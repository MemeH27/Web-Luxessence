export const APP_VERSION = '2.0.0';

// Tipos de cambio para el modal de actualización:
// 'new'     → nueva funcionalidad para el usuario
// 'fix'     → corrección de error visible para el usuario
// 'improve' → mejora de experiencia/diseño
// 'system'  → cambio interno/admin (se muestra solo como "Mejora de estabilidad")
export const UPDATE_CHANGELOG = [
    { type: 'improve', text: 'Mejoras generales en la interfaz y experiencia de la web' },
    { type: 'fix', text: 'Corrección de errores y optimización de rendimiento' },
];
