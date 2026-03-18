import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BarcodeScanner = ({ onScan, onClose }) => {
    const scannerRef = useRef(null);
    const [scanner, setScanner] = useState(null);
    const [isTorchOn, setIsTorchOn] = useState(false);
    const [cameraId, setCameraId] = useState(null);
    const [availableCameras, setAvailableCameras] = useState([]);
    const [zoom, setZoom] = useState(1);
    const [maxZoom, setMaxZoom] = useState(1);
    const [minZoom, setMinZoom] = useState(1);
    const [isZoomSupported, setIsZoomSupported] = useState(false);

    useEffect(() => {
        // Initialize cameras
        try {
            Html5Qrcode.getCameras().then(cameras => {
                if (cameras && cameras.length > 0) {
                    setAvailableCameras(cameras);
                    // Prefer back camera
                    const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera'));
                    setCameraId(backCamera ? backCamera.id : cameras[0].id);
                }
            }).catch(err => console.warn("Error getting cameras", err));
        } catch (e) {
            console.warn("Global camera initialization error", e);
        }

        const html5QrCode = new Html5Qrcode("reader");
        setScanner(html5QrCode);

        return () => {
            if (html5QrCode.isScanning) {
                html5QrCode.stop().then(() => {
                    html5QrCode.clear();
                }).catch(err => console.warn("Error stopping scanner on unmount", err));
            } else {
                try { html5QrCode.clear(); } catch(e) {}
            }
        };
    }, []);

    useEffect(() => {
        if (scanner && cameraId) {
            startScanning();
        }
    }, [scanner, cameraId]);

    const startScanning = async () => {
        if (!scanner || !cameraId) return;
        
        try {
            if (scanner.isScanning) {
                await scanner.stop();
            }

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                showTorchButtonIfSupported: false // We handle it manually
            };

            await scanner.start(
                cameraId,
                config,
                (decodedText) => {
                    onScan(decodedText);
                    stopAndClose();
                },
                (errorMessage) => {
                    // Ignore transient errors
                }
            );

            // Check for zoom capabilities after start
            try {
                const track = scanner.getRunningTrack();
                if (track) {
                    const capabilities = track.getCapabilities();
                    if (capabilities.zoom) {
                        setIsZoomSupported(true);
                        setMinZoom(capabilities.zoom.min || 1);
                        setMaxZoom(capabilities.zoom.max || 1);
                        setZoom(track.getSettings().zoom || 1);
                    } else {
                        setIsZoomSupported(false);
                    }
                }
            } catch (e) {
                console.warn("Zoom not supported on this track", e);
            }
        } catch (err) {
            console.warn("Scanner start error (usually camera busy or permission denied):", err);
        }
    };

    const stopAndClose = async () => {
        if (scanner && scanner.isScanning) {
            await scanner.stop();
            scanner.clear();
        }
        onClose();
    };

    const toggleTorch = async () => {
        if (scanner && scanner.isScanning) {
            const currentIsTorchOn = !isTorchOn;
            scanner.applyVideoConstraints({
                advanced: [{ torch: currentIsTorchOn }]
            }).then(() => {
                setIsTorchOn(currentIsTorchOn);
            }).catch(e => {
                // Silently ignore if torch is not supported
            });
        }
    };

    const switchCamera = () => {
        const currentIndex = availableCameras.findIndex(c => c.id === cameraId);
        const nextIndex = (currentIndex + 1) % availableCameras.length;
        setCameraId(availableCameras[nextIndex].id);
        setIsZoomSupported(false); // Reset for new camera
    };

    const handleZoomChange = (e) => {
        const value = parseFloat(e.target.value);
        if (scanner && scanner.isScanning) {
            scanner.applyVideoConstraints({
                advanced: [{ zoom: value }]
            }).then(() => {
                setZoom(value);
            }).catch(e => {
                console.warn("Error applying zoom", e);
            });
        }
    };

    const handleTapToFocus = async (e) => {
        if (!scanner || !scanner.isScanning) return;
        
        try {
            const track = scanner.getRunningTrack();
            if (!track) return;

            const capabilities = track.getCapabilities();
            if (capabilities.focusMode && capabilities.focusMode.includes('manual')) {
                // Try to focus at the center or near the tap point if possible
                // Note: Web focuses are often limited, but setting manual might help
                await track.applyConstraints({
                    advanced: [{ focusMode: 'manual' }]
                });
                // Return to continuous after a delay
                setTimeout(() => {
                    track.applyConstraints({
                        advanced: [{ focusMode: 'continuous' }]
                    }).catch(() => {});
                }, 2000);
            }
        } catch (err) {
            console.warn("Tap to focus not supported:", err);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black flex flex-col pt-safe pb-safe"
        >
            {/* Header */}
            <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-serif font-black italic text-xl">Lector LuxOS</h2>
                        <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Escaneando código de barras</p>
                    </div>
                </div>
                <button onClick={stopAndClose} className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Container */}
            <div className="flex-1 relative flex items-center justify-center p-4">
                <div 
                    id="reader" 
                    onClick={handleTapToFocus}
                    className="w-full max-w-sm rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-[0_0_50px_rgba(255,255,255,0.1)] cursor-crosshair"
                ></div>
                
                {/* Custom Overlay */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
                    <div className="w-[280px] h-[180px] border-2 border-gold/50 rounded-3xl relative">
                        <div className="absolute inset-0 bg-gold/5 animate-pulse rounded-3xl" />
                        
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-gold rounded-tl-xl" />
                        <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-gold rounded-tr-xl" />
                        <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-gold rounded-bl-xl" />
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-gold rounded-br-xl" />
                        
                        {/* Scanning Line */}
                        <motion.div 
                            animate={{ top: ['10%', '90%'] }} 
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-4 right-4 h-0.5 bg-gold shadow-[0_0_10px_#D4AF37]" 
                        />
                    </div>
                    <p className="mt-8 text-white/60 text-[10px] font-black uppercase tracking-[0.3em] bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">Alinea el código en el recuadro</p>
                </div>
            </div>

            {/* Controls */}
            <div className="p-10 flex flex-col items-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
                {/* Zoom Control */}
                {isZoomSupported && (
                    <div className="w-full max-w-xs flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Zoom</span>
                        <input 
                            type="range"
                            min={minZoom}
                            max={maxZoom}
                            step="0.1"
                            value={zoom}
                            onChange={handleZoomChange}
                            className="flex-1 accent-gold h-1.5 rounded-full appearance-none bg-white/10"
                        />
                        <span className="text-[10px] font-black text-gold uppercase tracking-widest w-8">{zoom.toFixed(1)}x</span>
                    </div>
                )}

                <div className="flex justify-center gap-6">
                    <button 
                        onClick={toggleTorch}
                        className={`p-6 rounded-[2rem] transition-all border ${isTorchOn ? 'bg-gold border-gold text-primary' : 'bg-white/5 border-white/10 text-white'}`}
                    >
                        <Zap className={`w-8 h-8 ${isTorchOn ? 'fill-primary' : ''}`} />
                    </button>
                    
                    {availableCameras.length > 1 && (
                        <button 
                            onClick={switchCamera}
                            className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-white hover:bg-white/10 transition-all"
                        >
                            <RefreshCw className="w-8 h-8" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default BarcodeScanner;
