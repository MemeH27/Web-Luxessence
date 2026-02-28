import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, X, Search, Tag, Settings, Percent, CheckCircle2, Circle, Power, Calendar, Gift, ChevronRight, Package, TrendingUp, Sparkles, AlertCircle, Activity, Upload, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/admin/Pagination';
import SecurityModal from '../../components/admin/SecurityModal';
import { uploadAndOptimize } from '../../utils/image';

const Promotions = () => {
    const { addToast } = useToast();
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Security Modal
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null);

    const [form, setForm] = useState({
        title: '',
        description: '',
        discount_badge: '',
        restrictions: '',
        image_url: '',
        product_ids: [],
        new_prices: {},
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        promo_type: 'discount',
        promo_code: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data: promoData } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
        const { data: prodData } = await supabase.from('products').select('*').order('name');
        setPromotions(promoData || []);
        setProducts(prodData || []);
        setLoading(false);
    };

    const handleOpenModal = (promo = null) => {
        if (promo) {
            setEditingPromotion(promo);
            setForm({ ...promo });
        } else {
            setEditingPromotion(null);
            setForm({
                title: '',
                description: '',
                discount_badge: '',
                restrictions: '',
                image_url: '',
                product_ids: [],
                new_prices: {},
                is_active: true,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                promo_type: 'discount',
                promo_code: ''
            });
        }
        setIsModalOpen(true);
    };

    const toggleProductSelection = (productId) => {
        const currentIds = [...form.product_ids];
        const index = currentIds.indexOf(productId);

        if (index > -1) {
            currentIds.splice(index, 1);
            const updatedPrices = { ...form.new_prices };
            delete updatedPrices[productId];
            setForm({ ...form, product_ids: currentIds, new_prices: updatedPrices });
        } else {
            setForm({
                ...form,
                product_ids: [...currentIds, productId],
                new_prices: { ...form.new_prices, [productId]: products.find(p => p.id === productId)?.price || 0 }
            });
        }
    };

    const handleSelectAll = () => {
        if (form.product_ids.length === products.length) {
            setForm({ ...form, product_ids: [], new_prices: {} });
        } else {
            const allIds = products.map(p => p.id);
            const allPrices = {};
            products.forEach(p => { allPrices[p.id] = p.price; });
            setForm({ ...form, product_ids: allIds, new_prices: allPrices });
        }
    };

    const [uploadingImage, setUploadingImage] = useState(false);

    const handleImageUpload = async (e) => {
        setUploadingImage(true);
        const file = e.target.files[0];
        try {
            const publicUrl = await uploadAndOptimize(supabase, 'products', file, false); // Consistent bucket usage
            setForm({ ...form, image_url: publicUrl });
            addToast('Imagen de promoción cargada correctamente');
        } catch (error) {
            console.error('Upload error:', error);
            addToast('Error subiendo imagen', 'error');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formattedPrices = {};
        Object.entries(form.new_prices).forEach(([id, price]) => {
            formattedPrices[id] = Number(price);
        });
        const payload = { ...form, new_prices: formattedPrices };

        try {
            const { error } = editingPromotion
                ? await supabase.from('promotions').update(payload).eq('id', editingPromotion.id)
                : await supabase.from('promotions').insert(payload);

            if (error) throw error;
            addToast('Promoción guardada correctamente');
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            addToast('Error al guardar la promoción', 'error');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (promo) => {
        try {
            const { error } = await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
            if (error) throw error;
            addToast(`Promoción ${!promo.is_active ? 'activada' : 'desactivada'}`);
            fetchData();
        } catch (err) {
            addToast('Error al cambiar estado', 'error');
        }
    };

    const handleDeletePromo = (id) => {
        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        const { error } = await supabase.from('promotions').delete().eq('id', id);
        if (!error) {
            addToast('Campaña eliminada permanentemente');
            fetchData();
        }
    };

    const filteredPromotions = promotions.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    const paginatedPromotions = filteredPromotions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-12 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary">Marketing & Offers</h1>
                    <p className="text-primary/40 font-medium italic">Configura campañas exclusivas y dinámicas de fidelización.</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-4 !rounded-[2rem] !px-10 !py-5 shadow-2xl shadow-primary/20">
                    <Plus className="w-5 h-5" /> <span className="text-xs uppercase font-black tracking-widest italic">NUEVA CAMPAÑA</span>
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-8">
                    {/* Search & Stats Bar */}
                    <div className="glass-panel p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center justify-between border-primary/10 bg-white/40">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar campaña por nombre..."
                                className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-4 pl-16 pr-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-inner"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <span className="text-[10px] uppercase tracking-widest font-black text-primary/40 bg-white/50 px-6 py-2 rounded-full border border-primary/5 flex items-center gap-2">
                                <Activity className="w-3 h-3 text-green-500" /> {promotions.filter(p => p.is_active).length} Activas
                            </span>
                        </div>
                    </div>

                    {/* Promotions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 content-start">
                        {loading && promotions.length === 0 ? (
                            [1, 2, 3, 4].map(i => <div key={i} className="h-64 glass-panel animate-pulse rounded-[3rem] bg-white/40" />)
                        ) : paginatedPromotions.length === 0 ? (
                            <div className="col-span-full py-32 text-center bg-white/40 rounded-[3rem] border border-dashed border-primary/10 flex flex-col items-center gap-6">
                                <Sparkles className="w-16 h-16 text-primary/10" />
                                <p className="italic text-primary/20 text-xl font-serif">Aún no has lanzado campañas de marketing</p>
                            </div>
                        ) : (
                            paginatedPromotions.map(promo => (
                                <motion.div
                                    layout
                                    key={promo.id}
                                    className={`group relative overflow-hidden bg-white rounded-[3rem] p-8 md:p-10 border transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 ${promo.is_active ? 'border-primary/10' : 'border-primary/5 grayscale opacity-60'}`}
                                >
                                    <div className="flex gap-6 mb-8">
                                        <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden bg-primary/5 shrink-0 border border-primary/5 group-hover:scale-105 transition-transform duration-500 shadow-inner">
                                            {promo.image_url ? (
                                                <img src={promo.image_url} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/10">
                                                    <Tag className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${promo.is_active ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-primary/20'}`} />
                                                    <span className="text-[9px] uppercase font-black tracking-[0.2em] text-primary/30">{promo.is_active ? 'Vigente' : 'Pausada'}</span>
                                                </div>
                                                <h3 className="text-2xl font-serif font-bold italic text-primary leading-tight group-hover:text-luxury-black transition-colors line-clamp-2">{promo.title}</h3>
                                            </div>

                                            <div className="flex gap-2">
                                                <button onClick={() => toggleStatus(promo)} title="Alternar Estado" className={`p-2 rounded-xl transition-all shadow-sm ${promo.is_active ? 'bg-primary text-secondary-light' : 'bg-primary/5 text-primary/40 hover:bg-primary/10'}`}><Power className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleOpenModal(promo)} title="Configurar" className="p-2 bg-primary/5 text-primary/40 hover:bg-primary hover:text-white rounded-xl transition-all shadow-sm border border-primary/5"><Settings className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDeletePromo(promo.id)} title="Eliminar" className="p-2 bg-red-500/5 text-red-500/40 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-sm border border-primary/5"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-4 py-1.5 bg-secondary text-primary text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                                                {promo.discount_badge}
                                            </span>
                                            <span className="px-4 py-1.5 bg-primary/5 text-primary/60 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/5">
                                                {promo.product_ids.length} Productos
                                            </span>
                                        </div>

                                        <p className="text-xs text-primary/60 font-medium leading-relaxed italic line-clamp-2">"{promo.description}"</p>

                                        <div className="pt-6 border-t border-primary/5 flex justify-between items-center">
                                            <div className="flex items-center gap-2 text-primary/30">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {promo.start_date} {promo.end_date ? `— ${promo.end_date}` : ''}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0 text-primary/20" />
                                        </div>
                                    </div>

                                    {/* Ambient Glow */}
                                    {promo.is_active && <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full pointer-events-none" />}
                                </motion.div>
                            ))
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredPromotions.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Sidebar Context */}
                <div className="space-y-8">
                    <div className="bg-primary p-12 rounded-[4rem] text-secondary-light space-y-10 shadow-3xl relative overflow-hidden">
                        <div className="space-y-4 relative z-10">
                            <h2 className="text-3xl font-serif font-bold italic">Promo Analytics</h2>
                            <p className="text-secondary-light/40 text-xs font-medium uppercase tracking-[0.2em]">Impacto de Campaña</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-3">Alcance de Audiencia</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-serif font-bold italic text-secondary">Global</p>
                                    <Sparkles className="w-8 h-8 opacity-20" />
                                </div>
                            </div>

                            <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-3">Ratio de Conversión</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-3xl font-serif font-bold italic text-secondary">+12.4%</p>
                                    <TrendingUp className="w-8 h-8 opacity-20" />
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-secondary/10 rounded-[2.5rem] border border-secondary/20 relative z-10">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> Optimización Lux
                            </p>
                            <p className="text-xs italic leading-relaxed">
                                Las campañas con distintivos visuales capturan un <span className="text-secondary font-bold">40% más de interés</span>.
                                Asegúrate de rotar tus ofertas flash mensualmente.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white border border-secondary/20 p-8 rounded-[3rem] space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 text-primary">
                            <Gift className="w-5 h-5" />
                            <h4 className="font-serif font-bold italic">Próximas Ventanas</h4>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-2xl flex justify-between items-center group">
                                <span className="text-[10px] font-black text-primary/40 uppercase group-hover:text-primary transition-colors">Navidad Lux:</span>
                                <span className="text-[8px] bg-primary text-white px-2 py-0.5 rounded-full font-black">Dic 15</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-secondary-light w-full max-w-5xl rounded-[4rem] p-10 md:p-14 relative z-10 shadow-3xl overflow-hidden max-h-[90vh] flex flex-col border border-primary/10"
                        >
                            <div className="flex justify-between items-center mb-10 shrink-0">
                                <div className="space-y-1">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold italic text-primary">{editingPromotion ? 'Relanzar Campaña' : 'Estrategia de Ventas'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black pb-2">Planificación y Ajuste de Catálogo</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-primary/5 hover:bg-red-500 hover:text-white rounded-full text-primary transition-all"><X className="w-7 h-7" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-12 pr-4">
                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[3rem] p-10 group hover:border-primary/30 transition-colors relative h-48 overflow-hidden bg-white shadow-inner">
                                            {form.image_url ? (
                                                <img src={form.image_url} className="w-full h-full object-contain" />
                                            ) : (
                                                <div className="text-center space-y-4">
                                                    <Upload className="text-primary w-12 h-12 mx-auto opacity-20" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Imagen de la Campaña (Landing)</p>
                                                </div>
                                            )}
                                            <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                            {uploadingImage && <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-30"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Eslogan o Título</label>
                                            <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-8 outline-none transition-all shadow-sm font-serif italic text-xl text-primary focus:border-primary" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Incentivo (Badge)</label>
                                            <input required value={form.discount_badge} onChange={e => setForm({ ...form, discount_badge: e.target.value })} placeholder="Ej: 20% OFF" className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 outline-none shadow-sm font-black text-primary text-sm focus:border-primary" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Lógica</label>
                                            <select value={form.promo_type} onChange={e => setForm({ ...form, promo_type: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 font-bold text-primary text-xs outline-none focus:ring-1 focus:ring-primary h-[56px]">
                                                <option value="discount">Precio Especial</option>
                                                <option value="code">Cupon / Código</option>
                                                <option value="special">Oferta Especial</option>
                                                <option value="bogo">2x1 / Regalo</option>
                                            </select>
                                        </div>
                                    </div>

                                    {form.promo_type === 'code' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3 text-secondary" /> CÓDIGO DEL CUPÓN
                                            </label>
                                            <input
                                                required
                                                value={form.promo_code}
                                                onChange={e => setForm({ ...form, promo_code: e.target.value.toUpperCase() })}
                                                placeholder="Ej: LUX5OFF"
                                                className="w-full bg-secondary/5 border border-secondary/20 rounded-2xl py-4 px-8 outline-none shadow-sm font-black text-primary text-lg tracking-widest focus:border-secondary"
                                            />
                                            <p className="text-[9px] text-primary/40 italic ml-1">Este código aplicará un 5% de descuento adicional al total de la factura.</p>
                                        </motion.div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Restricciones o Letra Pequeña</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-3xl py-5 px-8 outline-none transition-all shadow-sm resize-none text-xs font-medium italic focus:border-primary" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Apertura</label>
                                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 text-[10px] font-black text-primary outline-none" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Clausura</label>
                                            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 text-[10px] font-black text-primary outline-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-8 h-[500px] flex flex-col">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black">Universo Participante</label>
                                        <button type="button" onClick={handleSelectAll} className="text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary underline decoration-primary/20">
                                            {form.product_ids.length === products.length ? 'Desmarcar Todo' : 'Añadir Todo el Catálogo'}
                                        </button>
                                    </div>

                                    <div className="flex-1 bg-primary/5 rounded-[3rem] p-8 overflow-y-auto no-scrollbar space-y-4 border border-primary/5 shadow-inner">
                                        {products.map(prod => (
                                            <div key={prod.id} className={`p-4 rounded-2xl transition-all border ${form.product_ids.includes(prod.id) ? 'bg-white border-primary/10 shadow-md' : 'bg-transparent border-transparent opacity-50'}`}>
                                                <div className="flex items-center justify-between gap-4">
                                                    <button type="button" onClick={() => toggleProductSelection(prod.id)} className="flex items-center gap-4 text-left min-w-0 flex-1">
                                                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${form.product_ids.includes(prod.id) ? 'bg-primary border-primary' : 'bg-transparent border-primary/20'}`}>
                                                            {form.product_ids.includes(prod.id) && <CheckCircle2 className="text-white w-3 h-3" />}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs font-black text-primary truncate leading-none mb-1">{prod.name}</p>
                                                            <p className="text-[8px] font-bold text-primary/30 uppercase tracking-widest italic">Normal: L. {prod.price}</p>
                                                        </div>
                                                    </button>

                                                    {form.product_ids.includes(prod.id) && form.promo_type === 'discount' && (
                                                        <div className="w-36 shrink-0 relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary/30 italic">L.</span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={form.new_prices[prod.id]}
                                                                onChange={(e) => setForm({ ...form, new_prices: { ...form.new_prices, [prod.id]: e.target.value } })}
                                                                className="w-full bg-primary/5 border border-primary/20 rounded-xl py-3 pl-8 pr-4 text-sm font-black text-primary outline-none focus:ring-1 focus:ring-primary shadow-sm"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="lg:col-span-2 pt-6 shrink-0">
                                    <button type="submit" disabled={loading} className="w-full btn-primary !py-6 shadow-3xl !rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs active:scale-95 transition-all flex items-center justify-center gap-4">
                                        {loading ? 'DESPLEGANDO...' : (editingPromotion ? 'ACTUALIZAR OFERTA' : 'LANZAR CAMPAÑA OFICIAL')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={() => {
                    if (securityAction?.type === 'delete') executeDelete(securityAction.id);
                    setIsSecurityOpen(false);
                }}
                title="Eliminar Campaña"
            />
        </div>
    );
};

export default Promotions;
