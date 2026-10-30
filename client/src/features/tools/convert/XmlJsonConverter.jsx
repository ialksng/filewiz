import { useState } from 'react';
import { downloadFile } from '../../../utils/downloadFile';

function elementToValue(element) {
  const children = [...element.children];
  const attributes = Object.fromEntries([...element.attributes].map(attribute => [attribute.name, attribute.value]));
  const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.nodeValue).join('').trim();
  if (!children.length && !Object.keys(attributes).length) return text;
  const value = {};
  if (Object.keys(attributes).length) value['@attributes'] = attributes;
  for (const child of children) {
    const childValue = elementToValue(child);
    if (Object.hasOwn(value, child.tagName)) {
      value[child.tagName] = Array.isArray(value[child.tagName]) ? [...value[child.tagName], childValue] : [value[child.tagName], childValue];
    } else value[child.tagName] = childValue;
  }
  if (text) value['#text'] = text;
  return value;
}

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

function validName(name) {
  if (!/^[A-Za-z_][\w.:-]*$/.test(name) || /^xml/i.test(name)) throw new Error(`“${name}” is not a supported XML element name.`);
  return name;
}

function valueToXml(name, value) {
  validName(name);
  if (Array.isArray(value)) return value.map(item => valueToXml(name, item)).join('');
  if (value === null || typeof value !== 'object') return `<${name}>${escapeXml(value ?? '')}</${name}>`;
  const attributes = value['@attributes'] || {};
  const attributeText = Object.entries(attributes).map(([key, item]) => ` ${validName(key)}="${escapeXml(item)}"`).join('');
  const text = value['#text'] == null ? '' : escapeXml(value['#text']);
  const children = Object.entries(value).filter(([key]) => key !== '@attributes' && key !== '#text').map(([key, item]) => valueToXml(key, item)).join('');
  return `<${name}${attributeText}>${text}${children}</${name}>`;
}

function convert(text, direction) {
  if (direction === 'xml-json') {
    const document = new DOMParser().parseFromString(text, 'application/xml');
    const error = document.querySelector('parsererror');
    if (error) throw new Error('This XML is not well-formed. Check its tags and attributes.');
    if (!document.documentElement) throw new Error('No XML document element was found.');
    return JSON.stringify({ [document.documentElement.tagName]: elementToValue(document.documentElement) }, null, 2);
  }
  const value = JSON.parse(text);
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 1) {
    throw new Error('Provide a JSON object with exactly one root key, for example {"catalog":{"item":"Book"}}.');
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${valueToXml(Object.keys(value)[0], Object.values(value)[0])}\n`;
}

export default function XmlJsonConverter() {
  const [direction, setDirection] = useState('xml-json');
  const [source, setSource] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const sourceLabel = direction === 'xml-json' ? 'XML' : 'JSON';
  const resultLabel = direction === 'xml-json' ? 'JSON' : 'XML';

  const run = () => {
    setBusy(true); setError(''); setResult('');
    try { setResult(convert(source, direction)); }
    catch (cause) { setError(cause?.message || 'Could not convert this data.'); }
    finally { setBusy(false); }
  };
  const download = () => {
    const extension = resultLabel.toLowerCase();
    downloadFile(new Blob([result], { type: extension === 'json' ? 'application/json;charset=utf-8' : 'application/xml;charset=utf-8' }), `converted.${extension}`);
  };

  return <div className="mx-auto max-w-6xl space-y-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-8">
    <header><h2 className="text-2xl font-bold">XML and JSON converter</h2><p className="mt-2 text-slate-500">Convert nested structured data in your browser. XML attributes appear under <code>@attributes</code>; repeated tags become JSON arrays.</p></header>
    <label className="block max-w-sm text-sm font-medium">Conversion<select className="mt-1 w-full rounded-xl border p-3" value={direction} onChange={event => { setDirection(event.target.value); setSource(''); setResult(''); setError(''); }}><option value="xml-json">XML to JSON</option><option value="json-xml">JSON to XML</option></select></label>
    <div className="grid gap-4 lg:grid-cols-2">
      <label className="block min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-5"><span className="mb-3 block font-bold text-slate-800">{sourceLabel} input</span><textarea className="min-h-72 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5" value={source} onChange={event => { setSource(event.target.value); setResult(''); }} placeholder={direction === 'xml-json' ? '<catalog><item>Book</item></catalog>' : '{"catalog":{"item":"Book"}}'} /></label>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-[#f5f5fa] p-4 sm:p-5"><span className="mb-3 block font-bold text-slate-800">{resultLabel} output</span><textarea readOnly className="min-h-72 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-5" value={result} placeholder="Converted data appears here." />{result && <button onClick={download} className="btn btn-primary mt-3 w-full">Download {resultLabel}</button>}</div>
    </div>
    <button disabled={busy || !source.trim()} onClick={run} className="btn btn-primary w-full disabled:opacity-50">{busy ? 'Converting…' : `Convert ${sourceLabel} to ${resultLabel}`}</button>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <p className="text-xs text-slate-500">Data stays in your browser. XML namespaces are retained as element names.</p>
  </div>;
}
