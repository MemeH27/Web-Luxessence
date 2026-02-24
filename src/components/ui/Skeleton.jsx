import { motion } from 'framer-motion';

const Skeleton = ({ className }) => {
    return (
        <div className={`relative overflow-hidden bg-primary/5 rounded-2xl ${className}`}>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute inset-x-0 inset-y-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
        </div>
    );
};

export default Skeleton;
