import { Trash2, Archive } from 'lucide-react'

export default function PendingCartsPanel({ pendingCarts = [], onResume, onDelete }) {
    const cartsList = Array.isArray(pendingCarts) ? pendingCarts : (pendingCarts?.data || [])

    const handleDelete = (id, e) => {
        e.stopPropagation()
        if (onDelete) {
            onDelete(id)
        }
    }

    if (cartsList.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#FAF9F6] border border-[#EAE8E2]">
                <Archive className="w-3.5 h-3.5 text-[#C8C5BE]" />
                <span className="text-xs text-[#9A978F] whitespace-nowrap">لا توجد سلات معلقة</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide" style={{ maxWidth: '55vw' }}>
            {cartsList.map((cart) => (
                <button
                    key={cart.id}
                    onClick={() => onResume(cart)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EAE8E2] bg-[#FAF9F6] hover:border-[#ADCBBB] hover:bg-[#EEF4F1] transition-all group cursor-pointer"
                    style={{ minWidth: '120px', maxWidth: '160px' }}
                >
                    <div className="flex-1 min-w-0 text-right">
                        <p className="text-[11px] font-bold text-[#1A2D23] truncate leading-tight">
                            {cart.customer?.name || 'عميل غير محدد'}
                        </p>
                        <p className="text-[10px] font-semibold text-[#2E5A44] leading-tight">
                            {parseFloat(cart.total).toFixed(2)} ج
                        </p>
                    </div>
                    <button
                        onClick={(e) => handleDelete(cart.id, e)}
                        className="flex-shrink-0 p-0.5 rounded hover:bg-[#FDEEEC] text-[#C8C5BE] hover:text-[#C0392B] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </button>
            ))}
        </div>
    )
}
