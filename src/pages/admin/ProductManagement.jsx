import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { exportToExcel } from '../../utils/export';
import { Plus, Edit3, Trash2, X, Upload, Search, Download, Package2, ChevronUp, ChevronDown, ListPlus, Lock, CheckCircle2, Circle, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SecurityModal from '../../components/admin/SecurityModal';
import Pagination from '../../components/admin/Pagination';
import { useToast } from '../../context/ToastContext';
import { uploadAndOptimize } from '../../utils/image';

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
    const [newCategoryImage, setNewCategoryImage] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Security Modal State
    const [isSecurityOpen, setIsSecurityOpen] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type, id, data }

    const [form, setForm] = useState({
        name: '', description: '', price: 0, cost: 0, stock: 0, category_id: '', image_url: '', hover_image_url: '',
        is_new_arrival: false, is_gift_option: false, is_coming_soon: false
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
            setForm({
                name: '', description: '', price: 0, cost: 0, stock: 0,
                category_id: categories[0]?.id || '', image_url: '',
                is_new_arrival: false, is_gift_option: false, is_coming_soon: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCreateCategory = async () => {
        if (!newCategoryName) return;
        setLoading(true);
        try {
            const payload = {
                name: newCategoryName,
                image_url: newCategoryImage
            };

            const { data, error } = editingCategory
                ? await supabase.from('categories').update(payload).eq('id', editingCategory.id).select().single()
                : await supabase.from('categories').insert(payload).select().single();

            if (error) {
                console.error('Error saving category:', error);
                alert(`Error al guardar categoría: ${error.message}`);
            } else {
                if (editingCategory) {
                    setCategories(categories.map(c => c.id === data.id ? data : c));
                } else {
                    setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)));
                    setForm({ ...form, category_id: data.id });
                }
                setNewCategoryName('');
                setNewCategoryImage('');
                setEditingCategory(null);
                setIsCategoryModalOpen(false);
                addToast('Categoría guardada con éxito');
            }
        } catch (err) {
            alert('Error inesperado al guardar la categoría');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCategory = (cat) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setNewCategoryImage(cat.image_url || '');
    };

    const handleCategoryImageUpload = async (e) => {
        setUploading('category_image');
        const file = e.target.files[0];
        try {
            const publicUrl = await uploadAndOptimize(supabase, 'products', file, false);
            setNewCategoryImage(publicUrl);
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Error subiendo imagen: ${error.message}.`);
        } finally {
            setUploading(null);
        }
    };

    const handleImageUpload = async (e, field = 'image_url') => {
        setUploading(field);
        const file = e.target.files[0];
        try {
            const publicUrl = await uploadAndOptimize(supabase, 'products', file, true);
            setForm({ ...form, [field]: publicUrl });
        } catch (error) {
            console.error('Upload error:', error);
            alert(`Error subiendo imagen: ${error.message}.`);
        } finally {
            setUploading(null);
        }
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

    const toggleComingSoon = async (id, currentStatus) => {
        try {
            const { error } = await supabase.from('products').update({ is_coming_soon: !currentStatus }).eq('id', id);
            if (error) throw error;
            addToast(`Producto ${!currentStatus ? 'marcado como Próximamente' : 'removido de Próximamente'}`);
            fetchData();
        } catch (err) {
            addToast('Error al cambiar estado', 'error');
        }
    };

    const handleSecurityConfirm = () => {
        if (!securityAction) return;
        if (securityAction.type === 'delete') {
            executeDelete(securityAction.id);
        }
        setSecurityAction(null);
    };

    const handleDelete = (id) => {
        setSecurityAction({ type: 'delete', id });
        setIsSecurityOpen(true);
    };

    const executeDelete = async (id) => {
        setLoading(true);
        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) {
                console.error('Error deleting product:', error);
                addToast(`Error al eliminar: ${error.message}`, 'error');
            } else {
                addToast('Producto eliminado');
                fetchData();
            }
        } catch (err) {
            addToast('Error inesperado al eliminar', 'error');
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


    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedProducts = filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 on search
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <div className="space-y-12 pb-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-serif font-black italic text-primary leading-tight">Gestión de Inventario</h1>
                    <p className="text-primary/40 font-medium italic">Control maestro de catálogo, existencias y precios.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={handleExport} className="glass-panel p-5 rounded-2xl hover:bg-primary/5 text-primary/60 transition-colors shadow-sm border-primary/5">
                        <Download className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleOpenModal()} className="btn-primary flex-1 md:flex-none flex items-center justify-center gap-3 !py-5 shadow-xl shadow-primary/10">
                        <Plus className="w-6 h-6" /> <span className="text-xs uppercase tracking-widest font-black">Nuevo Producto</span>
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Product List Panel */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Search Bar */}
                    <div className="relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 w-5 h-5 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o categoría..."
                            className="w-full bg-white border border-primary/5 rounded-[2rem] py-6 pl-16 pr-8 focus:ring-1 focus:ring-primary outline-none shadow-sm font-medium transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="bg-white/40 rounded-[3rem] p-4 md:p-8 shadow-sm border border-primary/5 min-h-[600px] max-h-[800px] overflow-y-auto no-scrollbar space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full text-primary/20 italic font-serif">Destilando catálogo...</div>
                        ) : paginatedProducts.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-primary/20 italic font-serif">No hay tesoros que coincidan.</div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 px-1">
                                {paginatedProducts.map(prod => (
                                    <motion.div
                                        layout
                                        key={prod.id}
                                        className="group bg-white rounded-[2rem] border border-primary/10 hover:border-primary/20 shadow-sm hover:shadow-xl transition-all flex items-center p-3 md:p-5 gap-4 overflow-hidden"
                                    >
                                        <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-[1.8rem] overflow-hidden bg-primary/5 shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            <img src={prod.image_url || '/img/logo.svg'} className="w-full h-full object-cover" alt={prod.name} />
                                            {prod.is_coming_soon && (
                                                <div className="absolute inset-0 bg-orange-500/20 backdrop-blur-[2px] flex items-center justify-center">
                                                    <Clock className="w-8 h-8 text-white drop-shadow-lg animate-pulse" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1 h-full">
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-[8px] uppercase tracking-widest text-primary/30 font-black truncate">{prod.categories?.name}</p>
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${prod.stock > 10 ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.3)]' : prod.stock > 0 ? 'bg-orange-500' : 'bg-red-500 shadow-[0_0_5px_rgba(239,44,44,0.3)]'}`} />
                                                </div>
                                                <h3 className="font-serif font-bold italic text-primary text-base md:text-xl leading-snug truncate" title={prod.name}>
                                                    {prod.name}
                                                </h3>
                                            </div>

                                            <div className="flex items-baseline gap-3">
                                                <p className="text-xl md:text-3xl font-sans font-black text-primary tracking-tighter">L. {prod.price.toLocaleString()}</p>
                                                <span className="text-[9px] font-black text-primary/20 uppercase tracking-[0.2em] whitespace-nowrap">Stock: {prod.stock}</span>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 border-t border-primary/5 mt-1">
                                                <button
                                                    onClick={() => toggleComingSoon(prod.id, prod.is_coming_soon)}
                                                    className={`p-2.5 md:p-3 rounded-xl transition-all border ${prod.is_coming_soon
                                                        ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/10'
                                                        : 'bg-primary/5 border-transparent text-primary/30 hover:text-orange-500 hover:bg-orange-500/5'}`}
                                                    title="Próximamente"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => { setEditingProduct(prod); setForm(prod); setIsModalOpen(true); }}
                                                    className="p-2.5 md:p-3 bg-primary/5 text-primary/30 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    title="Editar"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(prod.id)}
                                                    className="p-2.5 md:p-3 bg-red-500/5 text-red-500/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredProducts.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                    />
                </div>

                {/* Info & Stats Sidebar */}
                <div className="space-y-8">
                    {/* Summary Card */}
                    <div className="bg-primary p-8 md:p-12 rounded-[3rem] md:rounded-[4rem] text-secondary-light space-y-8 md:space-y-10 shadow-3xl relative overflow-hidden">
                        <div className="space-y-2 md:space-y-4 relative z-10">
                            <h2 className="text-2xl md:text-3xl font-serif font-bold italic truncate">Resumen de Inventario</h2>
                            <p className="text-secondary-light/40 text-[10px] md:text-xs font-medium uppercase tracking-[0.2em]">Métricas del Catálogo</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
                            <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/10">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-2">Total Referencias</p>
                                <p className="text-2xl md:text-3xl font-serif font-bold italic text-secondary">{products.length}</p>
                            </div>
                            <div className="bg-white/5 p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-white/10 flex flex-col justify-center">
                                <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-secondary-light/40 mb-2">Valor Stock Total</p>
                                <p className="text-xl md:text-2xl font-bold text-secondary break-all sm:break-normal">L. {Math.round(products.reduce((acc, p) => acc + (p.price * p.stock), 0)).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-secondary/10 rounded-[2rem] md:rounded-[2.5rem] border border-secondary/20 relative z-10">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                                <Package2 className="w-4 h-4 md:w-5 md:h-5" /> Lanzamientos
                            </p>
                            <p className="text-xs md:text-sm italic leading-relaxed">
                                Tienes <span className="text-secondary font-bold">{products.filter(p => p.is_coming_soon).length} productos</span> marcados como lanzamientos futuros.
                            </p>
                        </div>

                        {/* Ambient Decoration */}
                        <div className="absolute top-0 right-0 w-40 h-40 bg-secondary/5 rounded-full blur-3xl opacity-50" />
                    </div>

                    <div className="bg-white border border-secondary/20 p-8 rounded-[3rem] space-y-6 shadow-sm">
                        <div className="flex items-center gap-4 text-primary">
                            <ListPlus className="w-5 h-5" />
                            <h4 className="font-serif font-bold italic">Sincronización</h4>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Backup:</span>
                                <span className="text-green-500 flex items-center gap-2">OK <CheckCircle2 className="w-3 h-3" /></span>
                            </li>
                            <li className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest group">
                                <span className="text-primary/40 group-hover:text-primary transition-colors">Seguridad:</span>
                                <span className="text-primary flex items-center gap-2">Activa <Lock className="w-3 h-3" /></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <SecurityModal
                isOpen={isSecurityOpen}
                onClose={() => setIsSecurityOpen(false)}
                onConfirm={handleSecurityConfirm}
                title="Eliminar Producto"
            />

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/20 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-4xl rounded-[4rem] p-10 md:p-14 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar border border-primary/10">
                            <div className="flex justify-between items-center mb-10">
                                <div className="space-y-1">
                                    <h2 className="text-3xl md:text-4xl font-serif font-bold italic text-primary">{editingProduct ? 'Perfil de Producto' : 'Nueva Referencia'}</h2>
                                    <p className="text-[10px] text-primary/30 uppercase tracking-[0.2em] font-black">Identidad Comercial y Técnica</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-3 bg-primary/5 hover:bg-red-500 hover:text-white rounded-full text-primary transition-all"><X className="w-7 h-7" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="md:col-span-1 space-y-6">
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[3rem] p-10 group hover:border-primary/30 transition-colors relative h-64 overflow-hidden bg-white shadow-inner">
                                        {form.image_url ? (
                                            <img src={form.image_url} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center space-y-4">
                                                <Upload className="text-primary w-12 h-12 mx-auto opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Imagen Principal</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                        {uploading === 'image_url' && <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-30"><p className="text-secondary-light font-black uppercase tracking-widest text-xs">Cargando...</p></div>}
                                    </div>

                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[3rem] p-6 group hover:border-primary/30 transition-colors relative h-40 overflow-hidden bg-white shadow-inner">
                                        {form.hover_image_url ? (
                                            <img src={form.hover_image_url} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <Plus className="text-primary w-8 h-8 mx-auto opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40">Imagen Hover (Opcional)</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={(e) => handleImageUpload(e, 'hover_image_url')} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                        {uploading === 'hover_image_url' && <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-30"><p className="text-xs text-white">...</p></div>}
                                    </div>
                                </div>

                                <div className="md:col-span-1 space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre Comercial</label>
                                        <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-white border border-primary/10 rounded-2xl py-5 px-8 outline-none transition-all shadow-sm font-serif italic text-xl text-primary focus:border-primary" />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Segmento / Categoría</label>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 relative">
                                                <select
                                                    value={form.category_id}
                                                    onChange={e => setForm({ ...form, category_id: e.target.value })}
                                                    className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 font-bold text-primary outline-none focus:border-primary appearance-none cursor-pointer shadow-sm"
                                                >
                                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                                                    <ChevronDown className="w-4 h-4" />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsCategoryModalOpen(true)}
                                                className="w-14 h-14 bg-primary text-secondary rounded-2xl flex items-center justify-center shrink-0 shadow-lg hover:scale-105 transition-all"
                                                title="Nueva Categoría"
                                            >
                                                <Plus className="w-7 h-7" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <StepperInput label="PVP (L.)" value={form.price} onChange={v => setForm({ ...form, price: v })} step={50} />
                                    <StepperInput label="Costo (L.)" value={form.cost} onChange={v => setForm({ ...form, cost: v })} step={50} />
                                    <StepperInput label="Existencia" value={form.stock} onChange={v => setForm({ ...form, stock: v })} />
                                </div>

                                <div className="md:col-span-2 space-y-3">
                                    <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Notas del Producto</label>
                                    <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="3" className="w-full bg-white border border-primary/10 rounded-[2rem] py-5 px-8 outline-none transition-all shadow-sm resize-none text-sm italic focus:border-primary" />
                                </div>

                                <button type="submit" className="md:col-span-2 btn-primary !py-6 mt-4 font-black uppercase tracking-[0.3em] text-xs">
                                    {editingProduct ? 'ACTUALIZAR INVENTARIO' : 'DAR DE ALTA PRODUCTO'}
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary/40 backdrop-blur-md" onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); }} />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-secondary-light w-full max-w-lg rounded-[2.5rem] p-10 relative z-10 shadow-2xl border border-primary/10 max-h-[90vh] overflow-y-auto no-scrollbar">
                            <h3 className="text-2xl font-serif font-bold italic text-primary mb-8">{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>

                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/10 rounded-[2.5rem] p-6 group hover:border-primary/30 transition-colors relative h-40 overflow-hidden bg-white shadow-inner">
                                        {newCategoryImage ? (
                                            <img src={newCategoryImage} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <Upload className="text-primary w-8 h-8 mx-auto opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 text-center">Imagen de la Categoría</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleCategoryImageUpload} className="absolute inset-0 opacity-0 cursor-pointer z-20" />
                                        {uploading === 'category_image' && <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm flex items-center justify-center z-30"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase tracking-widest text-primary/40 font-black ml-1">Nombre</label>
                                        <input
                                            autoFocus
                                            placeholder="Nombre del segmento..."
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            className="w-full bg-white border border-primary/10 rounded-2xl py-4 px-6 focus:ring-1 focus:ring-primary outline-none transition-all shadow-sm font-bold text-primary"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={() => { setIsCategoryModalOpen(false); setEditingCategory(null); setNewCategoryName(''); setNewCategoryImage(''); }} className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-primary/40 hover:text-primary transition-colors">Cancelar</button>
                                    <button onClick={handleCreateCategory} className="flex-2 btn-primary !py-4 text-xs flex-1">{editingCategory ? 'Actualizar' : 'Crear'}</button>
                                </div>

                                <div className="pt-8 border-t border-primary/5">
                                    <h4 className="text-[10px] uppercase tracking-widest text-primary/30 font-black mb-4">Categorías Existentes</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary/5 group/cat">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-primary/5 overflow-hidden">
                                                        {cat.image_url ? <img src={cat.image_url} className="w-full h-full object-cover" /> : <Package2 className="w-4 h-4 m-auto mt-3 text-primary/10" />}
                                                    </div>
                                                    <span className="text-xs font-bold text-primary">{cat.name}</span>
                                                </div>
                                                <button onClick={() => handleEditCategory(cat)} className="p-2 text-primary/20 hover:text-primary transition-colors">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
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
