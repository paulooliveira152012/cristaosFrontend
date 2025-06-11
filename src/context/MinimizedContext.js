// src/context/MinimizedContext.js
import React, { createContext, useState, useContext } from "react";

const MinimizedContext = createContext();

export const MinimizedProvider = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <MinimizedContext.Provider value={{ isMinimized, setIsMinimized }}>
      {children}
    </MinimizedContext.Provider>
  );
};

export const useMinimized = () => useContext(MinimizedContext);

export default MinimizedContext;
