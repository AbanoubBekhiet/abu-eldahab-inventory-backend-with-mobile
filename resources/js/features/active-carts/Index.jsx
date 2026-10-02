import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import { ShoppingCart, Store, Phone, Eye, X, Image as ImageIcon } from 'lucide-react'
import api from '../../shared/services/api'

export default function ActiveCartsIndex() {
    const [search, setSearch] = useState('')
    const [viewingCart, setViewingCart] = useState(null)

    // React Query: Fetch Active Carts
    const { data: cartsData, isLoading } = useQuery({
        queryKey: ['active_carts', search],
        queryFn: async () => {
            const res = await api.get('/active-carts', { params: { search: search || undefined } })
            return res.data
        },
    })

    const activeCarts = cartsData?.active_carts?.data || []

    return (
        <AppLayout title="السلال النشطة" subtitle={`العملاء الذين لديهم سلال نشطة حالياً`}>
            <div className="space-y-5" dir="rtl">
                {/* Cards Grid */}
                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <p className="font-bold">جاري تحميل السلال...</p>
                    </div>
                ) : activeCarts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <span className="text-4xl block mb-3">🛒</span>
                        <p className="font-bold">لا توجد سلال نشطة حالياً.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {activeCarts.map((cartEntry, i) => (
                            <div
                                key={cartEntry.user.id}
                                className="rounded-2xl p-5 transition-all duration-300 animate-fade-in hover:shadow-md text-right relative flex flex-col justify-between"
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #EAE8E2',
                                    animationDelay: `${i * 40}ms`,
                                }}
                            >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4 flex-row-reverse">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
                                                style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}
                                            >
                                                {(cartEntry.user.name || 'ع').charAt(0)}
                                            </div>
                                            <div className="text-right">
                                                <h3 className="text-sm font-bold" style={{ color: '#1A2D23' }}>{cartEntry.user.name || 'عميل'}</h3>
                                                <p className="text-xs" style={{ color: '#B8B5AE' }}>
                                                    آخر نشاط: {cartEntry.last_added_date}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2 mb-4 text-right px-1">
                                        {cartEntry.user.phone && cartEntry.user.phone !== '—' && (
                                            <div className="flex items-center gap-2 justify-start">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-[#9A978F]" />
                                                <span className="text-sm" style={{ color: '#7C7870' }}>{cartEntry.user.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 justify-start mt-2">
                                            <ShoppingCart className="w-3.5 h-3.5 flex-shrink-0 text-[#9A978F]" />
                                            <span className="text-sm font-bold text-[#2E5A44]">{cartEntry.items_count} أصناف في السلة</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E2]">
                                    <button
                                        onClick={() => setViewingCart(cartEntry)}
                                        className="px-4 py-2 w-full rounded-xl bg-[#EEF4F1] text-[#2E5A44] hover:bg-[#ADCBBB] transition-all flex items-center justify-center gap-2 font-bold text-sm"
                                    >
                                        <Eye className="w-4 h-4" />
                                        عرض السلة
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* View Cart Details Modal */}
                {viewingCart && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
                        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-[#EAE8E2] shadow-2xl flex flex-col max-h-[90vh]">
                            <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}>
                                        {viewingCart.user.name.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-bold text-base text-[#1A2D23]">{viewingCart.user.name}</h3>
                                        <p className="text-xs text-[#9A978F]">{viewingCart.user.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingCart(null)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                    <X className="w-5 h-5 text-[#9A978F]" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto text-right space-y-4 flex-1">
                                <h4 className="font-bold text-sm text-[#1A2D23] mb-2 flex items-center justify-between">
                                    <span>محتويات السلة</span>
                                    <span className="text-xs px-2 py-1 bg-[#EEF4F1] text-[#2E5A44] rounded-full">
                                        {viewingCart.items.length} أصناف
                                    </span>
                                </h4>
                                
                                <div className="space-y-3">
                                    {viewingCart.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border border-[#EAE8E2] rounded-xl bg-white">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-[#EAE8E2]" />
                                            ) : (
                                                <div className="w-14 h-14 bg-[#FAF9F6] rounded-lg border border-[#EAE8E2] flex items-center justify-center">
                                                    <ImageIcon className="w-6 h-6 text-[#D5D2C4]" />
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-bold text-sm text-[#1A2D23]">{item.name}</h4>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-[#9A978F] font-bold">
                                                        الكمية: <span className="text-[#2E5A44]">{item.quantity} {item.unit}</span>
                                                    </span>
                                                    <span className="text-sm font-bold text-[#1A2D23]">
                                                        {(item.price * item.quantity).toFixed(2)} ج.م
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
