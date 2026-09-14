import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import ProductGridCard from './components/ProductGridCard'
import { Heart, ArrowLeft, Trash2 } from 'lucide-react'

export default function ShopWishlist() {
    const [cart, setCart]         = useState([])
    const [wishlist, setWishlist] = useState([])

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
        const updated = wishlist.filter(w => w.id !== product.id)
        saveWishlist(updated)
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A2D23] font-sans flex flex-col" dir="rtl">
            <ShopHeader
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                wishlistCount={wishlist.length}
            />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                
                <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FDEEEC] text-[#922B21] flex items-center justify-center font-bold">
                            <Heart className="w-5 h-5 fill-[#922B21]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1A2D23]">قائمة المنتجات المفضلة</h2>
                            <p className="text-xs text-[#7C7870]">المنتجات التي قمت بحفظها للشراء لاحقاً</p>
                        </div>
                    </div>

                    {wishlist.length > 0 && (
                        <button onClick={() => saveWishlist([])} className="text-xs font-bold text-[#922B21] hover:underline flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>تفريغ المفضلة</span>
                        </button>
                    )}
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#EAE8E2] space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#EAE8E2] flex items-center justify-center mx-auto text-[#9A978F]">
                            <Heart className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-[#1A2D23]">قائمة المفضلة فارغة حالياً</h3>
                        <p className="text-xs text-[#7C7870] max-w-sm mx-auto">يمكنك إضافة أي منتج للمفضلة بالضغط على أيقونة القلب في بطاقة المنتج.</p>
                        <Link href="/shop/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E5A44] text-white text-xs font-bold shadow-md hover:bg-[#234533] transition-all">
                            <span>تصفح المنتجات</span>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {wishlist.map((prod) => (
                            <ProductGridCard
                                key={prod.id}
                                product={prod}
                                isWishlisted={true}
                                isInCart={cart.some(c => c.id === prod.id)}
                                onToggleWishlist={handleToggleWishlist}
                                onAddToCart={handleAddToCart}
                            />
                        ))}
                    </div>
                )}

            </main>

            <ShopFooter />
            <MobileBottomNav active="wishlist" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
