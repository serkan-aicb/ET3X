"use client";

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      {...props}
      forcedTheme="dark" // Force dark theme
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}