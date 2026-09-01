import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@inertiajs/react'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import ProductGridCard from './components/ProductGridCard'
import {
    Sparkles, ArrowLeft, Layers, ShoppingBag, Heart,
    Percent, Truck, ShieldCheck, Headphones, Tag, ChevronLeft
} from 'lucide-react'
import api from '../../shared/services/api'

export default function ShopHome() {
    const [search, setSearch]       = useState('')
    const [cart, setCart]           = useState([])
    const [wishlist, setWishlist]   = useState([])
    const [selectedCat, setSelectedCat] = useState('all')

    // Sync cart & wishlist from localStorage
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

    // React Query: Fetch Products & Categories
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['shop-products', search, selectedCat],
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

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-10">
                
                {/* Hero Banner (Stitch Screen Design Inspiration) */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10 lg:p-12 text-white flex flex-col justify-between"
                    style={{ background: 'linear-gradient(135deg, #1A2D23 0%, #2E5A44 60%, #3A7259 100%)' }}>
                    <div className="max-w-xl space-y-4 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold">
                            <Sparkles className="w-3.5 h-3.5 text-[#ADCBBB]" />
                            <span>عروض طازجة يومية حصرية</span>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black leading-tight">
                            تسوق أفضل المواد الغذائية والمنتجات الطازجة
                        </h2>
                        <p className="text-xs sm:text-sm text-[#ADCBBB] font-medium leading-relaxed">
                            احصل على منتجاتك المفضلة من خضروات، فواكه، ومنتجات غذائية عالية الجودة وتأكد من وصولها إليك طازجة وبأفضل الأسعار.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-3">
                            <Link href="/shop/products" className="px-6 py-3 rounded-2xl bg-white text-[#2E5A44] font-black text-xs sm:text-sm shadow-md hover:bg-[#FAF9F6] transition-all flex items-center gap-2">
                                <span>تصفح المنتجات الآن</span>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                            <Link href="/shop/contact" className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold text-xs sm:text-sm backdrop-blur-md transition-all">
                                اتصل بنا والدعم
                            </Link>
                        </div>
                    </div>

                    <div className="absolute left-[-20px] bottom-[-20px] w-64 h-64 rounded-full bg-[#3A7259]/30 blur-3xl pointer-events-none" />
                </div>

                {/* Categories Slider */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-black text-[#1A2D23]">الأقسام والتصنيفات</h3>
                        <Link href="/shop/products" className="text-xs font-bold text-[#2E5A44] hover:underline flex items-center gap-1">
                            <span>عرض الكل</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                        <button
                            onClick={() => setSelectedCat('all')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                                selectedCat === 'all'
                                    ? 'bg-[#2E5A44] text-white border-[#2E5A44] shadow-sm'
                                    : 'bg-white text-[#5C5950] border-[#EAE8E2] hover:border-[#2E5A44]'
                            }`}
                        >
                            جميع الأقسام
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCat(cat.id)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    selectedCat === cat.id
                                        ? 'bg-[#2E5A44] text-white border-[#2E5A44] shadow-sm'
                                        : 'bg-white text-[#5C5950] border-[#EAE8E2] hover:border-[#2E5A44]'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Products Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black text-[#1A2D23]">المنتجات المميزة</h3>
                            <p className="text-xs text-[#7C7870]">أجود الأغذية والمنتجات المتوفرة في المتجر</p>
                        </div>
                        <span className="text-xs font-bold text-[#5C5950]">
                            إجمالي: {products.length} منتج
                        </span>
                    </div>

                    {productsLoading ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                            <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-[#5C5950]">جاري جلب المنتجات الطازجة...</p>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                            <ShoppingBag className="w-12 h-12 text-[#9A978F] mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-bold text-[#5C5950]">لا توجد منتجات حالياً في هذا القسم</p>
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
                </div>

            </main>

            <ShopFooter />
            <MobileBottomNav active="home" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
