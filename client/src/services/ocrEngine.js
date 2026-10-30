import { createWorker } from 'tesseract.js';

/**
 * Perform Optical Character Recognition (OCR) on an image file or blob
 * @param {File|Blob|string} imageSource
 * @param {string} language - default 'eng'
 * @param {function} onProgress - callback with { status, progress }
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function performOcr(imageSource, language = 'eng', onProgress = null) {
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status) {
        onProgress({
          status: m.status,
          progress: typeof m.progress === 'number' ? Math.round(m.progress * 100) : 0
        });
      }
    }
  });

  try {
    const ret = await worker.recognize(imageSource);
    return {
      text: ret.data.text,
      confidence: ret.data.confidence
    };
  } finally {
    await worker.terminate();
  }
}
