import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileType, Loader2 } from "lucide-react";
import { useFile } from "../context/FileContext"; // Imported FileContext

export default function UploadBox() {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState("idle");
  const [detectedType, setDetectedType] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  
  // Grab the global state setter
  const { setFile } = useFile(); 

  const detectFileType = (file) => {
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    if (mime.includes("pdf") || name.endsWith(".pdf")) return "pdf";
    if (mime.includes("image")) return "image";
    if (mime.includes("word") || name.endsWith(".doc") || name.endsWith(".docx")) return "word";
    if (mime.includes("excel") || mime.includes("spreadsheet") || name.endsWith(".xls") || name.endsWith(".xlsx")) return "excel";
    if (mime.includes("powerpoint") || mime.includes("presentation") || name.endsWith(".ppt") || name.endsWith(".pptx")) return "ppt";
    
    return "unknown";
  };

  const handleFile = (file) => {
    if (!file) return;
    
    // 1. Save the file to global state immediately so it survives the redirect
    setFile([file]);
    
    setStatus("detecting");

    setTimeout(() => {
      const type = detectFileType(file);
      setDetectedType(type);
      setStatus("redirecting");

      setTimeout(() => {
        // 2. Redirect to the correct tool hub
        navigate(`/tools/${type}`);
      }, 1200);
    }, 600);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => status === "idle" && fileInputRef.current?.click()}
      className={`w-full max-w-2xl bg-white rounded-3xl shadow-xl p-12 transition-all duration-300 text-center ${
        status === "idle" ? "cursor-pointer" : "cursor-default"
      } ${
        isDragging
          ? "border-2 border-purple-500 bg-purple-50 scale-[1.02] shadow-purple-500/20"
          : "border-2 border-dashed border-purple-200 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-900/5"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
      />

      {status === "idle" && (
        <div className="flex flex-col items-center pointer-events-none">
          <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
            <Upload className="text-purple-600" size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-slate-800">
            Upload your document
          </h2>
          <p className="text-slate-500 text-base max-w-md mx-auto leading-relaxed">
            Just drop your file here — we’ll automatically detect its type and
            show the best tools instantly in your language.
          </p>
          <div className="mt-8 bg-purple-600 text-white font-medium px-8 py-3.5 rounded-xl text-sm shadow-lg shadow-purple-200">
            Upload Document
          </div>
          <p className="text-xs font-medium text-slate-400 mt-6 uppercase tracking-widest">
            PDF · Word · Excel · Images · PPT
          </p>
        </div>
      )}

      {status === "detecting" && (
        <div className="py-12 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <Loader2 className="animate-spin text-purple-600 mb-6" size={48} />
          <h2 className="text-xl font-semibold text-slate-800">
            Analyzing file type...
          </h2>
        </div>
      )}

      {status === "redirecting" && (
        <div className="py-12 flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <FileType className="text-green-500" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Detected: <span className="uppercase text-purple-600">{detectedType}</span>
          </h2>
          <p className="text-slate-500 font-medium">
            Opening optimal tools for your file...
          </p>
        </div>
      )}
    </div>
  );
}