import React , { createContext , useContext , ReactNode } from "react";
import { ToastContainer , toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useTheme } from "../Theme/ThemeContext";

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'default';

interface ToastContextType {
    notify: (message:string , type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
    children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {

    const {colors} = useTheme();
    const BackgroundColor = colors.primary[400];
    const TextColor  = colors.grey[100]; 
    const notify = (message: string, type: ToastType = 'default') => {
      switch (type) {
        case 'success':
          toast.success(message, { 
            position: "top-right",
            style: {color: TextColor , backgroundColor:BackgroundColor , border: `2px solid ${TextColor}`}  
        });
          break;
        case 'info':
          toast.info(message, { 
            position: "top-right",
            style: {color: TextColor , backgroundColor:BackgroundColor , border: `2px solid ${TextColor}`}  
        });
          break;
        case 'warning':
          toast.warning(message, { 
            position: "top-right",
            style: {color: TextColor , backgroundColor:BackgroundColor , border: `2px solid ${TextColor}`}  
        });
          break;
        case 'error':
          toast.error(message, { 
            position: "top-right",
            style: {color: TextColor , backgroundColor:BackgroundColor , border: `2px solid ${TextColor}`}  
        });
          break;
        default:
          toast(message, { 
            position: "top-right",
            style: {color: TextColor , backgroundColor:BackgroundColor , border: `2px solid ${TextColor}`}  
        });
      }
    };

    return (
        <ToastContext.Provider value={{ notify }}>
            <ToastContainer/>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = (): ToastContextType => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}; 