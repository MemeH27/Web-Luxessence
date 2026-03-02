import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Sparkles, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ADMIN_EMAIL, MAX_LOGIN_ATTEMPTS, LOCKOUT_DURATION } from '../../lib/constants';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [attempts, setAttempts] = useState(0);
    const [lockedUntil, setLockedUntil] = useState(null);
    const [showAttempts, setShowAttempts] = useState(false);
    const navigate = useNavigate();

    // Check for existing lockout on component mount
    useEffect(() => {
        const storedLock = localStorage.getItem('lux_login_locked_until');
        if (storedLock) {
            const lockTime = parseInt(storedLock);
            if (lockTime > Date.now()) {
                setLockedUntil(lockTime);
            } else {
                localStorage.removeItem('lux_login_locked_until');
            }
        }

        // Load previous attempts
        const storedAttempts = localStorage.getItem('lux_login_attempts');
        if (storedAttempts) {
            setAttempts(parseInt(storedAttempts));
        }
    }, []);

    // Update lockout timer display
    useEffect(() => {
        if (!lockedUntil) return;

        const interval = setInterval(() => {
            if (Date.now() >= lockedUntil) {
                setLockedUntil(null);
                setAttempts(0);
                localStorage.removeItem('lux_login_locked_until');
                localStorage.removeItem('lux_login_attempts');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockedUntil]);

    const handleLogin = async (e) => {
        e.preventDefault();

        // Check if account is locked
        if (lockedUntil && Date.now() < lockedUntil) {
            const remainingMinutes = Math.ceil((lockedUntil - Date.now()) / 60000);
            setError(`Demasiados intentos. Intenta de nuevo en ${remainingMinutes} minutos.`);
            return;
        }

        setLoading(true);
        setError('');
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

        if (authError) {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            localStorage.setItem('lux_login_attempts', newAttempts.toString());

            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                const lockUntil = Date.now() + LOCKOUT_DURATION;
                setLockedUntil(lockUntil);
                localStorage.setItem('lux_login_locked_until', lockUntil.toString());
                setError(`Demasiados intentos fallidos. Cuenta bloqueada por 15 minutos.`);
            } else {
                const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
                setError(`Credenciales inválidas. Te quedan ${remaining} intentos.`);
                setShowAttempts(true);
                setTimeout(() => setShowAttempts(false), 3000);
            }
        } else {
            // Successful login - verify admin status before allowing access
            const userEmail = data.user?.email;

            // CRITICAL: Verify user is the admin
            if (userEmail !== ADMIN_EMAIL) {
                // Sign out non-admin users immediately
                await supabase.auth.signOut();
                setError('Acceso denegado. Solo el administrador puede acceder a esta área.');
                setLoading(false);
                return;
            }

            // Successful admin login - reset attempts
            localStorage.removeItem('lux_login_attempts');
            localStorage.removeItem('lux_login_locked_until');
            setAttempts(0);
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
                                        disabled={lockedUntil && Date.now() < lockedUntil}
                                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-5 pl-14 pr-6 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/20 text-primary font-medium transition-all disabled:opacity-50"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {(error || showAttempts) && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-2xl text-center ${lockedUntil && Date.now() < lockedUntil ? 'bg-red-50 border border-red-200' : 'bg-red-50 border border-red-100'}`}
                                >
                                    <p className="text-xs font-bold text-red-600 flex items-center justify-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        {error || (attempts > 0 && `${attempts} intento${attempts > 1 ? 's' : ''} fallido${attempts > 1 ? 's' : ''}`)}
                                    </p>
                                    {lockedUntil && Date.now() < lockedUntil && (
                                        <p className="text-[10px] text-red-500 mt-1">
                                            Bloqueado hasta: {new Date(lockedUntil).toLocaleTimeString()}
                                        </p>
                                    )}
                                </motion.div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || (lockedUntil && Date.now() < lockedUntil)}
                            className="w-full btn-primary !py-6 group flex items-center justify-center gap-3 shadow-3xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Validando...' : lockedUntil && Date.now() < lockedUntil ? 'Cuenta Bloqueada' : 'INICIAR SESIÓN HQ'}
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
