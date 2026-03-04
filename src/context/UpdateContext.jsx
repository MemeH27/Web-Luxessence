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
            console.log('No registration found');
            return;
        }

        setIsChecking(true);
        setLastCheckResult('none');
        setIsDismissed(false); // Reset dismissal to allow prompt to show if update found

        try {
            // Re-trigger service worker update check
            await registration.update();

            // Wait a bit to see if updateAvailable is triggered via SW events
            setTimeout(() => {
                // If updateAvailable is still false, then we are on latest or check didn't find anything
                setUpdateAvailable(prev => {
                    if (prev) {
                        setLastCheckResult('update-found');
                    } else {
                        setLastCheckResult('up-to-date');
                        // Auto-clear message after 5 seconds
                        setTimeout(() => {
                            setLastCheckResult('none');
                        }, 5000);
                    }
                    return prev;
                });
                setIsChecking(false);
            }, 2500);
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
