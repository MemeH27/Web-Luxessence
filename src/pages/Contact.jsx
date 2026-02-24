import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Instagram, Facebook, Send, Package2 } from 'lucide-react';

const Contact = () => {
    const [phone, setPhone] = useState('504');
    const contactInfo = [
        { icon: Phone, title: 'Atención al Cliente', value: '+504 3313-5869', id: 'tel:+50433135869' },
        { icon: Phone, title: 'Línea de Pedidos', value: '+504 8896-6603', id: 'tel:+50488966603' },
        { icon: Mail, title: 'Correo de Contacto', value: 'luxessence504@gmail.com', id: 'mailto:luxessence504@gmail.com' },
        { icon: MapPin, title: 'Ubicaciones', value: 'Santa Rosa de Copán / San Pedro Sula, Honduras', id: '#' },
    ];

    const handlePhoneChange = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (!val.startsWith('504')) val = '504' + val;
        if (val.length <= 11) setPhone(val);
    };

    return (
        <div className="max-w-7xl mx-auto px-6 space-y-24 pb-24">
            {/* Header */}
            <div className="text-center space-y-6 max-w-2xl mx-auto pt-10">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-primary tracking-[0.5em] uppercase text-xs font-black"
                >
                    Personal Sourcing
                </motion.p>
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-5xl md:text-6xl font-serif font-bold italic text-primary leading-tight"
                >
                    ¿No encuentras <br /> esa pieza ideal?
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-luxury-black/40 leading-relaxed font-medium"
                >
                    Si buscas una pieza de lujo o accesorio exclusivo que no está en nuestro catálogo, nosotros lo encontramos por ti.
                    Nuestro equipo se especializa en conseguir tesoros de alta gama alrededor del mundo.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {contactInfo.map((info, i) => (
                        <motion.a
                            key={i}
                            href={info.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="glass-card p-10 rounded-[3rem] space-y-4 hover:border-primary/30 group bg-white shadow-xl shadow-primary/2"
                        >
                            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-secondary-light transition-all duration-500 shadow-lg shadow-primary/5">
                                <info.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-serif italic text-xl text-primary">{info.title}</h3>
                            <p className="text-luxury-black/40 text-sm font-bold tracking-tight">{info.value}</p>
                        </motion.a>
                    ))}

                    {/* Socials Card */}
                    <div className="sm:col-span-2 glass-panel p-10 rounded-[3rem] flex flex-col sm:flex-row items-center justify-between gap-8 overflow-hidden relative border-primary/10 bg-white shadow-sm">
                        <div className="space-y-2 text-center sm:text-left z-10">
                            <h3 className="font-serif italic text-2xl text-primary">Nuestras Redes</h3>
                            <p className="text-luxury-black/40 text-sm font-medium italic">Síguenos para lanzamientos y curaduría exclusiva</p>
                        </div>
                        <div className="flex gap-4 z-10">
                            <a href="#" className="w-16 h-16 glass-panel rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-secondary-light transition-all duration-500 shadow-lg border-primary/5">
                                <Instagram className="w-7 h-7" />
                            </a>
                            <a href="#" className="w-16 h-16 glass-panel rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-secondary-light transition-all duration-500 shadow-lg border-primary/5">
                                <Facebook className="w-7 h-7" />
                            </a>
                        </div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/2 rounded-full blur-[100px] -z-0" />
                    </div>
                </div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="glass-card p-12 rounded-[4rem] relative overflow-hidden bg-white shadow-2xl border-primary/5"
                >
                    <div className="relative z-10 space-y-10">
                        <div className="space-y-2">
                            <h3 className="text-3xl font-serif italic text-primary">Solicita tu Producto</h3>
                            <p className="text-[10px] text-primary/30 uppercase tracking-widest font-black italic">Lo buscamos por ti</p>
                        </div>
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); alert('Solicitud recibida. Iniciamos la búsqueda de tu tesoro.'); }}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre Completo</label>
                                    <input required className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Teléfono (WhatsApp)</label>
                                    <input
                                        required
                                        type="tel"
                                        placeholder="+504 0000-0000"
                                        className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                    />
                                    {phone.length < 11 && phone.length > 3 && <p className="text-[9px] text-red-500 font-bold ml-1 italic">Mínimo 8 dígitos permitidos</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Producto Deseado</label>
                                <input required placeholder="Ej: Fragancia de Nicho o Cartera de Diseñador" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-primary/20 text-primary font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Detalles Adicionales</label>
                                <textarea required rows="4" placeholder="Háblanos de lo que buscas..." className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all resize-none text-primary font-medium" />
                            </div>
                            <button type="submit" disabled={phone.length < 11} className="w-full btn-primary !py-6 flex items-center justify-center gap-4 shadow-3xl disabled:opacity-50">
                                ENVIAR SOLICITUD <Send className="w-5 h-5 text-secondary-light" />
                            </button>
                        </form>
                    </div>
                </motion.div>
            </div>

            {/* National Shipping & Online Focus */}
            <div className="h-[28rem] glass-panel rounded-[4rem] overflow-hidden relative flex items-center justify-center p-8 text-center border-primary/10 bg-white shadow-2xl group">
                <div className="space-y-6 max-w-xl relative z-10 transition-transform duration-700 group-hover:scale-105">
                    <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6 shadow-xl shadow-primary/5">
                        <Package2 className="w-10 h-10" />
                    </div>
                    <h3 className="font-serif italic text-4xl md:text-5xl text-primary leading-tight">Tu Boutique Online</h3>
                    <p className="text-luxury-black/60 text-base md:text-lg font-medium leading-relaxed">
                        Gestionamos entregas directas en <span className="text-primary font-bold">Santa Rosa de Copán</span> y <span className="text-primary font-bold">San Pedro Sula</span>.
                        Además, realizamos envíos seguros a <span className="text-primary font-bold">nivel nacional</span> para que el lujo llegue hasta tu puerta.
                    </p>
                    <div className="flex items-center justify-center gap-4 pt-4">
                        <div className="h-px w-8 bg-primary/20" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/40">Excelencia en Logística</span>
                        <div className="h-px w-8 bg-primary/20" />
                    </div>
                </div>

                {/* Abstract Background Design instead of fuzzy image */}
                <div className="absolute inset-0 bg-primary/[0.02] -z-0" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
};

export default Contact;
