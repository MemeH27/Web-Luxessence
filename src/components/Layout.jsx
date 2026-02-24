import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import { useEffect } from 'react';

const Layout = ({ children }) => {
    const location = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location]);

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
