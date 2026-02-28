import React from 'react';
import { Phone, Receipt, CreditCard } from 'lucide-react';

const InvoiceContent = ({ sale, customer, items, payments, totalPaid, balanceDue, isExport = false }) => {
    return (
        <div
            className={`bg-white invoice-container mx-auto ${isExport ? 'w-[816px] min-w-[816px]' : 'w-full max-w-[816px] min-w-[320px]'}`}
            style={{
                minHeight: '1056px',
                padding: isExport ? '40px' : '2rem',
                // Ensure text rendering behaves correctly
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale'
            }}
        >
            {/* Header Design */}
            <div className={`flex justify-between gap-8 border-b-2 border-primary/10 pb-10 ${isExport ? 'flex-row' : 'flex-col md:flex-row'}`}>
                <div className="space-y-4">
                    <h2 className={`font-serif font-black italic text-primary tracking-tighter ${isExport ? 'text-5xl' : 'text-4xl lg:text-5xl'}`}>LUXESSENCE</h2>
                    <div className="space-y-1">
                        <p className={`font-black text-gray-400 uppercase tracking-[0.3em] ${isExport ? 'text-xs' : 'text-[10px] md:text-xs'}`}>Tienda 100% Online</p>
                        <div className={`text-gray-500 font-medium ${isExport ? 'text-xs' : 'text-[9px] md:text-xs'}`}>
                            <p>Santa Rosa de Copán | San Pedro Sula</p>
                            <p>Tel: 3313-5869 / 8896-6603</p>
                            <p>www.luxessence.store</p>
                        </div>
                    </div>
                </div>
                <div className={`flex flex-col justify-end space-y-4 ${isExport ? 'text-right' : 'text-left md:text-right'}`}>
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest whitespace-nowrap">Nº de Factura</p>
                            <p className={`font-mono font-bold text-primary ${isExport ? 'text-2xl' : 'text-xl lg:text-2xl'}`}>#LUX-{sale.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest whitespace-nowrap">Fecha de Emisión</p>
                            <p className="text-sm font-bold text-primary">{new Date(sale.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Participants Grid */}
            <div className={`gap-10 py-12 ${isExport ? 'grid grid-cols-2' : 'grid grid-cols-1 md:grid-cols-2'}`}>
                <div className="space-y-4">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest border-l-2 border-primary pl-3 whitespace-nowrap">Datos del Comprador</p>
                    <div className="space-y-1">
                        <h3 className="text-2xl font-serif font-bold italic text-primary">{customer?.first_name} {customer?.last_name}</h3>
                        <div className="text-sm text-gray-500 space-y-1 font-medium">
                            <p className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-gray-400" /> {customer?.phone}</p>
                            <p className="flex items-start gap-2 max-w-xs">{customer?.address || 'Honduras'}</p>
                        </div>
                    </div>
                </div>
                <div className={`space-y-4 ${isExport ? 'text-right' : 'md:text-right'}`}>
                    <p className={`text-[10px] uppercase font-black text-gray-400 tracking-widest whitespace-nowrap ${isExport ? 'border-r-2 border-primary pr-3' : 'md:border-r-2 md:border-primary md:pr-3'}`}>Detalles de Venta</p>
                    <div className="space-y-2">
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-300 whitespace-nowrap">Método de Pago</p>
                            <p className="text-sm font-black text-primary uppercase">{sale.payment_method}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-black text-gray-300 whitespace-nowrap">Estado</p>
                            <p className={`text-sm font-bold ${sale.is_paid ? 'text-green-600' : 'text-red-500'}`}>{sale.is_paid ? 'CANCELADO' : 'PENDIENTE'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] border-l-2 border-primary/20 pl-3 whitespace-nowrap">Detalle de Productos</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap">
                        {items.filter(i => !i.is_promo_metadata).length} {items.filter(i => !i.is_promo_metadata).length === 1 ? 'Artículo' : 'Artículos'}
                    </p>
                </div>
                <div className="rounded-[2rem] border border-primary/5 bg-gray-50/50 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className={`bg-primary text-white uppercase font-black tracking-[0.2em] ${isExport ? 'text-[10px]' : 'text-[9px] md:text-[10px]'}`}>
                                <th className="px-8 py-5 w-24">Cant.</th>
                                <th className="px-6 py-5">Descripción</th>
                                <th className="px-6 py-5 text-right font-serif whitespace-nowrap">Precio Unit.</th>
                                <th className="px-8 py-5 text-right whitespace-nowrap">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.filter(i => !i.is_promo_metadata).map((item, idx) => (
                                <tr key={idx} className="text-sm group hover:bg-white transition-colors">
                                    <td className="px-8 py-5 font-black text-gray-400">
                                        <span className="bg-gray-100 px-2 py-1 rounded-md text-[10px] text-primary/60">{item.quantity}</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <p className="font-bold text-primary leading-tight">{item.name}</p>
                                    </td>
                                    <td className="px-6 py-5 text-right text-gray-500 font-medium italic whitespace-nowrap">L. {Number(item.price).toLocaleString()}</td>
                                    <td className="px-8 py-5 text-right font-black text-primary whitespace-nowrap">L. {(item.price * item.quantity).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payments Section (Credit Only) */}
            {sale.payment_method === 'Crédito' && payments.length > 0 && (
                <div className="mt-12 space-y-4">
                    <p className="text-[10px] uppercase font-black text-orange-500/60 tracking-[0.2em] border-l-2 border-orange-500/20 pl-3 whitespace-nowrap">Cronograma de Pagos / Abonos</p>
                    <div className="rounded-[2rem] border border-orange-100 bg-orange-50/30 overflow-hidden">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-orange-100/50 text-orange-800 text-[9px] uppercase font-black tracking-[0.2em]">
                                    <th className="px-8 py-4">Fecha de Proceso</th>
                                    <th className="px-6 py-4">Referencia / Nota</th>
                                    <th className="px-8 py-4 text-right whitespace-nowrap">Monto Pagado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-orange-100">
                                {payments.map((p, idx) => (
                                    <tr key={idx} className="text-[13px]">
                                        <td className="px-8 py-4 font-bold text-orange-900/70">
                                            {new Date(p.created_at).toLocaleDateString('es-HN')}
                                            <span className="text-[9px] ml-2 text-orange-400 font-black opacity-60 whitespace-nowrap">
                                                {new Date(p.created_at).toLocaleTimeString('es-HN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-orange-800/60 italic font-medium">{p.notes || 'Abono a cuenta'}</td>
                                        <td className="px-8 py-4 text-right font-black text-orange-700 whitespace-nowrap">L. {Number(p.amount).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className={`mt-14 pt-10 border-t-2 border-primary/5 flex items-start gap-12 justify-end ${isExport ? 'flex-row' : 'flex-col md:flex-row'}`}>
                {/* Right: Financial Summary */}
                <div className={`space-y-2 ${isExport ? 'w-96' : 'w-full md:w-96'}`}>
                    {/* Breakdown */}
                    <div className="space-y-4 px-2 pb-6">
                        <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tighter text-gray-400">
                            <span className="whitespace-nowrap">Subtotal Neto</span>
                            <span className="text-sm font-sans font-bold text-gray-600 whitespace-nowrap">L. {(sale.total + (sale.discount || 0)).toLocaleString()}</span>
                        </div>

                        {sale.discount > 0 && (
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tighter text-red-500/60 transition-all">
                                <span className="whitespace-nowrap">
                                    {items.find(i => i.is_promo_metadata)?.promo_code_used
                                        ? `Descuento p. cupón (${items.find(i => i.is_promo_metadata).promo_code_used})`
                                        : 'Descuento Especial'
                                    }
                                </span>
                                <span className="text-sm font-sans font-bold whitespace-nowrap">- L. {sale.discount.toLocaleString()}</span>
                            </div>
                        )}

                        {sale.payment_method === 'Crédito' && totalPaid > 0 && (
                            <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tighter text-green-600/60 pt-2 border-t border-dashed border-gray-100">
                                <span className="whitespace-nowrap">Total Abonado</span>
                                <span className="text-sm font-sans font-bold whitespace-nowrap">L. {totalPaid.toLocaleString()}</span>
                            </div>
                        )}
                    </div>

                    {/* Final Balance/Total Area */}
                    <div className="relative bg-primary p-5 px-7 rounded-2xl shadow-xl overflow-hidden group">
                        <Receipt className="absolute -right-1 -bottom-1 w-16 h-16 text-white/5 rotate-12 transition-transform group-hover:scale-110" />
                        <div className="relative z-10 space-y-0.5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 whitespace-nowrap">
                                {sale.payment_method === 'Crédito' ? 'Saldo a Liquidar' : 'Total Facturado'}
                            </p>
                            <div className="flex items-baseline gap-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
                                <span className="text-lg font-black text-secondary">L.</span>
                                <span className="text-3xl font-sans font-black text-white tracking-widest leading-none whitespace-nowrap">
                                    {(sale.payment_method === 'Crédito' ? balanceDue : Number(sale.total)).toLocaleString()}
                                </span>
                            </div>
                            {sale.payment_method === 'Crédito' && (
                                <div className="flex items-center gap-1.5 pt-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${sale.is_paid ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-secondary shadow-[0_0_8px_rgba(244,180,0,0.5)] animate-pulse'}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${sale.is_paid ? 'text-green-500' : 'text-secondary'}`}>
                                        Estado: {sale.is_paid ? 'Cancelado' : 'Pendiente'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Section: Notes & Terms */}
            <div className="mt-14 space-y-6 border-t border-primary/5 pt-10">
                <div className={`items-start gap-8 ${isExport ? 'grid grid-cols-2' : 'grid grid-cols-1 md:grid-cols-2'}`}>
                    <div className={`space-y-2 ${isExport ? 'text-left' : 'text-center md:text-left'}`}>
                        <p className="text-[9px] uppercase font-black text-primary/30 tracking-[0.2em] whitespace-nowrap">Facturación</p>
                        <p className="text-[10px] text-gray-400 font-medium italic leading-relaxed">
                            Documento para control administrativo interno meramente. Gracias por su preferencia y confianza en Luxessence.
                        </p>
                    </div>

                    {sale.payment_method === 'Crédito' && (
                        <div className={`bg-orange-50/30 p-4 rounded-xl border border-orange-100/50 flex items-center gap-4 ${isExport ? 'text-left' : 'text-center md:text-left'}`}>
                            <CreditCard className={`w-6 h-6 text-orange-500/50 shrink-0 ${isExport ? 'block' : 'hidden md:block'}`} />
                            <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-orange-600/60 whitespace-nowrap">Términos de Crédito</p>
                                <p className="text-[10px] font-bold text-orange-800/60 leading-relaxed">
                                    Pago total requerido en <span className="underline">30 días hábiles</span>. Favor realizar abonos puntuales y evita cargos adicionales.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-6 text-center">
                    <p className="text-[8px] font-black text-primary/10 uppercase tracking-[0.5em] whitespace-nowrap">La esencia del lujo en cada detalle</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    @page { margin: 15mm; size: auto; }
                    body { background: white !important; }
                    .no-print { display: none !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

const InvoiceTemplate = React.forwardRef(({ saleData }, ref) => {
    // Standardize data access
    const sale = saleData?.sale || saleData;
    const customer = saleData?.customer || saleData?.customers;
    const items = saleData?.items || saleData?.orders?.items || [];
    const payments = saleData?.payments || [];

    // Calculate totals for credit sales
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const balanceDue = Math.max(0, Number(sale.total) - totalPaid);

    if (!sale) return null;

    return (
        <div className="w-full h-full relative flex justify-center isolate">
            {/* The responsive Preview for the UI Modal */}
            <div className="w-full">
                <InvoiceContent
                    sale={sale}
                    customer={customer}
                    items={items}
                    payments={payments}
                    totalPaid={totalPaid}
                    balanceDue={balanceDue}
                    isExport={false}
                />
            </div>

            {/* 
              The fixed-width Hidden Element strictly for PNG Export.
              By rendering a second version with 'isExport={true}', we bypass
              Tailwind's 'md:' viewports and force a perfect Letter/A4 Desktop layout
              regardless of the mobile device screen size clicking "Descargar" o "Compartir".
              
              We position it absolute and off-screen so the user never sees it.
              The `ref` connects to THIS element for the htmlToImage generator.
            */}
            <div className="absolute top-[-9999px] left-[-9999px] -z-50 pointer-events-none w-[816px]">
                <div ref={ref} id="invoice-capture-area-export">
                    <InvoiceContent
                        sale={sale}
                        customer={customer}
                        items={items}
                        payments={payments}
                        totalPaid={totalPaid}
                        balanceDue={balanceDue}
                        isExport={true}
                    />
                </div>
            </div>
        </div>
    );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';

export default InvoiceTemplate;
