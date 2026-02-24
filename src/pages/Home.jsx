import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, ShieldCheck, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const Home = () => {
    const brandValues = [
        { icon: Sparkles, title: 'Calidad Premium', desc: 'Artículos seleccionados de las casas de lujo más prestigiosas.' },
        { icon: ShieldCheck, title: '100% Original', desc: 'Garantizamos la autenticidad de cada pieza en nuestra colección.' },
        { icon: Heart, title: 'Atención Personal', desc: 'Asesoría experta para potenciar tu marca personal.' },
    ];

    const [activePromos, setActivePromos] = useState([]);

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
        const fetchPromos = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
                .lte('start_date', today)
                .or(`end_date.is.null,end_date.gte.${today}`)
                .order('created_at', { ascending: false });
            setActivePromos(data || []);
        };
        fetchPromos();
    }, []);

    return (
        <div className="space-y-32 pb-0">
            {/* Cinematic Hero */}
            <section className="relative h-[90vh] md:h-[85vh] flex items-center justify-center overflow-hidden px-6">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/img/banner-mandarin.png"
                        className="w-full h-full object-cover scale-100 md:scale-105 md:object-center object-[70%] transition-transform duration-[3000ms]"
                        alt="Hero Background"
                    />
                    {/* Intensified Deep Fade Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/0 via-primary/30 to-secondary-light" />
                    <div className="absolute inset-0 bg-gradient-to-t from-secondary-light via-transparent to-transparent opacity-90" />
                    <div className="absolute inset-0 bg-black/10" /> {/* Subtle contrast layer */}
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
                        className="text-secondary-light tracking-[0.5em] uppercase text-[10px] md:text-xs font-black bg-white/10 backdrop-blur-md py-2 px-6 rounded-full inline-block border border-white/20 shadow-xl"
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
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
                {brandValues.map((value, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.2 }}
                        className="text-center space-y-6 group"
                    >
                        <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto transition-all duration-700 group-hover:scale-110 group-hover:bg-primary group-hover:text-secondary-light group-hover:shadow-[0_20px_50px_-15px_rgba(113,17,22,0.3)] shadow-xl shadow-primary/5">
                            <value.icon className="w-10 h-10 text-primary group-hover:text-secondary-light transition-all duration-500" />
                        </div>
                        <h3 className="text-2xl font-serif italic text-primary">{value.title}</h3>
                        <p className="text-luxury-black/40 text-sm leading-relaxed">{value.desc}</p>
                    </motion.div>
                ))}
            </section>

            {/* Discover Categories */}
            <section className="max-w-7xl mx-auto px-6 space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-serif font-bold italic text-primary">Nuestras Categorías</h2>
                    <div className="w-20 h-1 bg-primary/20 mx-auto rounded-full" />
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
