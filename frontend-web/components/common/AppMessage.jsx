'use client';

import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'react-toastify';

const variants = {
    info: {
        role: 'status',
        Icon: Info,
        style: 'border-blue-300 bg-blue-50 text-blue-950 dark:border-blue-600/80 dark:bg-blue-950/75 dark:text-blue-50',
    },
    warning: {
        role: 'alert',
        Icon: AlertTriangle,
        style: 'border-red-200 bg-red-50 text-red-900 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-100',
    },
    success: {
        role: 'status',
        Icon: CheckCircle2,
        style: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-100',
    },
};

export default function AppMessage({ variant = 'info', children, className = '', compact = false, role }) {
    const messageVariant = variants[variant] || variants.info;
    const { Icon } = messageVariant;

    return (
        <div
            role={role || messageVariant.role}
            aria-live={messageVariant.role === 'alert' ? 'assertive' : 'polite'}
            className={`flex items-center gap-3 rounded-xl border ${compact ? 'min-h-12 w-full px-4 py-2.5 text-sm' : 'px-4 py-3 text-sm'} font-semibold shadow-sm ${messageVariant.style} ${className}`}
        >
            <Icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}

function createToast(variant, message, options = {}) {
    if (typeof message !== 'string' && typeof message !== 'number') {
        return toast[variant === 'warning' ? 'error' : variant](message, options);
    }

    const { className, bodyClassName, icon, theme, ...toastOptions } = options;
    return toast[variant === 'warning' ? 'error' : variant](
        <AppMessage variant={variant} compact>
            {message}
        </AppMessage>,
        {
            ...toastOptions,
            theme: theme || 'dark',
            icon: icon ?? false,
            className: `${className || ''} !w-[min(22rem,calc(100vw-2rem))] !overflow-hidden !rounded-2xl !bg-transparent !p-0 !shadow-none`,
            bodyClassName: `${bodyClassName || ''} !m-0 !w-full !min-w-0 !p-0`,
        }
    );
}

export const appToast = {
    info: (message, options) => createToast('info', message, options),
    warning: (message, options) => createToast('warning', message, options),
    error: (message, options) => createToast('warning', message, options),
    success: (message, options = {}) => toast.success(message, options),
};
