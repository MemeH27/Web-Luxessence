import { motion } from 'framer-motion';
import { Award, Eye, Heart, ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const About = () => {
    const [settings, setSettings] = useState({
        about_hero_image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000',
        about_story_image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1000',
        about_story_title: 'Más que una Fragancia, un Legado',
        about_story_description: 'En Luxessence, entendemos que el perfume no es solo un aroma; es la huella invisible que dejas al caminar, el eco de tu personalidad y el sello de tu distinción. Nacimos con la visión de democratizar el acceso al lujo auténtico.'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            const { data } = await supabase.from('site_settings').select('key, value');
            if (data) {
                const s = {};
                data.forEach(item => { if (item.key.startsWith('about_')) s[item.key] = item.value; });
                setSettings(prev => ({ ...prev, ...s }));
            }
        };
        fetchSettings();
    }, []);

    const values = [
        { icon: Award, title: 'Excelencia', desc: 'Cada fragancia en nuestra colección es una obra maestra de la perfumería internacional.' },
        { icon: Eye, title: 'Curaduría', desc: 'Seleccionamos minuciosamente cada pieza para asegurar que represente la máxima distinción.' },
        { icon: Heart, title: 'Pasión', desc: 'Nos mueve el deseo de ayudar a cada cliente a descubrir su firma personal.' },
        { icon: ShieldCheck, title: 'Integridad', desc: 'Autenticidad garantizada en cada producto, respaldada por años de trayectoria.' },
    ];

    return (
        <div className="pb-32 space-y-32">
            {/* Hero Section */}
            <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={settings.about_hero_image}
                        className="w-full h-full object-cover"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-primary/60 backdrop-blur-[2px]" />
                </div>
                <div className="relative z-10 text-center space-y-6 px-6">
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-secondary-light tracking-[0.5em] uppercase text-[10px] md:text-sm font-black"
                    >
                        Nuestra Esencia
                    </motion.p>
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-8xl font-serif font-bold italic text-white"
                    >
                        Luxessence
                    </motion.h1>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="w-24 h-1 bg-secondary mx-auto rounded-full"
                    />
                </div>
            </section>

            {/* Story Section */}
            <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary leading-tight">
                        {settings.about_story_title}
                    </h2>
                    <div className="space-y-6 text-luxury-black/60 text-lg leading-relaxed font-medium">
                        <p>{settings.about_story_description}</p>
                    </div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-2xl relative z-10">
                        <img
                            src={settings.about_story_image}
                            className="w-full h-full object-cover"
                            alt="Luxury Piece"
                        />
                    </div>
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-0" />
                    <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0" />
                </motion.div>
            </section>

            {/* Values Grid */}
            <section className="bg-primary py-32">
                <div className="max-w-7xl mx-auto px-6 space-y-20">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl md:text-5xl font-serif font-bold italic text-secondary-light">Pilares de Excelencia</h2>
                        <div className="w-20 h-1 bg-secondary mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {values.map((value, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="space-y-6 group"
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-secondary group-hover:scale-110">
                                    <value.icon className="w-8 h-8 text-secondary group-hover:text-primary transition-colors" />
                                </div>
                                <div className="space-y-3">
                                    <h3 className="text-xl font-serif italic text-white">{value.title}</h3>
                                    <p className="text-secondary-light/40 text-sm leading-relaxed">{value.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA section */}
            <section className="max-w-4xl mx-auto px-6 text-center space-y-12">
                <h2 className="text-4xl md:text-6xl font-serif font-bold italic text-primary">¿Listo para encontrar tu esencia?</h2>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <a href="/catalog" className="btn-primary px-12 py-5 rounded-2xl shadow-2xl hover:scale-105 transition-transform">
                        Explorar Catálogo
                    </a>
                    <a href="/contact" className="text-primary font-black uppercase tracking-[0.2em] text-xs hover:text-secondary transition-colors underline decoration-secondary/30 underline-offset-8">
                        Contáctanos
                    </a>
                </div>
            </section>
        </div>
    );
};

export default About;
