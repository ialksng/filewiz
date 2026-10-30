import { useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';
import { useFile } from '../../../context/FileContext';
import SaveToDriveButton from '../../../components/SaveToDriveButton';

const modes = {
  'pdf-to-word': {
    title: 'PDF to Word',
    description: 'Extract selectable PDF text into an editable Word document. Scanned PDFs need OCR first; complex layouts may need cleanup.',
    accept: 'application/pdf,.pdf',
    inputLabel: 'Choose PDF',
    outputExtension: 'docx',
  },
  'word-to-pdf': {
    title: 'Word to PDF',
    description: 'Create a text-focused PDF from a DOCX file. Complex formatting, tables, and embedded images may not match Word exactly.',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    inputLabel: 'Choose Word document',
    outputExtension: 'pdf',
  },
  'word-to-powerpoint': {
    title: 'Word to PowerPoint',
    description: 'Turn the text in a Word document into a simple slide deck. Each slide contains a title and a few paragraphs.',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    inputLabel: 'Choose Word document',
    outputExtension: 'pptx',
  },
  'word-to-text': {
    title: 'Word to text',
    description: 'Extract readable text from a DOCX file. Images, tables styling, and other visual formatting are not included.',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    inputLabel: 'Choose Word document',
    outputExtension: 'txt',
  },
  'text-to-word': {
    title: 'Text to Word',
    description: 'Create an editable DOCX document from a plain text file. Each line becomes a paragraph.',
    accept: '.txt,text/plain',
    inputLabel: 'Choose text file',
    outputExtension: 'docx',
  },
};

function safePdfText(text) {
  return Array.from(text.normalize('NFKD'), (character) => {
    const codePoint = character.codePointAt(0);
    return (codePoint >= 32 && codePoint <= 126) || (codePoint >= 160 && codePoint <= 255)
      ? character
      : '?';
  }).join('');
}

async function makePdfFromText(text) {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 54;
  const fontSize = 11;
  const lineHeight = 15;
  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const paragraph of text.split(/\r?\n/)) {
    const cleanParagraph = safePdfText(paragraph.trim());
    if (!cleanParagraph) {
      y -= lineHeight * 0.65;
      continue;
    }
    const words = cleanParagraph.split(/\s+/);
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) > pageWidth - margin * 2 && line) {
        if (y < margin + lineHeight) {
          page = pdf.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(line, { x: margin, y, size: fontSize, font });
        y -= lineHeight;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      if (y < margin + lineHeight) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }
      const heading = /^(#{1,3}\s|[A-Z][A-Z\s]{3,}:?$)/.test(line);
      page.drawText(line, { x: margin, y, size: heading ? 13 : fontSize, font: heading ? fontBold : font });
      y -= lineHeight * 1.35;
    }
  }
  return new Blob([await pdf.save({ useObjectStreams: false })], { type: 'application/pdf' });
}

async function readPdfText(file) {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href;
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  if (document.numPages > 200) throw new Error('For performance, convert PDFs with 200 pages or fewer.');
  const pages = [];
  for (let number = 1; number <= document.numPages; number += 1) {
    const page = await document.getPage(number);
    const items = (await page.getTextContent()).items
      .filter(item => item.str?.trim())
      .map(item => ({ text: item.str.trim(), x: item.transform[4], y: item.transform[5] }))
      .sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const item of items) {
      let current = lines.at(-1);
      if (!current || Math.abs(current.y - item.y) > 3) {
        current = { y: item.y, items: [] };
        lines.push(current);
      }
      current.items.push(item);
    }
    pages.push(lines.map(line => line.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ')).join('\n'));
  }
  const result = pages.join('\n\n');
  if (!result.trim()) throw new Error('No selectable text was found. Run OCR on this scanned PDF, then try again.');
  return result;
}

async function textToDocx(text) {
  const { Document, HeadingLevel, Packer, Paragraph } = await import('docx');
  const paragraphs = text.split(/\r?\n/).map((line, index) => {
    if (index === 0 && line.startsWith('# ')) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.TITLE });
    if (/^#{1,3}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      return new Paragraph({
        text: line.replace(/^#{1,3}\s/, ''),
        heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      });
    }
    return new Paragraph(line);
  });
  const doc = new Document({ sections: [{ children: paragraphs }] });
  return Packer.toBlob(doc);
}

async function convertWord(file, mode) {
  if (mode === 'text-to-word') return textToDocx(await file.text());
  const JSZip = (await import('jszip')).default;
  const archive = await JSZip.loadAsync(await file.arrayBuffer());
  const documentXml = await archive.file('word/document.xml')?.async('text');
  if (!documentXml) throw new Error('This Word file does not contain a readable document body.');
  const xml = new DOMParser().parseFromString(documentXml, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('The Word document contains invalid XML.');
  const paragraphs = [...xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'p')];
  const text = paragraphs.map(paragraph => {
    const parts = [];
    const visit = node => {
      if (node.nodeType === Node.TEXT_NODE) return;
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (node.localName === 't') parts.push(node.textContent || '');
      else if (node.localName === 'tab') parts.push('\t');
      else if (node.localName === 'br' || node.localName === 'cr') parts.push('\n');
      else [...node.childNodes].forEach(visit);
    };
    [...paragraph.childNodes].forEach(visit);
    return parts.join('');
  }).join('\n').trim();
  if (!text) throw new Error('No readable text was found in this Word file.');
  if (mode === 'word-to-pdf') return makePdfFromText(text);
  if (mode === 'word-to-text') return new Blob([text], { type: 'text/plain;charset=utf-8' });
  if (mode === 'word-to-powerpoint') {
    const PptxGenJS = (await import('pptxgenjs')).default;
    const presentation = new PptxGenJS();
    presentation.layout = 'LAYOUT_WIDE';
    presentation.author = 'FileWiz';
    presentation.subject = 'Converted from a Word document';
    const title = file.name.replace(/\.docx$/i, '');
    const paragraphs = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const chunks = [];
    for (let index = 0; index < paragraphs.length; index += 6) chunks.push(paragraphs.slice(index, index + 6));
    for (let index = 0; index < chunks.length; index += 1) {
      const slide = presentation.addSlide();
      slide.addText(index === 0 ? title : `${title} · ${index + 1}`, { x: 0.6, y: 0.35, w: 12.1, h: 0.7, fontFace: 'Aptos Display', fontSize: 26, bold: true, color: '452080' });
      slide.addText(chunks[index].join('\n\n'), { x: 0.75, y: 1.35, w: 11.8, h: 5.4, fontFace: 'Aptos', fontSize: 18, color: '243047', valign: 'mid', paraSpaceAfterPt: 16, fit: 'shrink' });
      slide.addText(`${index + 1} / ${chunks.length}`, { x: 11.8, y: 7.1, w: 0.8, h: 0.2, fontSize: 9, color: '64748B', align: 'right' });
    }
    return presentation.write({ outputType: 'blob' });
  }
  throw new Error('Unsupported conversion.');
}

export default function OfficeDocumentConverter({ mode }) {
  const config = modes[mode];
  const { activeFiles } = useFile();
  const [file, setFile] = useState(() => activeFiles.find(item => config.accept.split(',').some(accept => item.type === accept || accept.startsWith('.') && item.name.toLowerCase().endsWith(accept))) || null);
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const selectFile = selected => {
    setFile(selected);
    setOutput(null);
    setError('');
  };

  const convert = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    setOutput(null);
    try {
      const blob = mode === 'pdf-to-word'
        ? await textToDocx(await readPdfText(file))
        : await convertWord(file, mode);
      setOutput(blob);
    } catch (cause) {
      setError(cause?.message || `Could not convert this file to ${config.outputExtension.toUpperCase()}.`);
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    if (!output) return;
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'converted';
    downloadFile(output, `${baseName}.${config.outputExtension}`);
  };

  return <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-9">
    <h2 className="text-2xl font-bold">{config.title}</h2>
    <p className="mb-6 mt-2 text-slate-500">{config.description}</p>
    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-7 text-center font-semibold text-purple-800">
      {file ? file.name : config.inputLabel}
      <input className="sr-only" type="file" accept={config.accept} onChange={event => selectFile(event.target.files?.[0] || null)} />
    </label>
    {file && !output && <button disabled={busy} onClick={convert} className="btn btn-primary mt-4 w-full disabled:opacity-50">{busy ? 'Converting…' : config.title}</button>}
    {output && <div className="mt-5 rounded-xl bg-emerald-50 p-5"><p className="font-semibold text-emerald-800">Your file is ready to download.</p><button onClick={download} className="btn btn-primary mt-3 w-full">Download .{config.outputExtension}</button><SaveToDriveButton className="mt-3" blob={output} filename={`${file.name.replace(/\.[^.]+$/, '') || 'converted'}.${config.outputExtension}`} /></div>}
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="mt-5 text-xs text-slate-500">Files are processed in your browser and are not uploaded to FileWiz.</p>
  </div>;
}
