import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 4000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[500] space-y-4 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 20, scale: 0.9 }}
                            className={`pointer-events-auto flex items-center gap-4 p-5 rounded-[2rem] bg-white shadow-2xl border border-primary/5 min-w-[300px] max-w-[400px]`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-500/10 text-green-600' : toast.type === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-primary/10 text-primary'}`}>
                                {toast.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                                {toast.type === 'error' && <AlertCircle className="w-6 h-6" />}
                                {toast.type === 'info' && <Info className="w-6 h-6" />}
                            </div>
                            <div className="flex-1 pr-2">
                                <p className="text-sm font-bold text-luxury-black font-sans leading-tight">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-2 text-primary/20 hover:text-primary transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
