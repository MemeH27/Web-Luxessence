import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) alert('Acceso denegado. Verifique sus credenciales.');
        else {
            localStorage.setItem('lux_auth', 'true');
            navigate('/admin/dashboard');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-secondary-light flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Aura */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card w-full max-w-md p-12 rounded-[4rem] bg-white shadow-2xl relative overflow-hidden border border-primary/10"
            >
                <div className="space-y-10 relative z-10">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto border border-primary/20 shadow-2xl">
                            <Sparkles className="text-primary w-10 h-10" />
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-serif font-bold italic text-primary">Lux HQ+ Login</h1>
                            <p className="text-[10px] text-primary/40 uppercase tracking-[0.3em] font-black">Portal de Gestión de Elite</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Identificador Fiscal/Email</label>
                                <div className="relative">
                                    <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/20 text-primary font-medium transition-all"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Código de Acceso</label>
                                <div className="relative">
                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/50" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/20 text-primary font-medium transition-all"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary !py-6 group flex items-center justify-center gap-3 shadow-3xl"
                        >
                            {loading ? 'Validando...' : 'INICIAR SESIÓN HQ'}
                            {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </form>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-primary/30 uppercase tracking-widest font-black">
                        <ShieldCheck className="w-4 h-4 text-green-600/50" />
                        Autenticación Encriptada
                    </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
            </motion.div>
        </div>
    );
};

export default Login;
