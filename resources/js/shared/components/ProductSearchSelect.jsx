import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import api from '../services/api'

export default function ProductSearchSelect({
    products: fallbackProducts = [],
    value,
    onChange,
    selectedProduct: propSelectedProduct = null,
    placeholder = "ابحث عن المنتج بالاسم أو الوحدة..."
}) {
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState([])
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const [selectedItem, setSelectedItem] = useState(propSelectedProduct)
    const containerRef = useRef(null)

    // Debounce search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search)
        }, 300)
        return () => clearTimeout(handler)
    }, [search])

    // Load products on dropdown open or search change
    useEffect(() => {
        if (!isOpen) return

        let active = true
        setIsLoading(true)
        setPage(1)

        api.get('/products', {
            params: {
                search: debouncedSearch.trim() || undefined,
                page: 1,
            }
        }).then(res => {
            if (!active) return
            const data = res.data.products?.data || []
            setItems(data)
            setHasMore(!!res.data.products?.next_page)
            setIsLoading(false)
        }).catch(() => {
            if (!active) return
            if (fallbackProducts.length > 0) {
                const q = debouncedSearch.trim().toLowerCase()
                const filtered = q
                    ? fallbackProducts.filter(p =>
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.unit && p.unit.toLowerCase().includes(q))
                    )
                    : fallbackProducts
                setItems(filtered)
            }
            setIsLoading(false)
        })

        return () => { active = false }
    }, [isOpen, debouncedSearch])

    // Keep selected item updated
    useEffect(() => {
        if (propSelectedProduct) {
            setSelectedItem(propSelectedProduct)
            return
        }
        if (!value) {
            setSelectedItem(null)
            return
        }
        const found = items.find(p => String(p.id) === String(value)) ||
                      fallbackProducts.find(p => String(p.id) === String(value))
        if (found) {
            setSelectedItem(found)
        } else if (!selectedItem || String(selectedItem.id) !== String(value)) {
            api.get('/products', { params: { ids: value } }).then(res => {
                const list = res.data.products?.data || []
                if (list.length > 0) setSelectedItem(list[0])
            }).catch(() => {})
        }
    }, [value, propSelectedProduct, items, fallbackProducts])

    // Infinite scroll
    const handleScroll = useCallback((e) => {
        const el = e.currentTarget
        if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) {
            if (hasMore && !isLoading && !isLoadingMore) {
                const nextPage = page + 1
                setIsLoadingMore(true)
                api.get('/products', {
                    params: {
                        search: debouncedSearch.trim() || undefined,
                        page: nextPage,
                    }
                }).then(res => {
                    const more = res.data.products?.data || []
                    setItems(prev => {
                        const existing = new Set(prev.map(p => p.id))
                        return [...prev, ...more.filter(p => !existing.has(p.id))]
                    })
                    setHasMore(!!res.data.products?.next_page)
                    setPage(nextPage)
                    setIsLoadingMore(false)
                }).catch(() => {
                    setIsLoadingMore(false)
                })
            }
        }
    }, [hasMore, isLoading, isLoadingMore, page, debouncedSearch])

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const getProductLabel = (p) => {
        if (!p) return ''
        return p.unit ? `${p.name} (${p.unit})` : p.name
    }

    return (
        <div ref={containerRef} className="relative w-full text-right">
            <div className="relative">
                <input
                    type="text"
                    value={isOpen ? search : getProductLabel(selectedItem)}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        if (!isOpen) setIsOpen(true)
                    }}
                    onFocus={() => {
                        setSearch('')
                        setIsOpen(true)
                    }}
                    placeholder={selectedItem ? getProductLabel(selectedItem) : placeholder}
                    className="w-full h-11 px-3 pl-9 rounded-xl border border-[#D6D4CE] bg-white text-sm font-semibold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44] transition-colors"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A978F]">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#2E5A44]" /> : <Search className="w-4 h-4" />}
                </div>
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('', null)
                            setSearch('')
                            setSelectedItem(null)
                            setIsOpen(true)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A978F] hover:text-[#C0392B] p-1 rounded"
                        title="إلغاء التحديد"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    onScroll={handleScroll}
                    className="absolute z-50 w-full mt-1 bg-white border border-[#EAE8E2] rounded-xl shadow-xl max-h-56 overflow-y-auto divide-y divide-[#FAF9F6] text-right"
                >
                    {isLoading && items.length === 0 ? (
                        <div className="p-4 flex items-center justify-center gap-2 text-xs text-[#2E5A44] font-semibold">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جارٍ تحميل المنتجات...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="p-3 text-xs text-[#9A978F] text-center">لا يوجد منتج مطابق للبحث</div>
                    ) : (
                        <>
                            {items.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedItem(p)
                                        onChange(p.id, p)
                                        setSearch('')
                                        setIsOpen(false)
                                    }}
                                    className={`w-full text-right px-3 py-2.5 text-xs transition-colors hover:bg-[#EEF4F1] flex items-center justify-between gap-2 ${
                                        String(value) === String(p.id) ? 'bg-[#EEF4F1] font-bold text-[#2E5A44]' : 'text-[#1A2D23]'
                                    }`}
                                >
                                    <span className="font-bold truncate">
                                        {p.name}
                                        {p.unit && <span className="text-[11px] font-semibold text-[#2E5A44] mr-1.5">({p.unit})</span>}
                                    </span>
                                    <span className="text-[10px] text-[#7C7870] flex-shrink-0 bg-[#FAF9F6] px-2 py-0.5 rounded-md border border-[#EAE8E2]">
                                        مخزون: <strong className="text-[#2E5A44]">{p.stock}</strong> | تكلفة: <strong>{p.cost_price || p.price || 0}ج</strong>
                                    </span>
                                </button>
                            ))}
                            {isLoadingMore && (
                                <div className="p-2.5 flex items-center justify-center gap-2 text-[11px] text-[#2E5A44] font-medium bg-[#FAF9F6]">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>تحميل المزيد من المنتجات...</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
