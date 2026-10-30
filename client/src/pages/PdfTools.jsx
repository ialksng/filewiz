import { useNavigate } from 'react-router-dom';
import ToolCard from '../components/ToolCard';

export default function PdfTools() {
  const navigate = useNavigate();

  const handleToolSelect = (toolId) => {
    navigate(`/tools/pdf/${toolId}`);
  };

  const toolCategories = [
    {
      title: "ORGANIZE PDF",
      tools: [
        { id: "merge-pdf", name: "Merge PDF", icon: "📑", description: "Combine multiple PDFs into one unified document." },
        { id: "split-pdf", name: "Split PDF", icon: "✂️", description: "Separate one page or a whole set into independent PDF files." },
        { id: "rotate-pdf", name: "Rotate PDF", icon: "🔄", description: "Rotate PDF pages 90°, 180°, or 270° with live preview." },
        { id: "extract-pages", name: "Extract pages", icon: "📤", description: "Get a new document containing only the desired pages." },
        { id: "remove-pages", name: "Remove pages", icon: "🗑️", description: "Remove unwanted pages from a PDF document." },
        { id: "reorder-pdf", name: "Reorder pages", icon: "🔀", description: "Arrange every page in a custom order." },
        { id: "edit-pdf-metadata", name: "Edit PDF metadata", icon: "🏷️", description: "Update title, author, subject, and keywords." },
        { id: "sign-pdf", name: "Sign PDF", icon: "✍️", description: "Draw a signature and add it to a PDF page." },
        { id: "flatten-pdf", name: "Flatten PDF forms", icon: "📋", description: "Preserve field values as regular page content." },
        { id: "crop-pdf", name: "Crop PDF", icon: "✂️", description: "Set proportional visible margins across pages." },
        { id: "compare-pdf", name: "Compare PDFs", icon: "🆚", description: "Find text that differs between two PDF files." },
        { id: "pdf-to-markdown", name: "PDF to Markdown", icon: "Ⓜ️", description: "Export selectable text with page headings." },
      ]
    },
    {
      title: "OPTIMIZE PDF",
      tools: [
        { id: "compress-pdf", name: "Compress PDF", icon: "🗜️", description: "Reduce file size while optimizing document structure." },
      ]
    },
    {
      title: "CONVERT & CREATE",
      tools: [
        { id: "images-to-pdf", name: "Images to PDF", icon: "🖼️", description: "Convert JPG, PNG, and WebP images to a clean PDF." },
        { id: "pdf-to-images", name: "PDF to Images", icon: "🌄", description: "Render and download PDF pages as PNG images." },
        { id: "ocr-pdf", name: "OCR scanned PDF", icon: "👁️", description: "Recognize text on scanned PDF pages." },
      ]
    },
    {
      title: "EDIT & ENHANCE",
      tools: [
        { id: "add-watermark", name: "Add watermark", icon: "©️", description: "Stamp custom text watermark over your PDF pages." },
        { id: "add-page-numbers", name: "Add page numbers", icon: "🔢", description: "Insert formatted page numbering into your PDF." },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-8 py-10 mb-8">
        <div className="max-w-7xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-3 border border-purple-200">
            Client-Side · 100% Private · No File Upload
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">PDF Tools</h1>
          <p className="mt-3 text-lg text-gray-500 max-w-2xl">
            Fast, secure in-browser PDF utilities. Your files never leave your device. Merge, split, rotate, compress, convert, and watermark in seconds.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {toolCategories.map((category, index) => (
          <section key={index} className="pt-4">
            <h2 className="text-sm font-bold tracking-widest text-purple-600 uppercase mb-6 border-b border-gray-200 pb-2">
              {category.title}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {category.tools.map((tool) => (
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
