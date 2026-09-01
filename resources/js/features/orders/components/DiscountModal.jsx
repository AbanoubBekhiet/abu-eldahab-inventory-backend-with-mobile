import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Tag, AlertCircle } from 'lucide-react'
import api from '../../../shared/services/api'

export default function DiscountModal({ order, onClose }) {
    const queryClient = useQueryClient()
    const [discount, setDiscount] = useState(order.discount > 0 ? order.discount : '')
    const [error, setError] = useState('')

    const total = parseFloat(order.total.replace(/[^0-9.]/g, ''))

    const discountMutation = useMutation({
        mutationFn: async (val) => {
            const res = await api.post(`/orders/${order.raw_id}/discount`, { discount: val })
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] })
            onClose()
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'حدث خطأ أثناء تطبيق الخصم')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const val = parseFloat(discount)
        if (isNaN(val) || val < 0) { setError('أدخل قيمة صحيحة للخصم'); return }
        if (val > total) { setError('الخصم لا يمكن أن يتجاوز إجمالي الطلب'); return }
        discountMutation.mutate(val)
    }

    const netTotal = total - (parseFloat(discount) || 0)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#EAE8E2]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EEF4F1' }}>
                            <Tag className="w-4 h-4" style={{ color: '#2E5A44' }} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>تطبيق خصم</h3>
                            <p className="text-xs" style={{ color: '#9A978F' }}>{order.id}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F3EF] transition-colors"><X className="w-4 h-4 text-[#9A978F]" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Summary */}
                    <div className="rounded-xl p-4 space-y-2" style={{ backgroundColor: '#FAF9F6' }}>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#7C7870' }}>إجمالي الطلب</span>
                            <span className="font-bold" style={{ color: '#1A2D23' }}>{order.total}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#7C7870' }}>الخصم</span>
                            <span className="font-bold text-orange-600">{parseFloat(discount) > 0 ? `- ${parseFloat(discount).toFixed(2)} ج.م` : '—'}</span>
                        </div>
                        <div className="border-t border-[#EAE8E2] pt-2 flex justify-between text-sm">
                            <span className="font-bold" style={{ color: '#1A2D23' }}>الصافي</span>
                            <span className="font-bold" style={{ color: '#2E5A44' }}>{Math.max(0, netTotal).toFixed(2)} ج.م</span>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold" style={{ color: '#5C5950' }}>قيمة الخصم (ج.م)</label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            max={total}
                            value={discount}
                            onChange={e => { setDiscount(e.target.value); setError('') }}
                            className="w-full px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none"
                            style={{ backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }}
                            placeholder="0.00"
                            autoFocus
                        />
                        {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#EAE8E2] transition-colors hover:bg-[#F4F3EF]" style={{ color: '#5C5950' }}>إلغاء</button>
                        <button type="submit" disabled={discountMutation.isPending} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60" style={{ backgroundColor: '#2E5A44' }}>
                            {discountMutation.isPending ? 'جارٍ الحفظ...' : 'تطبيق الخصم'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
