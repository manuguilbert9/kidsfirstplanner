'use client'

import React, { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { hslToHslString } from '@/lib/utils';

interface ColorContextType {
  parent1Color: string | null;
  setParent1Color: (color: string | null) => void;
  parent2Color: string | null;
  setParent2Color: (color: string | null) => void;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

const extractHslValues = (hslString: string | null): string | null => {
    if (!hslString) return null;
    const match = hslString.match(/hsl\(([^)]+)\)/);
    return match ? match[1] : hslString;
}

export const ColorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [parent1Color, setParent1Color] = useState<string | null>(null);
  const [parent2Color, setParent2Color] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const p1ColorValues = extractHslValues(parent1Color);
    if (p1ColorValues) {
      root.style.setProperty('--parent1', p1ColorValues);
    } else {
      root.style.removeProperty('--parent1');
    }
  }, [parent1Color]);

  useEffect(() => {
    const root = document.documentElement;
    const p2ColorValues = extractHslValues(parent2Color);
    if (p2ColorValues) {
      root.style.setProperty('--parent2', p2ColorValues);
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
