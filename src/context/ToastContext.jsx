import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X, Bell } from 'lucide-react';

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
                            initial={{ opacity: 0, y: 20, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`pointer-events-auto flex items-center gap-4 p-4 rounded-[1.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-primary/5 min-w-[320px] max-w-[420px] overflow-hidden relative group`}
                        >
                            {/* Decorative background pulse */}
                            {toast.type === 'error' && (
                                <motion.div
                                    className="absolute -left-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full"
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ repeat: Infinity, duration: 3 }}
                                />
                            )}

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 relative z-10 ${toast.type === 'success' ? 'bg-green-500/10 text-green-600' :
                                    (toast.type === 'error' || toast.type === 'warning') ? 'bg-red-500/10 text-red-600' :
                                        'bg-primary/10 text-primary'
                                }`}>
                                {toast.type === 'success' && (
                                    <motion.div
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    >
                                        <CheckCircle2 className="w-6 h-6" />
                                    </motion.div>
                                )}
                                {(toast.type === 'error' || toast.type === 'warning') && (
                                    <motion.div
                                        animate={{
                                            rotate: [0, -10, 10, -10, 10, 0],
                                            scale: [1, 1.1, 1]
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 2.5,
                                            times: [0, 0.1, 0.2, 0.3, 0.4, 0.5]
                                        }}
                                    >
                                        <AlertTriangle className="w-6 h-6" />
                                    </motion.div>
                                )}
                                {toast.type === 'info' && (
                                    <motion.div animate={{ y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                                        <Info className="w-6 h-6" />
                                    </motion.div>
                                )}
                            </div>
                            <div className="flex-1 pr-2 relative z-10">
                                <p className="text-[13px] font-bold text-luxury-black font-sans leading-snug">{toast.message}</p>
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-2 text-primary/10 hover:text-primary transition-colors relative z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Toast Progress Bar */}
                            <motion.div
                                className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-green-500/20' :
                                    toast.type === 'error' ? 'bg-red-500/20' : 'bg-primary/20'
                                    }`}
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 4, ease: "linear" }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
