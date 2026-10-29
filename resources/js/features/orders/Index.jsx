import { useState, useEffect, useRef, useCallback } from 'react'
import { usePage } from '@inertiajs/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import OrderRow from './components/OrderRow'
import OrderDetailsModal from './components/OrderDetailsModal'
import { buildPrintHTML, silentPrint } from './components/OrderDetailsModal'
import DiscountModal from './components/DiscountModal'
import ReturnModal from './components/ReturnModal'
import { X } from 'lucide-react'
import api from '../../shared/services/api'

export default function OrdersIndex({
    orders: initialOrders,
    filters: initialFilters,
}) {
    const { appSettings } = usePage().props || {}
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [search, setSearch] = useState(initialFilters?.search || '')

    // Modals
    const [detailsOrder, setDetailsOrder] = useState(null)      // full order with products
    const [discountOrder, setDiscountOrder] = useState(null)    // row-level data
    const [returnOrder, setReturnOrder] = useState(null)        // full order with products

    const [loadingDetails, setLoadingDetails] = useState(false)

    // Infinite scroll page state
    const [page, setPage] = useState(1)
    const [allOrders, setAllOrders] = useState(() => {
        if (initialOrders?.data) return initialOrders.data
        if (Array.isArray(initialOrders)) return initialOrders
        return []
    })
    const [hasMore, setHasMore] = useState(() => !!(initialOrders?.next_page || initialOrders?.next_page_url))
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const loadMoreRef = useRef(null)

    // Reset pagination when search changes
    useEffect(() => {
        setAllOrders([])
        setHasMore(true)
        setPage(1)
    }, [search])

    const fetchOrders = useCallback(async (pageNum) => {
        const res = await api.get('/orders', {
            params: {
                search: search || undefined,
                page: pageNum,
            }
        })
        return res.data
    }, [search])

    // React Query: Fetch first page
    const { data: ordersData, isLoading: isOrdersLoading } = useQuery({
        queryKey: ['orders', search],
        queryFn: async () => fetchOrders(1),
        placeholderData: (!search && initialOrders) ? { orders: initialOrders } : undefined,
        staleTime: 0,
    })

    // Seed and sync allOrders on first page
    useEffect(() => {
        if (!ordersData) return
        const firstPageData = ordersData.orders?.data || ordersData?.data || []
        setAllOrders(prev => {
            if (!prev || prev.length === 0 || page === 1) return firstPageData
            const firstPageMap = new Map(firstPageData.map(item => [item.raw_id, item]))
            return prev.map(item => firstPageMap.has(item.raw_id) ? firstPageMap.get(item.raw_id) : item)
        })
        setHasMore(!!(ordersData.orders?.next_page || ordersData.orders?.next_page_url))
    }, [ordersData])

    // Infinite scroll observer
    useEffect(() => {
        if (!loadMoreRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isOrdersLoading) {
                    const nextPage = page + 1
                    setIsLoadingMore(true)
                    fetchOrders(nextPage).then(res => {
                        const more = res.orders?.data || res.data || []
                        setAllOrders(prev => {
                            const existingIds = new Set(prev.map(o => o.raw_id))
                            const newItems = more.filter(o => !existingIds.has(o.raw_id))
                            return [...prev, ...newItems]
                        })
                        setHasMore(!!(res.orders?.next_page || res.orders?.next_page_url))
                        setPage(nextPage)
                        setIsLoadingMore(false)
                    }).catch(() => setIsLoadingMore(false))
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(loadMoreRef.current)
        return () => observer.disconnect()
    }, [hasMore, isLoadingMore, isOrdersLoading, page, fetchOrders])

    const loadedOrders = allOrders.length > 0 ? allOrders : (ordersData?.orders?.data || ordersData?.data || [])

    // Delete Order Mutation
    const deleteMutation = useMutation({
        mutationFn: async (orderId) => {
            const res = await api.delete(`/orders/${orderId}`)
            return res.data
        },
        onSuccess: (data, orderId) => {
            setAlert({ type: 'success', message: data.message || 'تم حذف الطلب بنجاح' })
            setAllOrders(prev => prev.filter(order => order.raw_id !== orderId))
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
            const html = buildPrintHTML(res.data.order, appSettings)
            silentPrint(html)
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
                            {isOrdersLoading && loadedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-sm font-semibold text-[#9A978F]">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin"></div>
                                            <span>جاري تحميل الطلبات...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : loadedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-sm font-semibold text-[#9A978F]">لا توجد طلبات مطابقة للبحث</td>
                                </tr>
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
                    {isOrdersLoading && loadedOrders.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-[#9A978F]">
                            <div className="flex justify-center items-center gap-2">
                                <div className="w-5 h-5 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin"></div>
                                <span>جاري تحميل الطلبات...</span>
                            </div>
                        </div>
                    ) : loadedOrders.length === 0 ? (
                        <div className="p-8 text-center text-sm font-semibold text-[#9A978F]">لا توجد طلبات</div>
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
                </div>

                {/* Infinite Scroll Sentinel */}
                <div ref={loadMoreRef} className="py-6 flex justify-center">
                    {(isLoadingMore || (isOrdersLoading && loadedOrders.length > 0)) && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#EAE8E2] shadow-sm">
                            <div className="w-4 h-4 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-[#5C5950]">جاري تحميل المزيد من الطلبات...</span>
                        </div>
                    )}
                    {!hasMore && loadedOrders.length > 0 && (
                        <span className="text-xs font-bold text-[#9A978F]">تم تحميل جميع الطلبات</span>
                    )}
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
