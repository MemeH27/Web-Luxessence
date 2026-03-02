/**
 * Security Constants
 * 
 * CRITICAL: These constants are used for authorization and security verification.
 * The admin email is hardcoded to ensure only one specific user has admin privileges.
 */

// Admin email - ONLY this email has admin privileges in the entire system
// This is used for authorization at all layers (frontend, backend/database)
export const ADMIN_EMAIL = 'luxessence504@gmail.com';

// Session timeout in milliseconds (30 minutes)
export const SESSION_TIMEOUT = 30 * 60 * 1000;

// Session warning threshold in milliseconds (5 minutes before expiry)
export const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000;

// Login security constants
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
