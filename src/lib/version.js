export const APP_VERSION = '1.0.12';

// Tipos de cambio para el modal de actualización:
// 'new'     → nueva funcionalidad para el usuario
// 'fix'     → corrección de error visible para el usuario
// 'improve' → mejora de experiencia/diseño
// 'system'  → cambio interno/admin (se muestra solo como "Mejora de estabilidad")
export const UPDATE_CHANGELOG = [
    { type: 'new', text: 'Botón de acceso al Panel de Administración en la barra superior (solo admin)' },
    { type: 'fix', text: 'El ícono de perfil siempre dirige a Mi Perfil, incluso como administrador' },
    { type: 'improve', text: 'Notificación de actualización rediseñada con efecto Liquid Glass' },
    { type: 'fix', text: 'El nav inferior ahora cambia de color al llegar al pie de página en Mi Perfil' },
    { type: 'system', text: '' },
];
