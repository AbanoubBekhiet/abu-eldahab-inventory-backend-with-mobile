import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import { 
    ShoppingCart, 
    Store, 
    Phone, 
    Eye, 
    X, 
    Image as ImageIcon, 
    Trash2, 
    MapPin, 
    Tag, 
    Mail, 
    Package, 
    Receipt,
    Plus,
    Minus,
    CheckCircle2,
    AlertCircle,
    Check
} from 'lucide-react'
import api from '../../shared/services/api'

export default function ActiveCartsIndex() {
    const [search, setSearch] = useState('')
    const [selectedRegion, setSelectedRegion] = useState('all')
    const [viewingCart, setViewingCart] = useState(null)
    const [productSearch, setProductSearch] = useState('')
    const queryClient = useQueryClient()

    // React Query: Fetch Regions for Filter
    const { data: regionsData } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const res = await api.get('/regions')
            return res.data?.data || []
        },
    })
    const regions = regionsData || []

    // React Query: Fetch Active Carts
    const { data: cartsData, isLoading } = useQuery({
        queryKey: ['active_carts', search, selectedRegion],
        queryFn: async () => {
            const res = await api.get('/active-carts', { 
                params: { 
                    search: search || undefined,
                    region_id: selectedRegion !== 'all' ? selectedRegion : undefined
                } 
            })
            return res.data
        },
    })

    // React Query: Search products to add to cart
    const { data: searchProductsData, isLoading: isSearchingProducts } = useQuery({
        queryKey: ['products_search', productSearch],
        queryFn: async () => {
            if (!productSearch || productSearch.trim().length < 2) return []
            const res = await api.get('/products', { params: { search: productSearch.trim() } })
            return res.data?.products?.data || []
        },
        enabled: !!(viewingCart && productSearch.trim().length >= 2),
    })
    const searchResults = searchProductsData || []

    // Mutation: Add or Increment Product in Cart
    const addProductToCartMutation = useMutation({
        mutationFn: async ({ userId, product }) => {
            const res = await api.put(`/app-users/${userId}/cart/${product.id}`, { delta: 1 })
            return res.data
        },
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries(['active_carts'])
            setViewingCart(prev => {
                if (!prev) return null
                const existing = prev.items.find(i => i.id === variables.product.id)
                if (existing) {
                    const newItems = prev.items.map(i => 
                        i.id === variables.product.id 
                            ? { ...i, quantity: (parseFloat(i.quantity) || 0) + 1 }
                            : i
                    )
                    return { ...prev, items: newItems }
                } else {
                    const effectivePrice = variables.product.active_offer?.offer_price ?? variables.product.price
                    const newItem = {
                        id: variables.product.id,
                        name: variables.product.name,
                        price: effectivePrice,
                        original_price: variables.product.price,
                        has_offer: !!variables.product.active_offer,
                        image_url: variables.product.image_url,
                        quantity: 1,
                        unit: variables.product.unit,
                        subtotal: effectivePrice,
                    }
                    return { ...prev, items: [...prev.items, newItem] }
                }
            })
            setProductSearch('')
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'حدث خطأ أثناء إضافة المنتج')
        }
    })

    // Mutation: Update Item Quantity (+ / -)
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ userId, productId, quantity }) => {
            const res = await api.put(`/app-users/${userId}/cart/${productId}`, { quantity })
            return res.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['active_carts'])
            setViewingCart(prev => {
                if (!prev) return null
                if (variables.quantity <= 0) {
                    const newItems = prev.items.filter(i => i.id !== variables.productId)
                    if (newItems.length === 0) return null
                    return { ...prev, items: newItems }
                }
                const newItems = prev.items.map(i => i.id === variables.productId ? { ...i, quantity: variables.quantity } : i)
                return { ...prev, items: newItems }
            })
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'حدث خطأ أثناء تعديل الكمية')
        }
    })

    // Mutation: Remove Item from Cart
    const removeCartItemMutation = useMutation({
        mutationFn: async ({ userId, productId }) => {
            const res = await api.delete(`/app-users/${userId}/cart/${productId}`)
            return res.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(['active_carts'])
            setViewingCart(prev => {
                if (!prev) return null;
                const newItems = prev.items.filter(i => i.id !== variables.productId);
                if (newItems.length === 0) return null; // Close modal if empty
                return { ...prev, items: newItems };
            });
        },
        onError: () => alert('حدث خطأ أثناء الحذف')
    })

    // Mutation: Clear Entire Cart
    const clearCartMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await api.delete(`/app-users/${userId}/cart`)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['active_carts'])
            setViewingCart(null)
        },
        onError: () => alert('حدث خطأ أثناء تفريغ السلة')
    })

    // Mutation: Checkout / Complete Order by Admin or Sub-Admin
    const checkoutCartMutation = useMutation({
        mutationFn: async (userId) => {
            const res = await api.post(`/app-users/${userId}/cart/checkout`)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['active_carts'])
            queryClient.invalidateQueries(['orders'])
            setViewingCart(null)
            alert(data.message || 'تم إتمام الطلب بنجاح ونقله إلى صفحة الطلبات!')
        },
        onError: (err) => {
            alert(err.response?.data?.message || 'حدث خطأ أثناء إتمام الطلب')
        }
    })

    const activeCarts = cartsData?.active_carts?.data || []

    const formatCurrency = (val) => {
        const num = Number(val) || 0
        return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    // Modal calculated totals (updates immediately when item is modified or deleted)
    const modalItems = viewingCart?.items || []
    const modalItemsCount = modalItems.length
    const modalTotalQuantity = modalItems.reduce((acc, it) => acc + (parseFloat(it.quantity) || 0), 0)
    const modalTotalPrice = modalItems.reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0)), 0)

    // Modal region limit progress
    const modalMinTotal = viewingCart?.region_limits?.min_order_total || 0
    const modalMinCount = viewingCart?.region_limits?.min_products_count || 0
    const modalRemainingTotal = Math.max(0, modalMinTotal - modalTotalPrice)
    const modalRemainingCount = Math.max(0, modalMinCount - modalItemsCount)
    const modalIsLimitMet = (modalMinTotal <= 0 || modalTotalPrice >= modalMinTotal) && 
                            (modalMinCount <= 0 || modalItemsCount >= modalMinCount)

    return (
        <AppLayout title="السلال النشطة" subtitle="العملاء الذين لديهم سلال نشطة حالياً">
            <div className="space-y-5" dir="rtl">
                {/* Search Bar & Region Filters */}
                <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                        <SearchInput
                            placeholder="البحث بالاسم، الهاتف، المحل، العنوان، المنطقة..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full sm:w-80"
                        />
                        <div className="text-xs text-[#7C7870] font-medium flex items-center gap-2 self-end sm:self-center">
                            <span>إجمالي السلال المعروضة:</span>
                            <span className="font-bold text-[#2E5A44] px-2.5 py-1 rounded-full bg-[#EEF4F1] border border-[#D5E3DB]">
                                {activeCarts.length}
                            </span>
                        </div>
                    </div>

                    {/* Region Filter Pills */}
                    {regions.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                            <span className="text-[#9A978F] font-bold text-xs flex items-center gap-1 flex-shrink-0">
                                <MapPin className="w-3.5 h-3.5 text-[#2E5A44]" />
                                تصفية بالمنطقة:
                            </span>
                            <button
                                onClick={() => setSelectedRegion('all')}
                                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex-shrink-0 ${
                                    selectedRegion === 'all'
                                        ? 'bg-[#2E5A44] text-white shadow-sm'
                                        : 'bg-white text-[#7C7870] border border-[#EAE8E2] hover:bg-[#FAF9F6]'
                                }`}
                            >
                                جميع المناطق
                            </button>
                            {regions.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => setSelectedRegion(r.id.toString())}
                                    className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                                        selectedRegion == r.id
                                            ? 'bg-[#2E5A44] text-white shadow-sm'
                                            : 'bg-white text-[#7C7870] border border-[#EAE8E2] hover:bg-[#FAF9F6]'
                                    }`}
                                >
                                    <span>{r.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Cards Grid */}
                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <div className="w-8 h-8 border-3 border-[#2E5A44] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="font-bold">جاري تحميل السلال...</p>
                    </div>
                ) : activeCarts.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <span className="text-4xl block mb-3">🛒</span>
                        <p className="font-bold">
                            {search || selectedRegion !== 'all' ? 'لم يتم العثور على أي سلال تطابق التصفية.' : 'لا توجد سلال نشطة حالياً.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                        {activeCarts.map((cartEntry, i) => {
                            const cartTotalQty = cartEntry.total_quantity !== undefined 
                                ? cartEntry.total_quantity 
                                : (cartEntry.items || []).reduce((acc, it) => acc + (parseFloat(it.quantity) || 0), 0)
                            
                            const cartTotalPrice = cartEntry.total_price !== undefined 
                                ? cartEntry.total_price 
                                : (cartEntry.items || []).reduce((acc, it) => acc + ((parseFloat(it.price) || 0) * (parseFloat(it.quantity) || 0)), 0)

                            const regionLimits = cartEntry.region_limits

                            return (
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
                                        {/* Header: Customer Avatar & Name & Tag */}
                                        <div className="flex items-start justify-between mb-4 flex-row-reverse">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold shadow-sm flex-shrink-0"
                                                    style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}
                                                >
                                                    {(cartEntry.user.name || 'ع').charAt(0)}
                                                </div>
                                                <div className="text-right min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-base font-bold truncate" style={{ color: '#1A2D23' }}>
                                                            {cartEntry.user.name || 'عميل'}
                                                        </h3>
                                                        {cartEntry.user.registered_from_app && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                                style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', whiteSpace: 'nowrap' }}>
                                                                📱 تطبيق
                                                            </span>
                                                        )}
                                                    </div>
                                                    {cartEntry.user.phone && cartEntry.user.phone !== '—' && (
                                                        <p className="text-xs text-[#7C7870] font-medium mt-0.5" dir="ltr">
                                                            {cartEntry.user.phone}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-[#B8B5AE] mt-0.5">
                                                        آخر إضافة: {cartEntry.last_added_date}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Region Limit Progress Status (فاضل له قد ايه عشان يحقق ليميت المنطقة) */}
                                        {regionLimits?.has_limits && (
                                            regionLimits.is_limit_met ? (
                                                <div className="bg-[#E8F5E9] border border-[#C8E6C9] px-3 py-2 rounded-xl mb-3 flex items-center justify-between text-xs">
                                                    <span className="flex items-center gap-1.5 text-[#2E5A44] font-bold">
                                                        <CheckCircle2 className="w-4 h-4 text-[#2E5A44] flex-shrink-0" />
                                                        <span>تم تحقيق حد المنطقة ({formatCurrency(regionLimits.min_order_total)} ج.م)</span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="bg-[#FFFBEB] border border-[#FDE68A] px-3 py-2.5 rounded-xl mb-3 text-xs space-y-1">
                                                    <div className="flex items-center justify-between text-[#B45309] font-bold">
                                                        <span className="flex items-center gap-1.5">
                                                            <AlertCircle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                                                            <span>متبقي لتحقيق حد المنطقة:</span>
                                                        </span>
                                                        <span className="font-black text-[#B45309] text-sm">
                                                            {formatCurrency(regionLimits.remaining_total)} ج.م
                                                        </span>
                                                    </div>
                                                    <div className="text-[10px] text-[#92400E] flex items-center justify-between pt-0.5">
                                                        <span>حد الطلب: {formatCurrency(regionLimits.min_order_total)} ج.م</span>
                                                        {regionLimits.min_products_count > 0 && (
                                                            <span>الحد الأدنى: {regionLimits.min_products_count} أصناف</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        )}

                                        {/* Cart Summary Strip on Card (توتال العناصر وتوتال الحساب) */}
                                        <div className="bg-[#EEF4F1]/60 border border-[#D0E2D8] p-3 rounded-xl mb-3 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart className="w-4 h-4 text-[#2E5A44] flex-shrink-0" />
                                                <div>
                                                    <span className="text-[10px] text-[#7C7870] block">محتويات السلة</span>
                                                    <span className="text-xs font-bold text-[#2E5A44]">
                                                        {cartEntry.items_count} أصناف ({cartTotalQty} قطعة)
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-left">
                                                <span className="text-[10px] text-[#7C7870] block">إجمالي الحساب</span>
                                                <span className="text-sm font-black text-[#1A2D23]">
                                                    {formatCurrency(cartTotalPrice)} ج.م
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons: View Details & Quick Checkout */}
                                    <div className="flex items-center gap-2 pt-3 border-t border-[#EAE8E2]">
                                        <button
                                            onClick={() => setViewingCart(cartEntry)}
                                            className="px-3 py-2 flex-1 rounded-xl bg-[#EEF4F1] text-[#2E5A44] hover:bg-[#ADCBBB] transition-all flex items-center justify-center gap-1.5 font-bold text-xs"
                                        >
                                            <Eye className="w-4 h-4" />
                                            معاينة وتعديل
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`هل أنت متأكد من إتمام الطلب للعميل "${cartEntry.user.name}" بإجمالي ${formatCurrency(cartTotalPrice)} ج.م؟`)) {
                                                    checkoutCartMutation.mutate(cartEntry.user.id)
                                                }
                                            }}
                                            disabled={checkoutCartMutation.isPending}
                                            className="px-3 py-2 flex-1 rounded-xl bg-[#2E5A44] text-white hover:bg-[#1A2D23] transition-all flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm disabled:opacity-50"
                                            title="إتمام الطلب مباشرة من الإدارة"
                                        >
                                            <Check className="w-4 h-4" />
                                            إتمام الطلب
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* View Cart Details & Management Modal */}
                {viewingCart && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
                        <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden border border-[#EAE8E2] shadow-2xl flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}>
                                        {(viewingCart.user.name || 'ع').charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-base text-[#1A2D23]">{viewingCart.user.name}</h3>
                                            {viewingCart.user.registered_from_app && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                    style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE' }}>
                                                    📱 تطبيق
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-[#9A978F]" dir="ltr">{viewingCart.user.phone}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingCart(null)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                    <X className="w-5 h-5 text-[#9A978F]" />
                                </button>
                            </div>

                            {/* Customer Information Strip inside Modal */}
                            <div className="px-6 py-3 bg-[#F8FAF9] border-b border-[#EAE8E2] text-xs space-y-1.5">
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#7C7870]">
                                    {viewingCart.user.shop_name && viewingCart.user.shop_name !== '—' && (
                                        <div className="flex items-center gap-1.5">
                                            <Store className="w-3.5 h-3.5 text-[#2E5A44]" />
                                            <span className="font-bold text-[#1A2D23]">{viewingCart.user.shop_name}</span>
                                            {viewingCart.user.category_of_place && viewingCart.user.category_of_place !== '—' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EEF4F1] text-[#2E5A44]">
                                                    {viewingCart.user.category_of_place}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    {viewingCart.user.region && viewingCart.user.region !== '—' && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-[#559476]" />
                                            <span className="text-[#9A978F]">المنطقة:</span>
                                            <span className="font-bold text-[#2E5A44] px-2 py-0.5 rounded-full bg-[#E8F5E9] border border-[#C8E6C9]">
                                                {viewingCart.user.region}
                                            </span>
                                        </div>
                                    )}
                                    {viewingCart.user.phone && viewingCart.user.phone !== '—' && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-[#9A978F]" />
                                            <span className="font-medium text-[#1A2D23]" dir="ltr">{viewingCart.user.phone}</span>
                                        </div>
                                    )}
                                </div>
                                {viewingCart.user.address && viewingCart.user.address !== '—' && (
                                    <div className="flex items-start gap-1.5 text-[#5C5950] pt-0.5">
                                        <MapPin className="w-3.5 h-3.5 text-[#9A978F] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="font-semibold text-[#1A2D23]">العنوان: </span>
                                            <span>{viewingCart.user.address}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Region Limit Banner (Live Progress) */}
                            {viewingCart.region_limits?.has_limits && (
                                <div className={`px-6 py-2.5 border-b text-xs flex items-center justify-between ${
                                    modalIsLimitMet 
                                        ? 'bg-[#E8F5E9] border-[#C8E6C9] text-[#2E5A44]' 
                                        : 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                                }`}>
                                    <div className="flex items-center gap-2 font-bold">
                                        {modalIsLimitMet ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 text-[#2E5A44] flex-shrink-0" />
                                                <span>تم استيفاء الحد الأدنى لطلبات منطقة {viewingCart.region_limits.region_name} ({formatCurrency(viewingCart.region_limits.min_order_total)} ج.م)</span>
                                            </>
                                        ) : (
                                            <>
                                                <AlertCircle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                                                <span>متبقي {formatCurrency(modalRemainingTotal)} ج.م لتحقيق حد طلبات منطقة {viewingCart.region_limits.region_name} ({formatCurrency(viewingCart.region_limits.min_order_total)} ج.م)</span>
                                            </>
                                        )}
                                    </div>
                                    {viewingCart.region_limits.min_products_count > 0 && (
                                        <span className="text-[11px] opacity-85">
                                            (الأصناف: {modalItemsCount} من {viewingCart.region_limits.min_products_count})
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Modal Body: Products List with Increment / Decrement */}
                            <div className="p-6 overflow-y-auto text-right space-y-4 flex-1">
                                {/* Add Product Search Section */}
                                <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#EAE8E2] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-[#1A2D23] flex items-center gap-1.5">
                                            <Plus className="w-4 h-4 text-[#2E5A44]" />
                                            إضافة منتج إلى سلة العميل:
                                        </label>
                                        {productSearch && (
                                            <button 
                                                onClick={() => setProductSearch('')}
                                                className="text-[11px] text-[#9A978F] hover:text-red-500 font-medium"
                                            >
                                                إلغاء البحث
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <SearchInput
                                            placeholder="ابحث باسم المنتج لإضافته للسلة..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full"
                                        />
                                        {isSearchingProducts && (
                                            <div className="absolute left-3 top-2.5 text-xs text-[#9A978F] flex items-center gap-1">
                                                <span className="w-3.5 h-3.5 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin"></span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Search Results Dropdown List */}
                                    {productSearch.trim().length >= 2 && (
                                        <div className="bg-white rounded-xl border border-[#D5E3DB] shadow-md max-h-56 overflow-y-auto divide-y divide-[#FAF9F6] mt-2">
                                            {searchResults.length === 0 ? (
                                                <div className="p-4 text-center text-xs text-[#9A978F]">
                                                    {isSearchingProducts ? 'جاري البحث في المنتجات...' : 'لا توجد منتجات مطابقة للبحث.'}
                                                </div>
                                            ) : (
                                                searchResults.map((product) => {
                                                    const price = product.active_offer?.offer_price ?? product.price
                                                    const inStock = product.stock > 0
                                                    const isAlreadyInCart = viewingCart.items.some(it => it.id === product.id)
                                                    
                                                    return (
                                                        <div key={product.id} className="p-2.5 hover:bg-[#F8FAF9] flex items-center justify-between gap-3 transition-colors">
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                {product.image_url ? (
                                                                    <img src={product.image_url} alt={product.name} className="w-9 h-9 object-cover rounded-lg border border-[#EAE8E2] flex-shrink-0" />
                                                                ) : (
                                                                    <div className="w-9 h-9 bg-[#FAF9F6] rounded-lg border border-[#EAE8E2] flex items-center justify-center text-[#9A978F] flex-shrink-0">
                                                                        <Package className="w-4 h-4 text-[#D5D2C4]" />
                                                                    </div>
                                                                )}
                                                                <div className="text-right min-w-0">
                                                                    <h5 className="font-bold text-xs text-[#1A2D23] truncate">{product.name}</h5>
                                                                    <div className="flex items-center gap-2 text-[11px] text-[#7C7870] mt-0.5">
                                                                        <span className="font-semibold text-[#2E5A44]">{formatCurrency(price)} ج.م / {product.unit || 'وحدة'}</span>
                                                                        <span>•</span>
                                                                        <span className={inStock ? 'text-emerald-700' : 'text-red-500 font-bold'}>
                                                                            {inStock ? `المتاح: ${product.stock}` : 'نفذت الكمية'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => addProductToCartMutation.mutate({ userId: viewingCart.user.id, product })}
                                                                disabled={!inStock || addProductToCartMutation.isPending}
                                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 flex-shrink-0 ${
                                                                    !inStock 
                                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                        : isAlreadyInCart
                                                                            ? 'bg-[#E8F5E9] text-[#2E5A44] hover:bg-[#D5E3DB]'
                                                                            : 'bg-[#2E5A44] text-white hover:bg-[#1A2D23] shadow-2xs'
                                                                }`}
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                <span>{isAlreadyInCart ? 'زيادة قطعة' : 'إضافة للسلة'}</span>
                                                            </button>
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>

                                <h4 className="font-bold text-sm text-[#1A2D23] mb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>محتويات السلة</span>
                                        <span className="text-xs px-2 py-1 bg-[#EEF4F1] text-[#2E5A44] rounded-full font-bold">
                                            {modalItemsCount} أصناف
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm('هل أنت متأكد من تفريغ سلة هذا العميل بالكامل؟')) {
                                                clearCartMutation.mutate(viewingCart.user.id);
                                            }
                                        }}
                                        disabled={clearCartMutation.isPending}
                                        className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        تفريغ السلة
                                    </button>
                                </h4>
                                
                                <div className="space-y-3">
                                    {modalItems.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 border border-[#EAE8E2] rounded-xl bg-white hover:border-[#D5E3DB] transition-colors">
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="w-14 h-14 object-cover rounded-lg border border-[#EAE8E2] flex-shrink-0" />
                                            ) : (
                                                <div className="w-14 h-14 bg-[#FAF9F6] rounded-lg border border-[#EAE8E2] flex items-center justify-center flex-shrink-0">
                                                    <ImageIcon className="w-6 h-6 text-[#D5D2C4]" />
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-sm text-[#1A2D23] truncate">{item.name}</h4>
                                                <div className="flex items-center justify-between mt-1">
                                                    <span className="text-xs text-[#7C7870] font-medium">
                                                        السعر: {formatCurrency(item.price)} ج.م / {item.unit || 'وحدة'}
                                                    </span>
                                                    <span className="text-sm font-bold text-[#1A2D23]">
                                                        {formatCurrency((item.price || 0) * (item.quantity || 0))} ج.م
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Quantity Increase / Decrease Controls for Admin / Sub-admin */}
                                            <div className="flex items-center gap-1.5 bg-[#FAF9F6] border border-[#EAE8E2] rounded-xl p-1 flex-shrink-0">
                                                <button
                                                    onClick={() => updateQuantityMutation.mutate({ 
                                                        userId: viewingCart.user.id, 
                                                        productId: item.id, 
                                                        quantity: Number(item.quantity) + 1 
                                                    })}
                                                    disabled={updateQuantityMutation.isPending}
                                                    className="w-7 h-7 rounded-lg bg-white hover:bg-[#EEF4F1] text-[#2E5A44] flex items-center justify-center font-bold text-xs border border-[#EAE8E2] transition-colors shadow-2xs"
                                                    title="زيادة الكمية"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="px-2 font-bold text-xs text-[#1A2D23] min-w-[28px] text-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        const newQty = Number(item.quantity) - 1
                                                        if (newQty <= 0) {
                                                            if (window.confirm('هل تريد حذف هذا المنتج من السلة؟')) {
                                                                removeCartItemMutation.mutate({ userId: viewingCart.user.id, productId: item.id })
                                                            }
                                                        } else {
                                                            updateQuantityMutation.mutate({ 
                                                                userId: viewingCart.user.id, 
                                                                productId: item.id, 
                                                                quantity: newQty 
                                                            })
                                                        }
                                                    }}
                                                    disabled={updateQuantityMutation.isPending}
                                                    className="w-7 h-7 rounded-lg bg-white hover:bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs border border-[#EAE8E2] transition-colors shadow-2xs"
                                                    title="إنقاص الكمية"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            {/* Delete Item Button */}
                                            <button 
                                                onClick={() => removeCartItemMutation.mutate({ userId: viewingCart.user.id, productId: item.id })}
                                                disabled={removeCartItemMutation.isPending}
                                                className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors flex-shrink-0"
                                                title="حذف المنتج من السلة"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Footer at the End (توتال العناصر بالسلة، توتال حسابهم، وزر إتمام الطلب) */}
                            <div className="p-4 sm:p-5 bg-[#FAF9F6] border-t border-[#EAE8E2]">
                                <div className="bg-white p-4 rounded-xl border border-[#D5E3DB] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                                    {/* Total Items & Quantity */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                                        <div className="w-10 h-10 rounded-xl bg-[#EEF4F1] flex items-center justify-center text-[#2E5A44] flex-shrink-0">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-[#9A978F] block font-medium">توتال العناصر بالسلة:</span>
                                            <span className="text-sm font-bold text-[#1A2D23]">
                                                {modalItemsCount} أصناف <span className="text-[#2E5A44]">({modalTotalQuantity} قطعة)</span>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Total Amount & Order Checkout Action */}
                                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-[#EAE8E2]">
                                        <div className="text-right sm:text-left">
                                            <span className="text-xs text-[#9A978F] block font-medium">توتال الحساب (الإجمالي):</span>
                                            <span className="text-lg font-black text-[#2E5A44]">
                                                {formatCurrency(modalTotalPrice)} ج.م
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`هل أنت متأكد من إتمام الطلب للعميل "${viewingCart.user.name}" بإجمالي ${formatCurrency(modalTotalPrice)} ج.م وتحويله إلى طلب مؤكد؟`)) {
                                                    checkoutCartMutation.mutate(viewingCart.user.id)
                                                }
                                            }}
                                            disabled={checkoutCartMutation.isPending || modalItemsCount === 0}
                                            className="px-5 py-2.5 rounded-xl bg-[#2E5A44] text-white hover:bg-[#1A2D23] transition-colors text-sm font-bold shadow-sm flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
                                        >
                                            <Check className="w-4 h-4" />
                                            {checkoutCartMutation.isPending ? 'جاري الإتمام...' : 'إتمام وتأكيد الطلب'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
