import React, { createContext, useContext, useState, ReactNode } from "react";

interface BaseUrlContextType {
  baseUrl: string;
  setBaseUrl: (url: string) => void;
}

const BaseUrlContext = createContext<BaseUrlContextType | undefined>(undefined);

export const BaseUrlProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // Automatically detect environment and set appropriate base URL
  const getBaseUrl = () => {
    //COMMENTED OUT FOR DEVELOPMENT - Check if we're in production (deployed environment)
    if (
      window.location.hostname === "www.xpac.online" ||
      window.location.hostname === "xpac.online" ||
      window.location.protocol === "https:"
    ) {
      return "https://www.xpacc.online/api";
    } else {
      // Development environment (localhost) - Currently using for development
      return "http://localhost:3300/api";
    }
  };

  const [baseUrl, setBaseUrl] = useState<string>(getBaseUrl());

  return (
    <BaseUrlContext.Provider value={{ baseUrl, setBaseUrl }}>
      {children}
    </BaseUrlContext.Provider>
  );
};

export const useBaseUrl = (): BaseUrlContextType => {
  const context = useContext(BaseUrlContext);

  if (!context) {
    throw new Error("useBaseUrl must be used within a BaseUrlProvider");
  }
  return context;
};
