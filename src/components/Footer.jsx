import { Facebook, Instagram, Phone, MapPin, Truck, Mail, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-primary text-white pt-20 pb-24 md:pb-12 border-t border-white/10 relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8 mb-16">

                    {/* Brand Info */}
                    <div className="space-y-6">
                        <Link to="/" className="inline-block">
                            <img src="/img/logo-blanco.png" alt="Luxessence" className="h-12 object-contain hover:scale-105 transition-transform" />
                        </Link>
                        <p className="text-white/60 text-sm md:text-xs leading-relaxed font-medium max-w-xs">
                            Una colección curada de fragancias, carteras y accesorios diseñados para quienes entienden que el lujo es una actitud.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-secondary hover:bg-white/10 transition-all">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-secondary hover:bg-white/10 transition-all">
                                <Facebook className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold tracking-widest uppercase text-secondary">Contáctanos</h3>
                        <ul className="space-y-4">
                            <li>
                                <a href="https://wa.me/50433135869" target="_blank" rel="noopener noreferrer" className="filter-item group">
                                    <Phone className="w-4 h-4 text-secondary/60 group-hover:text-secondary transition-colors" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] md:text-[10px] text-white/40 uppercase tracking-widest font-black">Línea Principal</span>
                                        <span className="text-base md:text-sm text-white/80 group-hover:text-white transition-colors">+504 3313-5869</span>
                                    </div>
                                </a>
                            </li>
                            <li>
                                <a href="https://wa.me/50488966603" target="_blank" rel="noopener noreferrer" className="filter-item group">
                                    <Phone className="w-4 h-4 text-secondary/60 group-hover:text-secondary transition-colors" />
                                    <div className="flex flex-col">
                                        <span className="text-[11px] md:text-[10px] text-white/40 uppercase tracking-widest font-black">Línea Secundaria</span>
                                        <span className="text-base md:text-sm text-white/80 group-hover:text-white transition-colors">+504 8896-6603</span>
                                    </div>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Delivery & Shipping */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold tracking-widest uppercase text-secondary">Logística</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] md:text-[10px] text-white/40 uppercase tracking-widest font-black">Entregas Locales</span>
                                    <span className="text-sm md:text-xs text-white/80 leading-relaxed pt-1">San Pedro Sula y<br />Santa Rosa de Copán</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-4">
                                <div className="mt-1 w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-secondary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[11px] md:text-[10px] text-white/40 uppercase tracking-widest font-black">Nivel Nacional</span>
                                    <span className="text-sm md:text-xs text-white/80 leading-relaxed pt-1">Envíos seguros a todos<br />los departamentos</span>
                                </div>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 pb-16 md:pb-0 border-t border-white/5 flex items-center justify-center">
                    <p className="text-[11px] md:text-[10px] text-white/40 uppercase tracking-widest font-black text-center">
                        © {new Date().getFullYear()} Luxessence. Todos los derechos reservados.
                    </p>
                </div>
            </div>

            <style>{`
                .filter-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    cursor: pointer;
                }
            `}</style>
        </footer>
    );
};

export default Footer;
