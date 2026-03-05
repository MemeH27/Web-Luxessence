import { motion } from 'framer-motion';
import { Clock, Package, Truck, CheckCircle2 } from 'lucide-react';
import AnimatedIcon from './AnimatedIcon';

const statuses = [
    { key: 'pending', label: 'Recibido', icon: Clock, anim: 'pulse' },
    { key: 'processing', label: 'Preparando', icon: Package, anim: 'shake' },
    { key: 'shipped', label: 'En camino', icon: Truck, anim: 'bounce' },
    { key: 'processed', label: 'Entregado', icon: CheckCircle2, anim: 'shake' }
];

const OrderTracker = ({ currentStatus }) => {
    // Determine active index
    const activeIndex = statuses.findIndex(s => s.key === currentStatus);

    // In case status is not in the list, default to pending or logic
    const safeActiveIndex = activeIndex === -1 ? (currentStatus === 'delivered' ? 3 : 0) : activeIndex;

    return (
        <div className="w-full py-8 px-4">
            <div className="relative flex justify-between items-center max-w-2xl mx-auto">
                {/* Progress Bar Background */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-primary/5 -translate-y-1/2 rounded-full" />

                {/* Active Progress Bar */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(safeActiveIndex / (statuses.length - 1)) * 100}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded-full"
                />

                {statuses.map((status, idx) => {
                    const isActive = idx <= safeActiveIndex;
                    const isCurrent = idx === safeActiveIndex;

                    return (
                        <div key={status.key} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    scale: isCurrent ? 1.2 : 1,
                                    opacity: 1,
                                    backgroundColor: isActive ? '#711116' : '#fafafa',
                                    borderColor: isActive ? '#711116' : '#7111161a'
                                }}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors`}
                            >
                                <AnimatedIcon
                                    icon={status.icon}
                                    color={isActive ? '#fafafa' : '#71111640'}
                                    size={18}
                                    animation={isCurrent ? status.anim : 'none'}
                                />
                            </motion.div>

                            <motion.span
                                animate={{
                                    color: isActive ? '#711116' : '#71111640',
                                    fontWeight: isCurrent ? 800 : 500
                                }}
                                className="text-[9px] uppercase tracking-[0.2em] text-center font-black absolute -bottom-6 w-24"
                            >
                                {status.label}
                            </motion.span>

                            {/* Tooltip for current status info? */}
                            {isCurrent && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="absolute -top-10 bg-primary text-secondary-light px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest whitespace-nowrap"
                                >
                                    ¡{status.label}!
                                </motion.div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default OrderTracker;
