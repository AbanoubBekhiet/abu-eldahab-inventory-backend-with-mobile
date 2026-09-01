import { useState } from 'react'
import { Leaf, Lock } from 'lucide-react'
import api, { setAuthToken } from '../../shared/services/api'

export default function Login() {
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)
    const [processing, setProcessing] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcessing(true)
        setError(null)
        try {
            const response = await api.post('/auth/login', { password })
            if (response.data.success && response.data.access_token) {
                setAuthToken(response.data.access_token, response.data.user)
                window.location.href = '/'
            } else {
                setError(response.data.message || 'بيانات الدخول غير صحيحة')
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || 'حدث خطأ في الاتصال بالخادم')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
            dir="rtl"
            style={{ backgroundColor: '#FAF9F6' }}
        >
            <div
                className="w-full max-w-md rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-xl"
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE8E2',
                    boxShadow: '0 4px 20px rgba(46, 50, 48, 0.05)',
                }}
            >
                {/* Brand / Logo */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                        style={{ backgroundColor: '#2E5A44' }}
                    >
                        <Leaf className="w-7 h-7 text-white animate-pulse" />
                    </div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: '#2E5A44', fontFamily: 'Literata, serif' }}
                    >
                        أبو الدهب
                    </h1>
                    <p className="text-xs mt-1 font-medium" style={{ color: '#9A978F' }}>
                        منظومة إدارة المخزون ونقاط البيع
                    </p>
                </div>

                {/* Status / Flash Alerts */}
                {error && (
                    <div
                        className="p-4 mb-4 rounded-xl text-sm font-semibold text-center animate-fade-in"
                        style={{ backgroundColor: '#FDEEEC', color: '#922B21', border: '1px solid #E8A09A' }}
                    >
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>
                            كلمة المرور للدخول
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-4 pr-12 py-3.5 rounded-xl text-lg font-bold text-center tracking-widest transition-all duration-200 focus:outline-none"
                                style={{
                                    backgroundColor: '#F4F3EF',
                                    border: '1px solid #E2E0DA',
                                    color: '#1A2D23',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#2E5A44'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(46,90,68,0.1)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#E2E0DA'
                                    e.target.style.boxShadow = 'none'
                                }}
                                required
                                autoFocus
                            />
                            <Lock
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5"
                                style={{ color: '#B8B5AE' }}
                            />
                        </div>
                        <div className="flex justify-start mt-2">
                            <a
                                href="/auth/reset-password"
                                className="text-xs font-semibold hover:underline"
                                style={{ color: '#2E5A44' }}
                            >
                                نسيت كلمة المرور؟
                            </a>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98] shadow-md disabled:opacity-50"
                        style={{
                            backgroundColor: '#2E5A44',
                            boxShadow: '0 4px 12px rgba(46,90,68,0.25)',
                        }}
                    >
                        {processing ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </button>
                </form>
            </div>

            {/* Footer */}
            <p className="text-[11px] mt-6 font-medium text-center" style={{ color: '#B8B5AE' }}>
                أبو الدهب لمستلزمات الحدائق والزراعة © {new Date().getFullYear()}
            </p>
        </div>
    )
}
