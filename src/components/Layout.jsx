import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const Layout = ({ children }) => {
    const location = useLocation();
    const { addToast } = useToast();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const channel = supabase
                .channel(`customer_orders_${session.user.id}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `client_email=eq.${session.user.email}`
                }, (payload) => {
                    if (payload.new.status === 'processed' && payload.old.status !== 'processed') {
                        addToast('✨ ¡Tu pedido ha sido procesado y facturado con éxito!', 'success');
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        setupRealtime();
    }, [addToast]);

    return (
        <div className="min-h-screen bg-secondary-light text-luxury-black selection:bg-primary/20 selection:text-primary overflow-x-hidden">
            <Navbar />

            <AnimatePresence mode="wait">
                <motion.main
                    key={location.pathname}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full pt-[80px] pb-32 md:pb-10"
                >
                    {children}
                </motion.main>
            </AnimatePresence>

            <BottomNav />

            {/* Decorative Brand Colors */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[150px] -z-10 pointer-events-none" />
            <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/3 rounded-full blur-[150px] -z-10 pointer-events-none" />
        </div>
    );
};

export default Layout;
