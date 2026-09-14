import { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import { ShoppingBag, Plus, Minus, Trash2, ArrowLeft, Check, AlertCircle } from 'lucide-react'
import api, { getAuthUser } from '../../shared/services/api'

export default function ShopCart() {
    const [cart, setCart]         = useState([])
    const [wishlist, setWishlist] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [notice, setNotice]     = useState(null)
    const [customerNotes, setCustomerNotes] = useState('')
    const user = getAuthUser()

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

    const updateQuantity = (id, delta) => {
        const updated = cart.map(it => {
            if (it.id === id) {
                const q = it.quantity + delta
                return q > 0 ? { ...it, quantity: q } : null
            }
            return it
        }).filter(Boolean)
        saveCart(updated)
    }

    const removeItem = (id) => {
        saveCart(cart.filter(it => it.id !== id))
    }

    const clearCart = () => {
        saveCart([])
    }

    const subtotal = cart.reduce((sum, it) => sum + (parseFloat(it.price) || 0) * it.quantity, 0)

    const handleCheckout = async () => {
        if (!cart.length) return

        if (!user) {
            setNotice({ text: 'يرجى تسجيل الدخول أولاً لإتمام إجراءات طلب الشراء.', type: 'error' })
            return
        }

        setSubmitting(true)
        setNotice(null)

        try {
            const itemsPayload = cart.map(it => ({
                product_id: it.id,
                quantity: it.quantity,
                unit_price: parseFloat(it.price) || 0,
            }))

            const res = await api.post('/orders', {
                items: itemsPayload,
                payment_type: 'cash',
                notes: customerNotes || 'طلب عميل عبر متجر الموبايل/الويب',
            })

            clearCart()
            setNotice({ text: 'تم إنشاء وتقديم طلبك بنجاح! سيتم التواصل معك للتسليم.', type: 'success' })
        } catch (err) {
            setNotice({ text: err.response?.data?.message || 'حدث خطأ أثناء تنفيذ الطلب. يرجى المحاولة لاحقاً.', type: 'error' })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A2D23] font-sans flex flex-col" dir="rtl">
            <ShopHeader
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                wishlistCount={wishlist.length}
            />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                
                {/* Header */}
                <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#EBF5EF] text-[#2E5A44] flex items-center justify-center font-bold">
                            <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-[#1A2D23]">سلة التسوق الخاصة بك</h2>
                            <p className="text-xs text-[#7C7870]">راجع منتجاتك المختارة وتأكد من الكميات المطلوبة</p>
                        </div>
                    </div>

                    {cart.length > 0 && (
                        <button onClick={clearCart} className="text-xs font-bold text-[#922B21] hover:underline flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>تفريغ السلة</span>
                        </button>
                    )}
                </div>

                {notice && (
                    <div className={`p-4 rounded-2xl text-sm font-bold text-center border animate-fade-in flex items-center justify-between gap-3 ${
                        notice.type === 'success' ? 'bg-[#EBF5EF] border-[#ADCBBB] text-[#2E5A44]' : 'bg-[#FDEEEC] border-[#E8A09A] text-[#922B21]'
                    }`}>
                        <div className="flex items-center gap-2">
                            {notice.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <span>{notice.text}</span>
                        </div>
                    </div>
                )}

                {cart.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-[#EAE8E2] space-y-4">
                        <div className="w-16 h-16 rounded-full bg-[#FAF9F6] border border-[#EAE8E2] flex items-center justify-center mx-auto text-[#9A978F]">
                            <ShoppingBag className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-[#1A2D23]">سلة التسوق فارغة حالياً</h3>
                        <p className="text-xs text-[#7C7870] max-w-sm mx-auto">لم تقم بإضافة أي منتجات للسلة بعد. استعرض أقسام المتجر وأضف منتجاتك المفضلة.</p>
                        <Link href="/shop/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#2E5A44] text-white text-xs font-bold shadow-md hover:bg-[#234533] transition-all">
                            <span>تصفح المنتجات</span>
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Cart Items List */}
                        <div className="lg:col-span-2 space-y-3">
                            {cart.map((item) => {
                                const itemTotal = (parseFloat(item.price) || 0) * item.quantity
                                return (
                                    <div key={item.id} className="bg-white rounded-3xl p-4 sm:p-5 border border-[#EAE8E2] flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-[#FAF9F6] border border-[#F4F3EF] flex items-center justify-center font-black text-[#2E5A44] text-lg flex-shrink-0">
                                                {item.name?.charAt(0) || 'P'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#1A2D23]">{item.name}</h4>
                                                <p className="text-xs text-[#7C7870] mt-0.5">سعر الوحدة: {(parseFloat(item.price) || 0).toFixed(2)} ج.م</p>
                                                <span className="font-black text-sm text-[#2E5A44] block mt-1"> الإجمالي: {itemTotal.toFixed(2)} ج.م</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 bg-[#FAF9F6] border border-[#EAE8E2] rounded-2xl p-1">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-xl bg-white text-[#5C5950] font-bold flex items-center justify-center hover:bg-[#F4F3EF]">
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold text-[#1A2D23]">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-xl bg-[#2E5A44] text-white font-bold flex items-center justify-center hover:bg-[#234533]">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button onClick={() => removeItem(item.id)} className="p-2 rounded-xl text-[#9A978F] hover:text-[#922B21] hover:bg-[#FDEEEC]">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Order Summary & Checkout */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] space-y-4 sticky top-24">
                                <h3 className="text-base font-bold text-[#1A2D23]">ملخص الطلب</h3>

                                <div className="space-y-2 border-b border-[#F4F3EF] pb-4 text-xs font-semibold">
                                    <div className="flex justify-between text-[#5C5950]">
                                        <span>إجمالي المنتجات:</span>
                                        <span>{subtotal.toFixed(2)} ج.م</span>
                                    </div>
                                    <div className="flex justify-between text-[#5C5950]">
                                        <span>رسوم التوصيل:</span>
                                        <span className="text-[#2E5A44] font-bold">مجاني</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-baseline pt-1">
                                    <span className="font-bold text-sm text-[#1A2D23]">المبلغ الإجمالي:</span>
                                    <span className="font-black text-xl text-[#2E5A44]">{subtotal.toFixed(2)} ج.م</span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-1">ملاحظات أو تعليمات التوصيل (اختياري)</label>
                                    <textarea
                                        rows={2}
                                        value={customerNotes}
                                        onChange={e => setCustomerNotes(e.target.value)}
                                        placeholder="مثال: يرجى التوصيل في الفترة المسائية..."
                                        className="w-full p-3 rounded-2xl text-xs border border-[#EAE8E2] bg-[#FAF9F6]"
                                    />
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={submitting}
                                    className="w-full py-3.5 rounded-2xl bg-[#2E5A44] hover:bg-[#234533] text-white font-black text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
                                >
                                    {submitting ? 'جارٍ تنفيذ الطلب...' : 'تأكيد وإرسال الطلب'}
                                </button>
                            </div>
                        </div>

                    </div>
                )}

            </main>

            <ShopFooter />
            <MobileBottomNav active="cart" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
