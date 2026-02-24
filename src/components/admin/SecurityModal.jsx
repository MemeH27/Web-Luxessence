import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, X, ShieldCheck, AlertCircle } from 'lucide-react';

const SecurityModal = ({ isOpen, onClose, onConfirm, title = "Acción Sensible" }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === '1234') { // Contraseña maestra placeholder
            onConfirm();
            setPassword('');
            setError(false);
            onClose();
        } else {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-primary/40 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 shadow-2xl border border-primary/20"
                    >
                        <div className="text-center space-y-4 mb-8">
                            <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                                <Lock className={`w-8 h-8 ${error ? 'text-red-500 animate-bounce' : 'text-primary'}`} />
                            </div>
                            <h3 className="text-2xl font-serif font-bold italic text-primary">{title}</h3>
                            <p className="text-[10px] text-primary/40 uppercase tracking-widest font-black">Se requiere verificación maestra</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <div className="relative">
                                    <input
                                        autoFocus
                                        type="password"
                                        placeholder="••••"
                                        className={`w-full bg-primary/5 border ${error ? 'border-red-500 ring-2 ring-red-500/20' : 'border-primary/10'} rounded-2xl py-4 px-6 text-center text-3xl tracking-[0.5em] focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono`}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute -bottom-8 left-0 right-0 text-center"
                                        >
                                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest flex items-center justify-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Contraseña Incorrecta
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 btn-primary !py-4 shadow-xl"
                                >
                                    VERIFICAR
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SecurityModal;
