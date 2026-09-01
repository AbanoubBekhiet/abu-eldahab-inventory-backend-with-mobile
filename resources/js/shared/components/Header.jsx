import { Settings, Menu } from 'lucide-react'
import { getAuthUser } from '../services/api'

export default function Header({ title, subtitle, onMenuClick }) {
    const user = getAuthUser()
    const initials = user?.name ? user.name.charAt(0).toUpperCase() : 'م'
    
    return (
        <header className="sticky top-0 z-30 glass">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
                {/* Left: Mobile Menu toggle */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 rounded-xl transition-colors hover:bg-[#EAE8E2]"
                    >
                        <Menu className="w-5 h-5" style={{ color: '#5C5950' }} />
                    </button>
                </div>

                {/* Right: Settings icon + User */}
                <div className="flex items-center gap-2">
                    {/* Settings */}
                    <a
                        href="/settings"
                        className="p-2.5 rounded-xl transition-colors hover:bg-[#EAE8E2]"
                        title="الإعدادات"
                    >
                        <Settings className="w-5 h-5" style={{ color: '#5C5950' }} />
                    </a>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 pl-2 ml-1 border-l" style={{ borderColor: '#E2E0DA' }}>
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-semibold leading-tight" style={{ color: '#1A2D23' }}>
                                {user?.name || 'المستخدم'}
                            </p>
                            <p className="text-xs" style={{ color: '#9A978F' }}>مسؤول</p>
                        </div>
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm ring-2 ring-white"
                            style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}
                        >
                            {initials}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    )
}
