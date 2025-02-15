// src/context/SelectedMatchesContext.js

import React, { createContext, useState, useMemo } from 'react';

// Создаём контекст
export const SelectedMatchesContext = createContext();

// Провайдер контекста
export const SelectedMatchesProvider = ({ children }) => {
  const [allMatches, setAllMatches] = useState([]);
  const [selectedMatches, setSelectedMatches] = useState([]);

  // Мемоизируем значение контекста
  const value = useMemo(() => ({
    allMatches,
    setAllMatches,
    selectedMatches,
    setSelectedMatches
  }), [allMatches, selectedMatches]);

  return (
    <SelectedMatchesContext.Provider value={value}>
      {children}
    </SelectedMatchesContext.Provider>
  );
};
