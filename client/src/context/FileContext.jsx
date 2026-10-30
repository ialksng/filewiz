import { createContext, useContext, useState } from "react";

const FileContext = createContext();

export function FileProvider({ children }) {
  const [activeFiles, setActiveFiles] = useState([]);
  const [history, setHistory] = useState([]);

  const addFiles = (newFiles) => {
    const list = Array.isArray(newFiles) ? newFiles : [newFiles];
    setActiveFiles(list);
    setHistory((prev) => [...list, ...prev].slice(0, 20));
  };

  const clearFiles = () => {
    setActiveFiles([]);
  };

  return (
    <FileContext.Provider value={{ 
      file: activeFiles[0] || null, 
      activeFiles, 
      setActiveFiles: addFiles, 
      setFile: addFiles,
      clearFiles,
      history 
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFile() {
  return useContext(FileContext);
}