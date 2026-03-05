import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Send, ShieldCheck, ChevronUp, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart, subtotal } = useCart();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: null, message: null }); // { type: 'success' | 'error', message: string }
    const [formData, setFormData] = useState({
        first_name: '', last_name: '', phone: '', address: '', city: '', department: ''
    });
    const [deliveryMode, setDeliveryMode] = useState('domicilio'); // 'domicilio' or 'pickup'
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0); // 0 or 0.05
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [giftWrap, setGiftWrap] = useState(false);
    const giftWrapFee = giftWrap ? 75 : 0;

    const deliveryFee = deliveryMode === 'domicilio' ? 50 : 0;
    const discountAmount = subtotal * appliedDiscount;
    const finalTotal = subtotal + deliveryFee + giftWrapFee - discountAmount;

    const handleIncreaseQty = (item) => {
        let maxStock = item?.stock || 0;
        if (item.isCombo && item.variants && item.comboConfig) {
            const variant = item.variants.find(v => v.id === item.comboConfig.id);
            if (variant) maxStock = variant.stock;
        }

        if (item.quantity >= maxStock) {
            addToast(`Solo hay ${maxStock} unidad${maxStock === 1 ? '' : 'es'} disponibles`, 'warning');
            return;
        }
        updateQuantity(item.cartItemId, item.quantity + 1);
    };

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.user_metadata) {
                const meta = session.user.user_metadata;
                setFormData({
                    first_name: meta.first_name || '',
                    last_name: meta.last_name || '',
                    phone: meta.phone || '',
                    address: meta.address || '',
                    city: meta.city || '',
                    department: meta.department || ''
                });
            }
        };
        fetchUserData();
    }, []);

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Solo números
        setFormData({ ...formData, phone: val });
    };

    const validatePromo = async () => {
        if (!promoCode.trim()) return;
        setValidatingPromo(true);
        const today = new Date().toISOString().split('T')[0];
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setAppliedDiscount(0);
                addToast('Para aplicar cupones, debes haber iniciado sesión con tu cuenta.', 'info');
                setValidatingPromo(false);
                return;
            }

            // 1. Validate coupon existence and basic status
            const { data: promo } = await supabase
                .from('promotions')
                .select('*')
                .eq('promo_code', promoCode.trim().toUpperCase())
                .eq('promo_type', 'code')
                .single();

            if (!promo) {
                setAppliedDiscount(0);
                addToast('Código de cupón no válido.', 'error');
                setValidatingPromo(false);
                return;
            }

            if (!promo.is_active) {
                setAppliedDiscount(0);
                addToast('Este cupón ya no está activo.', 'error');
                setValidatingPromo(false);
                return;
            }

            // Validity dates check
            if (promo.start_date && today < promo.start_date) {
                setAppliedDiscount(0);
                addToast('Este cupón aún no es válido.', 'info');
                setValidatingPromo(false);
                return;
            }
            if (promo.end_date && today > promo.end_date) {
                setAppliedDiscount(0);
                addToast('Este cupón ya ha expirado.', 'error');
                setValidatingPromo(false);
                return;
            }

            // 2. Check if customer used it in non-cancelled orders (More robust check)
            const { data: userOrders } = await supabase
                .from('orders')
                .select('items')
                .eq('client_email', session.user.email)
                .neq('status', 'cancelled');

            const alreadyUsed = userOrders?.some(order =>
                Array.isArray(order.items) && order.items.some(item => item.promo_code_used === promo.promo_code)
            );

            if (alreadyUsed) {
                setAppliedDiscount(0);
                addToast('Este cupón es de un solo uso por cliente y ya lo has utilizado anteriormente.', 'error');
            } else {
                setAppliedDiscount(0.05); // 5% discount
                addToast(`¡Cupón ${promo.promo_code} aplicado con éxito!`, 'success');
            }
        } catch (err) {
            setAppliedDiscount(0);
            addToast('Error al validar cupón.', 'error');
        } finally {
            setValidatingPromo(false);
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: null, message: null });

        if (formData.phone.length < 8) {
            setStatus({ type: 'error', message: 'Por favor ingrese un número de teléfono válido (mínimo 8 dígitos).' });
            setLoading(false);
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();

            // 1. Create/Get Customer
            const { data: customer, error: custError } = await supabase
                .from('customers')
                .upsert({
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    address: formData.address,
                    email: session?.user?.email || null
                }, { onConflict: 'phone' })
                .select().single();

            if (custError) throw custError;

            // 2. Create Order (with coupon metadata to prevent re-use)
            const orderItems = appliedDiscount > 0
                ? [...cart, { is_promo_metadata: true, promo_code_used: promoCode.trim().toUpperCase(), discount_amount: discountAmount }]
                : cart;

            const { data: order, error: ordError } = await supabase
                .from('orders')
                .insert({
                    customer_id: customer.id,
                    items: orderItems,
                    total: finalTotal,
                    status: 'pending',
                    delivery_mode: deliveryMode,
                    client_email: session?.user?.email || null
                })
                .select().single();

            if (ordError) throw ordError;

            addToast('Pedido registrado con éxito');

            // 3. WhatsApp Redirect
            const message = `*NUEVO PEDIDO LUXESSENCE*%0A` +
                `--------------------------%0A` +
                `*Cliente:* ${formData.first_name} ${formData.last_name}%0A` +
                `*Teléfono:* ${formData.phone}%0A` +
                `*Entrega:* ${deliveryMode.toUpperCase()}%0A` +
                `*Ubicación:* ${formData.city}, ${formData.department}%0A` +
                `*Dirección:* ${formData.address}%0A` +
                `--------------------------%0A` +
                cart.map(i => {
                    const paidQty = i.is_bogo ? Math.ceil(i.quantity / 2) : i.quantity;
                    const itemTotal = i.price * paidQty;
                    return `- ${i.name} (x${i.quantity})${i.is_bogo ? ' [BOGO]' : ''}: L. ${itemTotal}`;
                }).join('%0A') +
                `%0A--------------------------%0A` +
                (deliveryFee > 0 ? `*Envío:* L. ${deliveryFee}%0A` : '') +
                (giftWrap ? `*Empaque de Regalo:* L. ${giftWrapFee}%0A` : '') +
                (discountAmount > 0 ? `*Descuento Cupón (5%):* -L. ${discountAmount.toFixed(2)}%0A` : '') +
                `*TOTAL: L. ${finalTotal.toFixed(2)}*%0A` +
                `--------------------------%0A` +
                `_Espere nuestra confirmación para el envío._`;

            window.open(`https://wa.me/50433135869?text=${message}`, '_blank');
            clearCart();
            setStatus({ type: 'success', message: '¡Pedido enviado con éxito! Redirigiendo a WhatsApp...' });
        } catch (error) {
            console.error(error);
            setStatus({ type: 'error', message: 'Error al procesar el pedido. Por favor intente de nuevo.' });
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-secondary-light flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-xl w-full text-center space-y-12 bg-white/40 backdrop-blur-3xl p-16 rounded-[4rem] border border-white shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                            animate={{
                                x: [0, 50, 0],
                                y: [0, 30, 0],
                                scale: [1, 1.2, 1]
                            }}
                            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px]"
                        />
                        <motion.div
                            animate={{
                                x: [0, -40, 0],
                                y: [0, -50, 0],
                                scale: [1, 1.3, 1]
                            }}
                            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            className="absolute bottom-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-[100px]"
                        />
                    </div>

                    <div className="relative z-10">
                        <motion.div
                            initial={{ scale: 0.8, rotate: -10 }}
                            animate={{
                                scale: 1,
                                rotate: 0,
                            }}
                            transition={{
                                scale: { duration: 0.8, type: 'spring' },
                            }}
                            className="w-40 h-40 bg-primary rounded-[3rem] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 relative"
                        >
                            <motion.div
                                animate={{
                                    y: [0, -15, 0],
                                    rotate: [0, -5, 5, -5, 0]
                                }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <ShoppingBag className="w-16 h-16 text-secondary-light" />
                            </motion.div>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-3 -right-3 w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-primary text-xs font-black shadow-xl border-2 border-white"
                            >
                                0
                            </motion.div>

                            {/* Floating particles */}
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-1 h-1 bg-secondary/40 rounded-full"
                                    animate={{
                                        x: [0, (i % 2 === 0 ? 60 : -60) * Math.random()],
                                        y: [0, (i % 3 === 0 ? 60 : -60) * Math.random()],
                                        opacity: [0, 1, 0],
                                        scale: [0, 1.5, 0]
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: i * 0.5
                                    }}
                                />
                            ))}
                        </motion.div>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary leading-tight">
                                No tienes nada agregado en tu Carrito.
                            </h2>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-primary/50 max-w-sm mx-auto text-base md:text-lg italic font-medium leading-relaxed"
                        >
                            Explore nuestra curaduría de tesoros y comience a escribir su propia leyenda hoy mismo.
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="relative z-20"
                    >
                        <button
                            onClick={() => navigate('/catalog')}
                            className="btn-primary w-full !py-7 rounded-[2.5rem] flex items-center justify-center gap-4 group shadow-3xl hover:shadow-primary/30 transition-all font-black tracking-[0.2em] text-xs uppercase relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center gap-4">
                                DESCUBRIR LA COLECCIÓN
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 space-y-16 pb-24 pt-40 md:pt-40">
            <header className="space-y-4 max-w-2xl">
                <h1 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">
                    <span className="md:hidden">Tu Carrito</span>
                    <span className="hidden md:inline">Bolsa de Compras</span>
                </h1>
                <p className="text-luxury-black/40 tracking-[0.3em] uppercase text-xs font-black">Revisión de su pedido premium</p>
                <div className="w-20 h-1 bg-primary/20 rounded-full" />
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-12 items-start">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    <AnimatePresence>
                        {cart.map((item) => (
                            <motion.div
                                layout
                                key={item.cartItemId}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="glass-card p-4 md:p-5 rounded-[2rem] md:rounded-[2rem] flex items-center gap-4 md:gap-5 bg-white shadow-xl shadow-primary/2 hover:shadow-primary/5 transition-all border-primary/5 group"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-primary/5 shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-500">
                                    <img src={item.image_url || '/img/logo.svg'} className="w-full h-full object-cover" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base md:text-xl font-serif font-bold italic text-primary leading-tight truncate">{item.name}</h3>
                                            <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-primary/30 font-black">L. {item.price} c/u</p>
                                        </div>
                                        <button onClick={() => { removeFromCart(item.cartItemId); addToast('Producto eliminado'); }} className="p-2 text-red-500/30 hover:text-red-500 transition-colors hover:bg-red-500/5 rounded-xl">
                                            <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-2 md:mt-3">
                                        <div className="flex items-center gap-2 md:gap-3 bg-primary/5 p-1 rounded-xl border border-primary/5 shadow-inner">
                                            <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="p-1.5 md:p-2 hover:bg-white rounded-lg transition-all text-primary/40 hover:text-primary"><Minus className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                                            <span className="w-4 text-center font-bold text-primary font-sans text-sm md:text-base">{item.quantity}</span>
                                            <button onClick={() => handleIncreaseQty(item)} className="p-1.5 md:p-2 hover:bg-white rounded-lg transition-all text-primary/40 hover:text-primary"><Plus className="w-3 h-3 md:w-3.5 md:h-3.5" /></button>
                                        </div>
                                        <p className="text-lg md:text-2xl font-sans font-bold text-primary tracking-tighter">
                                            L. {item.is_bogo ? (item.price * Math.ceil(item.quantity / 2)) : (item.price * item.quantity)}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Summary & Form */}
                <div className={`fixed lg:relative lg:col-span-3 inset-x-0 bottom-0 z-[150] lg:z-0 lg:block transition-all duration-700 ${isSummaryExpanded ? 'h-[85vh] lg:h-auto' : 'h-[140px] lg:h-auto'}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`glass-card p-6 md:p-10 rounded-t-[3rem] lg:rounded-[4rem] bg-white shadow-2xl border-primary/10 relative overflow-hidden h-full flex flex-col ${isSummaryExpanded ? 'overflow-y-auto' : 'overflow-hidden'}`}
                    >
                        {/* Mobile Toggle Handle */}
                        <div
                            className="lg:hidden flex items-center justify-between pb-6 cursor-pointer"
                            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] uppercase tracking-widest font-black text-primary/40">Total</span>
                                <span className="text-2xl font-sans font-bold text-primary">L. {finalTotal}</span>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shadow-lg border border-primary/10">
                                {isSummaryExpanded ? <ChevronDown className="w-6 h-6 text-primary" /> : <ChevronUp className="w-6 h-6 text-primary" />}
                            </div>
                        </div>

                        <div className={`space-y-10 relative z-10 flex-1 pb-40 lg:pb-0 ${!isSummaryExpanded && 'hidden lg:block'}`}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-3xl font-serif italic text-primary">Finalizar Pedido</h3>
                                    <p className="text-[10px] uppercase font-black text-primary/20 tracking-tighter lg:hidden">Desliza para ver detalles</p>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-xs text-primary/40 uppercase tracking-widest font-black italic">
                                        <span>Artículos ({cart.length})</span>
                                        <span>L. {subtotal}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-primary/40 uppercase tracking-widest font-black italic">
                                        <span>Tarifa de Entrega</span>
                                        <span className={deliveryFee === 0 ? "text-green-600 font-black" : "text-primary"}>
                                            {deliveryMode === 'pickup' ? 'No Aplica' : (deliveryFee === 0 ? 'Gratis' : `L. ${deliveryFee}`)}
                                        </span>
                                    </div>
                                    {giftWrap && (
                                        <div className="flex justify-between text-xs text-primary/40 uppercase tracking-widest font-black italic">
                                            <span>Empaque de Regalo</span>
                                            <span>L. {giftWrapFee}</span>
                                        </div>
                                    )}
                                    {appliedDiscount > 0 && (
                                        <div className="flex justify-between text-xs text-green-600 uppercase tracking-widest font-black italic">
                                            <span>Descuento ({(appliedDiscount * 100).toFixed(0)}% Cupón)</span>
                                            <span>-L. {discountAmount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="pt-6 border-t border-primary/10 flex justify-between items-end">
                                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40">Total Estimado</span>
                                        <span className="text-4xl font-sans font-bold text-primary tracking-tighter">L. {finalTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1 flex items-center gap-2">
                                    <Plus className="w-3 h-3" /> ¿Tienes un cupón?
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        placeholder="CÓDIGO"
                                        className="flex-1 bg-secondary/5 border border-secondary/20 rounded-2xl py-3 px-6 outline-none text-primary font-black tracking-widest text-sm focus:border-secondary uppercase"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        disabled={appliedDiscount > 0}
                                    />
                                    <button
                                        type="button"
                                        onClick={validatePromo}
                                        disabled={validatingPromo || appliedDiscount > 0}
                                        className="bg-primary text-secondary px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {validatingPromo ? '...' : (appliedDiscount > 0 ? 'APLICADO' : 'APLICAR')}
                                    </button>
                                </div>
                                {appliedDiscount > 0 && (
                                    <button onClick={() => { setAppliedDiscount(0); setPromoCode(''); }} className="text-[9px] text-red-500 font-black uppercase tracking-widest ml-1 underline transition-all hover:text-red-700">Remover cupón</button>
                                )}
                            </div>

                            <form onSubmit={handleCheckout} className="space-y-6">
                                <AnimatePresence mode="wait">
                                    {status.message && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className={`${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-700'} border p-4 rounded-2xl flex items-center gap-3 text-xs font-bold italic`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${status.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                            {status.message}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Método de Entrega</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryMode('domicilio')}
                                            className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMode === 'domicilio' ? 'bg-primary text-secondary-light border-primary' : 'bg-white text-primary/40 border-primary/10'}`}
                                        >
                                            Domicilio (L. 50)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeliveryMode('pickup')}
                                            className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${deliveryMode === 'pickup' ? 'bg-primary text-secondary-light border-primary' : 'bg-white text-primary/40 border-primary/10'}`}
                                        >
                                            Pickup (L. 0)
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Datos de {deliveryMode === 'pickup' ? 'Contacto' : 'Entrega'}</p>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input required placeholder="Nombre" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium shadow-inner" value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                                        <input required placeholder="Apellido" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium shadow-inner" value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                                    </div>
                                    <input required placeholder="Teléfono" type="tel" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium shadow-inner" value={formData.phone} onChange={handlePhoneChange} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <input required placeholder="Ciudad" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium shadow-inner" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                                        <select
                                            required
                                            className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all text-primary font-medium shadow-inner"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        >
                                            <option value="" disabled>Departamento</option>
                                            {["Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés", "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá", "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho", "Santa Bárbara", "Valle", "Yoro"].map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <textarea required rows="2" placeholder="Dirección Exacta para Envío" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium resize-none shadow-inner" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setGiftWrap(!giftWrap)}
                                    className={`w-full group relative p-6 rounded-3xl border transition-all duration-700 overflow-hidden flex items-center justify-between ${giftWrap ? 'bg-primary border-primary shadow-2xl' : 'bg-white border-primary/10'}`}
                                >
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors duration-700 ${giftWrap ? 'bg-secondary text-primary' : 'bg-primary/5 text-primary/40'}`}>
                                            <motion.div
                                                animate={giftWrap ? {
                                                    rotate: [0, -10, 10, -5, 5, 0],
                                                    scale: [1, 1.1, 1]
                                                } : {}}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M20 12v10H4V12" />
                                                    <path d="M2 7h20v5H2z" />
                                                    <path d="M12 22V7" />
                                                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                        <div className="text-left">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${giftWrap ? 'text-secondary-light' : 'text-primary/40'}`}>Presentación Premium</p>
                                            <p className={`text-base font-serif italic font-bold ${giftWrap ? 'text-white' : 'text-primary'}`}>¿Es un regalo?</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end relative z-10">
                                        <span className={`text-sm font-black ${giftWrap ? 'text-secondary' : 'text-primary/60'}`}>L. {giftWrapFee}</span>
                                        {giftWrap && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-[8px] font-black text-secondary-light tracking-tighter uppercase mt-1"
                                            >
                                                Añadido
                                            </motion.span>
                                        )}
                                    </div>
                                    {giftWrap && (
                                        <motion.div
                                            layoutId="gift-glow"
                                            className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10"
                                        />
                                    )}
                                </button>

                                <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-black text-primary/40 bg-primary/5 p-4 rounded-2xl italic">
                                    <ShieldCheck className="w-4 h-4 text-green-600" /> Transacción Segura vía WhatsApp
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full btn-primary !py-6 flex items-center justify-center gap-4 shadow-3xl group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <span className="relative z-10 flex items-center gap-4">
                                        {loading ? 'Procesando...' : 'COMPLETAR PEDIDO'} <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform text-secondary-light" />
                                    </span>
                                </button>
                            </form>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
