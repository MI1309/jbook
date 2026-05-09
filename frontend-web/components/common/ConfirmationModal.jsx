'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Ya, Keluar', cancelText = 'Batal', type = 'danger' }) {
    const { theme } = useTheme();

    if (!isOpen) return null;

    const isDark = theme === 'dark';

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={onClose}
            />
            
            {/* Modal Card */}
            <div className={`relative w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden transform animate-in zoom-in duration-300 ${
                isDark ? 'bg-neutral-900 border border-white/10' : 'bg-white border border-gray-100'
            }`}>
                <div className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg ${
                        type === 'danger' ? 'bg-red-600 shadow-red-500/20' : 'bg-amber-500 shadow-amber-500/20'
                    }`}>
                        <span className="text-3xl">
                            {type === 'danger' ? '⚠️' : '❓'}
                        </span>
                    </div>
                    
                    <h3 className={`text-2xl font-black mb-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </h3>
                    <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-neutral-500' : 'text-gray-500'}`}>
                        {message}
                    </p>
                </div>

                <div className="p-8 pt-0 grid grid-cols-2 gap-3">
                    <button
                        onClick={onClose}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                            isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-xl ${
                            type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
