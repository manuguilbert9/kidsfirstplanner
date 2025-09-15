'use client'

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';

interface ColorContextType {
  parent1Color: string | null;
  setParent1Color: (color: string | null) => void;
  parent2Color: string | null;
  setParent2Color: (color: string | null) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parent1Color, setParent1Color] = useState<string | null>(null);
  const [parent2Color, setParent2Color] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (parent1Color) {
      root.style.setProperty('--parent1', parent1Color);
    } else {
      root.style.removeProperty('--parent1');
    }
  }, [parent1Color]);

  useEffect(() => {
    const root = document.documentElement;
    if (parent2Color) {
      root.style.setProperty('--parent2', parent2Color);
    } else {
       root.style.removeProperty('--parent2');
    }
  }, [parent2Color]);

  const value = useMemo(() => ({
    parent1Color,
    setParent1Color,
    parent2Color,
    setParent2Color,
  }), [parent1Color, parent2Color]);

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
};

export const useColors = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
};
