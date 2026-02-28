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
                    <div className="bg-white p-10 rounded-[3.5rem] border border-primary/5 shadow-xl space-y-8 flex flex-col">
                        <div className="space-y-2">
                            <h3 className="text-2xl font-serif font-bold italic text-primary">Categorías en Landing</h3>
                            <p className="text-xs text-primary/40 italic leading-relaxed">Marca las categorías que deseas mostrar en la sección principal del Home.</p>
                        </div>
                        <div className="space-y-3 flex-1 overflow-y-auto max-h-[500px] pr-4 custom-scrollbar">
                            {dbCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between p-4 bg-primary/5 rounded-3xl border border-primary/5 hover:border-primary/20 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white border border-primary/5 shadow-inner">
                                            {cat.image_url ? <img src={cat.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-primary/10 font-black">{cat.name[0]}</div>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">{cat.name}</p>
                                            <p className={`text-[9px] font-black uppercase tracking-widest ${cat.is_featured ? 'text-secondary' : 'text-primary/30'}`}>
                                                {cat.is_featured ? 'Destacada' : 'No destacada'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleFeatured(cat.id, cat.is_featured)}
                                        disabled={updatingCat === cat.id}
                                        className={`w-14 h-7 rounded-full transition-all relative ${cat.is_featured ? 'bg-secondary' : 'bg-primary/10'}`}
                                    >
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-md ${cat.is_featured ? 'right-1' : 'left-1'}`} />
                                    </button>
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
                        <h3 className="text-2xl font-serif font-bold italic text-primary">Banner Principal (Landing)</h3>
                        <div className="flex flex-col lg:flex-row gap-10">
                            <div className="flex-1 space-y-3">
                                <div className="aspect-[21/9] rounded-[3rem] overflow-hidden bg-primary/5 relative border border-primary/5 group shadow-inner">
                                    {settings.hero_banner && <img src={settings.hero_banner} className="w-full h-full object-cover" />}
                                    <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-md transition-all">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'hero_banner')} />
                                        <div className="bg-white text-primary px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl">Cambiar Banner</div>
                                    </div>
                                    {uploading === 'hero_banner' && <div className="absolute inset-0 bg-primary/60 flex items-center justify-center backdrop-blur-sm"><Loader2 className="w-10 h-10 animate-spin text-white" /></div>}
                                </div>
                            </div>
                            <div className="w-full lg:w-96 space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-primary/40 ml-1">Título Hero</label>
                                    <input value={settings.hero_title || ''} onChange={e => setSettings({ ...settings, hero_title: e.target.value })} className="w-full bg-primary/5 border border-primary/5 rounded-2xl py-5 px-8 text-xl font-serif italic text-primary font-bold outline-none" />
                                </div>
                                <div className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex gap-4 items-start">
                                    <Info className="w-5 h-5 text-blue-500 mt-1" />
                                    <p className="text-[11px] text-blue-900/60 leading-relaxed italic">
                                        Este título aparece en letras grandes sobre el banner principal. Recomendado: Máx 40 caracteres.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SiteSettings;
