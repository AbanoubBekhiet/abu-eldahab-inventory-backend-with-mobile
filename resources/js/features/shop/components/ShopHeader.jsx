import { useState } from 'react'
import { Link } from '@inertiajs/react'
import {
    Leaf, Search, ShoppingBag, Heart, User,
    LogOut, Menu, X, Shield, ChevronDown
} from 'lucide-react'
import api, { clearAuthToken, getAuthUser } from '../../../shared/services/api'

export default function ShopHeader({ cartCount = 0, wishlistCount = 0, search = '', onSearchChange }) {
    const [menuOpen, setMenuOpen] = useState(false)
    const [userMenu, setUserMenu] = useState(false)
    const user = getAuthUser()

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout')
        } catch {
        } finally {
            clearAuthToken()
            window.location.href = '/login'
        }
    }

    return (
        <header className="sticky top-0 z-40 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-[#EAE8E2]" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
                
                {/* Brand / Logo */}
                <Link href="/shop" className="flex items-center gap-3 group flex-shrink-0">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md transition-transform group-hover:scale-105" style={{ backgroundColor: '#2E5A44' }}>
                        <Leaf className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base sm:text-lg font-black text-[#1A2D23] leading-none">أبو الدهب ماركت</h1>
                        <span className="text-[10px] font-bold tracking-widest text-[#2E5A44] uppercase">EcoMarket</span>
                    </div>
                </Link>

                {/* Search Bar */}
                <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
                    <input
                        type="text"
                        placeholder="ابحث عن منتج، خضروات، فواكه، أو مواد غذائية..."
                        value={search}
                        onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-2xl text-sm border border-[#EAE8E2] bg-white focus:outline-none focus:border-[#2E5A44] transition-all font-medium"
                    />
                    <Search className="w-4 h-4 text-[#9A978F] absolute right-3.5 top-3.5" />
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Wishlist */}
                    <Link href="/shop/wishlist" className="p-2.5 rounded-2xl hover:bg-white border border-transparent hover:border-[#EAE8E2] text-[#5C5950] relative transition-all">
                        <Heart className="w-5 h-5" />
                        {wishlistCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#922B21] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                {wishlistCount}
                            </span>
                        )}
                    </Link>

                    {/* Cart */}
                    <Link href="/shop/cart" className="p-2.5 rounded-2xl hover:bg-white border border-transparent hover:border-[#EAE8E2] text-[#5C5950] relative transition-all">
                        <ShoppingBag className="w-5 h-5" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2E5A44] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Account / User Menu */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setUserMenu(!userMenu)}
                                className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-[#EAE8E2] hover:border-[#2E5A44] transition-all text-right"
                            >
                                <div className="w-7 h-7 rounded-xl bg-[#2E5A44] text-white text-xs font-bold flex items-center justify-center">
                                    {user.name?.charAt(0) || 'U'}
                                </div>
                                <span className="hidden sm:inline text-xs font-bold text-[#1A2D23] max-w-[100px] truncate">
                                    {user.name}
                                </span>
                                <ChevronDown className="w-3.5 h-3.5 text-[#9A978F]" />
                            </button>

                            {userMenu && (
                                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#EAE8E2] py-2 z-50 animate-fade-in text-right">
                                    <div className="px-4 py-2 border-b border-[#F4F3EF]">
                                        <p className="text-xs font-bold text-[#1A2D23]">{user.name}</p>
                                        <p className="text-[10px] text-[#9A978F] truncate">{user.email}</p>
                                    </div>
                                    <Link href="/shop/profile" className="block px-4 py-2 text-xs font-semibold text-[#5C5950] hover:bg-[#FAF9F6] hover:text-[#2E5A44]">
                                        حسابي والطلبات
                                    </Link>
                                    {['admin', 'sub_admin'].includes(user.role) && (
                                        <a href="/" className="block px-4 py-2 text-xs font-semibold text-[#2E5A44] hover:bg-[#EBF5EF]">
                                            لوحة التحكم الإدارية
                                        </a>
                                    )}
                                    <button onClick={handleLogout} className="w-full text-right px-4 py-2 text-xs font-semibold text-[#922B21] hover:bg-[#FDEEEC] flex items-center gap-2">
                                        <LogOut className="w-3.5 h-3.5" />
                                        تسجيل الخروج
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/auth/login" className="px-4 py-2 rounded-2xl bg-[#2E5A44] text-white text-xs font-bold hover:bg-[#234533] transition-all shadow-sm">
                            تسجيل الدخول
                        </Link>
                    )}

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="md:hidden p-2 rounded-xl text-[#5C5950] hover:bg-white border border-transparent hover:border-[#EAE8E2]"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Mobile Dropdown Search & Menu */}
            {menuOpen && (
                <div className="md:hidden p-4 bg-white border-t border-[#EAE8E2] space-y-3 animate-fade-in" dir="rtl">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="ابحث عن منتج..."
                            value={search}
                            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl text-sm border border-[#EAE8E2] bg-[#FAF9F6]"
                        />
                        <Search className="w-4 h-4 text-[#9A978F] absolute right-3.5 top-3.5" />
                    </div>
                    <nav className="flex flex-col space-y-1 font-semibold text-sm text-[#5C5950]">
                        <Link href="/shop" className="px-3 py-2 rounded-xl hover:bg-[#FAF9F6]">الرئيسية</Link>
                        <Link href="/shop/products" className="px-3 py-2 rounded-xl hover:bg-[#FAF9F6]">جميع المنتجات</Link>
                        <Link href="/shop/wishlist" className="px-3 py-2 rounded-xl hover:bg-[#FAF9F6]">المفضلة</Link>
                        <Link href="/shop/cart" className="px-3 py-2 rounded-xl hover:bg-[#FAF9F6]">سلة التسوق</Link>
                        <Link href="/shop/contact" className="px-3 py-2 rounded-xl hover:bg-[#FAF9F6]">اتصل بنا والدعم</Link>
                    </nav>
                </div>
            )}
        </header>
    )
}
