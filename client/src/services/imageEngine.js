import imageCompression from 'browser-image-compression';

/**
 * Compress an image file using browser-image-compression
 * @param {File} file
 * @param {object} options
 * @returns {Promise<File>}
 */
export async function compressImage(file, options = {}) {
  const defaultOptions = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.8,
    ...options
  };

  return await imageCompression(file, defaultOptions);
}

/**
 * Convert an image file to another format (PNG, JPEG, WEBP, AVIF, BMP)
 * @param {File} file
 * @param {'image/png'|'image/jpeg'|'image/webp'|'image/avif'|'image/bmp'} targetFormat
 * @param {number} quality (0 to 1)
 * @returns {Promise<Blob>}
 */
export function convertImageFormat(file, targetFormat = 'image/png', quality = 0.92) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (targetFormat === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => {
          const imageData = String(reader.result);
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}"><image width="${img.width}" height="${img.height}" href="${imageData}"/></svg>`;
          URL.revokeObjectURL(url);
          resolve(new Blob([svg], { type: 'image/svg+xml' }));
        };
        reader.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Could not package this image as SVG.'));
        };
        reader.readAsDataURL(file);
        return;
      }

      // If converting to JPEG, draw white background for transparent pixels
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      if (targetFormat === 'image/bmp') {
        try {
          const bmp = canvasToBmp(canvas);
          resolve(bmp);
        } catch (error) {
          reject(error);
        }
        return;
      }

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Format conversion failed.'));
        if (blob.type !== targetFormat) {
          return reject(new Error(`This browser cannot export ${targetFormat.replace('image/', '').toUpperCase()} images. Try PNG, JPG, WebP, or BMP instead.`));
        }
        resolve(blob);
      }, targetFormat, quality);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

function canvasToBmp(sourceCanvas) {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const rowBytes = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowBytes * height;
  const buffer = new ArrayBuffer(54 + pixelBytes);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  view.setUint8(0, 0x42);
  view.setUint8(1, 0x4d);
  view.setUint32(2, buffer.byteLength, true);
  view.setUint32(10, 54, true);
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true);
  view.setUint16(28, 24, true);
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true);
  view.setInt32(42, 2835, true);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;
  const outputContext = outputCanvas.getContext('2d');
  outputContext.fillStyle = '#ffffff';
  outputContext.fillRect(0, 0, width, height);
  outputContext.drawImage(sourceCanvas, 0, 0);
  const pixels = outputContext.getImageData(0, 0, width, height).data;

  for (let y = 0; y < height; y += 1) {
    const rowStart = 54 + (height - 1 - y) * rowBytes;
    for (let x = 0; x < width; x += 1) {
      const source = (y * width + x) * 4;
      const target = rowStart + x * 3;
      bytes[target] = pixels[source + 2];
      bytes[target + 1] = pixels[source + 1];
      bytes[target + 2] = pixels[source];
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

export function supportsCanvasImageFormat(format) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    canvas.toBlob((blob) => resolve(blob?.type === format), format, 0.8);
  });
}

/**
 * Resize and/or crop an image
 * @param {File} file
 * @param {object} dimensions - { width, height, fit: 'contain'|'cover'|'stretch' }
 * @returns {Promise<Blob>}
 */
export function resizeImage(file, { width, height, fit = 'contain' }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const targetW = width || img.width;
      const targetH = height || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (fit === 'stretch') {
        ctx.drawImage(img, 0, 0, targetW, targetH);
      } else if (fit === 'cover') {
        const scale = Math.max(targetW / img.width, targetH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (targetW - w) / 2;
        const y = (targetH - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      } else {
        // contain
        const scale = Math.min(targetW / img.width, targetH / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (targetW - w) / 2;
        const y = (targetH - h) / 2;
        ctx.drawImage(img, x, y, w, h);
      }

      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Resize failed.'));
        resolve(blob);
      }, file.type || 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

export async function cropImage(file, region) {
  const image = new Image();
  const sourceUrl = URL.createObjectURL(file);
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = sourceUrl;
    });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
  const x = Math.max(0, Math.min(image.naturalWidth - 1, Math.round(region.x)));
  const y = Math.max(0, Math.min(image.naturalHeight - 1, Math.round(region.y)));
  const width = Math.max(1, Math.min(image.naturalWidth - x, Math.round(region.width)));
  const height = Math.max(1, Math.min(image.naturalHeight - y, Math.round(region.height)));
  const scale = Math.min(1, Math.sqrt(25_000_000 / (width * height)));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext('2d').drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not crop this image.')), file.type || 'image/png');
  });
}

/**
 * Rotate or flip an image
 * @param {File} file
 * @param {number} degrees - 90, 180, 270
 * @param {boolean} flipH - horizontal flip
 * @param {boolean} flipV - vertical flip
 * @returns {Promise<Blob>}
 */
export function transformImage(file, { rotation = 0, flipH = false, flipV = false }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const isRotated90or270 = rotation === 90 || rotation === 270;
      canvas.width = isRotated90or270 ? img.height : img.width;
      canvas.height = isRotated90or270 ? img.width : img.height;

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Transform failed.'));
        resolve(blob);
      }, file.type || 'image/png');
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

/**
 * Generate favicon set (16x16, 32x32, 48x48, 180x180) from an image
 * @param {File} file
 * @returns {Promise<{ size: number, blob: Blob }[]>}
 */
export async function generateFavicons(file) {
  const sizes = [16, 32, 48, 180];
  const results = [];

  for (const size of sizes) {
    const blob = await resizeImage(file, { width: size, height: size, fit: 'cover' });
    results.push({ size, blob });
  }

  return results;
}
