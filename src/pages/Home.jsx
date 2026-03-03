import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Silk from '../components/Silk';

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
    const [dbCategories, setDbCategories] = useState([]);
    const [newArrivals, setNewArrivals] = useState([]);
    const [comingSoon, setComingSoon] = useState([]);
    const [giftOptions, setGiftOptions] = useState([]);
    const [selectedGiftTier, setSelectedGiftTier] = useState(500);
    const [siteSettings, setSiteSettings] = useState({});
    const [loading, setLoading] = useState(true);

    // Simplified categories logic: we'll use dbCategories instead of hardcoded ones
    const displayCategories = dbCategories.slice(0, 3); // Limit to top 3 for layout symmetry 

    useEffect(() => {
        const fetchHomeData = async () => {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // Fetch Promos
            const { data: promos } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
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

            // Fetch Site Settings
            const { data: settings } = await supabase.from('site_settings').select('*');
            if (settings) {
                const s = {};
                settings.forEach(item => { s[item.key] = item.value; });
                setSiteSettings(s);
            }

            // Fetch Featured Categories
            const { data: cats } = await supabase
                .from('categories')
                .select('*, products(image_url)')
                .eq('is_featured', true)
                .limit(6);

            const processedCats = cats?.map(cat => ({
                id: cat.id,
                name: cat.name,
                path: `/catalog?category=${cat.id}`,
                img: cat.image_url || cat.products?.[0]?.image_url || 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1000'
            })) || [];

            setDbCategories(processedCats);
            setLoading(false);
        };
        fetchHomeData();
    }, []);

    return (
        <div className="space-y-12 md:space-y-16 pb-0">
            {/* Cinematic Premium Hero */}
            <section className="relative h-[85vh] md:h-[90vh] flex justify-center items-center overflow-hidden px-6 md:px-12 pt-24 md:pt-0">
                <motion.div
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-0 z-0"
                >
                    {/* Animated Luxury Silk Background */}
                    <div className="absolute inset-0 w-full h-full bg-[#1a0510] overflow-hidden">
                        <Silk
                            speed={5}
                            scale={1.4}
                            color="#8B1A3A"
                            noiseIntensity={1.8}
                            rotation={12}
                        />

                        {/* Subtle gradient at bottom for text readability only */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 z-10 pointer-events-none" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                    className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8 max-w-5xl w-full -mt-16 md:mt-0"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8, duration: 0.8 }}
                        className="flex flex-col items-center gap-2"
                    >
                        <span className="text-secondary-light tracking-[0.5em] uppercase text-[9px] md:text-[11px] font-black bg-white/5 backdrop-blur-xl py-2 px-6 rounded-full inline-block border border-white/10 shadow-2xl">
                            Luxessence Experience
                        </span>
                        <div className="w-12 h-px bg-gradient-to-r from-transparent via-secondary-light/50 to-transparent mt-2" />
                    </motion.div>

                    <h1 className="text-5xl md:text-7xl lg:text-[6rem] font-serif font-bold italic text-white leading-[1.1] drop-shadow-2xl px-4">
                        {siteSettings.hero_title || 'Descubre tu Legado'}
                    </h1>

                    <p className="text-white/80 text-sm md:text-lg lg:text-xl font-medium max-w-2xl leading-relaxed drop-shadow-md pb-4">
                        {siteSettings.hero_text || 'Una colección curada de fragancias, carteras y accesorios diseñados para quienes entienden que el lujo es una actitud.'}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 pt-4 w-full sm:w-auto">
                        <Link
                            to="/catalog"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-secondary text-primary px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(212,175,55,0.2)] hover:shadow-[0_15px_50px_rgba(212,175,55,0.3)] hover:scale-105 hover:bg-white transition-all duration-500 group"
                        >
                            Explorar Colección
                            <ShoppingBag className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        </Link>

                        <Link
                            to="/about"
                            className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/5 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/40 transition-all duration-500 group"
                        >
                            Nuestra Historia
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                {/* Ambient floating flare effect */}
                <motion.div
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-1/4 right-1/4 w-[30vw] h-[30vw] min-w-[300px] min-h-[300px] bg-secondary-light/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"
                />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {dbCategories.map((cat, i) => (
                        <Link key={cat.id || i} to={cat.path} className="group relative h-[450px] rounded-[3rem] overflow-hidden shadow-2xl">
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

                <div className="flex justify-center pt-10">
                    <Link
                        to="/catalog"
                        className="px-8 py-3.5 bg-primary/5 hover:bg-primary text-primary hover:text-secondary-light rounded-full border border-primary/5 shadow-xl transition-all duration-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 group"
                    >
                        Explorar todas nuestras categorías
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                    </Link>
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
                                    {promo.image_url && (
                                        <img src={promo.image_url} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[2000ms]" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 opacity-70" />
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
