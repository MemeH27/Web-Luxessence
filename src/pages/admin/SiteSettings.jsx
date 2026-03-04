import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Image as ImageIcon, Plus, Trash2, Info, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../context/ToastContext';
import { uploadAndOptimize } from '../../utils/image';

const SiteSettings = () => {
    const { addToast } = useToast();
    const [settings, setSettings] = useState({});
    const [dbCategories, setDbCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(null);
    const [updatingCat, setUpdatingCat] = useState(null);

    useEffect(() => {
        const init = async () => {
            await fetchSettings();
            await fetchCategories();
        };
        init();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from('site_settings').select('*');
            if (error) {
                if (error.code === '42P01') setSettings(null);
                else throw error;
            } else {
                const s = {};
                data.forEach(item => { s[item.key] = item.value; });
                setSettings(s);
            }
        } catch (err) {
            console.error(err);
            addToast('Error al cargar ajustes', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*').order('name');
        setDbCategories(data || []);
    };

    const handleInitialize = async () => {
        setSaving(true);
        const initialData = [
            { key: 'hero_banner', value: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000', category: 'Home', description: 'Banner principal del Home' },
            { key: 'hero_title', value: 'Descubre tu Legado Personal', category: 'Home', description: 'Título principal del Home' },
            { key: 'about_hero_image', value: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=2000', category: 'Nosotros', description: 'Fondo de cabecera Nosotros' },
            { key: 'about_story_image', value: 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=1000', category: 'Nosotros', description: 'Imagen de historia' },
            { key: 'about_story_title', value: 'Más que una Fragancia, un Legado', category: 'Nosotros', description: 'Título de historia' },
            { key: 'about_story_description', value: 'En Luxessence, entendemos que el perfume no es solo un aroma...', category: 'Nosotros', description: 'Descripción de historia' }
        ];
        try {
            const { error } = await supabase.from('site_settings').upsert(initialData, { onConflict: 'key' });
            if (error) throw error;
            addToast('Ajustes inicializados', 'success');
            fetchSettings();
        } catch (err) {
            addToast('Error al inicializar: ' + err.message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e, key) => {
        setUploading(key);
        try {
            const file = e.target.files[0];
            const url = await uploadAndOptimize(supabase, 'settings', file, true);
            setSettings({ ...settings, [key]: url });
            addToast('Imagen cargada temporalmente', 'info');
        } catch (err) {
            addToast('Error al subir imagen', 'error');
        } finally {
            setUploading(null);
        }
    };

    const handleCategoryImageUpload = async (e, catId) => {
        setUploading('cat_' + catId);
        try {
            const file = e.target.files[0];
            const url = await uploadAndOptimize(supabase, 'categories', file, true);

            const { error } = await supabase.from('categories').update({ image_url: url }).eq('id', catId);
            if (error) throw error;

            setDbCategories(prev => prev.map(c => c.id === catId ? { ...c, image_url: url } : c));
            addToast('Portada actualizada', 'success');
        } catch (err) {
            console.error('Category upload error:', err);
            addToast('Error al subir portada: ' + (err.message || 'Error desconocido'), 'error');
        } finally {
            setUploading(null);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
            const { error } = await supabase.from('site_settings').upsert(updates, { onConflict: 'key' });
            if (error) throw error;
            addToast('Cambios guardados', 'success');
        } catch (err) {
            addToast('Error al guardar', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleFeatured = async (catId, currentStatus) => {
        setUpdatingCat(catId);
        try {
            const { error } = await supabase.from('categories').update({ is_featured: !currentStatus }).eq('id', catId);
            if (error) throw error;
            setDbCategories(prev => prev.map(c => c.id === catId ? { ...c, is_featured: !currentStatus } : c));
            addToast('Categoría actualizada', 'success');
        } catch (err) {
            addToast('Error al actualizar categoría', 'error');
        } finally {
            setUpdatingCat(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center p-40 italic text-primary/20"><RefreshCw className="w-10 h-10 animate-spin mr-4" /> Sincronizando estéticas...</div>;

    if (settings === null) return (
        <div className="bg-red-50 p-20 rounded-[4rem] text-center space-y-6 max-w-2xl mx-auto border-2 border-red-100">
            <Trash2 className="w-20 h-20 text-red-100 mx-auto" />
            <h2 className="text-3xl font-serif italic font-bold text-red-900">Configuración Faltante</h2>
            <p className="text-red-800/60 italic">Debes crear la tabla <code>site_settings</code> en Supabase primero.</p>
            <pre className="text-[10px] bg-white p-6 rounded-3xl text-left border border-red-200 overflow-x-auto">
                {`CREATE TABLE site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  category TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Admin All" ON site_settings FOR ALL USING (auth.role() = 'authenticated');

-- Also run this to update categories:
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;`}
            </pre>
            <button onClick={fetchSettings} className="btn-primary !bg-red-600">REINTENTAR</button>
        </div>
    );

    return (
        <div className="space-y-12 pb-24">
            <header className="flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-6xl font-serif font-black italic text-primary leading-tight">Identidad Visual</h1>
                    <p className="text-primary/40 italic font-medium">Personaliza el escaparate digital de Luxessence.</p>
                </div>
                <button onClick={handleSave} disabled={saving} className="btn-primary !py-5 flex items-center gap-4 shadow-2xl group w-full md:w-auto">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                    <span className="text-xs font-black uppercase tracking-widest">Guardar Cambios</span>
                </button>
            </header>

            {Object.keys(settings).length === 0 ? (
                <div className="bg-amber-50 p-16 rounded-[4rem] text-center border-2 border-amber-100 space-y-6 max-w-xl mx-auto">
                    <ImageIcon className="w-20 h-20 text-amber-200 mx-auto" />
                    <h2 className="text-2xl font-serif italic text-amber-900">Ajustes Vacíos</h2>
                    <button onClick={handleInitialize} className="btn-primary">INICIALIZAR AJUSTES</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {/* Featured Categories Selector */}
                    <div className="bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-xl space-y-8 flex flex-col min-h-[600px]">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-serif font-bold italic text-primary">Gestión de Categorías</h3>
                            <p className="text-xs text-primary/40 italic leading-relaxed">Actualiza las portadas y personaliza qué categorías se destacan en el menú principal.</p>
                        </div>
                        <div className="space-y-4 flex-1 overflow-y-auto pr-4 custom-scrollbar">
                            {dbCategories.map(cat => (
                                <div key={cat.id} className="relative group">
                                    <div className="flex items-center gap-3 sm:gap-6 p-4 sm:p-5 bg-primary/[0.02] rounded-[2rem] sm:rounded-[2.5rem] border border-primary/5 group-hover:border-gold/30 transition-all duration-500">
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[1.5rem] overflow-hidden bg-white border border-primary/5 shadow-inner shrink-0">
                                            {cat.image_url ? (
                                                <img src={cat.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-primary/20 text-2xl sm:3xl font-serif italic">{cat.name[0]}</div>
                                            )}

                                            <label className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center backdrop-blur-sm transition-all cursor-pointer z-20">
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleCategoryImageUpload(e, cat.id)}
                                                />
                                                {uploading === 'cat_' + cat.id ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                                                ) : (
                                                    <>
                                                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white mb-1" />
                                                        <span className="text-[7px] sm:text-[8px] text-white font-black uppercase tracking-widest text-center px-1">Cambiar Foto</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <p className="text-base sm:text-lg font-serif font-bold italic text-primary truncate pr-2">{cat.name}</p>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => toggleFeatured(cat.id, cat.is_featured)}
                                                    disabled={updatingCat === cat.id}
                                                    className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${cat.is_featured
                                                        ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-primary/5 text-primary/30 border border-primary/5'
                                                        }`}
                                                >
                                                    {cat.is_featured ? 'Destacada' : 'No destacada'}
                                                </button>
                                                {uploading === 'cat_' + cat.id && <span className="text-[7px] text-gold animate-pulse font-black uppercase shrink-0">Subiendo...</span>}
                                            </div>
                                        </div>

                                        <div className="shrink-0">
                                            <button
                                                onClick={() => toggleFeatured(cat.id, cat.is_featured)}
                                                className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-all relative ${cat.is_featured ? 'bg-gold' : 'bg-primary/10'}`}
                                            >
                                                <div className={`absolute top-0.5 sm:top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${cat.is_featured ? 'right-1' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* About Section Management */}
                    <div className="bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-xl space-y-8">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-serif font-bold italic text-primary">Sección Nosotros</h3>
                            <p className="text-xs text-primary/40 italic">Controla las imágenes y textos de tu historia.</p>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Fondo Héroe</label>
                                    <div className="aspect-video rounded-3xl overflow-hidden bg-primary/5 relative border border-primary/5 group">
                                        {settings.about_hero_image && <img src={settings.about_hero_image} className="w-full h-full object-cover" />}
                                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer">
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'about_hero_image')} />
                                            {uploading === 'about_hero_image' ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Plus className="w-8 h-8 text-white" />}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Foto Historia</label>
                                    <div className="aspect-video rounded-3xl overflow-hidden bg-primary/5 relative border border-primary/5 group">
                                        {settings.about_story_image && <img src={settings.about_story_image} className="w-full h-full object-cover" />}
                                        <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-sm transition-all cursor-pointer">
                                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'about_story_image')} />
                                            {uploading === 'about_story_image' ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Plus className="w-8 h-8 text-white" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Título Nosotros</label>
                                <input value={settings.about_story_title || ''} onChange={e => setSettings({ ...settings, about_story_title: e.target.value })} className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 text-primary font-bold outline-none" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Descripción de la Marca</label>
                                <textarea rows="4" value={settings.about_story_description || ''} onChange={e => setSettings({ ...settings, about_story_description: e.target.value })} className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 text-primary text-xs font-medium resize-none outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Landing Banner */}
                    <div className="bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-xl space-y-8 xl:col-span-2">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-serif font-bold italic text-primary">Textos del Hero (Página Inicial)</h3>
                            <p className="text-xs text-primary/40 italic leading-relaxed">Personaliza el mensaje que ven tus clientes al entrar a la tienda.</p>
                        </div>
                        <div className="flex flex-col gap-6 w-full">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Título Principal</label>
                                <input value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} placeholder="Descubre tu Legado" className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-5 px-8 text-xl font-serif italic text-primary font-bold outline-none" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Mensaje o Subtítulo</label>
                                <textarea rows="3" value={settings.hero_text || ''} onChange={e => setSettings({ ...settings, hero_text: e.target.value })} placeholder="Una colección curada de fragancias..." className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-4 px-6 text-primary text-sm font-medium resize-none outline-none" />
                            </div>
                            <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex gap-4 items-start">
                                <Info className="w-5 h-5 text-blue-500 mt-1" />
                                <p className="text-[11px] text-blue-900/60 leading-relaxed italic">
                                    El fondo animado tipo seda siempre estará visible. Estos campos cambian exclusivamente los títulos frontales de bienvenida.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteSettings;
