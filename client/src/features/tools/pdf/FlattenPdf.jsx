import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { downloadFile } from '../../../utils/downloadFile';
import SaveToDriveButton from '../../../components/SaveToDriveButton';
import { useFile } from '../../../context/FileContext';

export default function FlattenPdf() {
  const { activeFiles } = useFile();
  const [file,setFile]=useState(() => activeFiles.find(item => item.type === 'application/pdf' || item.name.toLowerCase().endsWith('.pdf')) || null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [result,setResult]=useState(null);
  const flatten=async()=>{if(!file)return;setBusy(true);setError('');try{const doc=await PDFDocument.load(await file.arrayBuffer(),{ignoreEncryption:true});doc.getForm().flatten();setResult(new Blob([await doc.save({useObjectStreams:false})],{type:'application/pdf'}));}catch(cause){setError(cause?.message||'Could not flatten this PDF.');}finally{setBusy(false);}};
  const download=async()=>{if(!result)return;await downloadFile(result,`${file.name.replace(/\.pdf$/i,'')}-flattened.pdf`);};
  return <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><h2 className="text-2xl font-bold">Flatten PDF forms</h2><p className="mb-6 mt-2 text-slate-500">Turn interactive form fields into regular page content so their current values are preserved.</p><label className="block rounded-2xl border-2 border-dashed border-purple-200 p-8 text-center text-sm font-semibold text-purple-700">Choose PDF<input className="sr-only" type="file" accept="application/pdf,.pdf" onChange={event=>{setFile(event.target.files?.[0]||null);setResult(null);setError('');}}/></label>{file&&<div className="mt-5 space-y-4"><p className="text-sm text-slate-600">{file.name}</p>{result?<><button onClick={download} className="btn btn-primary w-full">Download flattened PDF</button><SaveToDriveButton blob={result} filename={`${file.name.replace(/\.pdf$/i,'')}-flattened.pdf`}/></>:<button disabled={busy} onClick={flatten} className="btn btn-primary w-full disabled:opacity-50">{busy?'Flattening…':'Flatten form fields'}</button>}</div>}{error&&<p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}</div>;
}
