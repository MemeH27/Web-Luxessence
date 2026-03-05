import { createContext, useContext, useState, useEffect } from 'react';

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [registration, setRegistration] = useState(null);
    const [isChecking, setIsChecking] = useState(false);
    const [lastCheckResult, setLastCheckResult] = useState('none'); // 'none', 'up-to-date', 'update-found'

    // Si hay una actualización y no ha sido descartada, mostramos el modal
    useEffect(() => {
        if (updateAvailable && !isDismissed) {
            setShowModal(true);
        }
    }, [updateAvailable, isDismissed]);

    const checkForUpdate = async () => {
        if (!registration) {
            // No SW registration – likely Safari/iPad or non-PWA browser.
            setIsChecking(true);
            setLastCheckResult('none');
            setTimeout(() => {
                setIsChecking(false);
                setLastCheckResult('up-to-date');
                setTimeout(() => setLastCheckResult('none'), 5000);
            }, 1000);
            return;
        }

        if (updateAvailable) {
            setIsDismissed(false);
            setShowModal(true);
            setLastCheckResult('update-found');
            return;
        }

        setIsChecking(true);
        setLastCheckResult('none');
        setIsDismissed(false); // Reset dismissal to allow prompt to show if update found

        try {
            // Re-trigger service worker update check
            await registration.update();

            // Check immediately if an update was found and is installing
            if (registration.installing || registration.waiting) {
                setUpdateAvailable(true);
                setLastCheckResult('update-found');
                setIsDismissed(false);
                setShowModal(true);
                setIsChecking(false);
                return;
            }

            // Wait a bit to see if updateAvailable is triggered via SW events
            setTimeout(() => {
                setUpdateAvailable(prev => {
                    if (prev || registration.installing || registration.waiting) {
                        setLastCheckResult('update-found');
                        setIsDismissed(false);
                        setShowModal(true);
                        return true;
                    } else {
                        setLastCheckResult('up-to-date');
                        // Auto-clear message after 5 seconds
                        setTimeout(() => {
                            setLastCheckResult('none');
                        }, 5000);
                        return prev;
                    }
                });
                setIsChecking(false);
            }, 5000);
        } catch (error) {
            console.error('Error checking for update:', error);
            setIsChecking(false);
        }
    };

    return (
        <UpdateContext.Provider value={{
            updateAvailable,
            setUpdateAvailable,
            isDismissed,
            setIsDismissed,
            showModal,
            setShowModal,
            registration,
            setRegistration,
            isChecking,
            checkForUpdate,
            lastCheckResult,
            setLastCheckResult
        }}>
            {children}
        </UpdateContext.Provider>
    );
};

export const useUpdate = () => useContext(UpdateContext);
