import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppColors } from '@/constants/theme';

export type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeContextType = {
  mode: ThemeMode;
  colors: typeof AppColors.light;
  setMode: (mode: ThemeMode) => void;
};

// auto = dark si entre 20h et 7h, sinon light
function getAutoColors(): typeof AppColors.light {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 7 ? AppColors.dark : AppColors.light;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  colors: AppColors.light,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [autoColors, setAutoColors] = useState(getAutoColors());

  // En mode auto, recalcule chaque minute
  useEffect(() => {
    if (mode !== 'auto') return;
    setAutoColors(getAutoColors());
    const interval = setInterval(() => setAutoColors(getAutoColors()), 60_000);
    return () => clearInterval(interval);
  }, [mode]);

  const colors =
    mode === 'light' ? AppColors.light :
    mode === 'dark'  ? AppColors.dark  :
    autoColors;

  return (
    <ThemeContext.Provider value={{ mode, colors, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);