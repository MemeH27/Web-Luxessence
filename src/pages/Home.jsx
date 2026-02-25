import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ProductGridItem = ({ product }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="group space-y-4"
    >
        <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-primary/5 relative">
            <img
                src={product.image_url || '/img/logo.svg'}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            {product.is_new_arrival && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-primary text-secondary-light text-[8px] font-black uppercase tracking-widest rounded-full z-10">
                    Nuevo
                </span>
            )}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="space-y-1 text-center">
            <p className="text-[10px] uppercase tracking-widest text-primary/40 font-black truncate px-2">
                {product.categories?.name}
            </p>
            <h3 className="font-serif italic text-lg text-primary leading-tight line-clamp-1 px-2 group-hover:underline transition-all decoration-secondary">
                {product.name}
            </h3>
            <p className="text-primary font-bold">L. {product.price}</p>
        </div>
    </motion.div>
);
const Home = () => {
    const brandValues = [
        {
            icon: ShieldCheck,
            title: 'Productos 100% Originales',
            desc: 'Garantizamos la autenticidad de cada fragancia y accesorio.'
        },
        {
            icon: Sparkles,
            title: 'Atención Personalizada',
            desc: 'Asesoría experta para encontrar tu esencia ideal.'
        },
        {
            icon: ShoppingBag,
            title: 'Entregas Rápidas',
            desc: 'Envío express en San Pedro Sula y entregas en 2-3 días a todo el país.'
        },
        {
            icon: Heart,
            title: 'Servicio al Cliente',
            desc: 'Soporte dedicado de lunes a sábado para todas tus consultas.'
        },
    ];

    const [activePromos, setActivePromos] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [comingSoon, setComingSoon] = useState([]);
    const [giftOptions, setGiftOptions] = useState([]);
    const [selectedGiftTier, setSelectedGiftTier] = useState(500);
    const [loading, setLoading] = useState(true);

    const categories = [
        { name: 'Fragancias', path: '/catalog', img: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1000' },
        ...(activePromos.length > 0 ? [{
            name: activePromos[0].title,
            path: '/catalog?promo=true',
            img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1000'
        }] : []),
        { name: 'Carteras', path: '/catalog', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000' },
        { name: 'Accesorios', path: '/catalog', img: 'https://images.unsplash.com/photo-1535633302704-b02a41af8435?auto=format&fit=crop&q=80&w=1000' },
    ];

    useEffect(() => {
        const fetchHomeData = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Fetch Promos
            const { data: promos } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', today)
                .or(`end_date.is.null,end_date.gte.${today}`)
                .order('created_at', { ascending: false });
            setActivePromos(promos || []);

            // Fetch New Arrivals
            const { data: arrivals } = await supabase
                .from('products')
                .select('*, categories(*)')
                .eq('is_new_arrival', true)
                .limit(4);
            setNewArrivals(arrivals || []);

            // Fetch Coming Soon
            const { data: soon } = await supabase
                .from('products')
                .select('*, categories(*)')
                .eq('is_coming_soon', true)
                .limit(4);
            setComingSoon(soon || []);

            // Fetch Gift Options
            const { data: gifts } = await supabase
                .from('products')
                .select('*, categories(*)')
                .eq('is_gift_option', true)
                .order('price', { ascending: true });
            setGiftOptions(gifts || []);

            setLoading(false);
        };
        fetchHomeData();
    }, []);

    return (
        <div className="space-y-12 md:space-y-16 pb-0">
            {/* Cinematic Hero */}
            <section className="relative h-[70vh] md:h-[80vh] flex items-start justify-center overflow-hidden px-6 pt-24 md:pt-32">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/banner-mandarin.png"
                        className="w-full h-full object-cover scale-100 md:scale-105 md:object-center object-[70%] transition-transform duration-[3000ms]"
                        alt="Hero Background"
                    />
                    {/* Refined Premium Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent opacity-100" />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1 }}
                    className="relative z-10 text-center space-y-8 max-w-4xl"
                >
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-secondary-light tracking-[0.5em] uppercase text-[9px] md:text-xs font-black bg-white/10 backdrop-blur-md py-1.5 px-5 rounded-full inline-block border border-white/20 shadow-xl mb-2"
                    >
                        La distinción hecha esencia
                    </motion.p>
                    <h1 className="text-5xl md:text-8xl font-serif font-bold italic text-white leading-tight drop-shadow-2xl">
                        Descubre tu <br /> Legado Personal
                    </h1>
                    <p className="text-white/90 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                        Una colección curada de fragancias, carteras y accesorios diseñados para quienes entienden que el lujo es una actitud.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                        <Link to="/catalog" className="btn-primary !bg-secondary !text-primary hover:!bg-white flex items-center gap-3 shadow-2xl">
                            Explorar Colección <ShoppingBag className="w-5 h-5" />
                        </Link>
                        <Link to="/about" className="text-white font-bold tracking-widest uppercase text-xs hover:text-secondary flex items-center gap-2 drop-shadow-lg transition-colors">
                            Nuestra Historia <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Brand Values */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                {brandValues.map((value, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="text-center space-y-4 group"
                    >
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:shadow-2xl group-hover:shadow-primary/20 bg-white/50 backdrop-blur-sm border border-primary/5">
                            <value.icon className="w-8 h-8 md:w-10 md:h-10 text-primary group-hover:text-secondary-light transition-colors duration-500" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xs md:text-sm font-black uppercase tracking-widest text-primary leading-tight">{value.title}</h3>
                            <p className="text-luxury-black/40 text-[10px] md:text-xs leading-relaxed max-w-[180px] mx-auto font-medium">{value.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </section>

            {/* Discover Categories */}
            <section className="max-w-7xl mx-auto px-6 space-y-8 md:space-y-10">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl md:text-5xl font-serif font-bold italic text-primary">Nuestras Categorías</h2>
                    <div className="w-16 h-1 bg-primary/20 mx-auto rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {categories.map((cat, i) => (
                        <Link key={i} to={cat.path} className="group relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl">
                            <img src={cat.img} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125" alt={cat.name} />
                            <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute bottom-12 left-12 space-y-3 z-10 transition-transform duration-700 group-hover:-translate-y-2">
                                <h3 className="text-4xl font-serif font-bold italic text-secondary-light tracking-tight">{cat.name}</h3>
                                <span className="text-[10px] text-secondary-light uppercase tracking-[0.3em] font-black flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-x-6 group-hover:translate-x-0">
                                    Explorar Selección <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                            <div className="absolute inset-0 border-[1rem] border-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none rounded-[3rem]" />
                        </Link>
                    ))}
                </div>
            </section>

            {/* New Arrivals Section */}
            {newArrivals.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/30">Nuevo Inventario</p>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">— NEW ARRIVALS —</h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {newArrivals.map((prod) => (
                            <ProductGridItem key={prod.id} product={prod} />
                        ))}
                    </div>

                    <div className="text-center pt-8">
                        <Link to="/catalog" className="btn-primary !bg-primary !text-secondary-light px-12 py-4 rounded-xl shadow-xl hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest">
                            Ver Más
                        </Link>
                    </div>
                </section>
            )}

            {/* Coming Soon Section */}
            {comingSoon.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] uppercase tracking-[0.4em] font-black text-amber-500/60">Lanzamientos Futuros</p>
                        <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">— PRÓXIMAMENTE —</h2>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {comingSoon.map((prod) => (
                            <ProductGridItem key={prod.id} product={prod} />
                        ))}
                    </div>

                    <div className="text-center pt-8">
                        <Link to="/catalog" className="btn-primary !bg-amber-500 !text-white px-12 py-4 rounded-xl shadow-xl hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest">
                            Ver Todo lo Próximo
                        </Link>
                    </div>
                </section>
            )}

            {/* Promotions Section */}
            {activePromos.length > 0 && (
                <section className="bg-secondary/10 py-32 px-6">
                    <div className="max-w-7xl mx-auto space-y-16">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">— PROMOCIONES —</h2>
                            <p className="text-primary/60 max-w-xl mx-auto italic font-medium">Aprovecha nuestras ofertas exclusivas y liquidaciones por tiempo limitado.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {activePromos.slice(0, 3).map((promo) => (
                                <Link
                                    key={promo.id}
                                    to={`/catalog?promo=true`}
                                    className="group relative h-[400px] rounded-[2.5rem] overflow-hidden shadow-xl bg-primary"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 opacity-70" />
                                    <div className="absolute inset-x-8 bottom-8 z-20 space-y-4">
                                        <span className="px-4 py-1.5 bg-secondary text-primary text-[10px] font-black uppercase tracking-widest rounded-full">{promo.discount_badge}</span>
                                        <h3 className="text-3xl font-serif font-bold italic text-white leading-tight">{promo.title}</h3>
                                        <p className="text-white/60 text-xs line-clamp-2">{promo.description}</p>
                                    </div>
                                    <ArrowRight className="absolute top-8 right-8 text-secondary w-8 h-8 opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-4 group-hover:translate-x-0 z-20" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Gift Options Section */}
            {giftOptions.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 space-y-12">
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/30">Curaduría por Presupuesto</p>
                            <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">— OPCIONES DE REGALO —</h2>
                        </div>

                        <div className="flex justify-center gap-4 md:gap-8 overflow-x-auto no-scrollbar py-4">
                            {[200, 500, 800, 1000, 2000].map((tier) => (
                                <button
                                    key={tier}
                                    onClick={() => setSelectedGiftTier(tier)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${selectedGiftTier === tier ? 'bg-primary text-secondary-light shadow-xl scale-110' : 'bg-primary/5 text-primary/40 hover:bg-primary/10'}`}
                                >
                                    Menos de {tier} LPS
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {giftOptions.filter(p => p.price <= selectedGiftTier).slice(0, 4).map((prod) => (
                            <ProductGridItem key={prod.id} product={prod} />
                        ))}
                    </div>

                    {/* Smart Combo Suggestion */}
                    {giftOptions.filter(p => p.price <= selectedGiftTier / 2).length >= 2 && (
                        <div className="max-w-3xl mx-auto p-10 bg-secondary/10 rounded-[3rem] border border-secondary/20 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
                            <div className="space-y-2 text-center md:text-left">
                                <span className="px-3 py-1 bg-secondary text-primary text-[8px] font-black uppercase tracking-widest rounded-full">Sugerencia de Combo</span>
                                <h4 className="text-2xl font-serif font-bold italic text-primary">Regalo Ideal para {selectedGiftTier} LPS</h4>
                                <p className="text-xs text-primary/60">Combina piezas exclusivas para una experiencia completa.</p>
                            </div>
                            <div className="flex-1 flex items-center gap-4">
                                {giftOptions.filter(p => p.price <= selectedGiftTier / 2).slice(0, 2).map((p, idx) => (
                                    <div key={p.id} className="flex-1 flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 rounded-xl overflow-hidden shadow-lg">
                                            <img src={p.image_url} className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] font-bold text-primary truncate max-w-[100px]">{p.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center pt-8">
                        <Link to="/catalog" className="btn-primary !bg-primary !text-secondary-light px-12 py-4 rounded-xl shadow-xl hover:scale-105 transition-all uppercase text-[10px] font-black tracking-widest">
                            Explorar Más Regalos
                        </Link>
                    </div>
                </section>
            )}

            {/* Featured Quote */}
            <section className="bg-primary pt-32 pb-40 px-6 relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
                    <div className="w-12 h-1 bg-secondary-light/30 mx-auto rounded-full" />
                    <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-secondary-light leading-snug">
                        "El estilo es la única cosa que no puedes comprar. No está en una bolsa, una marca o un precio. Está en tu esencia."
                    </h2>
                    <p className="text-secondary-light/40 uppercase tracking-[0.3em] text-xs font-black">Luxessence Experience</p>
                </div>

                {/* Ambient Decorative */}
                <div className="absolute -top-20 -left-20 w-80 h-80 bg-secondary-light/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-secondary-light/5 rounded-full blur-3xl" />
            </section>
        </div>
    );
};

export default Home;
