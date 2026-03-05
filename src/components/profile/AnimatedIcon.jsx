import { motion } from 'framer-motion';

const AnimatedIcon = ({ icon: Icon, color = 'currentColor', size = 20, animation = 'default', className = '' }) => {
    const animations = {
        default: {
            whileHover: { scale: 1.2, rotate: 5 },
            transition: { type: 'spring', stiffness: 300, damping: 10 }
        },
        pulse: {
            animate: { scale: [1, 1.1, 1] },
            transition: { repeat: Infinity, duration: 2, ease: "easeInOut" }
        },
        rotate: {
            animate: { rotate: 360 },
            transition: { repeat: Infinity, duration: 4, ease: "linear" }
        },
        bounce: {
            animate: { y: [0, -3, 0] },
            transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
        },
        shake: {
            whileHover: { rotate: [0, -5, 5, -5, 5, 0] },
            transition: { duration: 0.4 }
        }
    };

    const selectedAnim = animations[animation] || animations.default;

    return (
        <motion.div
            className={`flex items-center justify-center ${className}`}
            {...selectedAnim}
        >
            <Icon size={size} color={color} strokeWidth={1.5} />
        </motion.div>
    );
};

export default AnimatedIcon;
