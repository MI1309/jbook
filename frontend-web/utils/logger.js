/**
 * Logger Utility for JBook Frontend
 * 
 * Provides a standardized way to log messages across the application.
 * Automatically silences debug and info logs in production to avoid leaking sensitive data
 * and cluttering the browser console.
 */

const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
    /**
     * Log debug information. Use for development troubleshooting.
     * @param {string} message - The message to log
     * @param {any} [data] - Optional data to attach
     */
    debug: (message, data = '') => {
        if (!isProduction) {
            console.debug(`[JBook:DEBUG] ${message}`, data);
        }
    },

    /**
     * Log general information. Use for tracking normal application flow.
     * @param {string} message - The message to log
     * @param {any} [data] - Optional data to attach
     */
    info: (message, data = '') => {
        if (!isProduction) {
            console.info(`[JBook:INFO] %c${message}`, 'color: #2563eb; font-weight: bold;', data);
        }
    },

    /**
     * Log warnings. Use for recoverable errors or unexpected states.
     * @param {string} message - The message to log
     * @param {any} [data] - Optional data to attach
     */
    warn: (message, data = '') => {
        console.warn(`[JBook:WARN] %c${message}`, 'color: #d97706; font-weight: bold;', data);
    },

    /**
     * Log errors. Use for critical failures or unrecoverable states.
     * These are preserved in production and could be hooked into an error reporting service.
     * @param {string} message - The message to log
     * @param {Error|any} [error] - The error object or data
     */
    error: (message, error = '') => {
        console.error(`[JBook:ERROR] %c${message}`, 'color: #dc2626; font-weight: bold;', error);
        
        // TODO: In the future, this can be integrated with Sentry or an API endpoint
        // if (isProduction && error) {
        //    sendToBackendOrSentry(message, error);
        // }
    }
};

export default logger;
