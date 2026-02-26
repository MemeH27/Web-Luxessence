import * as htmlToImage from 'html-to-image';

/**
 * Capture an element as PNG using html-to-image
 * Resolve the oklch/oklab crash once and for all by using the browser's own 
 * renderer instead of a custom CSS parser.
 */
const captureToPNG = async (element) => {
    if (!element) throw new Error("Element not found");

    // Wait for everything to settle
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        // Get the container width to ensure consistent letter-size output
        const containerWidth = element.offsetWidth || 816;

        // html-to-image is much more reliable for Tailwind 4
        // We use toPng which creates an image using a hidden SVG foreignObject
        const dataUrl = await htmlToImage.toPng(element, {
            quality: 1.0,
            pixelRatio: 2,
            backgroundColor: '#ffffff',
            width: containerWidth, // Force consistent width
            style: {
                transform: 'scale(1)',
                transformOrigin: 'top left'
            },
            cacheBust: true,
            // Ensure fonts are included if possible
            fontEmbedCSS: '',
        });

        return {
            toDataURL: () => dataUrl,
            toBlob: (callback) => {
                fetch(dataUrl)
                    .then(res => res.blob())
                    .then(callback);
            }
        };
    } catch (error) {
        // Fallback for oklab/oklch error in case some parser still trips
        console.warn("Attempting capture fallback...", error);

        // If it still fails, it's likely something very specific.
        // But html-to-image doesn't parse CSS manually, so it shouldn't fail with oklab.
        throw error;
    }
};

/**
 * Downloads the invoice as PNG
 */
export const downloadInvoicePNG = async (element, data) => {
    if (!element) return false;
    try {
        const result = await captureToPNG(element);
        const id = (data?.id || data?.sale?.id || 'lux').slice(0, 8).toUpperCase();
        const link = document.createElement('a');
        link.download = `Factura_Luxessence_${id}.png`;
        link.href = result.toDataURL();
        link.click();
        return true;
    } catch (err) {
        console.error("Download PNG failed:", err);
        return false;
    }
};

/**
 * Shares the invoice as PNG
 */
export const shareInvoicePNG = async (element, data) => {
    if (!element) return false;
    try {
        const result = await captureToPNG(element);
        const id = (data?.id || data?.sale?.id || 'lux').slice(0, 8).toUpperCase();

        const sale = data?.sale || data;
        const customer = data?.customer || data?.customers;
        const phone = customer?.phone || '';
        const total = (sale?.total || 0).toLocaleString();

        result.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `Factura_Luxessence_${id}.png`, { type: 'image/png' });

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Factura Luxessence',
                        text: `Tu comprobante de Luxessence por L. ${total}`
                    });
                } catch (shareErr) {
                    const msg = `Hola! Aquí tienes tu factura de Luxessence por L. ${total}. #LUX-${id}`;
                    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                }
            } else {
                const msg = `Hola! Aquí tienes tu factura de Luxessence por L. ${total}. #LUX-${id}`;
                window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
            }
        });
        return true;
    } catch (err) {
        console.error("Share PNG failed:", err);
        return false;
    }
};
