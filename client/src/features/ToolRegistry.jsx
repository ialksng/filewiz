/* This file is a lazy component registry, not a React Fast Refresh boundary. */
/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react';

const CompressPdf = lazy(() => import('../features/tools/pdf/CompressPdf'));
const MergePdf = lazy(() => import('../features/tools/pdf/MergePdf'));
const SplitPdf = lazy(() => import('../features/tools/pdf/SplitPdf'));
const RotatePdf = lazy(() => import('../features/tools/pdf/RotatePdf'));
const ImagesToPdf = lazy(() => import('../features/tools/pdf/ImagesToPdf'));
const WatermarkPdf = lazy(() => import('../features/tools/pdf/WatermarkPdf'));
const PageNumbersPdf = lazy(() => import('../features/tools/pdf/PageNumbersPdf'));
const ManagePdf = lazy(() => import('../features/tools/pdf/ManagePdf'));
const PdfToImages = lazy(() => import('../features/tools/pdf/PdfToImages'));
const SignPdf = lazy(() => import('../features/tools/pdf/SignPdf'));
const FlattenPdf = lazy(() => import('../features/tools/pdf/FlattenPdf'));
const CropPdf = lazy(() => import('../features/tools/pdf/CropPdf'));
const ComparePdf = lazy(() => import('../features/tools/pdf/ComparePdf'));
const PdfOcr = lazy(() => import('../features/tools/pdf/PdfOcr'));
const PdfToMarkdown = lazy(() => import('../features/tools/pdf/PdfToMarkdown'));
const OfficeDocumentConverter = lazy(() => import('../features/tools/convert/OfficeDocumentConverter'));
const SubtitleConverter = lazy(() => import('../features/tools/convert/SubtitleConverter'));
const XmlJsonConverter = lazy(() => import('../features/tools/convert/XmlJsonConverter'));

const CompressImage = lazy(() => import('../features/tools/image/CompressImage'));
const ConvertImage = lazy(() => import('../features/tools/image/ConvertImage'));
const FaviconGenerator = lazy(() => import('../features/tools/image/FaviconGenerator'));
const ImageStudio = lazy(() => import('../features/tools/image/ImageStudio'));
const ImageCollage = lazy(() => import('../features/tools/image/ImageCollage'));
const MemeGenerator = lazy(() => import('../features/tools/image/MemeGenerator'));
const PhotoEditor = lazy(() => import('../features/tools/image/PhotoEditor'));
const ImageTransform = lazy(() => import('../features/tools/image/ImageTransform'));
const BlurArea = lazy(() => import('../features/tools/image/BlurArea'));
const ImageUpscaler = lazy(() => import('../features/tools/image/ImageUpscaler'));

const WordCounter = lazy(() => import('../features/tools/utility/WordCounter'));
const JsonFormatter = lazy(() => import('../features/tools/utility/JsonFormatter'));
const Base64Converter = lazy(() => import('../features/tools/utility/Base64Converter'));
const PasswordGenerator = lazy(() => import('../features/tools/utility/PasswordGenerator'));
const QrGenerator = lazy(() => import('../features/tools/utility/QrGenerator'));
const OcrExtractor = lazy(() => import('../features/tools/utility/OcrExtractor'));
const DelimitedDataConverter = lazy(() => import('../features/tools/utility/DelimitedDataConverter'));
const TextCaseConverter = lazy(() => import('../features/tools/utility/TextCaseConverter'));
const ColorConverter = lazy(() => import('../features/tools/utility/ColorConverter'));
const SpreadsheetConverter = lazy(() => import('../features/tools/utility/SpreadsheetConverter'));
const BackgroundRemover = lazy(() => import('../features/tools/image/BackgroundRemover'));
const UrlShortener = lazy(() => import('../features/tools/utility/UrlShortener'));
const UrlEncoder = lazy(() => import('../features/tools/utility/UrlBuilder').then(module => ({ default: module.UrlEncoder })));
const UtmBuilder = lazy(() => import('../features/tools/utility/UrlBuilder').then(module => ({ default: module.UtmBuilder })));

export const getToolComponent = (toolId) => {
  switch (toolId) {
    // --- PDF Tools ---
    case 'compress-pdf':
      return <CompressPdf />;
    case 'merge-pdf':
      return <MergePdf />;
    case 'organize-pdf':
    case 'reorder-pdf':
      return <ManagePdf mode="reorder" />;
    case 'split-pdf':
    case 'extract-pages':
      return <SplitPdf />;
    case 'remove-pages':
      return <ManagePdf mode="remove" />;
    case 'rotate-pdf':
      return <RotatePdf />;
    case 'images-to-pdf':
    case 'jpg-to-pdf':
      return <ImagesToPdf />;
    case 'add-watermark':
      return <WatermarkPdf />;
    case 'add-page-numbers':
      return <PageNumbersPdf />;
    case 'edit-pdf-metadata':
      return <ManagePdf mode="metadata" />;
    case 'pdf-to-images':
      return <PdfToImages />;
    case 'sign-pdf':
      return <SignPdf />;
    case 'flatten-pdf':
      return <FlattenPdf />;
    case 'pdf-to-markdown':
      return <PdfToMarkdown />;
    case 'crop-pdf':
      return <CropPdf />;
    case 'compare-pdf':
      return <ComparePdf />;
    case 'ocr-pdf':
      return <PdfOcr />;
    case 'pdf-to-word':
    case 'word-to-pdf':
    case 'word-to-powerpoint':
    case 'word-to-text':
    case 'text-to-word':
      return <OfficeDocumentConverter mode={toolId} />;
    case 'srt-vtt-converter':
      return <SubtitleConverter />;
    case 'xml-json-converter':
      return <XmlJsonConverter />;

    // --- Image Tools ---
    case 'compress-image':
      return <CompressImage />;
    case 'convert-image':
    case 'jpg-to-png':
    case 'png-to-jpg':
    case 'webp-to-png':
      return <ConvertImage />;
    case 'create-favicon':
    case 'favicon-generator':
      return <FaviconGenerator />;
    case 'image-watermark':
      return <ImageStudio mode="watermark" />;
    case 'image-filter':
      return <ImageStudio mode="filter" />;
    case 'flip-image':
      return <ImageStudio mode="flip" />;
    case 'image-collage':
      return <ImageCollage />;
    case 'meme-generator':
      return <MemeGenerator />;
    case 'photo-editor':
      return <PhotoEditor />;
    case 'upscale-image':
      return <ImageUpscaler />;
    case 'resize-image':
      return <ImageTransform mode="resize" />;
    case 'crop-image':
      return <ImageTransform mode="crop" />;
    case 'rotate-image':
      return <ImageTransform mode="rotate" />;
    case 'blur-area':
      return <BlurArea />;
    case 'background-remover':
      return <BackgroundRemover />;

    // --- OCR & Utilities ---
    case 'ocr-image':
    case 'ocr-extractor':
      return <OcrExtractor />;
    case 'word-counter':
    case 'character-counter':
      return <WordCounter />;
    case 'json-formatter':
    case 'json-validator':
      return <JsonFormatter />;
    case 'base64-converter':
    case 'base64-encode':
    case 'base64-decode':
      return <Base64Converter />;
    case 'password-generator':
    case 'uuid-generator':
      return <PasswordGenerator />;
    case 'qr-generator':
    case 'qr-code':
      return <QrGenerator />;
    case 'csv-json-converter':
    case 'csv-tsv-converter':
      return <DelimitedDataConverter initialMode={toolId === 'csv-tsv-converter' ? 'csv-tsv' : 'csv-json'} />;
    case 'csv-to-excel':
    case 'excel-to-csv':
      return <SpreadsheetConverter mode={toolId} />;
    case 'text-case-converter':
      return <TextCaseConverter />;
    case 'color-converter':
      return <ColorConverter />;
    case 'url-shortener':
      return <UrlShortener />;
    case 'url-encoder':
      return <UrlEncoder />;
    case 'utm-builder':
      return <UtmBuilder />;

    default:
      return null;
  }
};
