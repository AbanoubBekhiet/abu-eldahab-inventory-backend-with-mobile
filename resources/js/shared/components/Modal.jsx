import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }

    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 animate-fade-in"
                style={{ backgroundColor: 'rgba(26,29,22,0.45)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />
            {/* Modal */}
            <div
                className={`relative w-full ${sizeClasses[size]} rounded-2xl shadow-2xl animate-scale-in`}
                style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #EAE8E2' }}>
                    <h2 className="text-lg font-bold" style={{ color: '#1A2D23' }}>{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl transition-colors hover:bg-[#EAE8E2]"
                    >
                        <X className="w-5 h-5" style={{ color: '#B8B5AE' }} />
                    </button>
                </div>
                {/* Content */}
                <div className="p-6">{children}</div>
            </div>
        </div>
    )
}
