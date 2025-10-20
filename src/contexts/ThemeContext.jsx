import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Check localStorage and system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) {
      return saved === "dark";
    }
    // Check system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Prevent transitions on initial page load
  useEffect(() => {
    // Add preload class to prevent transitions during initial render
    document.documentElement.classList.add("preload");

    // Remove preload class after a brief delay to enable transitions
    const timer = setTimeout(() => {
      document.documentElement.classList.remove("preload");
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Update document class and localStorage when theme changes
    const htmlElement = document.documentElement;

    // Use View Transitions API if available for ultra-smooth transitions
    if (
      document.startViewTransition &&
      !htmlElement.classList.contains("preload")
    ) {
      document.startViewTransition(() => {
        if (isDarkMode) {
          htmlElement.classList.add("dark");
          localStorage.setItem("theme", "dark");
        } else {
          htmlElement.classList.remove("dark");
          localStorage.setItem("theme", "light");
        }
      });
    } else {
      // Fallback for browsers without View Transitions API
      if (isDarkMode) {
        htmlElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        htmlElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
