import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { Plus, Edit3, Trash2, X, Upload, Search, Download, Package2, ChevronUp, ChevronDown, ListPlus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityModal from '../../components/admin/SecurityModal';
import { useToast } from '../../context/ToastContext';

const StepperInput = ({ label, value, onChange, min = 0, step = 1, prefix = '' }) => (
    <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">{label}</label>
        <div className="flex items-center gap-2 bg-white border border-primary/10 rounded-2xl p-1 shadow-sm">
            <button
                type="button"
                onClick={() => onChange(Math.max(min, Number(value) - step))}
                className="p-3 hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors rounded-xl"
            >
                <ChevronDown className="w-4 h-4" />
            </button>
            <div className="flex-1 flex items-center justify-center">
                {prefix && <span className="text-primary/20 text-sm font-bold ml-2">{prefix}</span>}
                <input
                    type="text"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        onChange(val);
                    }}
                    className="w-full bg-transparent text-center font-bold text-primary outline-none py-2"
                />
            </div>
            <button
                type="button"
                onClick={() => onChange(Number(value) + step)}
                className="p-3 hover:bg-primary/5 text-primary/40 hover:text-primary transition-colors rounded-xl"
            >
                <ChevronUp className="w-4 h-4" />
            </button>
        </div>
    </div>
);

const ProductManagement = () => {
    const { addToast } = useToast();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Security Modal State
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type, id, data }

    const [form, setForm] = useState({
        name: '', description: '', price: 0, cost: 0, stock: 0, category_id: '', image_url: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: prodData, error: prodError } = await supabase.from('products').select('*, categories(*)').order('created_at', { ascending: false });
            const { data: catData, error: catError } = await supabase.from('categories').select('*').order('name');

            if (prodError) console.error('Error fetching products:', prodError);
            if (catError) console.error('Error fetching categories:', catError);

            setProducts(prodData || []);
            setCategories(catData || []);
        } catch (err) {
            console.error('Unexpected error in fetchData:', err);
        }
        setLoading(false);
    };

    const handleOpenModal = (prod = null) => {
        if (prod) {
            setEditingProduct(prod);
            setForm({ ...prod });
        } else {
            setEditingProduct(null);
            setForm({ name: '', description: '', price: 0, cost: 0, stock: 0, category_id: categories[0]?.id || '', image_url: '' });
        }
        setIsModalOpen(true);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        setLoading(true);
        try {
            const { data, error } = await supabase.from('categories').insert({ name: newCategoryName }).select().single();
            if (error) {
                console.error('Error creating category:', error);
                alert(`Error al crear categoría: ${error.message}`);
            } else {
                setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
                setForm({ ...form, category_id: data.id });
                setNewCategoryName('');
                setIsCategoryModalOpen(false);
            }
        } catch (err) {
            alert('Error inesperado al crear la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e) => {
        setUploading(true);
        const file = e.target.files[0];
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage.from('products').upload(fileName, file);

        if (error) {
            console.error('Upload error:', error);
            alert(`Error subiendo imagen: ${error.message}. Asegúrese de tener el bucket 'products' creado en Supabase con acceso público.`);
        } else {
            const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
            setForm({ ...form, image_url: publicUrl });
        }
        setUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { categories: _, ...cleanForm } = form;
        const payload = { ...cleanForm, price: Number(form.price), cost: Number(form.cost), stock: Number(form.stock) };

        try {
            const { error } = editingProduct
                ? await supabase.from('products').update(payload).eq('id', editingProduct.id)
                : await supabase.from('products').insert(payload);

            if (error) {
                console.error('Error saving product:', error);
                alert(`Error al guardar producto: ${error.message}`);
            } else {
                setIsModalOpen(false);
                fetchData();
            }
        } catch (err) {
            alert('Error inesperado al guardar el producto');
        } finally {
            setLoading(false);
        }
    };

    const handleSecurityConfirm = () => {
        if (!securityAction) return;
        if (securityAction.type === 'delete') {
            executeDelete(securityAction.id);
        } else if (securityAction.type === 'edit') {
            setIsModalOpen(true);
        }
        setSecurityAction(null);
    };

    const handleDelete = (id) => {
        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        if (!confirm('¿Eliminar este producto del sistema?')) return;
        setLoading(true);
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                console.error('Error deleting product:', error);
                alert(`Error al eliminar: ${error.message}`);
            } else {
                addToast('Producto eliminado');
                fetchData();
            }
        } catch (err) {
            alert('Error inesperado al eliminar');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const exportData = filteredProducts.map(p => ({
            Nombre: p.name,
            Categoría: p.categories?.name,
            Precio: p.price,
            Costo: p.cost,
            Existencia: p.stock,
            Descripción: p.description
        }));
        exportToExcel(exportData, 'Inventario_Luxessence', 'Productos');
    };


    const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-12 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-serif font-bold italic text-primary">Gestión de Catálogo</h1>
                    <p className="text-primary/40 tracking-widest uppercase text-xs font-black">Control maestro de inventario</p>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleExport} className="glass-panel p-4 rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary flex items-center gap-2">
                        <Plus className="w-5 h-5" /> Nuevo Producto
                    </button>
                </div>
            </header>

            {/* View Bar */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center glass-panel p-6 rounded-[2rem] border-primary/10">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Filtrar por nombre..."
                        className="w-full bg-primary/5 border border-primary/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-primary outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <p className="text-[10px] uppercase tracking-widest font-black text-primary/40">{filteredProducts.length} Referencias Activas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                {loading ? (
                    [1, 2, 3].map(i => <div key={i} className="h-40 glass-panel animate-pulse rounded-[1.5rem] md:rounded-[2.5rem]" />)
                ) : filteredProducts.length === 0 ? (
                    <div className="col-span-full py-20 text-center italic text-primary/20 italic">No hay productos que coincidan con la búsqueda</div>
                ) : (
                    filteredProducts.map(prod => (
                        <motion.div
                            layout
                            key={prod.id}
                            className="glass-card p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center gap-4 md:gap-6 group relative bg-white/40 overflow-hidden"
                        >
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl md:rounded-2xl overflow-hidden bg-primary/5 border border-primary/10 shrink-0 shadow-inner">
                                <img src={prod.image_url || '/img/logo.svg'} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={prod.name} />
                            </div>
                            <div className="flex-1 space-y-1 relative z-10 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-serif italic text-base md:text-lg leading-tight text-primary line-clamp-1">{prod.name}</h3>
                                    <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                                        <button onClick={() => { setEditingProduct(prod); setForm(prod); setIsModalOpen(true); }} className="p-1.5 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-lg transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDelete(prod.id)} className="p-1.5 bg-red-500/5 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                                <p className="text-[8px] md:text-[9px] uppercase tracking-widest bg-primary/5 text-primary/40 px-2 py-0.5 rounded-md font-black inline-block">
                                    {prod.categories?.name}
                                </p>
                                <div className="flex items-center justify-between md:justify-start md:gap-4 pt-1">
                                    <span className="text-primary font-sans font-bold text-lg md:text-xl">L. {prod.price}</span>
                                    <div className="flex items-center gap-1.5 bg-primary/[0.03] px-2 py-0.5 rounded-full border border-primary/5">
                                        <div className={`w-1.5 h-1.5 rounded-full ${prod.stock > 10 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : prod.stock > 0 ? 'bg-orange-500' : 'bg-red-500'}`} />
                                        <span className="text-[9px] md:text-[10px] uppercase font-black text-primary/30">Stock: {prod.stock}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-[40px] md:w-20 md:h-20 md:rounded-bl-[50px] -z-0 pointer-events-none" />
                        </motion.div>
                    ))
                )}
            </div>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleSecurityConfirm}
                title={securityAction?.type === 'delete' ? 'Eliminar Producto' : 'Modificar Producto'}
            />

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-2xl rounded-[3.5rem] p-10 md:p-14 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar border border-primary/10">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-serif font-bold italic text-primary">{editingProduct ? 'Perfil de Producto' : 'Nueva Referencia'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black">Identidad Comercial y Técnica</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-primary/5 rounded-full text-primary transition-colors"><X className="w-6 h-6" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="md:col-span-2 space-y-6">
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[2.5rem] p-10 group hover:border-primary/30 transition-colors relative h-48 overflow-hidden bg-white shadow-inner">
                                        {form.image_url ? (
                                            <>
                                                <img src={form.image_url} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110" />
                                                <img src={form.image_url || '/img/logo.svg'} className="relative z-10 h-full object-contain drop-shadow-2xl" />
                                            </>
                                        ) : (
                                            <div className="text-center space-y-2 relative z-10">
                                                <Upload className="text-primary w-10 h-10 mx-auto opacity-30" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Sube la imagen de tu producto</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                        {uploading && <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-30"><p className="text-secondary-light font-black uppercase tracking-widest text-xs">Cargando...</p></div>}
                                    </div>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre del producto</label>
                                    <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-serif italic text-lg text-primary" />
                                </div>

                                <div className="space-y-4 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Categoría de Producto</label>
                                    <div className="flex gap-4">
                                        <div className="relative flex-1">
                                            <div className="relative group">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                                    className="w-full bg-white border-2 border-primary/10 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none flex items-center justify-between transition-all shadow-sm font-bold text-primary"
                                                >
                                                    <span className={form.category_id ? 'text-primary' : 'text-primary/30'}>
                                                        {categories.find(c => c.id === form.category_id)?.name || 'Seleccione una categoría'}
                                                    </span>
                                                    <ChevronDown className={`w-5 h-5 text-primary/30 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {isDropdownOpen && (
                                                        <>
                                                            <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                className="absolute top-full left-0 right-0 mt-3 bg-white border border-primary/10 rounded-[2rem] shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                                                            >
                                                                <div className="max-h-60 overflow-y-auto p-2 no-scrollbar">
                                                                    {categories.length === 0 ? (
                                                                        <div className="p-4 text-center text-[10px] uppercase tracking-widest text-primary/40 font-black">
                                                                            No hay categorías disponibles
                                                                        </div>
                                                                    ) : (
                                                                        categories.map(cat => (
                                                                            <button
                                                                                key={cat.id}
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    setForm({ ...form, category_id: cat.id });
                                                                                    setIsDropdownOpen(false);
                                                                                }}
                                                                                className={`w-full text-left p-4 rounded-xl text-sm transition-all flex items-center justify-between group/item ${form.category_id === cat.id ? 'bg-primary text-secondary-light' : 'hover:bg-primary/5 text-primary'}`}
                                                                            >
                                                                                <span className="font-bold">{cat.name}</span>
                                                                                {form.category_id === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-secondary-light" />}
                                                                            </button>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryModalOpen(true)}
                                            className="w-16 h-16 bg-primary text-secondary-light rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 shrink-0"
                                            title="Nueva Categoría"
                                        >
                                            <Plus className="w-8 h-8" />
                                        </button>
                                    </div>
                                </div>

                                <StepperInput label="Precio de Venta (PVP)" prefix="L." value={form.price} onChange={v => setForm({ ...form, price: v })} step={5} />
                                <StepperInput label="Costo Unitario" prefix="L." value={form.cost} onChange={v => setForm({ ...form, cost: v })} step={5} />
                                <StepperInput label="Stock Inicial / Existencia" value={form.stock} onChange={v => setForm({ ...form, stock: v })} />

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Detalles Adicionales (Opcional)</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" placeholder="Especificaciones, notas o detalles del producto..." className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm resize-none font-sans text-sm italic" />
                                </div>

                                <button type="submit" className="md:col-span-2 btn-primary !py-5 mt-4 group">
                                    {editingProduct ? 'Confirmar Modificaciones' : 'Incorporar al Inventario'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Quick Category Modal */}
            <AnimatePresence>
                {isCategoryModalOpen && (
                    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => setIsCategoryModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-sm rounded-[2.5rem] p-10 relative z-10 shadow-2xl border border-primary/10">
                            <h3 className="text-xl font-serif font-bold italic text-primary mb-6">Nueva Categoría</h3>
                            <div className="space-y-4">
                                <input
                                    autoFocus
                                    placeholder="Nombre del segmento..."
                                    value={newCategoryName}
                                    onChange={e => setNewCategoryName(e.target.value)}
                                    className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm"
                                />
                                <div className="flex gap-4">
                                    <button onClick={() => setIsCategoryModalOpen(false)} className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Cancelar</button>
                                    <button onClick={handleCreateCategory} className="flex-1 btn-primary !py-4 text-xs">Crear</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductManagement;
