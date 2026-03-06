export const APP_VERSION = '1.1.0';

// Tipos de cambio para el modal de actualización:
// 'new'     → nueva funcionalidad para el usuario
// 'fix'     → corrección de error visible para el usuario
// 'improve' → mejora de experiencia/diseño
// 'system'  → cambio interno/admin (se muestra solo como "Mejora de estabilidad")
export const UPDATE_CHANGELOG = [
    { type: 'improve', text: 'Nueva experiencia de selección de fragancias con deslizador horizontal' },
    { type: 'improve', text: 'Contador de cantidad simplificado con vista de disponibilidad al instante' },
    { type: 'new', text: 'Comparte el enlace de tus productos favoritos con un mensaje personalizado' },
    { type: 'improve', text: 'Mejoras en el margen inferior del catálogo para navegación más limpia' },
    { type: 'system', text: '' },
];
