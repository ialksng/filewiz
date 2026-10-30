import { createContext, useState, useContext } from 'react';

const LoaderContext = createContext();

export function LoaderProvider({ children }) {
  // Initial state is false; only show when an active blocking action requests it
  const [isLoading, setIsLoading] = useState(false);

  return (
    <LoaderContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoaderContext.Provider>
  );
}

export function useLoader() {
  return useContext(LoaderContext);
}