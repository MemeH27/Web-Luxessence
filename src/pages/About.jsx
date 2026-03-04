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
        { icon: Award, title: 'Excelencia', desc: 'Cada fragancia en nuestra colección es una obra maestra de la perfumería internacional.', color: 'from-amber-400 to-gold' },
        { icon: Eye, title: 'Curaduría', desc: 'Seleccionamos minuciosamente cada pieza para asegurar que represente la máxima distinción.', color: 'from-primary-light to-primary' },
        { icon: Heart, title: 'Pasión', desc: 'Nos mueve el deseo de ayudar a cada cliente a descubrir su firma personal.', color: 'from-red-400 to-primary' },
        { icon: ShieldCheck, title: 'Integridad', desc: 'Autenticidad garantizada en cada producto, respaldada por años de trayectoria.', color: 'from-blue-400 to-primary-dark' },
    ];

    return (
        <div className="pb-32 bg-[#fafafa] overflow-hidden">
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden pt-44 md:pt-40">
                <motion.div
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="absolute inset-0"
                >
                    <img
                        src={settings.about_hero_image}
                        className="w-full h-full object-cover"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/20 to-[#fafafa]" />
                </motion.div>

                <div className="relative z-10 text-center space-y-8 px-6 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-8"
                    >
                        <p className="text-white tracking-[0.6em] uppercase text-[10px] md:text-xs font-black">
                            Establecidos en la Distinción
                        </p>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-7xl md:text-[10rem] font-serif font-bold italic text-white drop-shadow-2xl leading-none"
                    >
                        Luxessence
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-white/80 text-lg md:text-2xl font-light tracking-widest uppercase"
                    >
                        El Arte de la Alta Perfumería
                    </motion.p>

                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "120px" }}
                        transition={{ delay: 0.8, duration: 1.5 }}
                        className="h-1 bg-gold mx-auto rounded-full mt-12 shadow-[0_0_20px_rgba(212,175,55,0.8)]"
                    />
                </div>

                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/40"
                >
                    <div className="w-px h-24 bg-gradient-to-b from-white to-transparent mx-auto" />
                </motion.div>
            </section>

            {/* Story Section */}
            <section className="max-w-7xl mx-auto px-6 py-40 relative">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                    <span className="absolute -top-20 -left-20 text-[20rem] font-serif italic text-primary/5 opacity-20">L</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-12"
                    >
                        <div className="space-y-4">
                            <h3 className="text-gold font-black uppercase tracking-[0.3em] text-xs">Nuestra Historia</h3>
                            <h2 className="text-5xl md:text-7xl font-serif font-bold italic text-primary leading-[1.1]">
                                {settings.about_story_title}
                            </h2>
                        </div>

                        <div className="space-y-8 text-luxury-black/70 text-xl leading-relaxed font-medium">
                            <p className="border-l-4 border-gold/30 pl-8 py-2 italic bg-gold/5 rounded-r-2xl">
                                {settings.about_story_description}
                            </p>
                            <p>
                                Nuestra misión es simple pero profunda: elevar el espíritu humano a través de sensorialidad pura.
                                No vendemos frascos, vendemos momentos, memorias y la confianza de ser inolvidable.
                            </p>
                        </div>

                        <div className="flex items-center gap-6 pt-8 border-t border-primary/5">
                            <div className="w-16 h-px bg-primary/20" />
                            <p className="font-serif italic text-primary/40 text-lg">Curaduría de Luxessence</p>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] relative z-10 border-[12px] border-white ring-1 ring-primary/5">
                            <img
                                src={settings.about_story_image}
                                className="w-full h-full object-cover"
                                alt="Luxury Essence"
                            />
                        </div>
                        {/* Decorative floating glass card */}
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            className="absolute -bottom-12 -right-12 glass-card-premium p-10 rounded-3xl z-20 max-w-xs space-y-4 hidden md:block"
                        >
                            <div className="w-12 h-12 bg-gold rounded-full flex items-center justify-center shadow-lg">
                                <Award className="text-white w-6 h-6" />
                            </div>
                            <h4 className="font-serif italic text-2xl text-primary">Autenticidad</h4>
                            <p className="text-xs text-primary/80 font-medium">Procedencia garantizada desde las casas más exclusivas de Europa y América.</p>
                        </motion.div>

                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/10 rounded-full blur-[100px] -z-0" />
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -z-0" />
                    </motion.div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="bg-primary relative py-40 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

                <div className="max-w-7xl mx-auto px-6 space-y-32 relative z-10">
                    <div className="text-center space-y-6 max-w-3xl mx-auto">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-gold font-black uppercase tracking-[0.4em] text-xs"
                        >
                            Lo que nos define
                        </motion.span>
                        <h2 className="text-5xl md:text-7xl font-serif font-bold italic text-white drop-shadow-xl">Símbolos de Distinción</h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                        {values.map((value, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className="glass-card p-10 rounded-[3rem] space-y-8 flex flex-col items-center text-center group hover:bg-white/10 border-white/5 transition-all duration-500 hover:-translate-y-4"
                            >
                                <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-700 group-hover:rotate-[360deg]`}>
                                    <value.icon className="w-10 h-10 text-white" />
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-3xl font-serif italic text-gold">{value.title}</h3>
                                    <p className="text-white/80 text-base leading-relaxed font-light">{value.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <div className="absolute -top-40 -right-40 w-[40rem] h-[40rem] bg-gold/5 rounded-full blur-[150px]" />
                <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-[150px]" />
            </section>

            {/* CTA Section */}
            <section className="max-w-5xl mx-auto px-6 py-40 text-center space-y-16">
                <div className="space-y-8">
                    <motion.h2
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        className="text-5xl md:text-[5.5rem] font-serif font-bold italic text-primary leading-tight"
                    >
                        Comienza tu Viaje <br />
                        <span className="text-gold">Sensorial</span>
                    </motion.h2>
                    <p className="text-luxury-black/40 text-xl max-w-2xl mx-auto font-medium">
                        Permítenos guiarte hacia la fragancia que contará tu historia sin decir una sola palabra.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-10">
                    <a href="/catalog" className="btn-premium">
                        Explorar Colección
                    </a>
                    <a href="/contact" className="group flex items-center gap-4 text-primary font-black uppercase tracking-[0.3em] text-xs transition-all hover:text-gold">
                        CONTACTAR CURADOR
                        <div className="w-12 h-px bg-primary/20 group-hover:bg-gold group-hover:w-20 transition-all" />
                    </a>
                </div>
            </section>
        </div>
    );
};

export default About;
