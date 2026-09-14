import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import ProductGridCard from './components/ProductGridCard'
import { Grid, Filter, Search, ShoppingBag } from 'lucide-react'
import api from '../../shared/services/api'

export default function ShopProducts() {
    const [search, setSearch]       = useState('')
    const [cart, setCart]           = useState([])
    const [wishlist, setWishlist]   = useState([])
    const [selectedCat, setSelectedCat] = useState('all')

    useEffect(() => {
        try {
            const c = localStorage.getItem('shop_cart')
            const w = localStorage.getItem('shop_wishlist')
            if (c) setCart(JSON.parse(c))
            if (w) setWishlist(JSON.parse(w))
        } catch {}
    }, [])

    const saveCart = (newCart) => {
        setCart(newCart)
        localStorage.setItem('shop_cart', JSON.stringify(newCart))
    }

    const saveWishlist = (newWishlist) => {
        setWishlist(newWishlist)
        localStorage.setItem('shop_wishlist', JSON.stringify(newWishlist))
    }

    const handleAddToCart = (product) => {
        const existingIdx = cart.findIndex(it => it.id === product.id)
        if (existingIdx > -1) {
            const updated = [...cart]
            updated[existingIdx].quantity += 1
            saveCart(updated)
        } else {
            saveCart([...cart, { ...product, quantity: 1 }])
        }
    }

    const handleToggleWishlist = (product) => {
        const exists = wishlist.some(w => w.id === product.id)
        if (exists) {
            saveWishlist(wishlist.filter(w => w.id !== product.id))
        } else {
            saveWishlist([...wishlist, product])
        }
    }

    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['shop-catalog', search, selectedCat],
        queryFn: async () => {
            const res = await api.get('/products', {
                params: {
                    search: search || undefined,
                    category_id: selectedCat !== 'all' ? selectedCat : undefined
                }
            })
            return res.data
        }
    })

    const { data: categoriesData } = useQuery({
        queryKey: ['shop-categories'],
        queryFn: async () => {
            const res = await api.get('/categories')
            return res.data
        }
    })

    const products   = productsData?.data || []
    const categories = categoriesData?.data || []

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A2D23] font-sans flex flex-col" dir="rtl">
            <ShopHeader
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                wishlistCount={wishlist.length}
                search={search}
                onSearchChange={setSearch}
            />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                
                {/* Title & Filter Header */}
                <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-black text-[#1A2D23]">قائمة منتجات المتجر</h2>
                        <p className="text-xs text-[#7C7870] mt-0.5">استعرض كافة المنتجات والأصناف الغذائية المتوفرة</p>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto max-w-full">
                        <button
                            onClick={() => setSelectedCat('all')}
                            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                                selectedCat === 'all'
                                    ? 'bg-[#2E5A44] text-white border-[#2E5A44]'
                                    : 'bg-[#FAF9F6] text-[#5C5950] border-[#EAE8E2]'
                            }`}
                        >
                            الكل
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCat(cat.id)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
                                    selectedCat === cat.id
                                        ? 'bg-[#2E5A44] text-white border-[#2E5A44]'
                                        : 'bg-[#FAF9F6] text-[#5C5950] border-[#EAE8E2]'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Catalog Grid */}
                {productsLoading ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                        <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm font-semibold text-[#5C5950]">جاري تحميل قائمة المنتجات...</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                        <ShoppingBag className="w-12 h-12 text-[#9A978F] mx-auto mb-3 opacity-50" />
                        <p className="text-sm font-bold text-[#5C5950]">لم يتم العثور على منتجات مطابقة</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {products.map((prod) => (
                            <ProductGridCard
                                key={prod.id}
                                product={prod}
                                isWishlisted={wishlist.some(w => w.id === prod.id)}
                                isInCart={cart.some(c => c.id === prod.id)}
                                onToggleWishlist={handleToggleWishlist}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                )}

            </main>

            <ShopFooter />
            <MobileBottomNav active="products" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
