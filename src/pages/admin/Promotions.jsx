import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Trash2, X, Search, Tag, Settings, Percent, CheckCircle2, Circle, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Promotions = () => {
    const [promotions, setPromotions] = useState([]);
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [form, setForm] = useState({
        title: '',
        description: '',
        discount_badge: '',
        restrictions: '',
        product_ids: [],
        new_prices: {}, // product_id -> price
        is_active: true,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        promo_type: 'discount'
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
                product_ids: [],
                new_prices: {},
                is_active: true,
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                promo_type: 'discount'
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
            // Deselect all
            setForm({ ...form, product_ids: [], new_prices: {} });
        } else {
            // Select all
            const allIds = products.map(p => p.id);
            const allPrices = {};
            products.forEach(p => {
                allPrices[p.id] = p.price;
            });
            setForm({ ...form, product_ids: allIds, new_prices: allPrices });
        }
    };

    const handlePriceChange = (productId, price) => {
        setForm({
            ...form,
            new_prices: { ...form.new_prices, [productId]: price }
        });
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

            if (error) {
                alert(`Error al guardar promoción: ${error.message}`);
            } else {
                setIsModalOpen(false);
                fetchData();
            }
        } catch (err) {
            alert('Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (promo) => {
        const { error } = await supabase
            .from('promotions')
            .update({ is_active: !promo.is_active })
            .eq('id', promo.id);

        if (!error) fetchData();
    };

    const handleDelete = async (id) => {
        if (confirm('¿Desea eliminar esta promoción?')) {
            const { error } = await supabase.from('promotions').delete().eq('id', id);
            if (!error) fetchData();
        }
    };

    const filteredPromotions = promotions.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-12 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Promociones</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Ofertas y Eventos Especiales</p>
                </div>
                <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Nueva Promoción
                </button>
            </header>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {loading && promotions.length === 0 ? (
                    <div className="col-span-full h-32 flex items-center justify-center text-primary/20 italic">Cargando promociones...</div>
                ) : filteredPromotions.length === 0 ? (
                    <div className="col-span-full py-20 text-center italic text-primary/20">No hay promociones activas</div>
                ) : (
                    filteredPromotions.map(promo => (
                        <motion.div
                            layout
                            key={promo.id}
                            className={`glass-card p-8 rounded-[2.5rem] border transition-all ${promo.is_active ? 'border-primary/20' : 'border-primary/5 opacity-60'}`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <Tag className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] uppercase font-black tracking-widest text-primary/40">Promo ID: {promo.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="text-2xl font-serif font-bold italic text-primary">{promo.title}</h3>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => toggleStatus(promo)}
                                        className={`p-3 rounded-2xl transition-all ${promo.is_active ? 'bg-primary text-secondary-light shadow-lg' : 'bg-primary/5 text-primary/30'}`}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => handleDelete(promo.id)} className="p-3 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1 bg-secondary-light text-primary text-[10px] font-black uppercase tracking-tighter rounded-full border border-primary/10">
                                        {promo.discount_badge}
                                    </span>
                                    <span className="px-3 py-1 bg-primary/5 text-primary/40 text-[10px] font-black uppercase tracking-tighter rounded-full">
                                        {promo.product_ids.length} Productos
                                    </span>
                                </div>
                                <p className="text-xs text-primary/60 line-clamp-2">{promo.description}</p>

                                <button
                                    onClick={() => handleOpenModal(promo)}
                                    className="w-full py-4 bg-white/50 border border-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary/40 hover:bg-primary hover:text-secondary-light transition-all"
                                >
                                    Editar Detalles
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
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
                            className="bg-secondary-light w-full max-w-4xl rounded-[3.5rem] p-10 md:p-14 relative z-10 shadow-3xl overflow-y-auto max-h-[90vh] no-scrollbar border border-primary/10"
                        >
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-serif font-bold italic text-primary">{editingPromotion ? 'Editor de Promoción' : 'Nueva Campaña'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black">Estrategia y Descuentos</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Título de la Promoción</label>
                                        <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: 10% de descuento..." className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-serif italic text-lg text-primary" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Distintivo (Badge)</label>
                                        <input required value={form.discount_badge} onChange={e => setForm({ ...form, discount_badge: e.target.value })} placeholder="Ej: 10% OFF / 2x1" className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-black text-primary" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Descripción</label>
                                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none text-sm" />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Restricciones</label>
                                        <textarea value={form.restrictions} onChange={e => setForm({ ...form, restrictions: e.target.value })} rows="2" placeholder="Aplican restricciones..." className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none text-xs italic" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Fecha Inicio</label>
                                            <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-4 text-xs font-bold text-primary outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Fecha Fin</label>
                                            <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-3 px-4 text-xs font-bold text-primary outline-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Tipo de Promoción</label>
                                        <div className="flex gap-4">
                                            {['discount', 'bogo'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, promo_type: type })}
                                                    className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${form.promo_type === type ? 'bg-primary text-secondary-light border-primary shadow-lg' : 'bg-white text-primary/40 border-primary/10'}`}
                                                >
                                                    {type === 'discount' ? 'Descuento / Precio' : '2x1 / Gratis (BOGO)'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end px-1">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black">Seleccionar Productos y Precios</label>
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline"
                                        >
                                            {form.product_ids.length === products.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                                        </button>
                                    </div>
                                    <div className="bg-white/50 border border-primary/5 rounded-[2.5rem] p-6 max-h-[400px] overflow-y-auto no-scrollbar space-y-4 shadow-inner">
                                        {products.map(prod => (
                                            <div key={prod.id} className="space-y-3 p-4 bg-white rounded-3xl border border-primary/5 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleProductSelection(prod.id)}
                                                        className="flex items-center gap-3 text-left group"
                                                    >
                                                        {form.product_ids.includes(prod.id) ? <CheckCircle2 className="text-primary w-5 h-5" /> : <Circle className="text-primary/20 w-5 h-5 group-hover:text-primary transition-colors" />}
                                                        <span className={`text-sm font-bold ${form.product_ids.includes(prod.id) ? 'text-primary' : 'text-primary/40'}`}>{prod.name}</span>
                                                    </button>
                                                    <span className="text-[10px] text-primary/20 font-black">L. {prod.price}</span>
                                                </div>

                                                {form.product_ids.includes(prod.id) && (
                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 pt-2 border-t border-primary/5">
                                                        <span className="text-[8px] uppercase font-black text-primary/40">
                                                            {form.promo_type === 'bogo' ? 'Regla BOGO:' : 'Precio Promo:'}
                                                        </span>
                                                        <div className="flex-1 relative">
                                                            {form.promo_type === 'discount' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-primary/20">L.</span>}
                                                            <input
                                                                type={form.promo_type === 'discount' ? 'number' : 'text'}
                                                                value={form.promo_type === 'discount' ? form.new_prices[prod.id] : 'Compra 1 Lleva 1 Gratis'}
                                                                readOnly={form.promo_type === 'bogo'}
                                                                onChange={(e) => form.promo_type === 'discount' && handlePriceChange(prod.id, e.target.value)}
                                                                className={`w-full bg-primary/5 border-none rounded-xl py-2 ${form.promo_type === 'discount' ? 'pl-7' : 'px-3'} pr-3 text-sm font-bold text-primary focus:ring-1 focus:ring-primary outline-none`}
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" disabled={loading} className="md:col-span-2 btn-primary !py-5 mt-4">
                                    {loading ? 'Procesando...' : editingPromotion ? 'Actualizar Promoción' : 'Activar Nueva Campaña'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Promotions;
