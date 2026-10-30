import { execFile } from 'child_process';
import path from 'path';
import util from 'util';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const execFilePromise = util.promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const compress = async (inputFilePath, level, customQuality) => {
  const outputFileName = `compressed-${Date.now()}.pdf`;
  const outputDir = process.env.VERCEL ? path.join(os.tmpdir(), 'filewiz-outputs') : path.join(__dirname, '../../../../outputs');
  const outputFilePath = path.join(outputDir, outputFileName);

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Map user settings to Ghostscript parameters
  let pdfSettings = '/screen';
  
  if (level === 'recommended') {
    pdfSettings = '/ebook'; 
  } else if (level === 'less') {
    pdfSettings = '/printer'; 
  } else if (level === 'custom') {
    const qualityNum = Number.parseInt(customQuality, 10);
    if (!Number.isInteger(qualityNum) || qualityNum < 1 || qualityNum > 100) {
      throw new Error('Compression quality must be from 1 to 100.');
    }
    if (qualityNum < 33) pdfSettings = '/screen';
    else if (qualityNum < 66) pdfSettings = '/ebook';
    else pdfSettings = '/printer';
  }

  // Ghostscript command execution
  try {
    await execFilePromise(process.env.GHOSTSCRIPT_BINARY || 'gs', [
      '-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', `-dPDFSETTINGS=${pdfSettings}`,
      '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${outputFilePath}`, inputFilePath,
    ], { timeout: Number(process.env.PDF_PROCESS_TIMEOUT_MS) || 60000, maxBuffer: 1024 * 1024 });
    return outputFilePath;
  } catch (error) {
    throw new Error('Failed to compress PDF file.');
  }
};
