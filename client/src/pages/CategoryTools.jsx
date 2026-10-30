import { useParams, useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';
import NotFound from './NotFound';
import useSeoMetadata from '../services/useSeoMetadata';
import { tools as toolDefinitions } from '../services/toolDefinitions';
import { useFile } from '../context/FileContext';

export default function CategoryTools() {
  const { type = 'pdf' } = useParams();
  const navigate = useNavigate();
  const { activeFiles, clearFiles } = useFile();
  const conversionTools = toolDefinitions.filter(tool => tool.category === 'Convert').map(tool => ({
    id: tool.id,
    name: tool.name,
    icon: tool.icon,
    description: tool.description,
  }));

  const handleToolSelect = (toolId) => {
    const definition = toolDefinitions.find((tool) => tool.id === toolId);
    if (definition?.path) navigate(definition.path);
    else navigate(`/tools/${type}/${definition?.engine || toolId}`);
  };

  const categoriesData = {
    pdf: {
      title: "PDF Tools",
      subtitle: "Merge, split, compress, convert, rotate, and watermark PDFs with browser-based processing.",
      sections: [
        {
          title: "ORGANIZE PDF",
          tools: [
            { id: "merge-pdf", name: "Merge PDF", icon: "📑", description: "Combine multiple PDFs into one unified document." },
            { id: "split-pdf", name: "Split PDF", icon: "✂️", description: "Extract individual pages or ranges into separate PDFs." },
            { id: "rotate-pdf", name: "Rotate PDF", icon: "🔄", description: "Rotate PDF pages clockwise (90°, 180°, 270°)." },
            { id: "reorder-pdf", name: "Reorder PDF pages", icon: "🔀", description: "Arrange all pages in the order you choose." },
            { id: "remove-pages", name: "Remove PDF pages", icon: "🗑️", description: "Delete selected pages from a PDF." },
            { id: "edit-pdf-metadata", name: "Edit PDF metadata", icon: "🏷️", description: "Update title, author, subject, and keywords." },
            { id: "sign-pdf", name: "Sign PDF", icon: "✍️", description: "Draw and add a signature to a PDF page." },
            { id: "flatten-pdf", name: "Flatten PDF forms", icon: "📋", description: "Preserve form values as regular page content." },
            { id: "crop-pdf", name: "Crop PDF", icon: "✂️", description: "Set proportional visible margins across pages." },
            { id: "compare-pdf", name: "Compare PDFs", icon: "🆚", description: "Find text that differs between two PDF files." },
            { id: "pdf-to-markdown", name: "PDF to Markdown", icon: "Ⓜ️", description: "Export selectable text with page headings." },
          ]
        },
        {
          title: "OPTIMIZE & SECURE",
          tools: [
            { id: "compress-pdf", name: "Compress PDF", icon: "🗜️", description: "Reduce file size with client-side compaction." },
            { id: "add-watermark", name: "Add Watermark", icon: "©️", description: "Stamp custom text watermarks across all pages." },
            { id: "add-page-numbers", name: "Add Page Numbers", icon: "🔢", description: "Insert clean page numbers into your PDF." }
          ]
        },
        {
          title: "CONVERT & OCR",
          tools: [
            { id: "images-to-pdf", name: "Images to PDF", icon: "🖼️", description: "Convert JPG, PNG, and WebP images into a single PDF." },
            { id: "pdf-to-images", name: "PDF to images", icon: "🌄", description: "Export PDF pages as PNG images." },
            { id: "ocr-pdf", name: "OCR Extractor", icon: "👁️", description: "Extract searchable text from document scans & photos." }
          ]
        }
      ]
    },
    image: {
      title: "Image Tools",
      subtitle: "Compress, convert, resize, and create website favicons right in your browser.",
      sections: [
        {
          title: "COMPRESS & CONVERT",
          tools: [
            { id: "compress-image", name: "Compress Image", icon: "🗜️", description: "Optimize image file size without loss of detail." },
            { id: "convert-image", name: "Convert Format", icon: "🔄", description: "Convert between JPG, PNG, and modern WebP." },
            { id: "resize-image", name: "Resize Image", icon: "↔️", description: "Set custom pixel dimensions and fit mode." },
            { id: "crop-image", name: "Crop Image", icon: "▣", description: "Drag a visible crop box over your image, then choose square or free-form cropping." },
            { id: "rotate-image", name: "Rotate Image", icon: "⤵️", description: "Rotate an image in 90-degree steps." },
            { id: "create-favicon", name: "Favicon Generator", icon: "⭐", description: "Generate 16x16, 32x32, 48x48, 180x180 app icons." },
            { id: "image-watermark", name: "Watermark Image", icon: "©️", description: "Add adjustable text branding to an image." },
            { id: "image-filter", name: "Image Filters", icon: "🎨", description: "Apply grayscale, sepia, vivid, and color effects." },
            { id: "flip-image", name: "Flip Image", icon: "↔️", description: "Flip images horizontally or vertically." },
            { id: "image-collage", name: "Image Collage Maker", icon: "🧩", description: "Arrange several images in a customizable grid." },
            { id: "meme-generator", name: "Meme Generator", icon: "😄", description: "Create captioned images with top and bottom text." },
            { id: "photo-editor", name: "Photo Editor", icon: "🪄", description: "Adjust brightness, contrast, saturation, and rotation." },
            { id: "upscale-image", name: "Upscale Image", icon: "🔎", description: "Enlarge images with browser-based smoothing." },
            { id: "blur-area", name: "Blur Face or Area", icon: "🫥", description: "Manually select a face or detail to blur." },
            { id: "background-remover", name: "AI Background Remover", icon: "🪄", description: "Remove backgrounds from portraits and other images with private on-device AI, or select a plain background color." }
          ]
        },
        {
          title: "TEXT EXTRACTION",
          tools: [
            { id: "ocr-image", name: "OCR Text Recognition", icon: "👁️", description: "Extract text from photos and screenshots via Tesseract." }
          ]
        }
      ]
    },
    utility: {
      title: "Utilities",
      subtitle: "Instant developer, writer, and office utilities with zero server upload.",
      sections: [
        {
          title: "TEXT & ENCODING",
          tools: [
            { id: "ocr-extractor", name: "OCR Text Extractor", icon: "👁️", description: "Neural OCR for images and document scans." },
            { id: "word-counter", name: "Word Counter", icon: "📝", description: "Count words, characters, sentences, and reading time." },
            { id: "json-formatter", name: "JSON Formatter", icon: "🔧", description: "Format, validate, beautify, and minify JSON data." },
            { id: "base64-converter", name: "Base64 Encoder/Decoder", icon: "🔐", description: "Encode text to Base64 or decode Base64 strings." },
            { id: "csv-json-converter", name: "CSV ↔ JSON Converter", icon: "🔃", description: "Convert CSV tables to JSON and back." },
            { id: "text-case-converter", name: "Text Case Converter", icon: "🔠", description: "Convert text to title, camel, snake, or other cases." },
            { id: "color-converter", name: "HEX / RGB Color Converter", icon: "🎨", description: "Convert color values with a live preview." },
          ]
        },
        {
          title: "GENERATORS",
          tools: [
            { id: "password-generator", name: "Password & UUID Generator", icon: "🔑", description: "Generate secure cryptographic passwords and UUIDs." },
            { id: "qr-generator", name: "QR Code Generator", icon: "📱", description: "Generate crisp scannable QR codes for links & text." }
          ]
        },
        {
          title: "LINKS & CAMPAIGNS",
          tools: [
            { id: "url-shortener", name: "URL Shortener", icon: "🔗", description: "Create shareable FileWiz short links that work across devices." },
            { id: "utm-builder", name: "UTM Link Builder", icon: "📈", description: "Add campaign tracking parameters to links." },
            { id: "url-encoder", name: "URL Encoder & Decoder", icon: "🔡", description: "Encode or decode special characters in URLs." }
          ]
        }
      ]
    },
    word: {
      title: "Word Tools",
      subtitle: "Choose a conversion for your Word document. FileWiz processes these files in your browser.",
      sections: [{
        title: "WORD DOCUMENT CONVERSIONS",
        tools: [
          { id: "word-to-powerpoint", name: "Word to PowerPoint", icon: "📊", description: "Turn a Word document into a simple slide deck." },
          { id: "word-to-pdf", name: "Word to PDF", icon: "📄", description: "Create a text-focused PDF from a Word document." },
        ],
      }],
    },
    excel: {
      title: "Spreadsheet Tools",
      subtitle: "Convert spreadsheet files and CSV data with tools that run in your browser.",
      sections: [{
        title: "SPREADSHEET CONVERSIONS",
        tools: [
          { id: "excel-to-csv", name: "Excel to CSV", icon: "📑", description: "Export a worksheet from an Excel workbook to CSV." },
          { id: "csv-to-excel", name: "CSV to Excel", icon: "📊", description: "Convert CSV data into an Excel workbook." },
        ],
      }],
    },
    ppt: {
      title: "PowerPoint Tools",
      subtitle: "FileWiz recognizes PowerPoint files. Tools for editing or converting an existing presentation are not available yet.",
      sections: [{
        title: "RELATED DOCUMENT TOOLS",
        tools: [
          { id: "word-to-powerpoint", name: "Create PowerPoint from Word", icon: "📊", description: "Make a new slide deck from a Word document. This tool needs a Word file as its input." },
        ],
      }],
    },
    convert: {
      title: 'File Conversions',
      subtitle: 'Convert documents and spreadsheet files between common formats.',
      sections: [{ title: 'DOCUMENT & DATA CONVERSIONS', tools: conversionTools }],
    },
  };

  const activeCategory = categoriesData[type] || categoriesData.pdf;
  const categoryDescriptions = {
    pdf: 'Merge, split, compress, convert, and organize PDF files with browser-based FileWiz tools.',
    image: 'Compress, resize, convert, edit, and create image files with FileWiz tools.',
    utility: 'Use FileWiz tools for document conversion, text, encoding, OCR, QR codes, and everyday file tasks.',
    word: 'Convert Word documents to PowerPoint or PDF with FileWiz.',
    excel: 'Convert Excel workbooks and CSV files with FileWiz.',
    ppt: 'Explore available tools for PowerPoint files in FileWiz.',
    convert: 'Convert documents and spreadsheet files between common formats with FileWiz.',
  };
  useSeoMetadata({
    title: `${activeCategory.title} · FileWiz`,
    description: categoryDescriptions[type] || categoryDescriptions.pdf,
    canonicalPath: categoriesData[type] ? `/tools/${type}` : undefined,
    robots: categoriesData[type] ? 'index, follow' : 'noindex, nofollow',
  });

  if (!categoriesData[type]) return <NotFound />;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Category Header */}
      <div className="mb-6 border-b border-slate-200 bg-white px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {['pdf', 'image', 'utility', 'convert'].map((tab) => (
              <button
                key={tab}
                onClick={() => navigate(`/tools/${tab}`)}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${type === tab ? 'bg-violet-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {tab === 'convert' ? 'Conversions' : tab === 'utility' ? 'Utilities' : tab === 'image' ? 'Images' : 'PDF'}
              </button>
            ))}
          </div>

          {activeFiles.length > 0 && <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-semibold text-purple-950">Selected file{activeFiles.length === 1 ? '' : 's'}</p><p className="mt-1 break-all text-sm text-purple-800">{activeFiles.map(file => file.name).join(', ')}</p><p className="mt-1 text-xs text-purple-700">Choose a matching tool; your selected file will carry into its workspace.</p></div>
            <button type="button" onClick={clearFiles} className="min-h-10 shrink-0 rounded-lg border border-purple-300 bg-white px-4 text-sm font-semibold text-purple-800 hover:bg-purple-100">Clear selection</button>
          </div>}

          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{activeCategory.title}</h1>
          <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600 sm:text-lg">
            {activeCategory.subtitle}
          </p>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {activeCategory.sections.map((section, index) => (
          <section key={index} className="pt-2">
            <h2 className="mb-4 border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wider text-violet-700">
              {section.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {section.tools.map((tool) => (
                <ToolCard 
                  key={tool.id}
                  icon={tool.icon} 
                  title={tool.name} 
                  description={tool.description}
                  onClick={() => handleToolSelect(tool.id)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
