import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, ArrowRight } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleReset = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
            setError(error.message);
        } else {
            addToast('Contraseña actualizada con éxito');
            navigate('/');
        }
        setLoading(false);
    };

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center px-4 bg-secondary-light">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md glass-panel p-10 md:p-14 rounded-[3.5rem] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-0" />

                <div className="text-center space-y-4 mb-10 relative z-10">
                    <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto border border-primary/10">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-serif font-bold italic text-primary">Nueva Contraseña</h1>
                        <p className="text-[10px] text-primary/40 uppercase tracking-widest font-black mt-2">Personaliza tu acceso de seguridad</p>
                    </div>
                </div>

                <form onSubmit={handleReset} className="space-y-6 relative z-10">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-red-500 text-[10px] uppercase font-black text-center tracking-widest">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nueva Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-primary/10 rounded-2xl py-4 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Confirmar Contraseña</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-white border border-primary/10 rounded-2xl py-4 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary !py-5 flex items-center justify-center gap-3 shadow-xl shadow-primary/10"
                    >
                        {loading ? 'Actualizando...' : 'RESTABLECER MI CUENTA'}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
