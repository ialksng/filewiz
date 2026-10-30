import fs from 'fs';

export const cleanupFiles = (filePaths) => {
  filePaths.forEach(filePath => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
      });
    }
  });
};