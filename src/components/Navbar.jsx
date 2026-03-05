import { useState, useEffect, useRef, useId } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShoppingBag, User, LogOut, Mail, Lock, UserCircle, ArrowRight, ChevronDown, Search, ShoppingCart, Eye, EyeOff, LayoutDashboard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { ADMIN_EMAIL } from '../lib/constants';
import { useUpdate } from '../context/UpdateContext';

// Glass-surface pill — implements glass-surface.txt displacement filter directly
const NavGlassPill = ({
    navLinks,
    location,
    user,
    cartCount,
    handleLogout,
    setIsAuthOpen,
    ADMIN_EMAIL,
    isSolid = false,
    updateAvailable,
    isDismissed,
    setIsDismissed,
    setShowModal
}) => {
    const containerRef = useRef(null);
    const feImageRef = useRef(null);
    const uid = useId().replace(/:/g, '-');
    const filterId = `nav-glass-${uid}`;
    const redGradId = `ng-red-${uid}`;
    const blueGradId = `ng-blue-${uid}`;

    const generateMap = () => {
        const rect = containerRef.current?.getBoundingClientRect();
        const w = rect?.width || 400;
        const h = rect?.height || 60;
        const br = 9999; // full pill
        const edgeSize = Math.min(w, h) * 0.035;
        const svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="red"/>
            </linearGradient>
            <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0000"/>
              <stop offset="100%" stop-color="blue"/>
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
          <rect x="0" y="0" width="${w}" height="${h}" rx="${br}" fill="url(#${redGradId})"/>
          <rect x="0" y="0" width="${w}" height="${h}" rx="${br}" fill="url(#${blueGradId})" style="mix-blend-mode:difference"/>
          <rect x="${edgeSize}" y="${edgeSize}" width="${w - edgeSize * 2}" height="${h - edgeSize * 2}" rx="${br}" fill="hsl(0 0% 30% / 0.92)" style="filter:blur(11px)"/>
        </svg>`;
        return `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };

    useEffect(() => {
        if (!containerRef.current) return;
        // Set SVG filter feImage href
        const feImg = document.getElementById(`${filterId}-img`);
        if (feImg) feImg.setAttribute('href', generateMap());
        // Resize observer
        const ro = new ResizeObserver(() => {
            const feImg2 = document.getElementById(`${filterId}-img`);
            if (feImg2) feImg2.setAttribute('href', generateMap());
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Primary color badge style for logo/icons pill
    const badgeStyle = {
        background: isSolid ? 'transparent' : 'rgba(113, 17, 22, 0.42)',
        backdropFilter: isSolid ? 'none' : 'blur(18px) saturate(1.6)',
        WebkitBackdropFilter: isSolid ? 'none' : 'blur(18px) saturate(1.6)',
        boxShadow: isSolid ? 'none' : '0 0 22px rgba(113, 17, 22, 0.38), inset 0 1px 0 rgba(255,255,255,0.07)',
        transition: 'background 0.5s ease, box-shadow 0.5s ease',
    };
    const linksBadgeStyle = {
        background: isSolid ? 'transparent' : 'rgba(113, 17, 22, 0.35)',
        backdropFilter: isSolid ? 'none' : 'blur(20px) saturate(1.6)',
        WebkitBackdropFilter: isSolid ? 'none' : 'blur(20px) saturate(1.6)',
        boxShadow: isSolid ? 'none' : '0 0 26px rgba(113, 17, 22, 0.32), inset 0 1px 0 rgba(255,255,255,0.06)',
        transition: 'background 0.5s ease, box-shadow 0.5s ease',
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{
                borderRadius: '9999px',
                backdropFilter: isSolid ? 'blur(20px) saturate(1.8)' : `url(#${filterId}) saturate(1.2)`,
                WebkitBackdropFilter: isSolid ? 'blur(20px) saturate(1.8)' : `url(#${filterId}) saturate(1.2)`,
                background: isSolid ? 'rgba(113, 17, 22, 0.95)' : 'hsl(0 0% 100% / 0)',
                border: isSolid ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(255,255,255,0.18)',
                boxShadow: isSolid
                    ? '0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)'
                    : '0 0 2px 1px color-mix(in oklch, white, transparent 65%) inset, 0 0 10px 4px color-mix(in oklch, white, transparent 85%) inset, 0 8px 32px rgba(0,0,0,0.28)',
                transition: 'background 0.5s ease, box-shadow 0.5s ease, border-color 0.5s ease',
            }}
        >
            {/* Invisible SVG that defines the filter — must be in-DOM for backdropFilter url() to work */}
            <svg
                style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
                        <feImage id={`${filterId}-img`} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
                        <feDisplacementMap in="SourceGraphic" in2="map" scale="-180" xChannelSelector="R" yChannelSelector="G" result="dispRed" />
                        <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
                        <feDisplacementMap in="SourceGraphic" in2="map" scale="-170" xChannelSelector="R" yChannelSelector="G" result="dispGreen" />
                        <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
                        <feDisplacementMap in="SourceGraphic" in2="map" scale="-160" xChannelSelector="R" yChannelSelector="G" result="dispBlue" />
                        <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
                        <feBlend in="red" in2="green" mode="screen" result="rg" />
                        <feBlend in="rg" in2="blue" mode="screen" result="output" />
                        <feGaussianBlur in="output" stdDeviation="0.7" />
                    </filter>
                </defs>
            </svg>

            <div className="relative z-10 w-full px-4 md:px-6 py-2.5 flex justify-between items-center gap-3">

                {/* Logo badge */}
                <Link to="/" className="flex items-center group shrink-0 rounded-full px-3 py-1.5" style={badgeStyle}>
                    <img src="/img/logo-blanco.png" alt="Luxessence" className="h-7 md:h-9 w-auto object-contain transition-transform duration-500 group-hover:scale-105" />
                </Link>

                {/* Desktop nav links badge */}
                <div className="hidden md:flex items-center gap-6 rounded-full px-5 py-1.5" style={linksBadgeStyle}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-[10px] font-black tracking-widest uppercase transition-all hover:text-white ${location.pathname === link.path ? 'text-white' : 'text-white/65'}`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>

                {/* Icons badge */}
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5" style={badgeStyle}>
                    <div className="hidden md:flex items-center gap-1">
                        {updateAvailable && isDismissed && (
                            <button
                                onClick={() => {
                                    setIsDismissed(false);
                                    setShowModal(true);
                                }}
                                className="relative p-1.5 transition-colors group"
                                title="Actualización disponible"
                            >
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                                >
                                    <svg className="w-4.5 h-4.5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </motion.div>
                                <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
                            </button>
                        )}
                        <button className="text-white/65 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10">
                            <Search className="w-4 h-4" />
                        </button>
                        {user ? (
                            <>
                                <Link to="/profile" className="text-white/65 hover:text-white p-1.5 rounded-full hover:bg-white/10">
                                    <User className="w-4 h-4" />
                                </Link>
                                {user.email === ADMIN_EMAIL && (
                                    <Link to="/admin/dashboard" className="relative text-white/65 hover:text-white p-1.5 rounded-full hover:bg-white/10" title="Panel Admin">
                                        <LayoutDashboard className="w-4 h-4" />
                                        <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full" />
                                    </Link>
                                )}
                                <button onClick={handleLogout} className="text-white/45 hover:text-white p-1.5 rounded-full hover:bg-white/10">
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button onClick={() => setIsAuthOpen(true)} className="text-white/65 hover:text-white p-1.5 rounded-full hover:bg-white/10">
                                <User className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Link to="/cart" className="relative p-1.5 text-white/80 hover:text-white transition-colors">
                        <ShoppingCart className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-white text-[#500a1e] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                    {updateAvailable && isDismissed && (
                        <button
                            onClick={() => {
                                setIsDismissed(false);
                                setShowModal(true);
                            }}
                            className="relative p-1.5 transition-colors md:hidden"
                            title="Actualización pendiente"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                            >
                                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </motion.div>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-ping" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full" />
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};


const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'signup', 'forgot'
    const [email, setEmail] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const { updateAvailable, isDismissed, setIsDismissed, setShowModal } = useUpdate();

    useEffect(() => {
        const handleScroll = () => {
            // heroGone = true when the hero section (85vh) has fully scrolled past
            const heroHeight = window.innerHeight * 0.85;
            setScrolled(window.scrollY > heroHeight);
        };
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

        // Listen for open auth modal event
        const handleOpenAuth = () => {
            setIsAuthOpen(true);
            setAuthMode('login');
        };
        window.addEventListener('open-auth-modal', handleOpenAuth);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            subscription.unsubscribe();
            window.removeEventListener('open-auth-modal', handleOpenAuth);
        };
    }, []);

    useEffect(() => {
        if (isAuthOpen) {
            document.body.classList.add('auth-open');
        } else {
            document.body.classList.remove('auth-open');
        }
        // Notify other components about auth modal visibility
        window.dispatchEvent(new CustomEvent('auth-modal-change', { detail: { open: isAuthOpen } }));

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
            {/* Main Navbar — glass-surface.txt effect via NavGlassPill */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="fixed left-3 right-3 z-[100]"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}
            >
                <NavGlassPill
                    navLinks={navLinks}
                    location={location}
                    user={user}
                    cartCount={cartCount}
                    handleLogout={handleLogout}
                    setIsAuthOpen={setIsAuthOpen}
                    ADMIN_EMAIL={ADMIN_EMAIL}
                    isSolid={scrolled || location.pathname !== '/'}
                    updateAvailable={updateAvailable}
                    isDismissed={isDismissed}
                    setIsDismissed={setIsDismissed}
                    setShowModal={setShowModal}
                />
            </motion.nav>

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
                                                                    type={showPassword ? "text" : "password"}
                                                                    required
                                                                    placeholder="••••••••"
                                                                    className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-12 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                    value={password}
                                                                    onChange={(e) => setPassword(e.target.value)}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setShowPassword(!showPassword)}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors focus:outline-none"
                                                                >
                                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {authMode === 'signup' && (
                                                            <div className="space-y-1">
                                                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Confirmar Contraseña</label>
                                                                <div className="relative">
                                                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30" />
                                                                    <input
                                                                        type={showConfirmPassword ? "text" : "password"}
                                                                        required
                                                                        placeholder="••••••••"
                                                                        className="w-full bg-white border border-primary/10 rounded-xl py-3 pl-11 pr-12 outline-none focus:ring-1 focus:ring-primary placeholder:text-primary/10 text-primary text-sm transition-all"
                                                                        value={confirmPassword}
                                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/30 hover:text-primary transition-colors focus:outline-none"
                                                                    >
                                                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                    </button>
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
