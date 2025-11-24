import React, { createContext, useContext, useState, ReactNode } from 'react';

// Theme Types
export type ThemeType = 'dark' | 'light';

// Theme Colors
export type ColorShades = {
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
};

export type ThemeColors = {
    grey: ColorShades;
    primary: ColorShades;
    greenAccent: ColorShades;
    redAccent: ColorShades;
    blueAccent: ColorShades;
};

export const dark: ThemeColors = {
    grey: {
        100: "#e0e0e0",
        200: "#c2c2c2",
        300: "#a3a3a3",
        400: "#858585",
        500: "#666666",
        600: "#525252",
        700: "#3d3d3d",
        800: "#292929",
        900: "#141414",
    },
    primary: {
        100: "#d0d1d5",
        200: "#a1a4ab",
        300: "#727681",
        400: "#1f2a40",
        500: "#141b2d",
        600: "#101624",
        700: "#0c101b",
        800: "#080b12",
        900: "#040509",
    },
    greenAccent: {
        100: "#dbf5ee",
        200: "#b7ebde",
        300: "#94e2cd",
        400: "#70d8bd",
        500: "#4cceac",
        600: "#3da58a",
        700: "#2e7c67",
        800: "#1e5245",
        900: "#0f2922",
    },
    redAccent: {
        100: "#f2dcdb",
        200: "#e5b9b7",
        300: "#d79592",
        400: "#ca726e",
        500: "#bd4f4a",
        600: "#973f3b",
        700: "#712f2c",
        800: "#4c201e",
        900: "#26100f",
    },
    blueAccent: {
        100: "#e1e2fe",
        200: "#c3c6fd",
        300: "#a4a9fc",
        400: "#868dfb",
        500: "#6870fa",
        600: "#535ac8",
        700: "#3e4396",
        800: "#2a2d64",
        900: "#151632",
    },
};

export const light: ThemeColors = {
    grey: {
        100: "#141414",
        200: "#292929",
        300: "#3d3d3d",
        400: "#525252",
        500: "#666666",
        600: "#858585",
        700: "#a3a3a3",
        800: "#c2c2c2",
        900: "#e0e0e0",
    },
    primary: {
        100: "#040509",
        200: "#080b12",
        300: "#0c101b",
        400: "#f2f0f0",
        500: "#141b2d",
        600: "#434957",
        700: "#727681",
        800: "#a1a4ab",
        900: "#d0d1d5",
    },
    greenAccent: {
        100: "#0f2922",
        200: "#1e5245",
        300: "#2e7c67",
        400: "#3da58a",
        500: "#4cceac",
        600: "#70d8bd",
        700: "#94e2cd",
        800: "#b7ebde",
        900: "#dbf5ee",
    },
    redAccent: {
        100: "#26100f",
        200: "#4c201e",
        300: "#712f2c",
        400: "#973f3b",
        500: "#bd4f4a",
        600: "#ca726e",
        700: "#d79592",
        800: "#e5b9b7",
        900: "#f2dcdb",
    },
    blueAccent: {
        100: "#151632",
        200: "#2a2d64",
        300: "#3e4396",
        400: "#535ac8",
        500: "#6870fa",
        600: "#868dfb",
        700: "#a4a9fc",
        800: "#c3c6fd",
        900: "#e1e2fe",
    },
};

// Create Context
type ThemeContextType = {
    theme: ThemeType;
    setTheme: React.Dispatch<React.SetStateAction<ThemeType>>;
    colors: ThemeColors; 
    toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Create Provider component
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const savedTheme = localStorage.getItem('theme') as ThemeType || 'dark';
    const [theme, setTheme] = useState<ThemeType>(savedTheme);
    const colors = theme === 'dark' ? dark : light;

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, colors , toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Create custom hook
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};