import { compress } from './pdf.service.js';
import { cleanupFiles } from '../../utils/fileCleanup.js';
import fs from 'fs/promises';

export const compressPdf = async (req, res, next) => {
  let inputFilePath = null;
  let outputFilePath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    inputFilePath = req.file.path;
    const handle = await fs.open(inputFilePath, 'r');
    const prefix = Buffer.alloc(1024);
    const { bytesRead } = await handle.read(prefix, 0, prefix.length, 0);
    await handle.close();
    if (!prefix.subarray(0, bytesRead).includes(Buffer.from('%PDF-'))) {
      cleanupFiles([inputFilePath]);
      return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
    }
    const { level, customQuality } = req.body;

    // Execute the service logic
    outputFilePath = await compress(inputFilePath, level, customQuality);

    // Send compressed file back to user
    res.download(outputFilePath, 'compressed.pdf', (err) => {
      // Clean up server storage after download
      cleanupFiles([inputFilePath, outputFilePath]);
    });

  } catch (error) {
    cleanupFiles([inputFilePath, outputFilePath]);
    next(error); // Send to global error handler
  }
};
