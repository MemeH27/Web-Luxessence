/**
 * Error logging utility for tracking and debugging errors
 * Can be extended to send errors to external services like Sentry
 */

const ERROR_STORAGE_KEY = 'lux_errors_log';
const MAX_ERRORS_STORED = 50;

/**
 * Log an error with context
 * @param {string} context - Where the error occurred (component/function name)
 * @param {Error|string} error - The error object or message
 * @param {object} metadata - Additional context data
 */
export const logError = (context, error, metadata = {}) => {
    const errorEntry = {
        id: generateErrorId(),
        timestamp: new Date().toISOString(),
        context,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        metadata,
        userAgent: navigator?.userAgent || 'unknown',
        url: window?.location?.href || 'unknown'
    };

    // Store locally
    try {
        const existingErrors = JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || '[]');
        existingErrors.unshift(errorEntry);

        // Keep only last MAX_ERRORS_STORED errors
        const trimmedErrors = existingErrors.slice(0, MAX_ERRORS_STORED);
        localStorage.setItem(ERROR_STORAGE_KEY, JSON.stringify(trimmedErrors));
    } catch (err) {
        console.warn('Failed to store error log:', err);
    }

    // Console output with formatting
    console.error(
        `%c[Luxessence Error]%c ${context}`,
        'color: #ff4444; font-weight: bold',
        'color: inherit',
        error instanceof Error ? error : errorEntry.message,
        metadata
    );

    // In production, you would send to error tracking service here
    // if (import.meta.env.PROD) {
    //     sendToSentry(errorEntry);
    // }

    return errorEntry;
};

/**
 * Log a warning
 */
export const logWarning = (context, message, metadata = {}) => {
    console.warn(
        `%c[Luxessence Warning]%c ${context}`,
        'color: #ffaa00; font-weight: bold',
        'color: inherit',
        message,
        metadata
    );
};

/**
 * Log info/debug messages
 */
export const logInfo = (context, message, metadata = {}) => {
    if (import.meta.env.DEV) {
        console.log(
            `%c[Luxessence Info]%c ${context}`,
            'color: #4488ff; font-weight: bold',
            'color: inherit',
            message,
            metadata
        );
    }
};

/**
 * Get all stored errors
 */
export const getStoredErrors = () => {
    try {
        return JSON.parse(localStorage.getItem(ERROR_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
};

/**
 * Clear stored errors
 */
export const clearStoredErrors = () => {
    localStorage.removeItem(ERROR_STORAGE_KEY);
};

/**
 * Generate unique error ID
 */
const generateErrorId = () => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Supabase error handler with user-friendly messages
 */
export const handleSupabaseError = (error, fallbackMessage = 'Error de conexión') => {
    let userMessage = fallbackMessage;

    if (error?.message) {
        if (error.message.includes('network')) {
            userMessage = 'Sin conexión a internet. Verifique su red.';
        } else if (error.message.includes('timeout')) {
            userMessage = 'La solicitud tardó demasiado. Intente de nuevo.';
        } else if (error.message.includes('row-level security')) {
            userMessage = 'No tiene permisos para realizar esta acción.';
        } else if (error.code === '23505') { // Unique violation
            userMessage = 'Este registro ya existe.';
        } else if (error.code === '23503') { // Foreign key violation
            userMessage = 'No se puede modificar: relacionado con otros datos.';
        }
    }

    logError('Supabase', error, { userMessage });

    return userMessage;
};

/**
 * React error boundary helper
 */
export const createErrorHandler = (componentName) => (error, errorInfo) => {
    logError(`React.${componentName}`, error, {
        componentStack: errorInfo?.componentStack,
        boundary: componentName
    });
};

export default {
    logError,
    logWarning,
    logInfo,
    getStoredErrors,
    clearStoredErrors,
    handleSupabaseError,
    createErrorHandler
};
