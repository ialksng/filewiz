import { useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') { cell += '"'; index += 1; }
      else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"' && cell === '') quoted = true;
    else if (character === ',') { row.push(cell); cell = ''; }
    else if (character === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += character;
  }
  if (quoted) throw new Error('CSV contains an unclosed quoted field.');
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

function csvCell(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('result' in value) return csvCell(value.result);
    if (Array.isArray(value.richText)) return value.richText.map(part => part.text).join('');
    if ('text' in value) return String(value.text);
    if ('hyperlink' in value) return String(value.text || value.hyperlink);
    return JSON.stringify(value);
  }
  return String(value);
}

function toCsv(rows) {
  const quote = value => {
    const text = csvCell(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  return rows.map(row => row.map(quote).join(',')).join('\r\n');
}

export default function SpreadsheetConverter({ mode }) {
  const csvToExcel = mode === 'csv-to-excel';
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => csvToExcel
    ? item.name.toLowerCase().endsWith('.csv') || item.type === 'text/csv'
    : /\.xlsx?$/i.test(item.name)) || null);
  const [sheetNames, setSheetNames] = useState([]);
  const [sheetName, setSheetName] = useState('');
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectFile = async selected => {
    setFile(selected);
    setOutput(null);
    setError('');
    setSheetNames([]);
    setSheetName('');
    if (!selected || csvToExcel) return;
    if (selected.size > 30 * 1024 * 1024) {
      setError('For browser performance, choose an Excel workbook under 30 MB.');
      setFile(null);
      return;
    }
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(await selected.arrayBuffer());
      if (!workbook.worksheets.length) throw new Error('This workbook has no worksheets.');
      setSheetNames(workbook.worksheets.map(sheet => sheet.name));
      setSheetName(workbook.worksheets[0].name);
    } catch (cause) {
      setFile(null);
      setError(cause?.message || 'Could not open this Excel workbook. Choose an .xlsx file.');
    }
  };

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setOutput(null);
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('For browser performance, choose a file under 30 MB.');
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      if (csvToExcel) {
        const rows = parseCsv(await file.text());
        if (!rows.length) throw new Error('The CSV file is empty.');
        if (rows.length > 200000 || rows.some(row => row.length > 1000)) throw new Error('This CSV is too large to convert in the browser.');
        const sheet = workbook.addWorksheet('Sheet1');
        rows.forEach(row => sheet.addRow(row));
        const bytes = await workbook.xlsx.writeBuffer();
        setOutput(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      } else {
        await workbook.xlsx.load(await file.arrayBuffer());
        const sheet = workbook.getWorksheet(sheetName);
        if (!sheet) throw new Error('Choose a worksheet to export.');
        const rows = [];
        sheet.eachRow({ includeEmpty: true }, row => {
          rows.push(Array.from({ length: sheet.columnCount }, (_, index) => csvCell(row.getCell(index + 1).value)));
        });
        if (!rows.length) throw new Error('The selected worksheet is empty.');
        setOutput(new Blob([`\uFEFF${toCsv(rows)}`], { type: 'text/csv;charset=utf-8' }));
      }
    } catch (cause) {
      setError(cause?.message || 'Could not convert this spreadsheet.');
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!output) return;
    const base = file.name.replace(/\.[^.]+$/, '') || 'spreadsheet';
    downloadFile(output, `${base}.${csvToExcel ? 'xlsx' : 'csv'}`);
  };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">{csvToExcel ? 'CSV to Excel' : 'Excel to CSV'}</h2>
    <p className="mb-6 mt-2 text-slate-500">Convert spreadsheets in your browser. Your data is not uploaded to FileWiz.</p>
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-7 text-center font-semibold text-purple-800">
      {file ? file.name : csvToExcel ? 'Choose CSV file' : 'Choose Excel workbook (.xlsx)'}
      <input className="sr-only" type="file" accept={csvToExcel ? '.csv,text/csv' : '.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'} onChange={event => selectFile(event.target.files?.[0] || null)} />
    </label>
    {!csvToExcel && sheetNames.length > 0 && <label className="mt-4 block text-sm font-medium">Worksheet to export<select className="mt-1 w-full rounded-xl border p-3" value={sheetName} onChange={event => { setSheetName(event.target.value); setOutput(null); }}><option value="">Select a worksheet</option>{sheetNames.map(name => <option key={name} value={name}>{name}</option>)}</select></label>}
    {file && !output && <button disabled={busy} onClick={convert} className="btn btn-primary mt-4 w-full disabled:opacity-50">{busy ? 'Converting…' : `Convert to ${csvToExcel ? 'Excel' : 'CSV'}`}</button>}
    {output && <div className="mt-5 rounded-xl bg-emerald-50 p-5"><p className="font-semibold text-emerald-800">Your spreadsheet is ready.</p><button onClick={download} className="btn btn-primary mt-3 w-full">Download {csvToExcel ? 'Excel workbook' : 'CSV'}</button><SaveToDriveButton className="mt-3" blob={output} filename={`${file.name.replace(/\.[^.]+$/, '') || 'spreadsheet'}.${csvToExcel ? 'xlsx' : 'csv'}`} /></div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
  </div>;
}
