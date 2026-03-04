import { createContext, useContext, useState, useEffect } from 'react';

const UpdateContext = createContext();

export const UpdateProvider = ({ children }) => {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Si hay una actualización y no ha sido descartada, mostramos el modal
    useEffect(() => {
        if (updateAvailable && !isDismissed) {
            setShowModal(true);
        }
    }, [updateAvailable, isDismissed]);

    return (
        <UpdateContext.Provider value={{
            updateAvailable,
            setUpdateAvailable,
            isDismissed,
            setIsDismissed,
            showModal,
            setShowModal
        }}>
            {children}
        </UpdateContext.Provider>
    );
};

export const useUpdate = () => useContext(UpdateContext);
