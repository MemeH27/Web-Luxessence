import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

// Helper: base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export const usePushNotifications = () => {
    const { addToast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    // ⚠️ REEMPLAZA ESTA CADENA POR TU LLAVE PÚBLICA (USANDO npx web-push generate-vapid-keys)
    const PUBLIC_VAPID_KEY = 'BAgx6hSpq2Yd0gB4-rgjCnBCVa7jY-B38MtjDbmH8sopk8bxjXay-XjNVLKuLsYcB39sIJqMhki8xk7oZoJCEZE'; 

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }
        checkSubscriptionStatus();
    }, []);

    const checkSubscriptionStatus = async () => {
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (e) {
            console.error('Error checking push status:', e);
        }
    };

    const subscribe = async () => {
        // Validación para evitar el error de atob
        if (PUBLIC_VAPID_KEY === 'TU_LLAVE_PUBLICA_AQUI' || !PUBLIC_VAPID_KEY) {
            addToast('Error: Debes configurar tu LLAVE VAPID PÚBLICA en usePushNotifications.js antes de activar.', 'error');
            return;
        }

        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                throw new Error('Permiso de notificaciones denegado. Actívalo en la configuración de tu navegador.');
            }

            const registration = await navigator.serviceWorker.ready;

            // PREVENT InvalidAccessError by clearing old invalid subscriptions first
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                await existingSubscription.unsubscribe();
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Debes estar logueado para activar las alertas.');

            // Guardar en Supabase (Usando la tabla unificada)
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    subscription_json: subscription.toJSON(),
                    user_agent: navigator.userAgent
                }, { onConflict: 'user_id, user_agent' });

            if (error) throw error;

            setIsSubscribed(true);
            addToast('¡Actualizaciones activadas! 🎉 Recibirás promociones antes que nadie.', 'success');

            // 🧪 ENVIAR NOTIFICACIÓN DE PRUEBA AL ACTIVAR (Directamente a esta suscripción)
            await supabase.functions.invoke('notify-admins', {
                body: {
                    title: '¡Notificaciones activadas! 🎉',
                    body: 'Las notificaciones push se activaron correctamente en este dispositivo.',
                    url: '/',
                    subscription: subscription.toJSON() // Enviar directamente a esta suscripción
                }
            }).catch(console.error);
        } catch (error) {
            console.error('Subscription error:', error);
            addToast(error.name === 'InvalidCharacterError' ? 'La llave VAPID configurada no es válida (Base64).' : error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('push_subscriptions')
                        .delete()
                        .match({ user_id: user.id, user_agent: navigator.userAgent });
                }
            }
            
            setIsSubscribed(false);
            addToast('Alertas desactivadas correctamente.', 'info');
        } catch (error) {
            console.error('Unsubscription error:', error);
            addToast('Error al desactivar las notificaciones.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, subscribe, unsubscribe, loading };
};
