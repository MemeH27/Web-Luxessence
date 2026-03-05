import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const CountdownTimer = ({ targetDate, onExpire }) => {
    const [timeLeft, setTimeLeft] = useState({});
    const [isExpiringSoon, setIsExpiringSoon] = useState(false);

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const target = new Date(targetDate);
            const difference = target - now;

            if (difference <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
                if (onExpire) onExpire();
                return;
            }

            const hours = Math.floor((difference / (1000 * 60 * 60)));
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setTimeLeft({ hours, minutes, seconds });

            // "Expiring soon" if less than 6 hours
            if (difference < 6 * 60 * 60 * 1000) {
                setIsExpiringSoon(true);
            }
        };

        const timer = setInterval(calculateTime, 1000);
        calculateTime();

        return () => clearInterval(timer);
    }, [targetDate, onExpire]);

    const TimeUnit = ({ value, label }) => (
        <div className="flex flex-col items-center">
            <span className="text-xl md:text-2xl font-black font-sans tracking-tighter tabular-nums">
                {value.toString().padStart(2, '0')}
            </span>
            <span className="text-[7px] uppercase tracking-widest font-black opacity-40">{label}</span>
        </div>
    );

    return (
        <div className="flex flex-col items-center gap-2">
            <AnimatePresence>
                {isExpiringSoon && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-500 text-white text-[8px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5"
                    >
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                        </span>
                        EXPIRA PRONTO
                    </motion.div>
                )}
            </AnimatePresence>

            <div className={`flex items-center gap-4 bg-white/10 backdrop-blur-xl p-3 md:p-4 rounded-3xl border ${isExpiringSoon ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' : 'border-white/20'} text-white transition-all duration-1000`}>
                <Clock className={`w-4 h-4 md:w-5 md:h-5 ${isExpiringSoon ? 'text-red-500' : 'opacity-40'}`} />
                <div className="flex items-center gap-3">
                    <TimeUnit value={timeLeft.hours || 0} label="HRS" />
                    <span className="text-lg opacity-20">:</span>
                    <TimeUnit value={timeLeft.minutes || 0} label="MIN" />
                    <span className="text-lg opacity-20">:</span>
                    <TimeUnit value={timeLeft.seconds || 0} label="SEG" />
                </div>
            </div>
        </div>
    );
};

export default CountdownTimer;
