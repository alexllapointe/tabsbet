import React, { useEffect } from 'react';

const ErrorPopup = ({ open, onClose, message }) => {
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                onClose();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed z-50 bottom-4 right-4 bg-red-50 dark:bg-gray-100 text-red-400 p-4 rounded-lg shadow-lg flex flex-col items-center w-64">
            <div className="flex items-center mb-2">
                <svg className="flex-shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                </svg>
                <div>
                    <span className="block md:text-md font-semibold">Error!</span>
                    <span className="md:text-md text-sm">{message}</span>
                </div>
            </div>
            <div className="w-full bg-red-700 h-1 mt-2">
                <div className="h-full bg-red-400 animate-load"></div>
            </div>
        </div>
    );
}

export default ErrorPopup;
