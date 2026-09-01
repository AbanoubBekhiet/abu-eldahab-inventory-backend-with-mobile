import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import { User, ShoppingBag, Clock, Mail, Shield, LogOut, CheckCircle } from 'lucide-react'
import api, { getAuthUser, clearAuthToken } from '../../shared/services/api'

export default function ShopProfile() {
    const [cart, setCart]         = useState([])
    const [wishlist, setWishlist] = useState([])
    const user = getAuthUser()

    useEffect(() => {
        try {
            const c = localStorage.getItem('shop_cart')
            const w = localStorage.getItem('shop_wishlist')
            if (c) setCart(JSON.parse(c))
            if (w) setWishlist(JSON.parse(w))
        } catch {}
    }, [])

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout')
        } catch {} finally {
            clearAuthToken()
            window.location.href = '/login'
        }
    }

    // React Query: Fetch Customer Orders if user logged in
    const { data: myOrdersData, isLoading } = useQuery({
        queryKey: ['my-customer-orders', user?.id],
        queryFn: async () => {
            if (!user) return null
            const res = await api.get('/orders')
            return res.data
        },
        enabled: !!user,
    })

    const orders = myOrdersData?.data || []

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A2D23] font-sans flex flex-col" dir="rtl">
            <ShopHeader
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                wishlistCount={wishlist.length}
            />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                
                {!user ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2] space-y-4">
                        <User className="w-12 h-12 text-[#9A978F] mx-auto mb-2 opacity-50" />
                        <h2 className="text-xl font-black text-[#1A2D23]">يرجى تسجيل الدخول لعرض حسابك</h2>
                        <p className="text-xs text-[#7C7870]">سجل الدخول حتى تتمكن من متابعة طلباتك السابقة وبياناتك الشخصية.</p>
                        <a href="/auth/login" className="inline-block px-6 py-3 rounded-2xl bg-[#2E5A44] text-white text-xs font-bold shadow-md hover:bg-[#234533]">
                            تسجيل الدخول الآن
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Profile Info Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] space-y-6 sticky top-24">
                                <div className="text-center space-y-2">
                                    <div className="w-20 h-20 rounded-3xl bg-[#2E5A44] text-white text-2xl font-black flex items-center justify-center mx-auto shadow-md">
                                        {user.name?.charAt(0) || 'U'}
                                    </div>
                                    <h3 className="text-lg font-black text-[#1A2D23]">{user.name}</h3>
                                    <span className="px-3 py-1 rounded-full bg-[#EBF5EF] text-[#2E5A44] text-xs font-bold inline-block">
                                        {user.role === 'admin' ? 'مدير النظام (Admin)' : user.role === 'sub_admin' ? 'موظف (Sub Admin)' : 'عميل مسجل (Customer)'}
                                    </span>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-[#F4F3EF] text-xs font-medium">
                                    <div className="flex items-center justify-between text-[#5C5950]">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-[#9A978F]" />
                                            <span>البريد الإلكتروني:</span>
                                        </div>
                                        <span className="font-bold text-[#1A2D23]">{user.email}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full py-3 rounded-2xl border border-[#E8A09A] text-[#922B21] hover:bg-[#FDEEEC] font-bold text-xs transition-all flex items-center justify-center gap-2"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>تسجيل الخروج</span>
                                </button>
                            </div>
                        </div>

                        {/* Order History */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-[#1A2D23]">سجل طلبياتي السابقة</h3>
                                    <p className="text-xs text-[#7C7870]">متابعة حالة الطلبات وتفاصيل المشتريات</p>
                                </div>
                                <span className="text-xs font-bold text-[#2E5A44]">
                                    إجمالي الطلبات: {orders.length}
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                                    <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm font-semibold text-[#5C5950]">جاري جلب سجل طلباتك...</p>
                                </div>
                            ) : orders.length === 0 ? (
                                <div className="bg-white rounded-3xl p-12 text-center border border-[#EAE8E2]">
                                    <ShoppingBag className="w-12 h-12 text-[#9A978F] mx-auto mb-3 opacity-50" />
                                    <p className="text-sm font-bold text-[#5C5950]">لم تقم بإجراء أي طلبات حتى الآن</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {orders.map((ord) => (
                                        <div key={ord.id} className="bg-white rounded-3xl p-5 border border-[#EAE8E2] space-y-3">
                                            <div className="flex items-center justify-between pb-3 border-b border-[#F4F3EF]">
                                                <div>
                                                    <span className="font-black text-sm text-[#1A2D23]">طلب رقم #{ord.id}</span>
                                                    <span className="text-xs text-[#9A978F] block mt-0.5">{ord.created_at || 'مؤخراً'}</span>
                                                </div>
                                                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#EBF5EF] text-[#2E5A44]">
                                                    {ord.status || 'مكتمل'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs font-bold">
                                                <span className="text-[#5C5950]">إجمالي الطلب:</span>
                                                <span className="text-[#2E5A44] text-sm">{(parseFloat(ord.total) || 0).toFixed(2)} ج.م</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </main>

            <ShopFooter />
            <MobileBottomNav active="profile" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
