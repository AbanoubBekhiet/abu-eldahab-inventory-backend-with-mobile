import { Link } from '@inertiajs/react'
import { Home, Grid, ShoppingBag, Heart, User } from 'lucide-react'

export default function MobileBottomNav({ active = 'home', cartCount = 0, wishlistCount = 0 }) {
    const items = [
        { key: 'home',     label: 'الرئيسية', icon: Home,        href: '/shop' },
        { key: 'products', label: 'المنتجات', icon: Grid,        href: '/shop/products' },
        { key: 'cart',     label: 'السلة',    icon: ShoppingBag, href: '/shop/cart', count: cartCount },
        { key: 'wishlist', label: 'المفضلة', icon: Heart,       href: '/shop/wishlist', count: wishlistCount },
        { key: 'profile',  label: 'حسابي',    icon: User,        href: '/shop/profile' },
    ]

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE8E2] px-2 py-1.5 shadow-lg" dir="rtl">
            <div className="grid grid-cols-5 gap-1">
                {items.map((it) => {
                    const isSelected = active === it.key
                    const Icon = it.icon
                    return (
                        <Link
                            key={it.key}
                            href={it.href}
                            className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all relative ${
                                isSelected ? 'text-[#2E5A44] font-black' : 'text-[#7C7870] font-medium'
                            }`}
                        >
                            <div className="relative">
                                <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                {it.count > 0 && (
                                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-[#922B21] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                        {it.count}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] mt-1 tracking-tight">{it.label}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
