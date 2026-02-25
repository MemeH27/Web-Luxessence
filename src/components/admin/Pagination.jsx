import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

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

                <div className="flex items-center gap-2 p-1.5 bg-primary/5 rounded-[2rem] border border-primary/5">
                    {totalPages <= 1 ? (
                        <span className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-primary/40">Página 1 de 1</span>
                    ) : (
                        [...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => onPageChange(i + 1)}
                                className={`w-10 h-10 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest transition-all ${currentPage === i + 1
                                    ? 'bg-primary text-secondary shadow-lg shadow-primary/20 scale-110'
                                    : 'text-primary/40 hover:text-primary hover:bg-white'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))
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
