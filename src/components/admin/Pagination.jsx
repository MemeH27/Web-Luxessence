import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const maxVisible = isMobile ? 4 : 6;

    return (
        <div className="flex flex-col items-center gap-6 py-12">
            <div className="flex items-center justify-center gap-4">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="group p-4 bg-white border border-primary/10 rounded-2xl text-primary/30 hover:text-primary hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>

                <div className="flex items-center gap-1.5 p-1.5 bg-primary/5 rounded-[2rem] border border-primary/5 max-w-[260px] sm:max-w-none overflow-x-auto no-scrollbar">
                    {totalPages <= 1 ? (
                        <span className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary/40">Página 1 de 1</span>
                    ) : (
                        (() => {
                            const pages = [];
                            let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                            let end = Math.min(totalPages, start + maxVisible - 1);
                            
                            if (end - start + 1 < maxVisible) {
                                start = Math.max(1, end - maxVisible + 1);
                            }

                            if (!isMobile && start > 1) {
                                pages.push(
                                    <button
                                        key={1}
                                        onClick={() => onPageChange(1)}
                                        className={`w-9 h-9 rounded-[1.2rem] text-[10px] font-black transition-all ${currentPage === 1 ? 'bg-primary text-secondary' : 'text-primary/40 hover:text-primary'}`}
                                    >
                                        1
                                    </button>
                                );
                                if (start > 2) {
                                    pages.push(<span key="ellipsis-start" className="text-primary/20 text-xs px-1">...</span>);
                                }
                            }

                            for (let i = start; i <= end; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => onPageChange(i)}
                                        className={`w-9 h-9 rounded-[1.2rem] text-[10px] font-black transition-all ${currentPage === i
                                            ? 'bg-primary text-secondary shadow-lg shadow-primary/20 scale-110'
                                            : 'text-primary/40 hover:text-primary hover:bg-white'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (!isMobile && end < totalPages) {
                                if (end < totalPages - 1) {
                                    pages.push(<span key="ellipsis-end" className="text-primary/20 text-xs px-1">...</span>);
                                }
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => onPageChange(totalPages)}
                                        className={`w-9 h-9 rounded-[1.2rem] text-[10px] font-black transition-all ${currentPage === totalPages ? 'bg-primary text-secondary' : 'text-primary/40 hover:text-primary'}`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()
                    )}
                </div>

                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages || totalPages === 0}
                    className="group p-4 bg-white border border-primary/10 rounded-2xl text-primary/30 hover:text-primary hover:border-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            {totalItems > itemsPerPage && (
                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-primary/20">
                    Mostrando {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} de {totalItems} tesoros
                </p>
            )}
        </div>
    );
};

export default Pagination;
