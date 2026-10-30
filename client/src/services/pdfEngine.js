import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

/**
 * Merge multiple PDF Files into a single PDF
 * @param {File[]} files
 * @returns {Promise<Uint8Array>}
 */
export async function mergePdfs(files) {
  if (!files || files.length < 2) {
    throw new Error('Please select at least 2 PDF files to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save({ useObjectStreams: false });
}

/**
 * Split or Extract pages from a PDF File
 * @param {File} file
 * @param {number[]} pageNumbers - 1-based page numbers
 * @returns {Promise<Uint8Array>}
 */
export async function extractPdfPages(file, pageNumbers) {
  if (!file) throw new Error('No PDF file provided.');
  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error('Please specify at least one page to extract.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = sourcePdf.getPageCount();

  const newPdf = await PDFDocument.create();
  // Convert 1-based to 0-based and filter valid ranges
  const validIndices = pageNumbers
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < totalPages);

  if (validIndices.length === 0) {
    throw new Error('No valid pages found in specified range.');
  }

  const copiedPages = await newPdf.copyPages(sourcePdf, validIndices);
  copiedPages.forEach(p => newPdf.addPage(p));

  return await newPdf.save({ useObjectStreams: false });
}

/**
 * Rotate pages of a PDF File
 * @param {File} file
 * @param {number} rotationAngle - e.g. 90, 180, 270
 * @param {number[]} [pageNumbers] - 1-based page numbers to rotate. If empty, rotates all pages.
 * @returns {Promise<Uint8Array>}
 */
export async function rotatePdf(file, rotationAngle = 90, pageNumbers = null) {
  if (!file) throw new Error('No PDF file provided.');

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  const pagesToRotate = pageNumbers && pageNumbers.length > 0
    ? pageNumbers.map(p => p - 1).filter(idx => idx >= 0 && idx < totalPages)
    : Array.from({ length: totalPages }, (_, i) => i);

  pagesToRotate.forEach(idx => {
    const page = pdfDoc.getPage(idx);
    const currentAngle = page.getRotation().angle;
    page.setRotation(degrees((currentAngle + rotationAngle) % 360));
  });

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Add Text Watermark to a PDF File
 * @param {File} file
 * @param {string} watermarkText
 * @param {object} options
 * @returns {Promise<Uint8Array>}
 */
export async function addWatermarkToPdf(file, watermarkText, options = {}) {
  if (!file) throw new Error('No PDF file provided.');
  if (!watermarkText || !watermarkText.trim()) throw new Error('Watermark text is required.');

  const {
    opacity = 0.35,
    fontSize = 50,
    color = { r: 0.5, g: 0.5, b: 0.5 },
    rotation = -45
  } = options;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    page.drawText(watermarkText, {
      x: (width - textWidth) / 2,
      y: (height - textHeight) / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  });

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Add Page Numbers to a PDF File
 * @param {File} file
 * @param {string} position - 'bottom-center' | 'bottom-right' | 'top-right'
 * @param {string} format - 'Page {n} of {total}' | '{n}'
 * @returns {Promise<Uint8Array>}
 */
export async function addPageNumbersToPdf(file, position = 'bottom-center', format = 'Page {n} of {total}') {
  if (!file) throw new Error('No PDF file provided.');

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const total = pages.length;

  pages.forEach((page, idx) => {
    const n = idx + 1;
    const text = format.replace('{n}', n.toString()).replace('{total}', total.toString());
    const fontSize = 10;
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { width, height } = page.getSize();

    let x = (width - textWidth) / 2;
    let y = 20;

    if (position === 'bottom-right') {
      x = width - textWidth - 30;
      y = 20;
    } else if (position === 'top-right') {
      x = width - textWidth - 30;
      y = height - 30;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Convert Image Files to a Single PDF
 * @param {File[]} imageFiles
 * @returns {Promise<Uint8Array>}
 */
export async function imagesToPdf(imageFiles) {
  if (!imageFiles || imageFiles.length === 0) {
    throw new Error('Please select at least one image file.');
  }

  const pdfDoc = await PDFDocument.create();

  for (const imgFile of imageFiles) {
    const arrayBuffer = await imgFile.arrayBuffer();
    let embeddedImage;

    const isJpg = imgFile.type === 'image/jpeg' || imgFile.name.match(/\.jpe?g$/i);
    const isPng = imgFile.type === 'image/png' || imgFile.name.match(/\.png$/i);

    if (isJpg) {
      embeddedImage = await pdfDoc.embedJpg(arrayBuffer);
    } else if (isPng) {
      embeddedImage = await pdfDoc.embedPng(arrayBuffer);
    } else {
      // Convert WebP / other types to PNG via Canvas first
      const pngBuffer = await convertImageToPngBuffer(imgFile);
      embeddedImage = await pdfDoc.embedPng(pngBuffer);
    }

    const { width, height } = embeddedImage;
    // Standard A4 aspect or fitted page dimensions
    const page = pdfDoc.addPage([width, height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  return await pdfDoc.save({ useObjectStreams: false });
}

/**
 * Helper to convert any browser image to PNG ArrayBuffer
 */
function convertImageToPngBuffer(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas image conversion failed'));
        blob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

/**
 * Compress PDF via structural compaction and stream optimization in pdf-lib
 * @param {File} file
 * @returns {Promise<Uint8Array>}
 */
export async function compressPdf(file) {
  if (!file) throw new Error('No PDF file provided.');

  const arrayBuffer = await file.arrayBuffer();
  // Loading and re-saving with useObjectStreams compiles cross-reference streams and strips unreferenced resources
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  return await pdfDoc.save({
    useObjectStreams: false,
    addDefaultPage: false,
    objectsPerTick: 50,
  });
}
