import { useForm, usePage, Link } from '@inertiajs/react'
import { Leaf, Lock, ShieldCheck, ArrowLeft } from 'lucide-react'

export default function VerifyResetCode() {
    const { errors = {}, flash = {} } = usePage()?.props || {}
    const { data, setData, post, processing } = useForm({
        code: '',
        password: '',
        password_confirmation: '',
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        post('/auth/verify-reset-code')
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
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: '#2E5A44', fontFamily: 'Literata, serif' }}
                    >
                        تأكيد رمز التحقق
                    </h1>
                    <p className="text-xs mt-1 font-medium" style={{ color: '#9A978F' }}>
                        أدخل الرمز المكون من 6 أرقام/أحرف وكلمة المرور الجديدة
                    </p>
                </div>

                {/* Alerts */}
                {(flash?.error || errors?.code || errors?.password || errors?.password_confirmation) && (
                    <div
                        className="p-4 mb-4 rounded-xl text-sm font-semibold text-center animate-fade-in"
                        style={{ backgroundColor: '#FDEEEC', color: '#922B21', border: '1px solid #E8A09A' }}
                    >
                        {flash?.error || errors?.code || errors?.password || errors?.password_confirmation}
                    </div>
                )}
                {flash?.success && (
                    <div
                        className="p-4 mb-4 rounded-xl text-sm font-semibold text-center animate-fade-in"
                        style={{ backgroundColor: '#EBF5EF', color: '#2E5A44', border: '1px solid #ADCBBB' }}
                    >
                        {flash?.success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Code Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>
                            رمز التحقق (6 خانات)
                        </label>
                        <input
                            type="text"
                            maxLength={6}
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value)}
                            placeholder="------"
                            className="w-full py-3.5 rounded-xl text-xl font-bold text-center tracking-[0.4em] uppercase transition-all duration-200 focus:outline-none"
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
                    </div>

                    {/* Password Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>
                            كلمة المرور الجديدة
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full pl-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none font-bold"
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
                            />
                            <Lock
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5"
                                style={{ color: '#B8B5AE' }}
                            />
                        </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>
                            تأكيد كلمة المرور الجديدة
                        </label>
                        <div className="relative">
                            <input
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                className="w-full pl-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none font-bold"
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
                            />
                            <Lock
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5"
                                style={{ color: '#B8B5AE' }}
                            />
                        </div>
                    </div>

                    {/* Submit & Back buttons */}
                    <div className="pt-2 space-y-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98] shadow-md disabled:opacity-50"
                            style={{
                                backgroundColor: '#2E5A44',
                                boxShadow: '0 4px 12px rgba(46,90,68,0.25)',
                            }}
                        >
                            {processing ? 'جاري التحقق والتحديث...' : 'تأكيد وتغيير كلمة المرور'}
                        </button>
                        <Link
                            href="/auth/reset-password"
                            className="w-full py-3 rounded-xl font-bold transition-all duration-200 hover:bg-[#EAE8E2] flex items-center justify-center gap-2 border border-[#E2E0DA]"
                            style={{ color: '#5C5950' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            تغيير البريد الإلكتروني
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
