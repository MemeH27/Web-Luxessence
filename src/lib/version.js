export const APP_VERSION = '2.1.0';

// Tipos de cambio para el modal de actualización:
// 'new'     → nueva funcionalidad para el usuario
// 'fix'     → corrección de error visible para el usuario
// 'improve' → mejora de experiencia/diseño
// 'system'  → cambio interno/admin (se muestra solo como "Mejora de estabilidad")
export const UPDATE_CHANGELOG = [
    { type: 'new', text: 'Sistema de regalos exclusivos en compras' },
    { type: 'new', text: 'Notificaciones inteligentes automatizadas' },
    { type: 'improve', text: 'Optimización de carga en el catálogo móvil' },
    { type: 'fix', text: 'Mejoras en la estabilidad de las notificaciones push' },
];

