import { useState, useEffect } from 'react'
import { Sidebar, Header } from '../components'
import { getUserRole, isCustomer, isSubAdmin } from '../services/api'

export default function AppLayout({ children, title, subtitle }) {
    const [collapsed, setCollapsed] = useState(false)
    const [mobileOpen, setMobileOpen] = useState(false)

    useEffect(() => {
        const path = window.location.pathname
        const role = getUserRole()

        // Customers must not access the web application
        if (role === 'customer') {
            window.location.href = '/login'
            return
        }

        // Sub-admins restricted from /settings and /sub-admins
        if (role === 'sub_admin' && (path.startsWith('/settings') || path.startsWith('/sub-admins'))) {
            window.location.href = '/pos'
            return
        }
    }, [])

    return (
        <div className="min-h-screen" dir="rtl" style={{ backgroundColor: '#FAF9F6' }}>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 lg:hidden"
                    style={{ backgroundColor: 'rgba(26,29,22,0.35)' }}
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 right-0 z-40
                transform transition-transform duration-300 ease-in-out
                lg:translate-x-0
                ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
            </div>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${collapsed ? 'lg:mr-20' : 'lg:mr-64'}`}>
                <Header
                    title={title}
                    subtitle={subtitle}
                    onMenuClick={() => setMobileOpen(!mobileOpen)}
                />
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
