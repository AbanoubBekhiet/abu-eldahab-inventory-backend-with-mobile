import { useState } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import OrderDetailsModal, { buildPrintHTML } from '../../orders/components/OrderDetailsModal'
import DiscountModal from '../../orders/components/DiscountModal'
import ReturnModal from '../../orders/components/ReturnModal'
import OrderRow from '../../orders/components/OrderRow'

export default function RecentOrders({ recentOrders = [] }) {
    const { appSettings } = usePage().props
    const [detailsOrder, setDetailsOrder] = useState(null)
    const [discountOrder, setDiscountOrder] = useState(null)
    const [returnOrder, setReturnOrder] = useState(null)
    const [loadingDetails, setLoadingDetails] = useState(false)

    const fetchFull = async (order, callback) => {
        setLoadingDetails(true)
        try {
            const res = await fetch(`/orders/${order.raw_id}`, { headers: { Accept: 'application/json' } })
            const json = await res.json()
            callback(json.order)
        } catch { /* silent */ } finally {
            setLoadingDetails(false)
        }
    }

    const handlePrint = (order) => {
        fetchFull(order, (fullOrder) => {
            const html = buildPrintHTML(fullOrder, appSettings || {})
            const w = window.open('', '_blank', 'width=800,height=700')
            w.document.write(html)
            w.document.close()
            w.focus()
            setTimeout(() => { w.print(); w.close() }, 400)
        })
    }

    const handleDelete = (orderId) => {
        if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            router.delete(`/orders/${orderId}`, { preserveScroll: true })
        }
    }

    return (
        <>
            {detailsOrder && (
                <OrderDetailsModal
                    order={detailsOrder}
                    onClose={() => setDetailsOrder(null)}
                    onDiscount={(o) => { setDetailsOrder(null); setDiscountOrder(o) }}
                    onReturn={(o)   => { setDetailsOrder(null); setReturnOrder(o) }}
                />
            )}
            {discountOrder && <DiscountModal order={discountOrder} onClose={() => setDiscountOrder(null)} />}
            {returnOrder   && <ReturnModal   order={returnOrder}   onClose={() => setReturnOrder(null)} />}

            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 sm:p-6" style={{ borderBottom: '1px solid #EAE8E2' }}>
                    <div className="text-right">
                        <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>أحدث الطلبات</h3>
                        <p className="text-sm mt-0.5" style={{ color: '#9A978F' }}>آخر {recentOrders.length} معاملة</p>
                    </div>
                    <Link href="/orders" className="text-sm font-semibold transition-colors" style={{ color: '#2E5A44' }}
                        onMouseEnter={e => e.target.style.color = '#1A2D23'}
                        onMouseLeave={e => e.target.style.color = '#2E5A44'}>
                        عرض الكل
                    </Link>
                </div>

                {/* Loading overlay */}
                {loadingDetails && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                        <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-right" dir="rtl">
                        <thead>
                            <tr style={{ borderBottom: '1px solid #F4F3EF' }}>
                                {['معرف الطلب', 'العميل', 'العناصر', 'الإجمالي', 'التاريخ', 'نوع الدفع', ''].map(h => (
                                    <th key={h} className="text-right text-xs font-semibold uppercase tracking-wider px-6 py-3" style={{ color: '#B8B5AE' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.length === 0 ? (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-sm font-semibold" style={{ color: '#9A978F' }}>لا توجد طلبات حتى الآن</td></tr>
                            ) : recentOrders.map((order) => (
                                <OrderRow
                                    key={order.raw_id}
                                    order={order}
                                    onDetails={() => fetchFull(order, setDetailsOrder)}
                                    onDiscount={() => setDiscountOrder(order)}
                                    onReturn={() => fetchFull(order, setReturnOrder)}
                                    onPrint={() => handlePrint(order)}
                                    onDelete={() => handleDelete(order.raw_id)}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile */}
                <div className="sm:hidden">
                    {recentOrders.map((order) => (
                        <OrderRow
                            key={order.raw_id}
                            order={order}
                            onDetails={() => fetchFull(order, setDetailsOrder)}
                            onDiscount={() => setDiscountOrder(order)}
                            onReturn={() => fetchFull(order, setReturnOrder)}
                            onPrint={() => handlePrint(order)}
                            onDelete={() => handleDelete(order.raw_id)}
                        />
                    ))}
                    {recentOrders.length === 0 && (
                        <div className="p-8 text-center text-sm font-semibold" style={{ color: '#9A978F' }}>لا توجد طلبات</div>
                    )}
                </div>
            </div>
        </>
    )
}
