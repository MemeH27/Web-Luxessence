import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Package2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const Contact = () => {
    const { addToast } = useToast();
    const [phone, setPhone] = useState('504');

    const contactInfo = [
        { icon: Phone, title: 'Atención Ejecutiva', value: '+504 3313-5869', id: 'tel:+50433135869', desc: 'Atención personalizada vía WhatsApp' },
        { icon: Phone, title: 'Línea de Pedidos', value: '+504 8896-6603', id: 'tel:+50488966603', desc: 'Soporte directo para compras' },
        { icon: Mail, title: 'Canal Oficial', value: 'luxessence504@gmail.com', id: 'mailto:luxessence504@gmail.com', desc: 'Consultas corporativas y prensa' },
        { icon: MapPin, title: 'Nuestra Presencia', value: 'SR de Copán / San Pedro Sula', id: '#', desc: 'Honduras, Centroamérica' },
    ];

    return (
        <div className="bg-[#fafafa] min-h-screen pb-32">
            {/* Header / Hero */}
            <section className="relative pt-40 pb-20 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 bg-primary/5 rounded-full border border-primary/10"
                    >
                        <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Curaduría Premium</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-6xl md:text-8xl font-serif font-bold italic text-primary leading-tight"
                    >
                        ¿No encuentras tu <br /> <span className="text-gold-shimmer">Pieza Ideal?</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-luxury-black/60 max-w-2xl mx-auto text-xl font-medium leading-relaxed"
                    >
                        Si buscas una fragancia de nicho o un accesorio exclusivo que no figura en nuestra colección, nuestro equipo de sourcing lo encontrará por ti en las boutiques más prestigiosas del mundo.
                    </motion.p>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-0">
                    <div className="absolute top-40 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 right-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px]" />
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                {/* Info Cards - Left Column */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        {contactInfo.map((info, i) => (
                            <motion.a
                                key={i}
                                href={info.id}
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card-premium p-8 rounded-3xl group relative overflow-hidden"
                            >
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        <info.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-serif italic text-2xl text-primary">{info.title}</h3>
                                        <p className="text-primary/80 font-bold text-sm tracking-tight">{info.value}</p>
                                        <p className="text-luxury-black/30 text-[10px] font-black uppercase tracking-widest pt-2">{info.desc}</p>
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -z-0 translate-x-8 -translate-y-8 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700" />
                            </motion.a>
                        ))}
                    </div>

                    {/* Socials Section */}
                    <div className="glass-card-premium p-10 rounded-[3rem] space-y-8 bg-primary">
                        <div className="space-y-2 text-center">
                            <h3 className="font-serif italic text-3xl text-gold">Síguenos</h3>
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Lanzamientos & Curaduría</p>
                        </div>
                        <div className="flex justify-center gap-6">
                            <a href="#" className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-gold hover:text-primary transition-all duration-500 shadow-2xl">
                                <Instagram className="w-8 h-8" />
                            </a>
                            <a href="#" className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-gold hover:text-primary transition-all duration-500 shadow-2xl">
                                <Facebook className="w-8 h-8" />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Form - Right Column */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="lg:col-span-8 glass-card-premium p-12 md:p-20 rounded-[4rem] relative overflow-hidden bg-white"
                >
                    <div className="relative z-10 space-y-12">
                        <div className="space-y-4">
                            <span className="text-gold font-black uppercase tracking-[0.5em] text-xs">Formulario de Pedido Especial</span>
                            <h3 className="text-5xl md:text-6xl font-serif font-bold italic text-primary">Solicitud de Curaduría</h3>
                            <p className="text-luxury-black/40 text-lg font-medium">Complete los detalles para que nuestro equipo inicie la búsqueda de su tesoro.</p>
                        </div>

                        <form className="space-y-8" onSubmit={async (e) => {
                            e.preventDefault();
                            const form = e.target;
                            const formData = new FormData(form);
                            const name = formData.get('name');
                            const product = formData.get('product');
                            const link = formData.get('link');

                            try {
                                const { error } = await supabase.from('product_requests').insert({
                                    customer_name: name,
                                    whatsapp: phone,
                                    product_name: product,
                                    product_link: link
                                });

                                if (error) throw error;
                                addToast('¡Solicitud enviada con éxito! La curaduría ha comenzado.', 'success');
                                form.reset();
                                setPhone('504');
                            } catch (err) {
                                console.error('Error submitting request:', err);
                                addToast('Error al enviar la solicitud. Intente de nuevo.', 'error');
                            }
                        }}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-4 group-focus-within:text-gold transition-colors">Nombre Completo</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-gold transition-colors" />
                                        <input
                                            name="name"
                                            required
                                            className="w-full bg-white border border-primary/5 rounded-full py-5 pl-16 pr-8 outline-none focus:ring-1 focus:ring-gold/20 shadow-inner text-primary font-medium"
                                            placeholder="Su nombre completo"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-4 group-focus-within:text-gold transition-colors">WhatsApp (Directo)</label>
                                    <div className="relative group flex items-center bg-white border border-primary/5 rounded-full px-6 h-[64px] shadow-inner focus-within:ring-1 focus-within:ring-gold/20 transition-all">
                                        <Phone className="w-4 h-4 text-primary/30" />
                                        <span className="text-primary/40 font-black text-sm ml-4 border-r border-primary/10 pr-4">+504</span>
                                        <input
                                            required
                                            type="tel"
                                            placeholder="0000 0000"
                                            className="w-full bg-transparent outline-none text-primary font-bold text-lg tracking-[0.2em] px-4 placeholder:text-primary/10"
                                            value={phone.replace('504', '')}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 8) setPhone('504' + val);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-4 group-focus-within:text-gold transition-colors">Producto Deseado</label>
                                <div className="relative group">
                                    <Package2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-gold transition-colors" />
                                    <input
                                        name="product"
                                        required
                                        placeholder="Ej: Baccarat Rouge 540 o Birkin Handbag"
                                        className="w-full bg-white border border-primary/5 rounded-full py-5 pl-16 pr-8 outline-none focus:ring-1 focus:ring-gold/20 shadow-inner text-primary font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black ml-4 group-focus-within:text-gold transition-colors">Enlace de Referencia (Opcional)</label>
                                <div className="relative group">
                                    <Send className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/30 group-focus-within:text-gold transition-colors" />
                                    <input
                                        name="link"
                                        placeholder="https://..."
                                        className="w-full bg-white border border-primary/5 rounded-full py-5 pl-16 pr-8 outline-none focus:ring-1 focus:ring-gold/20 shadow-inner text-primary font-medium"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={phone.length < 11} className="btn-premium w-full flex items-center justify-center gap-6 disabled:opacity-30 disabled:cursor-not-allowed !rounded-full py-6">
                                ENVIAR SOLICITUD <Send className="w-5 h-5" />
                            </button>
                        </form>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold/5 rounded-tl-full -z-0" />
                </motion.div>
            </div>

            {/* Logistics Section */}
            <section className="max-w-7xl mx-auto px-6 py-40">
                <div className="bg-primary rounded-[5rem] p-12 md:p-24 relative overflow-hidden group shadow-[0_60px_120px_-20px_rgba(113,17,22,0.4)]">
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center text-gold shadow-2xl ring-1 ring-white/20">
                                <Package2 className="w-12 h-12" />
                            </div>
                            <h3 className="text-4xl md:text-6xl font-serif font-bold italic text-white leading-tight">Distribución <br /> <span className="text-gold">Sin Fronteras</span></h3>
                            <p className="text-white/60 text-xl font-light leading-relaxed">
                                Ofrecemos entregas programadas en <span className="text-white font-bold">SR de Copán</span> y <span className="text-white font-bold">San Pedro Sula</span>, además de envíos blindados a <span className="text-white font-bold">toda la nación</span> hondureña.
                            </p>
                        </div>
                        <div className="flex flex-col gap-8">
                            <div className="glass-card-premium p-8 rounded-3xl border-white/20 bg-white/10 backdrop-blur-md">
                                <h4 className="font-serif italic text-2xl text-gold-light mb-2">Seguridad Garantizada</h4>
                                <p className="text-white/80 text-sm leading-relaxed">Cada envío cuenta con protocolo de seguimiento y embalaje de alta seguridad para proteger la integridad de sus fragancias.</p>
                            </div>
                            <div className="glass-card-premium p-8 rounded-3xl border-white/20 bg-white/10 backdrop-blur-md">
                                <h4 className="font-serif italic text-2xl text-gold-light mb-2">Soporte 24/7</h4>
                                <p className="text-white/80 text-sm leading-relaxed">Nuestro equipo de logística está disponible para informarle sobre el estado de su tesoro en cualquier momento.</p>
                            </div>
                        </div>
                    </div>
                    {/* Abstract bg decor */}
                    <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-white/5 rounded-full blur-[150px] pointer-events-none" />
                    <div className="absolute -bottom-40 -left-40 w-[40rem] h-[40rem] bg-gold/10 rounded-full blur-[150px] pointer-events-none" />
                </div>
            </section>
        </div>
    );
};

export default Contact;
