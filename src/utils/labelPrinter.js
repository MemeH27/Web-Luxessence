import { jsPDF } from 'jspdf';

// Helper to convert logo image to base64 so jsPDF can embed it
const getLogoBase64 = () => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw background or logo as is. Since we want an ocre-tinted logo:
            // We can draw the logo-blanco image and then apply color tinting if needed,
            // or just render it cleanly. Let's tint it using Canvas compositing:
            ctx.drawImage(img, 0, 0);
            ctx.globalCompositeOperation = 'source-in';
            ctx.fillStyle = '#711116'; // Luxessence primary ocre/red color
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => {
            resolve(null); // Fallback to text branding if image fails to load
        };
        img.src = '/img/logo-blanco.png';
    });
};

// Helper to convert custom units to millimeters
const convertToMm = (val, unit) => {
    const num = Number(val) || 0;
    if (unit === 'cm') return num * 10;
    if (unit === 'in') return num * 25.4;
    return num; // 'mm'
};

/**
 * Generates a clean luxury-styled product label PDF.
 * Perfect for 58mm / 80mm / thermal or Bluetooth label printers.
 * Returns { doc, blobUrl, dataUri } so components can show a preview and print.
 */
export const generateProductLabel = async (product, customWidth = 58, customHeight = 40, unit = 'mm') => {
    const w = convertToMm(customWidth, unit) || 58;
    const h = convertToMm(customHeight, unit) || 40;

    const doc = new jsPDF({
        orientation: w > h ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [w, h]
    });

    const primaryColor = '#711116'; // Luxessence primary red
    const blackColor = '#1A1A1A';

    const margin = Math.min(w, h) * 0.04;
    const borderW = w - margin * 2;
    const borderH = h - margin * 2;

    // 1. Draw elegant border
    doc.setDrawColor(113, 17, 22);
    doc.setLineWidth(Math.min(w, h) * 0.01);
    doc.rect(margin, margin, borderW, borderH);

    const centerX = w / 2;

    // 2. Logo / Header Branding
    const logoData = await getLogoBase64();
    const logoW = w * 0.35;
    const logoH = logoW * 0.25;
    const logoY = h * 0.075;
    
    if (logoData) {
        doc.addImage(logoData, 'PNG', (w - logoW) / 2, logoY, logoW, logoH);
    } else {
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(Math.min(w, h) * 0.18);
        doc.setTextColor(primaryColor);
        doc.text('L U X E S S E N C E', centerX, logoY + logoH, { align: 'center' });
    }
    
    doc.setDrawColor(212, 175, 55); // Gold line separator
    doc.setLineWidth(Math.min(w, h) * 0.007);
    doc.line(w * 0.14, h * 0.225, w * 0.86, h * 0.225);

    // 3. Category
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(Math.min(w, h) * 0.13);
    doc.setTextColor(120, 120, 120);
    const categoryName = product.categories?.name || 'Fragancia';
    doc.text(categoryName.toUpperCase(), centerX, h * 0.31, { align: 'center' });

    // 4. Product Name (Wrapped if long)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(Math.min(w, h) * 0.18);
    doc.setTextColor(blackColor);
    const splitName = doc.splitTextToSize(product.name, w - margin * 4);
    doc.text(splitName, centerX, h * 0.42, { align: 'center' });

    // 5. Price (Enlarged)
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(Math.min(w, h) * 0.38);
    doc.setTextColor(primaryColor);
    const formattedPrice = `L. ${Number(product.price).toLocaleString()}`;
    doc.text(formattedPrice, centerX, h * 0.70, { align: 'center' });

    // 6. SKU / Barcode text at the bottom
    if (product.sku) {
        doc.setFont('Courier', 'bold');
        doc.setFontSize(Math.min(w, h) * 0.15);
        doc.setTextColor(blackColor);
        doc.text(`*${product.sku}*`, centerX, h * 0.84, { align: 'center' });
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(Math.min(w, h) * 0.12);
        doc.setTextColor(150, 150, 150);
        doc.text(product.sku, centerX, h * 0.91, { align: 'center' });
    } else {
        doc.setFont('Helvetica', 'italic');
        doc.setFontSize(Math.min(w, h) * 0.12);
        doc.setTextColor(150, 150, 150);
        doc.text('Luxessence Premium Quality', centerX, h * 0.86, { align: 'center' });
    }

    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const dataUri = doc.output('datauristring');

    return { doc, blobUrl, dataUri };
};

/**
 * Generates a single PDF document containing labels for all products.
 */
export const generateAllProductLabels = async (products, layoutType = 'thermal', customWidth = 58, customHeight = 40, unit = 'mm') => {
    if (!products || products.length === 0) return null;

    if (layoutType === 'thermal') {
        const w = convertToMm(customWidth, unit) || 58;
        const h = convertToMm(customHeight, unit) || 40;

        const doc = new jsPDF({
            orientation: w > h ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [w, h]
        });

        const primaryColor = '#711116';
        const blackColor = '#1A1A1A';
        const logoData = await getLogoBase64();

        const margin = Math.min(w, h) * 0.04;
        const borderW = w - margin * 2;
        const borderH = h - margin * 2;
        const centerX = w / 2;
        const logoW = w * 0.35;
        const logoH = logoW * 0.25;
        const logoY = h * 0.075;

        for (let idx = 0; idx < products.length; idx++) {
            const product = products[idx];
            
            if (idx > 0) {
                doc.addPage([w, h], w > h ? 'landscape' : 'portrait');
            }

            // Draw elegant border
            doc.setDrawColor(113, 17, 22);
            doc.setLineWidth(Math.min(w, h) * 0.01);
            doc.rect(margin, margin, borderW, borderH);

            // Logo
            if (logoData) {
                doc.addImage(logoData, 'PNG', (w - logoW) / 2, logoY, logoW, logoH);
            } else {
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(Math.min(w, h) * 0.18);
                doc.setTextColor(primaryColor);
                doc.text('L U X E S S E N C E', centerX, logoY + logoH, { align: 'center' });
            }
            
            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(Math.min(w, h) * 0.007);
            doc.line(w * 0.14, h * 0.225, w * 0.86, h * 0.225);

            // Category
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(Math.min(w, h) * 0.13);
            doc.setTextColor(120, 120, 120);
            const categoryName = product.categories?.name || 'Fragancia';
            doc.text(categoryName.toUpperCase(), centerX, h * 0.31, { align: 'center' });

            // Product Name
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(Math.min(w, h) * 0.18);
            doc.setTextColor(blackColor);
            const splitName = doc.splitTextToSize(product.name, w - margin * 4);
            doc.text(splitName, centerX, h * 0.42, { align: 'center' });

            // Price
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(Math.min(w, h) * 0.38);
            doc.setTextColor(primaryColor);
            const formattedPrice = `L. ${Number(product.price).toLocaleString()}`;
            doc.text(formattedPrice, centerX, h * 0.70, { align: 'center' });

            // SKU
            if (product.sku) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(Math.min(w, h) * 0.15);
                doc.setTextColor(blackColor);
                doc.text(`*${product.sku}*`, centerX, h * 0.84, { align: 'center' });
                
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(Math.min(w, h) * 0.12);
                doc.setTextColor(150, 150, 150);
                doc.text(product.sku, centerX, h * 0.91, { align: 'center' });
            } else {
                doc.setFont('Helvetica', 'italic');
                doc.setFontSize(Math.min(w, h) * 0.12);
                doc.setTextColor(150, 150, 150);
                doc.text('Luxessence Premium Quality', centerX, h * 0.86, { align: 'center' });
            }
        }

        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        return { doc, blobUrl };
    } else {
        // Grid / Planilla Layout (A4 size page, multiple labels per page)
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const primaryColor = '#711116';
        const blackColor = '#1A1A1A';
        const logoData = await getLogoBase64();

        // A4: 210 x 297 mm
        const labelW = 58;
        const labelH = 36;
        const gapX = 3;
        const gapY = 4;
        const marginX = 14;
        const marginY = 16;
        const cols = 3;
        const rows = 7;
        const labelsPerPage = cols * rows;

        for (let idx = 0; idx < products.length; idx++) {
            const product = products[idx];
            const pageIdx = idx % labelsPerPage;

            if (idx > 0 && pageIdx === 0) {
                doc.addPage();
            }

            const col = pageIdx % cols;
            const row = Math.floor(pageIdx / cols);

            const x = marginX + col * (labelW + gapX);
            const y = marginY + row * (labelH + gapY);

            // Draw border for this label
            doc.setDrawColor(113, 17, 22);
            doc.setLineWidth(0.3);
            doc.rect(x, y, labelW, labelH);
            
            // Outer accent border
            doc.setDrawColor(113, 17, 22);
            doc.setLineWidth(0.1);
            doc.rect(x + 1, y + 1, labelW - 2, labelH - 2);

            // Logo
            if (logoData) {
                doc.addImage(logoData, 'PNG', x + (labelW - 20) / 2, y + 2.5, 20, 5);
            } else {
                doc.setFont('Helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(primaryColor);
                doc.text('L U X E S S E N C E', x + labelW / 2, y + 5, { align: 'center' });
            }

            doc.setDrawColor(212, 175, 55);
            doc.setLineWidth(0.25);
            doc.line(x + 6, y + 8.5, x + labelW - 6, y + 8.5);

            // Category
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(5.5);
            doc.setTextColor(120, 120, 120);
            const categoryName = product.categories?.name || 'Fragancia';
            doc.text(categoryName.toUpperCase(), x + labelW / 2, y + 11.5, { align: 'center' });

            // Product Name
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(blackColor);
            const splitName = doc.splitTextToSize(product.name, labelW - 8);
            doc.text(splitName, x + labelW / 2, y + 15, { align: 'center' });

            // Price
            doc.setFont('Helvetica', 'bold');
            doc.setFontSize(13);
            doc.setTextColor(primaryColor);
            const formattedPrice = `L. ${Number(product.price).toLocaleString()}`;
            doc.text(formattedPrice, x + labelW / 2, y + 24.5, { align: 'center' });

            // SKU
            if (product.sku) {
                doc.setFont('Courier', 'bold');
                doc.setFontSize(6.5);
                doc.setTextColor(blackColor);
                doc.text(`*${product.sku}*`, x + labelW / 2, y + 29.5, { align: 'center' });
                
                doc.setFont('Helvetica', 'normal');
                doc.setFontSize(5);
                doc.setTextColor(150, 150, 150);
                doc.text(product.sku, x + labelW / 2, y + 32.5, { align: 'center' });
            } else {
                doc.setFont('Helvetica', 'italic');
                doc.setFontSize(5);
                doc.setTextColor(150, 150, 150);
                doc.text('Luxessence Premium Quality', x + labelW / 2, y + 31, { align: 'center' });
            }
        }

        const blob = doc.output('blob');
        const blobUrl = URL.createObjectURL(blob);
        return { doc, blobUrl };
    }
};

/**
 * Compliant printer trigger using URL.createObjectURL (Blob)
 * avoiding iframe cross-origin and data URI CSP blocks.
 */
export const printProductLabelBlob = (blobUrl) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.warn("Direct iframe print failed, falling back to opening new window:", e);
                const win = window.open(blobUrl, '_blank');
                if (win) win.focus();
            }
            
            // Clean up the iframe after a short delay
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 2000);
        }, 500);
    };
};
