import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (data, isAdmin = false, shouldDownload = true) => {
    const doc = new jsPDF();
    const { customer, order, sale, items } = data;

    // Color Palette
    const primaryColor = [113, 17, 22]; // #711116
    const secondaryColor = [249, 232, 215]; // #f9e8d7
    const borderLight = [230, 230, 230];

    // --- Header (Side-by-Side: Branding | Invoice Info) ---
    // Left side: Branding
    doc.setTextColor(...primaryColor);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(40);
    doc.text('LUXESSENCE', 20, 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('PERFUMERIA DE GAMA ALTA', 21, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Santa Rosa de Copán | San Pedro Sula', 21, 38);
    doc.text('Tel: 3313-5869 / 8896-6603', 21, 42);
    doc.text('www.luxessence.store', 21, 46);

    // Right side: Invoice Info (Styled Box)
    const boxX = 130;
    const boxY = 15;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.1);
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.03);
    doc.roundedRect(boxX, boxY, 60, 35, 5, 5, 'FD');

    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Nº DE FACTURA', boxX + 5, boxY + 8);
    doc.setFontSize(14);
    doc.setFont('courier', 'bold');
    doc.text(`#LUX-${sale.id.slice(0, 8).toUpperCase()}`, boxX + 5, boxY + 16);

    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('FECHA DE EMISIÓN', boxX + 5, boxY + 24);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(new Date(sale.created_at).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' }), boxX + 5, boxY + 30);

    // Separator
    doc.setDrawColor(...borderLight);
    doc.setLineWidth(0.5);
    doc.line(20, 58, 190, 58);

    // --- Metadata Row (Side-by-Side: Buyer | Sale Details) ---
    const metaY = 70;

    // Left: Buyer Info
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DATOS DEL COMPRADOR', 20, metaY);

    doc.setTextColor(40, 40, 40);
    doc.setFont('times', 'bolditalic');
    doc.setFontSize(20);
    doc.text(`${customer.first_name} ${customer.last_name}`, 20, metaY + 10);

    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Tel: ${customer.phone}`, 20, metaY + 17);
    doc.text(customer.address || 'Honduras', 20, metaY + 23, { maxWidth: 80 });

    // Right: Sale Details
    const detailsX = 130;
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DETALLES DE VENTA', detailsX, metaY);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('METODO DE PAGO', detailsX, metaY + 10);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(sale.payment_method).toUpperCase(), detailsX, metaY + 15);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.text('ESTADO', detailsX, metaY + 23);
    const isPaid = sale.is_paid;
    doc.setTextColor(isPaid ? 0 : 180, isPaid ? 120 : 0, 0);
    doc.text(isPaid ? 'PAGADO' : 'PENDIENTE', detailsX, metaY + 28);

    // --- Items Table ---
    const tableColumn = ["CANT", "DESCRIPCIÓN DEL PRODUCTO", "UNITARIO", "SUBTOTAL"];
    const tableRows = items.map(item => [
        item.quantity,
        item.name.toUpperCase(),
        `L. ${Number(item.price).toLocaleString()}`,
        `L. ${(Number(item.price) * item.quantity).toLocaleString()}`
    ]);

    autoTable(doc, {
        startY: 110,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 5
        },
        styles: {
            fontSize: 9,
            cellPadding: 4,
            font: 'helvetica'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'right', cellWidth: 35 },
            3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [252, 252, 252]
        }
    });

    // --- Summary Section ---
    const finalY = doc.lastAutoTable.finalY + 15;
    const summaryX = 130;

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMA NETO:', summaryX, finalY);
    doc.setFont('helvetica', 'normal');
    doc.text(`L. ${(sale.total + (sale.discount || 0)).toLocaleString()}`, 190, finalY, { align: 'right' });

    if (sale.discount > 0) {
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2], 0.6);
        doc.setFont('helvetica', 'bold');
        doc.text('INCENTIVO APLICADO:', summaryX, finalY + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`- L. ${Number(sale.discount).toLocaleString()}`, 190, finalY + 7, { align: 'right' });
    }

    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.5);
    doc.line(summaryX, finalY + 12, 190, finalY + 12);

    // Clean Sans Serif TOTAL
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL A PAGAR', summaryX, finalY + 22);

    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(`L. ${Number(sale.total).toLocaleString()}`, 190, finalY + 35, { align: 'right' });

    // --- Footer ---
    const footerY = 280;
    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text('Gracias por elegir la distinción de Luxessence. Este documento sirve como comprobante comercial de su adquisición.', 105, footerY, { align: 'center' });

    if (shouldDownload) {
        const suffix = isAdmin ? 'CONTROL' : 'CLIENTE';
        doc.save(`Luxessence_Factura_${sale.id.slice(0, 8)}_${suffix}.pdf`);
    }

    return doc.output('blob');
};

export const shareInvoicePDF = async (data) => {
    try {
        const blob = generateInvoice(data, false, false);
        const fileName = `Factura_Luxessence_${data.sale.id.slice(0, 8)}.pdf`;
        const file = new File([blob], fileName, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Factura Luxessence',
                text: `Hola ${data.customer.first_name}, te adjunto tu comprobante de compra en Luxessence por L. ${data.sale.total}.`
            });
            return true;
        } else {
            const message = `Hola ${data.customer.first_name}, te adjunto tu factura de Luxessence por L. ${data.sale.total}. #LUX-${data.sale.id.slice(0, 8).toUpperCase()}`;
            window.open(`https://wa.me/${data.customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
            return false;
        }
    } catch (err) {
    }
};
