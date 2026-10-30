export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  const tooLarge = err.code === 'LIMIT_FILE_SIZE';
  const status = tooLarge ? 413 : (err.message === 'Origin not allowed by CORS' ? 403 : err.name === 'MulterError' || err.message === 'Only PDF files are accepted.' ? 400 : 500);
  if (status === 500) console.error('FileWiz request failed');
  res.status(status).json({ error: tooLarge ? 'File exceeds the configured upload limit.' : status === 500 ? 'Request could not be processed.' : err.message });
};
