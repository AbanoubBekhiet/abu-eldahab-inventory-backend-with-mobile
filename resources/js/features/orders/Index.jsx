import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import OrderRow from './components/OrderRow'
import OrderDetailsModal from './components/OrderDetailsModal'
import { buildPrintHTML } from './components/OrderDetailsModal'
import DiscountModal from './components/DiscountModal'
import ReturnModal from './components/ReturnModal'
import { X } from 'lucide-react'
import api from '../../shared/services/api'

export default function OrdersIndex({
    orders: initialOrders,
    filters: initialFilters,
}) {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [search, setSearch] = useState(initialFilters?.search || '')

    // Modals
    const [detailsOrder, setDetailsOrder] = useState(null)      // full order with products
    const [discountOrder, setDiscountOrder] = useState(null)    // row-level data
    const [returnOrder, setReturnOrder] = useState(null)        // full order with products

    const [loadingDetails, setLoadingDetails] = useState(false)

    // React Query: Fetch Orders
    const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['orders', search],
        queryFn: async () => {
            const res = await api.get('/orders', { params: { search: search || undefined } })
            return res.data
        },
        initialData: initialOrders ? { orders: initialOrders } : undefined,
    })

    const loadedOrders = ordersData?.orders?.data || ordersData?.data || []

    // Delete Order Mutation
    const deleteMutation = useMutation({
        mutationFn: async (orderId) => {
            const res = await api.delete(`/orders/${orderId}`)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم حذف الطلب بنجاح' })
            queryClient.invalidateQueries({ queryKey: ['orders'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء حذف الطلب' })
        }
    })

    const printOrder = async (order) => {
        setLoadingDetails(true)
        try {
            const res = await api.get(`/orders/${order.raw_id}`)
            const html = buildPrintHTML(res.data.order, {})
            const w = window.open('', '_blank', 'width=800,height=700')
            w.document.write(html)
            w.document.close()
            w.focus()
            setTimeout(() => { w.print(); w.close() }, 400)
        } catch {
            setAlert({ type: 'error', message: 'تعذر تحميل تفاصيل الطلب للطباعة' })
        } finally {
            setLoadingDetails(false)
        }
    }

    const openDetails = async (order) => {
        setLoadingDetails(true)
        try {
            const res = await api.get(`/orders/${order.raw_id}`)
            setDetailsOrder(res.data.order)
        } catch {
            setAlert({ type: 'error', message: 'تعذر تحميل تفاصيل الطلب' })
        } finally {
            setLoadingDetails(false)
        }
    }

    const openReturn = async (order) => {
        setLoadingDetails(true)
        try {
            const res = await api.get(`/orders/${order.raw_id}`)
            setReturnOrder(res.data.order)
        } catch {
            setAlert({ type: 'error', message: 'تعذر تحميل بيانات الطلب' })
        } finally {
            setLoadingDetails(false)
        }
    }

    const handleDelete = (orderId) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            deleteMutation.mutate(orderId)
        }
    }

    const thStyle = { color: '#B8B5AE', borderBottom: '1px solid #EAE8E2', backgroundColor: '#FAF9F6' }

    return (
        <AppLayout title="إدارة الطلبات" subtitle="متابعة وإدارة جميع معاملات المبيعات">
            {/* Modals */}
            {detailsOrder && (
                <OrderDetailsModal
                    order={detailsOrder}
                    onClose={() => setDetailsOrder(null)}
                    onDiscount={(o) => setDiscountOrder(o)}
                    onReturn={(o) => setReturnOrder(o)}
                />
            )}
            {discountOrder && <DiscountModal order={discountOrder} onClose={() => setDiscountOrder(null)} />}
            {returnOrder && <ReturnModal order={returnOrder} onClose={() => setReturnOrder(null)} />}

            {/* Loading overlay */}
            {loadingDetails && (
                <div className="fixed inset-0 z-40 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
                    <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Flash Alert */}
            {alert && (
                <div className="p-4 rounded-xl text-sm font-semibold border transition-all relative flex items-center justify-between gap-4 mb-6"
                    style={{ backgroundColor: alert.type === 'success' ? '#EBF5EF' : '#FDEEEC', borderColor: alert.type === 'success' ? '#ADCBBB' : '#E8A09A', color: alert.type === 'success' ? '#2E5A44' : '#922B21' }}
                    dir="rtl">
                    <span className="flex-1 text-right">{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="opacity-70 hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Toolbar */}
            <div className="flex mb-6" dir="rtl">
                <SearchInput placeholder="البحث عن الطلبات..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-72" />
            </div>

            {/* Table */}
            <div className="rounded-2xl overflow-hidden text-right mb-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }} dir="rtl">
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr style={thStyle}>
                                {['معرف الطلب', 'العميل', 'العناصر', 'الإجمالي', 'التاريخ', 'نوع الدفع', 'الملاحظات', ''].map(h => (
                                    <th key={h} className="text-right text-xs font-semibold uppercase tracking-wider px-6 py-3" style={{ color: '#B8B5AE' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loadedOrders.length === 0 && !isOrdersLoading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm font-semibold text-[#9A978F]">لا توجد طلبات مطابقة للبحث</td></tr>
                            ) : (
                                loadedOrders.map(order => (
                                    <OrderRow
                                        key={order.raw_id}
                                        order={order}
                                        onDetails={() => openDetails(order)}
                                        onDiscount={() => setDiscountOrder(order)}
                                        onReturn={() => openReturn(order)}
                                        onPrint={() => printOrder(order)}
                                        onDelete={() => handleDelete(order.raw_id)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="sm:hidden">
                    {loadedOrders.map(order => (
                        <OrderRow
                            key={order.raw_id}
                            order={order}
                            onDetails={() => openDetails(order)}
                            onDiscount={() => setDiscountOrder(order)}
                            onReturn={() => openReturn(order)}
                            onPrint={() => printOrder(order)}
                            onDelete={() => handleDelete(order.raw_id)}
                        />
                    ))}
                    {loadedOrders.length === 0 && !isOrdersLoading && <div className="p-8 text-center text-sm font-semibold text-[#9A978F]">لا توجد طلبات</div>}
                </div>

                <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid #EAE8E2' }}>
                    <p className="text-sm" style={{ color: '#9A978F' }}>
                        عرض <span className="font-semibold" style={{ color: '#1A2D23' }}>{loadedOrders.length}</span> طلب
                    </p>
                </div>
            </div>
        </AppLayout>
    )
}
