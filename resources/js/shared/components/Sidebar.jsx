import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    ClipboardList,
    Users,
    Layers,
    Truck,
    BarChart3,
    Plus,
    HelpCircle,
    LogOut,
    Leaf,
    Settings,
    Wallet,
    Building2,
    ShieldCheck,
    Store,
    Tag,
    MapPin,
} from 'lucide-react'
import api, { clearAuthToken, getUserRole, isAdmin } from '../services/api'

const navItems = [
    { name: 'لوحة التحكم',   icon: LayoutDashboard, href: '/' },
    { name: 'المنتجات',     icon: Package,         href: '/products' },
    { name: 'التصنيفات',   icon: Layers,          href: '/categories' },
    { name: 'العملاء',     icon: Users,           href: '/customers' },
    { name: 'حسابات العملاء', icon: Wallet,     href: '/customers-accounts' },
    { name: 'الطلبات',     icon: ClipboardList,   href: '/orders' },
    { name: 'الموردين',    icon: Truck,           href: '/suppliers' },
    { name: 'حسابات الموردين', icon: Building2, href: '/suppliers-accounts' },
    { name: 'إدارة الموظفين', icon: ShieldCheck,   href: '/sub-admins', adminOnly: true },
    { name: 'الإحصائيات',  icon: BarChart3,       href: '/statistics' },
    { name: 'العروض',      icon: Tag,             href: '/offers' },
    { name: 'المناطق',     icon: MapPin,          href: '/regions' },
    { name: 'الإعدادات',   icon: Settings,        href: '/settings', adminOnly: true },
]

export default function Sidebar({ collapsed, onToggle }) {
    const url = typeof window !== 'undefined' ? window.location.pathname : '/'

    const isActive = (href) => {
        if (href === '/') return url === '/'
        return url.startsWith(href)
    }

    const handleLogout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
        } finally {
            clearAuthToken()
            window.location.href = '/login'
        }
    }

    return (
        <aside
            className={`
                h-full border-l transition-all duration-300 ease-in-out
                flex flex-col
                ${collapsed ? 'w-20' : 'w-60'}
            `}
            style={{ backgroundColor: '#F4F3EF', borderColor: '#E2E0DA' }}
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: '#E2E0DA' }}>
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: '#2E5A44' }}
                >
                    <Leaf className="w-5 h-5 text-white" />
                </div>
                {!collapsed && (
                    <div className="animate-fade-in min-w-0 text-right">
                        <h1 className="text-base font-bold tracking-tight leading-tight" style={{ color: '#2E5A44' }}>
                            أبو الدهب
                        </h1>
                        <p className="text-[10px] uppercase tracking-widest" style={{ color: '#9A978F' }}>
                            منظومة الإدارة
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                {navItems.filter(item => !item.adminOnly || isAdmin()).map((item) => {
                    const active = isActive(item.href)
                    return (
                        <a
                            key={item.name}
                            href={item.href}
                            className={`
                                group flex items-center gap-3 px-3 py-2.5 rounded-xl
                                transition-all duration-200
                                ${collapsed ? 'justify-center' : ''}
                            `}
                            style={active
                                ? { backgroundColor: '#D5E6DC', color: '#2E5A44' }
                                : { color: '#5C5950' }
                            }
                            onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = '#EAE8E2' }}
                            onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                            title={collapsed ? item.name : undefined}
                        >
                            <item.icon
                                className="w-5 h-5 flex-shrink-0 transition-colors"
                                style={{ color: active ? '#2E5A44' : '#7C7870' }}
                            />
                            {!collapsed && (
                                <span className={`text-sm animate-fade-in ${active ? 'font-bold' : 'font-medium'}`}>
                                    {item.name}
                                </span>
                            )}
                        </a>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="px-3 pb-3 space-y-1">
                {/* New Order CTA */}
                <a
                    href="/pos"
                    className={`
                        flex items-center justify-center gap-2 py-3 rounded-xl
                        font-bold text-sm text-white transition-all duration-200
                        hover:opacity-90 active:scale-[0.97] shadow-md
                        ${collapsed ? 'px-2' : 'px-4'}
                    `}
                    style={{ backgroundColor: '#2E5A44', boxShadow: '0 4px 12px rgba(46,90,68,0.3)' }}
                >
                    <Plus className="w-5 h-5" />
                    {!collapsed && <span>طلب جديد</span>}
                </a>

                <div className="pt-2 border-t mt-2 space-y-0.5" style={{ borderColor: '#E2E0DA' }}>
                    {!collapsed && (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[#EAE8E2] text-right"
                            style={{ color: '#7C7870' }}
                        >
                            <LogOut className="w-4.5 h-4.5" style={{ color: '#9A978F' }} />
                            تسجيل الخروج
                        </button>
                    )}
                </div>
            </div>
        </aside>
    )
}

