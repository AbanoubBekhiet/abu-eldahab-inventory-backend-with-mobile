import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usePage, router } from '@inertiajs/react'
import { SearchInput } from '../../shared/components'
import Cart from './components/Cart'
import POSProductCard from './components/POSProductCard'
import PendingCartsPanel from './components/PendingCartsPanel'
import CategoryFilter from '../products/components/CategoryFilter'
import { Minimize2, ArrowLeft, RefreshCw, ShoppingBag, Printer, X, Check, AlertCircle } from 'lucide-react'
import { buildPrintHTML } from '../orders/components/OrderDetailsModal'
import api from '../../shared/services/api'

export default function POSIndex({ products: initialProducts, categories: initialCategories, customers: initialCustomers, pendingCarts: initialPendingCarts }) {
    const { appSettings } = usePage().props || {}
    const queryClient = useQueryClient()
    const loadMoreRef = useRef(null)

    // Active cart state
    const [cart, setCart]                         = useState([])
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [showCart, setShowCart]                 = useState(false)

    // Receipt print preview state
    const [receipt, setReceipt]                   = useState(null)

    // Notification states
    const [notice, setNotice]                     = useState(null)

    // Products filter state — typed search + selected category
    const [searchInput, setSearchInput]            = useState('')
    const [appliedSearch, setAppliedSearch]        = useState({ query: '', category_id: '' })

    // Infinite scroll page state (reset when filter changes)
    const [page, setPage]                          = useState(1)
    const [allProducts, setAllProducts]            = useState(() => {
        // Seed from SSR data
        if (initialProducts?.data) return initialProducts.data
        if (Array.isArray(initialProducts)) return initialProducts
        return []
    })
    const [hasMore, setHasMore]                    = useState(() => initialProducts?.next_page_url != null)
    const [isLoadingMore, setIsLoadingMore]        = useState(false)

    // Debounce search input → appliedSearch
    useEffect(() => {
        const t = setTimeout(() => {
            setAppliedSearch(prev => {
                if (prev.query === searchInput) return prev
                return { ...prev, query: searchInput }
            })
        }, 300)
        return () => clearTimeout(t)
    }, [searchInput])

    // When filter changes, reset product list and page
    useEffect(() => {
        setAllProducts([])
        setHasMore(true)
        setPage(1)
    }, [appliedSearch])

    // Fetch one page of products when page or filter changes
    const fetchProducts = useCallback(async (pageNum, filter) => {
        const res = await api.get('/pos', {
            params: {
                query: filter.query || undefined,
                category_id: filter.category_id || undefined,
                page: pageNum,
            }
        })
        return res.data
    }, [])

    // Load page 1 whenever filter changes (replaces initial data too when no filters)
    const { data: posData, isLoading: isPosLoading } = useQuery({
        queryKey: ['pos-meta', appliedSearch],
        queryFn: async () => fetchProducts(1, appliedSearch),
        placeholderData: (!appliedSearch.query && !appliedSearch.category_id) ? {
            products: initialProducts,
            categories: initialCategories,
            customers: initialCustomers,
            pendingCarts: initialPendingCarts,
        } : undefined,
        staleTime: 0,
    })

    // When posData page 1 arrives, seed allProducts
    useEffect(() => {
        if (!posData) return
        const data = posData.products?.data ?? (Array.isArray(posData.products) ? posData.products : [])
        setAllProducts(data)
        setHasMore(!!posData.products?.next_page_url)
        setPage(1)
    }, [posData])

    // Derived lists from posData
    const categories    = posData?.categories   || initialCategories || []
    const customers     = posData?.customers    || initialCustomers  || []
    const pendingCarts  = Array.isArray(posData?.pendingCarts)
        ? posData.pendingCarts
        : (posData?.pendingCarts?.data ?? (initialPendingCarts?.data ?? (Array.isArray(initialPendingCarts) ? initialPendingCarts : [])))

    // ── Infinite scroll: load next page when sentinel is visible ──
    useEffect(() => {
        if (!loadMoreRef.current) return
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isPosLoading) {
                    const nextPage = page + 1
                    setIsLoadingMore(true)
                    fetchProducts(nextPage, appliedSearch).then(res => {
                        const more = res.products?.data ?? []
                        setAllProducts(prev => [...prev, ...more])
                        setHasMore(!!res.products?.next_page_url)
                        setPage(nextPage)
                        setIsLoadingMore(false)
                    }).catch(() => setIsLoadingMore(false))
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(loadMoreRef.current)
        return () => observer.disconnect()
    }, [hasMore, isLoadingMore, isPosLoading, page, appliedSearch, fetchProducts])

    // ── Pending Carts local state — instant UI updates ──────────────────
    const [localPendingCarts, setLocalPendingCarts] = useState(() => {
        if (Array.isArray(initialPendingCarts)) return initialPendingCarts
        if (Array.isArray(initialPendingCarts?.data)) return initialPendingCarts.data
        return []
    })

    // Keep local state in sync when server data arrives (e.g. on refresh)
    useEffect(() => {
        if (!posData?.pendingCarts) return
        const fresh = Array.isArray(posData.pendingCarts)
            ? posData.pendingCarts
            : (posData.pendingCarts?.data ?? [])
        setLocalPendingCarts(fresh)
    }, [posData?.pendingCarts])

    // Save Pending Cart Mutation
    const saveCartMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/pos/pending-carts', payload)
            return res.data
        },
        onSuccess: (data) => {
            setNotice({ type: 'success', text: data.message || 'تم حفظ السلة كسلة معلقة بنجاح!' })
            setCart([])
            setSelectedCustomer(null)
            // Optimistically add the saved cart to local list immediately
            if (data.pending_cart) {
                setLocalPendingCarts(prev => [{ ...data.pending_cart, customer: null, items: [] }, ...prev])
            }
            queryClient.invalidateQueries({ queryKey: ['pos-meta'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء حفظ السلة' })
        }
    })

    // Swap / Resume Pending Cart Mutation
    const swapCartMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/pos/pending-carts/swap', payload)
            return res.data
        },
        onSuccess: (data) => {
            if (data.resumed_cart) {
                setCart(data.resumed_cart.items || [])
                setSelectedCustomer(data.resumed_cart.customer || null)
                setNotice({ type: 'success', text: 'تم استئناف السلة المعلقة!' })
            }
            queryClient.invalidateQueries({ queryKey: ['pos-meta'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء استبدال السلة' })
        }
    })

    // Complete Order Mutation
    const completeOrderMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/pos/complete-order', payload)
            return res.data
        },
        onSuccess: (data) => {
            if (data.completed_order) {
                setReceipt(data.completed_order)
            }
            setCart([])
            setSelectedCustomer(null)
            setNotice({ type: 'success', text: data.message || 'تم إتمام الطلب بنجاح!' })
            queryClient.invalidateQueries({ queryKey: ['pos-meta'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء إتمام الطلب' })
        }
    })

    // Delete Pending Cart Mutation
    const deletePendingCartMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/pos/pending-carts/${id}`)
            return res.data
        },
        onMutate: (id) => {
            // Optimistically remove from local list immediately
            setLocalPendingCarts(prev => prev.filter(c => c.id !== id))
        },
        onSuccess: (data) => {
            setNotice({ type: 'success', text: data.message || 'تم حذف السلة المعلقة بنجاح!' })
            queryClient.invalidateQueries({ queryKey: ['pos-meta'] })
        },
        onError: (err, id) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء حذف السلة المعلقة' })
            queryClient.invalidateQueries({ queryKey: ['pos-meta'] })
        }
    })

    // ── Cart manipulation ──────────────────────────────────────────────
    const addToCart = (product) => {
        if (product.stock <= 0) {
            setNotice({ type: 'error', text: 'المنتج نفذ من المخزون!' })
            return
        }

        setCart(prev => {
            const existing = prev.find(i => i.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) {
                    setNotice({ type: 'error', text: 'لا يمكن إضافة كمية أكبر من المخزون المتوفر!' })
                    return prev
                }
                return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
            }
            return [...prev, { ...product, quantity: 1 }]
        })
    }

    const increment = (id) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                if (i.quantity >= i.stock) {
                    setNotice({ type: 'error', text: 'الكمية المطلوبة تتجاوز المخزون المتوفر!' })
                    return i
                }
                return { ...i, quantity: i.quantity + 1 }
            }
            return i
        }))
    }

    const decrement = (id) => setCart(prev => {
        const item = prev.find(i => i.id === id)
        if (item && item.quantity === 1) {
            return prev.filter(i => i.id !== id)
        }
        return prev.map(i => i.id === id ? { ...i, quantity: i.quantity - 1 } : i)
    })

    const changeQuantity = (id, newQty) => {
        if (newQty <= 0) {
            setCart(prev => prev.filter(i => i.id !== id))
            return
        }
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                if (newQty > i.stock) {
                    setNotice({ type: 'error', text: `الكمية المطلوبة تتجاوز المخزون المتوفر (${i.stock})!` })
                    return { ...i, quantity: i.stock }
                }
                return { ...i, quantity: newQty }
            }
            return i
        }))
    }
    const remove = (id) => setCart(prev => prev.filter(i => i.id !== id))
    const changePrice = (id, newPrice) => setCart(prev => prev.map(i => i.id === id ? { ...i, price: newPrice } : i))
    const clearCart = () => {
        setCart([])
        setSelectedCustomer(null)
    }

    // Save cart as pending
    const handleSaveCart = (customer) => {
        const targetCustomer = customer || selectedCustomer
        if (!targetCustomer || !targetCustomer.id) {
            setNotice({ type: 'error', text: 'يجب اختيار عميل أولاً لحفظ السلة المعلقة' })
            return
        }
        if (cart.length === 0 || saveCartMutation.isPending) return
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
        const items_count = cart.reduce((s, i) => s + i.quantity, 0)

        saveCartMutation.mutate({
            customer_id: targetCustomer.id,
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            total: parseFloat(total.toFixed(2)),
            items_count,
        })
    }

    // Swap / Resume pending cart
    const handleResume = (pendingCart) => {
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)
        const items_count = cart.reduce((s, i) => s + i.quantity, 0)

        // Optimistically remove the resumed cart from the list immediately
        setLocalPendingCarts(prev => prev.filter(c => c.id !== pendingCart.id))

        if (cart.length > 0) {
            if (!selectedCustomer) {
                setNotice({ type: 'error', text: 'يرجى اختيار عميل أولاً لحفظ السلة الحالية كسلة معلقة قبل الاستبدال' })
                return
            }
            swapCartMutation.mutate({
                resume_pending_cart_id: pendingCart.id,
                customer_id: selectedCustomer.id,
                items: cart.map(item => ({
                    id: item.id,
                    quantity: item.quantity,
                    price: item.price
                })),
                total: parseFloat(total.toFixed(2)),
                items_count,
            })
        } else {
            swapCartMutation.mutate({
                resume_pending_cart_id: pendingCart.id,
            })
        }
    }

    // Complete order
    const handleCompleteOrder = (customer, paymentType = 'كاش', paidAmount = 0) => {
        if (cart.length === 0 || completeOrderMutation.isPending) return
        const total = cart.reduce((s, i) => s + i.price * i.quantity, 0)

        completeOrderMutation.mutate({
            customer_id: customer.id,
            items: cart.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price
            })),
            total_price: parseFloat(total.toFixed(2)),
            payment_type: paymentType,
            paid_amount: paymentType === 'آجل' ? paidAmount : parseFloat(total.toFixed(2)),
        })
    }

    const isSaving = saveCartMutation.isPending || swapCartMutation.isPending || completeOrderMutation.isPending
    const cartItemCount = cart.reduce((s, i) => s + i.quantity, 0)

    const handleDirectPrint = (receiptData, settings = {}) => {
        const html = buildPrintHTML(receiptData, settings)
        const w = window.open('', '_blank', 'width=800,height=700')
        w.document.write(html)
        w.document.close()
        w.focus()
        setTimeout(() => { w.print(); w.close() }, 400)
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden text-right" style={{ backgroundColor: '#FAF9F6' }} dir="rtl">
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-receipt-area, #print-receipt-area * {
                        visibility: visible;
                    }
                    #print-receipt-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}} />

            {/* ── Header ── */}
            <header className="flex items-center gap-3 px-4 sm:px-5 py-2.5 bg-white border-b border-[#EAE8E2] flex-shrink-0">
                {/* Back button + title */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1.5 rounded-lg hover:bg-[#FAF9F6] transition-colors border border-[#EAE8E2]"
                    >
                        <ArrowLeft className="w-4 h-4 text-[#5C5950]" />
                    </button>
                    <h1 className="text-sm font-bold text-[#1A2D23] font-serif whitespace-nowrap">شاشة المبيعات</h1>
                </div>

                {/* Pending carts horizontal strip */}
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                    <span className="text-[10px] font-semibold text-[#9A978F] whitespace-nowrap flex-shrink-0">معلقة:</span>
                    <PendingCartsPanel pendingCarts={localPendingCarts} onResume={handleResume} onDelete={(id) => deletePendingCartMutation.mutate(id)} />
                </div>

                {/* Toast Notification */}
                {notice && (
                    <div className={`hidden md:flex flex-shrink-0 items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold shadow-sm ${
                        notice.type === 'success'
                            ? 'bg-[#EAF6EE] border-[#B7E1C5] text-[#2E5A44]'
                            : 'bg-[#FDEEEC] border-[#F5C2C0] text-[#C0392B]'
                    }`}>
                        {notice.type === 'success' ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                        {notice.text}
                    </div>
                )}

                {/* Mobile cart toggle */}
                <button
                    onClick={() => setShowCart(!showCart)}
                    className="lg:hidden flex-shrink-0 relative p-2 rounded-lg bg-[#D5E6DC] text-[#2E5A44] border border-[#ADCBBB]"
                >
                    <ShoppingBag className="w-4 h-4" />
                    {cartItemCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#2E5A44] text-white text-[9px] font-bold flex items-center justify-center">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </header>

            {/* Mobile notification fallback */}
            {notice && (
                <div className={`md:hidden flex items-center gap-2 p-3 border-b text-xs font-bold ${
                    notice.type === 'success'
                        ? 'bg-[#EAF6EE] border-[#B7E1C5] text-[#2E5A44]'
                        : 'bg-[#FDEEEC] border-[#F5C2C0] text-[#C0392B]'
                }`}>
                    {notice.text}
                </div>
            )}

            {/* ── Main Workspace ── */}
            <div className="flex-1 flex overflow-hidden">

                {/* COLUMN 1: Products Catalogue — 1/3 width */}
                <div className={`flex flex-col overflow-hidden border-l border-[#EAE8E2] bg-[#FAF9F6] ${showCart ? 'hidden lg:flex' : 'flex'}`}
                    style={{ width: '33%', minWidth: '240px', flexShrink: 0 }}>

                    {/* Search + Category Filter */}
                    <div className="px-3 py-2.5 space-y-2 bg-white border-b border-[#EAE8E2] flex-shrink-0">
                        <SearchInput
                            placeholder="ابحث عن منتج..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        <CategoryFilter
                            categories={categories}
                            selected={appliedSearch.category_id || 'all'}
                            onChange={(categoryId) => setAppliedSearch(prev => ({ ...prev, category_id: categoryId === 'all' ? '' : categoryId }))}
                        />
                    </div>

                    {/* Products Grid — 3 columns compact */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {isPosLoading && allProducts.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 text-[#9A978F] animate-spin" />
                            </div>
                        ) : allProducts.length === 0 ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-xs text-[#9A978F] font-semibold text-center">لا توجد منتجات</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 gap-1.5">
                                    {allProducts.map((product) => (
                                        <POSProductCard
                                            key={product.id}
                                            product={product}
                                            onAdd={addToCart}
                                        />
                                    ))}
                                </div>
                                <div ref={loadMoreRef} className="py-4 flex justify-center">
                                    {(isLoadingMore || (isPosLoading && allProducts.length > 0)) && (
                                        <span className="flex items-center gap-1.5 text-[10px] text-[#9A978F] animate-pulse">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            تحميل المزيد...
                                        </span>
                                    )}
                                    {!hasMore && allProducts.length > 0 && (
                                        <span className="text-[10px] text-[#C8C5BE]">تم تحميل جميع المنتجات</span>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* COLUMN 2: Active Cart — 2/3 width */}
                <div className={`flex-1 flex-col border-r border-[#EAE8E2] bg-white ${showCart ? 'flex' : 'hidden lg:flex'} overflow-hidden`}>
                    <div className="lg:hidden p-2 border-b border-[#EAE8E2] bg-[#FAF9F6]">
                        <button
                            onClick={() => setShowCart(false)}
                            className="flex items-center gap-1.5 text-xs font-bold text-[#5C5950] hover:text-[#1A2D23]"
                        >
                            <Minimize2 className="w-3.5 h-3.5" />
                            العودة للمنتجات
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <Cart
                            items={cart}
                            onIncrement={increment}
                            onDecrement={decrement}
                            onQuantityChange={changeQuantity}
                            onRemove={remove}
                            onPriceChange={changePrice}
                            onClear={clearCart}
                            onSaveCart={handleSaveCart}
                            onCompleteOrder={handleCompleteOrder}
                            customers={customers}
                            selectedCustomer={selectedCustomer}
                            setSelectedCustomer={setSelectedCustomer}
                            isSaving={isSaving}
                        />
                    </div>
                </div>
            </div>

            {/* ── Receipt Print Modal with Blurred Background ── */}
            {receipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A2D23]/40 backdrop-blur-md p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-[zoomIn_0.2s_ease-out]">

                        {/* Header controls (No print) */}
                        <div className="no-print flex items-center justify-between px-6 py-4 bg-[#FAF9F6] border-b border-[#EAE8E2]">
                            <h3 className="text-base font-bold text-[#1A2D23]">معاينة وتفاصيل الفاتورة</h3>
                            <button
                                onClick={() => setReceipt(null)}
                                className="p-1.5 rounded-lg hover:bg-[#EAE8E2] text-[#9A978F] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Printable Area */}
                        <div className="p-8 overflow-y-auto max-h-[70vh] flex-1 text-[#111]" id="print-receipt-area" style={{ fontFamily: "Arial, sans-serif" }}>

                            {/* Header Section */}
                            <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-[#1A2D23] text-right">
                                <div className="space-y-1">
                                    <h2 className="text-xl font-bold text-[#1A2D23]">
                                        {appSettings?.receipt_name || 'فاتورة طلب'}
                                    </h2>
                                    <p className="text-xs text-[#555]">فاتورة بيع</p>
                                    <div className="text-xs space-y-1 mt-2 text-[#333]">
                                        <div><strong>التاريخ:</strong> {receipt.date}</div>
                                        <div className="flex items-center gap-1 flex-wrap text-sm sm:text-base font-bold text-[#111]">
                                            <strong>العميل:</strong>
                                            <span className="text-base sm:text-lg font-extrabold">{receipt.customer_name}</span>
                                            {parseFloat(receipt.previous_balance || 0) !== 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                                    parseFloat(receipt.previous_balance || 0) > 0 ? 'bg-[#FDEEEC] text-[#C0392B]' : 'bg-[#EAF6EE] text-[#2E5A44]'
                                                }`}>
                                                    (رصيد سابق: {parseFloat(receipt.previous_balance || 0) > 0 ? `${parseFloat(receipt.previous_balance).toFixed(2)} ج.م` : `${Math.abs(parseFloat(receipt.previous_balance)).toFixed(2)} - ج.م`})
                                                </span>
                                            )}
                                        </div>
                                        {receipt.customer_address && receipt.customer_address !== '—' && (
                                            <div><strong>العنوان:</strong> {receipt.customer_address}</div>
                                        )}
                                        {(receipt.customer_phone || receipt.customer_phone_number || receipt.phone) && (
                                            <div><strong>هاتف العميل:</strong> {receipt.customer_phone || receipt.customer_phone_number || receipt.phone}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end text-right">
                                    {appSettings?.receipt_logo_url ? (
                                        <img
                                            src={appSettings.receipt_logo_url}
                                            alt="logo"
                                            className="max-h-16 max-w-[120px] object-contain mb-2"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl mb-2 shadow"
                                            style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}>
                                            {(appSettings?.receipt_name || 'م').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    {(appSettings?.phone1 || appSettings?.phone2) && (
                                        <div className="text-xs text-[#333] font-bold text-right leading-relaxed">
                                            📞 {[appSettings.phone1, appSettings.phone2].filter(Boolean).join('\n📞 ')}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Items Table */}
                            <table className="w-full text-sm border-collapse mb-4">
                                <thead>
                                    <tr className="bg-[#f5f5f5] border-b-2 border-[#ccc]">
                                        <th className="py-2 px-1 text-right font-bold text-[#333]">المنتج</th>
                                        <th className="py-2 px-1 text-center font-bold text-[#333]">الكمية</th>
                                        <th className="py-2 px-1 text-center font-bold text-[#333]">السعر</th>
                                        <th className="py-2 px-1 text-center font-bold text-[#333]">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {receipt.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-[#eee]">
                                            <td className="py-2 px-1 text-right text-[#111]">{idx + 1} - {item.name}</td>
                                            <td className="py-2 px-1 text-center text-[#111]">
                                                {item.quantity}{item.unit ? ' ' + item.unit : ''}
                                                {parseInt(item.number_of_items_in_unit || 0) > 1 && (
                                                    <div className="text-[10px] text-[#777]">
                                                        ({parseInt(item.number_of_items_in_unit) * item.quantity} قطعة)
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-2 px-1 text-center text-[#111]">
                                                {parseFloat(item.price).toFixed(2)}
                                            </td>
                                            <td className="py-2 px-1 text-center text-[#111] font-semibold">
                                                {parseFloat(item.total_price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* Total Units Count */}
                            <div className="py-2 border-t border-dashed border-[#ccc] text-xs text-[#333] text-right mb-2">
                                إجمالي الوحدات: <strong>{receipt.items.reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)}</strong>
                            </div>

                            {/* Payment Type */}
                            {receipt.payment_type && (
                                <div className="py-2 border-t border-dashed border-[#ccc] text-sm text-right mb-2 flex justify-between items-center">
                                    <span className="text-[#555]">نوع الدفع</span>
                                    <span className={`font-bold text-sm px-3 py-1 rounded-lg ${
                                        receipt.payment_type === 'آجل'
                                            ? 'bg-[#FDEEEC] text-[#C0392B] border border-[#F5C2C0]'
                                            : 'bg-[#EAF6EE] text-[#2E5A44] border border-[#B7E1C5]'
                                    }`}>{receipt.payment_type}</span>
                                </div>
                            )}

                            {/* Summary / Totals */}
                            <div className="border-t-2 border-[#111] pt-3 text-sm space-y-2">
                                <div className="flex justify-between font-bold text-base sm:text-lg">
                                    <span className="text-[#333] font-bold">الإجمالي</span>
                                    <span className="font-extrabold text-[#111] text-lg sm:text-xl">{parseFloat(receipt.total_price || 0).toFixed(2)} ج.م</span>
                                </div>
                                {receipt.discount > 0 && (
                                    <div className="flex justify-between text-orange-600 font-semibold">
                                        <span>الخصم</span>
                                        <span>- {parseFloat(receipt.discount).toFixed(2)} ج.م</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-[#ccc] pt-2 font-black text-xl sm:text-2xl">
                                    <span className="text-[#1A2D23] font-black">صافي الطلب</span>
                                    <span className="text-[#2E5A44] font-black text-xl sm:text-2xl">{parseFloat(receipt.net_total || receipt.total_price || 0).toFixed(2)} ج.م</span>
                                </div>

                                {/* Customer balance details */}
                                {(parseFloat(receipt.previous_balance || 0) !== 0 || parseFloat(receipt.credit_used || 0) > 0) && (
                                    <>
                                        <div className="flex justify-between text-sm pt-1 border-t border-dashed border-[#ccc]">
                                            <span className="text-[#555]">رصيد الحساب السابق</span>
                                            {parseFloat(receipt.previous_balance || 0) > 0 ? (
                                                <span className="font-semibold text-[#C0392B]">
                                                    {parseFloat(receipt.previous_balance).toFixed(2)} ج.م (دين)
                                                </span>
                                            ) : parseFloat(receipt.previous_balance || 0) < 0 ? (
                                                <span className="font-semibold text-[#2E5A44]">
                                                    {Math.abs(parseFloat(receipt.previous_balance)).toFixed(2)} - ج.م (دائن)
                                                </span>
                                            ) : (
                                                <span className="font-semibold text-[#555]">0.00 ج.م</span>
                                            )}
                                        </div>
                                        {parseFloat(receipt.credit_used || 0) > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-[#555]">رصيد دائن مستخدم للخصم</span>
                                                <span className="font-bold text-[#2E5A44]">
                                                    {parseFloat(receipt.credit_used).toFixed(2)} - ج.م
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div className="flex justify-between text-sm pt-1 border-t border-[#eee]">
                                    <span className="text-[#555]">المبلغ المدفوع</span>
                                    <span className="font-bold text-[#2E5A44]">{parseFloat(receipt.paid_amount || 0).toFixed(2)} ج.م</span>
                                </div>

                                {/* Final balance after this order */}
                                <div className="flex justify-between text-sm border-t border-dashed border-[#ccc] pt-2 mt-1">
                                    <span className="text-[#1A2D23] font-bold">رصيد الحساب بعد الطلب</span>
                                    {(() => {
                                        const prevBal = parseFloat(receipt.previous_balance || 0);
                                        const netTotal = parseFloat(receipt.net_total || receipt.total_price || 0);
                                        const paidAmt = parseFloat(receipt.paid_amount || 0);
                                        const finalBal = prevBal + netTotal - paidAmt;

                                        if (finalBal > 0) {
                                            return (
                                                <span className="font-bold text-[#C0392B] text-base">
                                                    {finalBal.toFixed(2)} ج.م (دين متبقي)
                                                </span>
                                            );
                                        } else if (finalBal < 0) {
                                            return (
                                                <span className="font-bold text-[#2E5A44] text-base">
                                                    {Math.abs(finalBal).toFixed(2)} - ج.م (رصيد دائن)
                                                </span>
                                            );
                                        } else {
                                            return <span className="font-bold text-[#555]">0.00 ج.م</span>;
                                        }
                                    })()}
                                </div>
                            </div>

                            {/* Footer Note */}
                            <div className="mt-8 text-center text-xs text-[#777] border-t border-dashed border-[#ccc] pt-4">
                                شكراً لتعاملكم معنا
                            </div>
                        </div>

                        {/* Actions (No print) */}
                        <div className="no-print px-6 py-4 bg-[#FAF9F6] border-t border-[#EAE8E2] flex gap-3">
                            <button
                                onClick={() => handleDirectPrint(receipt, appSettings)}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm bg-[#2E5A44] hover:bg-[#234533] text-white transition-all shadow-md active:scale-95"
                            >
                                <Printer className="w-4 h-4" />
                                طباعة الفاتورة
                            </button>
                            <button
                                onClick={() => setReceipt(null)}
                                className="flex-1 py-3 rounded-xl font-bold text-sm bg-white border border-[#D6D4CE] text-[#5C5950] hover:bg-[#EAE8E2] transition-all active:scale-95"
                            >
                                إغلاق
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    )
}