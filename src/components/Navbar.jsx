import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, Mail, Lock, UserCircle, ArrowRight, ChevronDown, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../lib/constants';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
    const [email, setEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [city, setCity] = useState('');
    const [department, setDepartment] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    const location = useLocation();
    const navigate = useNavigate();
    const { cart } = useCart();
    const { addToast } = useToast();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Check Auth
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session) {
                setIsAuthOpen(false);
            }
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (isAuthOpen) {
            document.body.classList.add('auth-open');
        } else {
            document.body.classList.remove('auth-open');
        }
        return () => document.body.classList.remove('auth-open');
    }, [isAuthOpen]);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError(null);

        if (authMode === 'forgot') {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            setLoading(false);
            if (error) setError(error.message);
            else {
                setResetEmailSent(true);
                addToast('Enlace de recuperación enviado');
            }
            return;
        }

        if (authMode === 'signup') {
            if (password !== confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }
            const rawPhone = phone ? phone.replace('+504', '').replace(/\D/g, '') : '';
            if (rawPhone.length !== 8) {
                setError('El número de teléfono debe tener exactamente 8 dígitos');
                return;
            }
        }

        setLoading(true);

        try {
            let result;
            if (authMode === 'login') {
                result = await supabase.auth.signInWithPassword({ email, password });
            } else {
                // Explicit check for existing email
                const { data: existingUser } = await supabase
                    .from('customers')
                    .select('id')
                    .eq('email', email)
                    .single();

                result = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            city: city,
                            department: department,
                            phone: phone
                        }
                    }
                });
            }

            if (result.error) {
                if (result.error.message.includes('User already registered')) {
                    setError('Este correo electrónico ya está registrado');
                } else if (result.error.message.includes('Invalid login credentials')) {
                    setError('Credenciales incorrectas');
                } else {
                    setError(result.error.message);
                }
            } else {
                addToast(authMode === 'login' ? 'Bienvenido de nuevo' : 'Cuenta creada con éxito');
                if (result.data.user?.email === ADMIN_EMAIL) {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/profile');
                }
            }
        } catch (err) {
            setError('Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const navLinks = [
        { name: 'Inicio', path: '/' },
        { name: 'Catálogo', path: '/catalog' },
        { name: 'Nosotros', path: '/about' },
        { name: 'Contacto', path: '/contact' },
    ];

    const handleLogout = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            addToast('Sesión cerrada correctamente');
            navigate('/');
        } catch (err) {
            console.error('Logout error:', err);
            addToast('Error al cerrar sesión', 'error');
        }
    };

    const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 pt-safe ${scrolled
                ? 'py-3 bg-primary/95 m-4 rounded-full shadow-2xl backdrop-blur-md border border-secondary/10'
                : 'py-6 bg-primary'
                }`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    {/* Logo Responsive */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <img
                            src="/img/logo.svg"
                            alt="Luxessence"
                            className="h-10 md:h-12 w-auto object-contain"
                        />
                        <span className="text-2xl font-serif font-bold tracking-tight text-secondary hidden lg:block">
                            Luxessence
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={`text-sm font-bold tracking-widest uppercase transition-all hover:text-secondary-light ${location.pathname === link.path ? 'text-secondary-light' : 'text-secondary/60'
                                    }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-6">
                        <button className="text-secondary/60 hover:text-secondary-light transition-colors p-2">
                            <Search className="w-5 h-5" />
                        </button>

                        {user ? (
                            <div className="flex items-center gap-4">
                                <Link to={user.email === ADMIN_EMAIL ? "/admin/dashboard" : "/profile"} className="text-secondary/60 hover:text-secondary-light transition-colors p-2">
                                    <User className="w-5 h-5" />
                                </Link>
                                <button onClick={handleLogout} className="text-secondary/40 hover:text-white p-2">
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsAuthOpen(true)} className="text-secondary/60 hover:text-secondary-light transition-colors p-2">
                                <User className="w-5 h-5" />
                            </button>
                        )}

                        <Link to="/cart" className="relative p-2 bg-secondary/10 rounded-full hover:bg-secondary/20 transition-all border border-secondary/10 group">
                            <ShoppingCart className="w-5 h-5 text-secondary group-hover:scale-110 transition-transform" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-secondary text-primary text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="flex md:hidden items-center gap-4">
                        <Link to="/cart" className="relative p-2 text-secondary">
                            <ShoppingCart className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-secondary text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button onClick={() => setIsOpen(!isOpen)} className="text-secondary p-2">
                            {isOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 top-0 left-0 w-full h-screen bg-primary z-[90] md:hidden flex flex-col pt-32 px-10"
                        >
                            {/* Close Button UI */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-8 right-8 w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary-light hover:bg-secondary/20 transition-all border border-secondary/10"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="flex flex-col gap-8 text-left">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.path}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Link
                                            to={link.path}
                                            onClick={() => setIsOpen(false)}
                                            className="text-4xl font-serif text-secondary font-bold hover:text-secondary-light transition-colors flex items-center justify-between group"
                                        >
                                            {link.name}
                                            <ArrowRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </Link>
                                    </motion.div>
                                ))}

                                <div className="h-px bg-secondary/10 my-8 w-1/4" />

                                {user ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="space-y-6"
                                    >
                                        <Link
                                            to={user.email === ADMIN_EMAIL ? "/admin/dashboard" : "/profile"}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-4 text-secondary/80 text-lg font-bold"
                                        >
                                            <UserCircle className="w-8 h-8 text-secondary" />
                                            <span>{user.email === ADMIN_EMAIL ? 'Panel Administrativo' : 'Mi Perfil'}</span>
                                        </Link>
                                        <button
                                            onClick={() => { handleLogout(); setIsOpen(false); }}
                                            className="text-white/40 text-sm font-black uppercase tracking-widest hover:text-white transition-colors"
                                        >
                                            Finalizar Sesión
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        onClick={() => { setIsAuthOpen(true); setIsOpen(false); }}
                                        className="btn-primary w-full !py-6 flex items-center justify-center gap-3"
                                    >
                                        <User className="w-5 h-5" /> ACCESO CLIENTE
                                    </motion.button>
                                )}
                            </div>

                            {/* Decorative Background for Mobile Menu */}
                            <div className="absolute bottom-10 right-10 opacity-5 grayscale pointer-events-none">
                                <img src="/img/logo-blanco.png" className="w-40" alt="Luxessence" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Custom Auth Modal */}
            <AnimatePresence>
                {isAuthOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-primary/40 backdrop-blur-md"
                            onClick={() => setIsAuthOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-secondary-light w-full max-w-lg md:max-w-2xl rounded-[3rem] p-8 md:p-16 relative z-10 shadow-3xl border border-primary/10 overflow-hidden"
                        >
                            <button
                                onClick={() => setIsAuthOpen(false)}
                                className="absolute top-6 right-6 p-2 hover:bg-primary/5 rounded-full transition-colors text-primary"
                            >
                                <X className="w-6 h-6" />
                            </button>

                            <div className="text-center mb-8">
                                <img
                                    src="/img/logo.svg"
                                    className="w-20 h-20 mx-auto mb-6 transition-transform duration-700 hover:rotate-6"
                                    style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(35%) saturate(7000%) hue-rotate(345deg) brightness(85%) contrast(100%)' }}
                                    alt="Luxessence"
                                />
                                <h2 className="text-3xl font-serif font-bold italic text-primary">
                                    {authMode === 'login' ? 'Bienvenido' : authMode === 'signup' ? 'Crear Cuenta' : 'Recuperar'}
                                </h2>
                                <p className="text-[10px] text-luxury-black/40 uppercase tracking-widest font-black mt-1">
                                    {authMode === 'login' ? 'Inicia sesión con tu cuenta' : authMode === 'signup' ? 'Únete a la experiencia Luxessence' : 'Ingresa tu correo para el enlace'}
                                </p>
                            </div>

                            <div className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-700 text-xs font-bold italic"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <form onSubmit={handleAuth} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {resetEmailSent && authMode === 'forgot' ? (
                                        <div className="text-center py-8 space-y-4">
                                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                                                <Mail className="w-8 h-8 text-green-600" />
                                            </div>
                                            <p className="text-sm font-medium text-primary/60 italic">Hemos enviado un enlace a su correo para restablecer su contraseña.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {authMode === 'signup' && (
                                                <div className="space-y-4 mb-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre</label>
                                                            <div className="relative">
                                                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="Nombre"
                                                                    className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                    value={firstName}
                                                                    onChange={(e) => setFirstName(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Apellido</label>
                                                            <div className="relative">
                                                                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="Apellido"
                                                                    className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                    value={lastName}
                                                                    onChange={(e) => setLastName(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Teléfono</label>
                                                            <div className="flex bg-white border border-primary/10 rounded-xl shadow-inner focus-within:ring-1 focus-within:ring-primary transition-all overflow-hidden items-stretch">
                                                                <div className="bg-primary/5 px-3 flex items-center justify-center border-r border-primary/10 shrink-0">
                                                                    <span className="text-primary font-bold text-sm">+504</span>
                                                                </div>
                                                                <input
                                                                    type="tel"
                                                                    required
                                                                    placeholder="0000 0000"
                                                                    className="w-full bg-transparent py-3 px-3 outline-none text-primary text-sm transition-all"
                                                                    value={phone ? phone.replace('+504', '').trim() : ''}
                                                                    onChange={(e) => {
                                                                        const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                                        setPhone(`+504 ${digitsOnly}`);
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Ciudad</label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    required
                                                                    placeholder="Ciudad"
                                                                    className="w-full bg-white border border-primary/10 rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all shadow-inner"
                                                                    value={city}
                                                                    onChange={(e) => setCity(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Departamento</label>
                                                        <div className="relative">
                                                            <select
                                                                required
                                                                className="w-full bg-white border border-primary/10 rounded-xl py-3 px-4 outline-none focus:ring-1 focus:ring-primary text-primary text-sm transition-all appearance-none cursor-pointer shadow-sm pr-10"
                                                                value={department}
                                                                onChange={(e) => setDepartment(e.target.value)}
                                                            >
                                                                <option value="" disabled>Seleccione un departamento</option>
                                                                {["Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro"].map(d => (
                                                                    <option key={d} value={d}>{d}</option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Email</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                        <input
                                                            type="email"
                                                            required
                                                            placeholder="tu@email.com"
                                                            className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                            value={email}
                                                            onChange={(e) => setEmail(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {authMode !== 'forgot' && (
                                                    <>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Contraseña</label>
                                                            <div className="relative">
                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                                <input
                                                                    type="password"
                                                                    required
                                                                    placeholder="••••••••"
                                                                    className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                    value={password}
                                                                    onChange={(e) => setPassword(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>

                                                        {authMode === 'signup' && (
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Confirmar Contraseña</label>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                                    <input
                                                                        type="password"
                                                                        required
                                                                        placeholder="••••••••"
                                                                        className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-4 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                        value={confirmPassword}
                                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>

                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full btn-primary !py-4 flex items-center justify-center gap-3 mt-8 shadow-xl shadow-primary/10"
                                            >
                                                {loading ? 'Procesando...' : authMode === 'login' ? 'INICIAR SESIÓN' : authMode === 'signup' ? 'CREAR CUENTA' : 'ENVIAR ENLACE'}
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </>
                                    )}
                                </form>

                                <div className="text-center space-y-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-xs text-luxury-black/40">
                                            {authMode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                                                setError(null);
                                                setResetEmailSent(false);
                                            }}
                                            className="text-xs font-black text-primary hover:underline underline-offset-4"
                                        >
                                            {authMode === 'login' ? 'Regístrate aquí' : 'Inicia sesión'}
                                        </button>
                                    </div>
                                    {authMode === 'login' && (
                                        <button
                                            onClick={() => setAuthMode('forgot')}
                                            className="text-[10px] uppercase tracking-widest font-black text-primary/40 hover:text-primary transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    )}
                                    {authMode === 'forgot' && (
                                        <button
                                            onClick={() => { setAuthMode('login'); setResetEmailSent(false); }}
                                            className="text-[10px] uppercase tracking-widest font-black text-primary/40 hover:text-primary transition-colors"
                                        >
                                            Volver al Inicio de Sesión
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default Navbar;
