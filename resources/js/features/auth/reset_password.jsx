import { useForm, usePage, Link } from '@inertiajs/react'
import { Leaf, Mail, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
    const { errors = {}, flash = {} } = usePage()?.props || {}
    const { data, setData, post, processing } = useForm({
        email: '',
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        post('/auth/reset-password')
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
                        <Leaf className="w-7 h-7 text-white" />
                    </div>
                    <h1
                        className="text-2xl font-bold tracking-tight"
                        style={{ color: '#2E5A44', fontFamily: 'Literata, serif' }}
                    >
                        نسيت كلمة المرور؟
                    </h1>
                    <p className="text-xs mt-1 font-medium" style={{ color: '#9A978F' }}>
                        أدخل بريدك الإلكتروني لإرسال رمز التحقق لإعادة تعيين كلمة المرور
                    </p>
                </div>

                {/* Alerts */}
                {(flash?.error || errors?.email) && (
                    <div
                        className="p-4 mb-4 rounded-xl text-sm font-semibold text-center animate-fade-in"
                        style={{ backgroundColor: '#FDEEEC', color: '#922B21', border: '1px solid #E8A09A' }}
                    >
                        {flash?.error || errors?.email}
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
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>
                            البريد الإلكتروني للعنوان
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="name@domain.com"
                                className="w-full pl-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 focus:outline-none font-medium"
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
                            <Mail
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5"
                                style={{ color: '#B8B5AE' }}
                            />
                        </div>
                    </div>

                    {/* Submit & Back buttons */}
                    <div className="space-y-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3.5 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98] shadow-md disabled:opacity-50"
                            style={{
                                backgroundColor: '#2E5A44',
                                boxShadow: '0 4px 12px rgba(46,90,68,0.25)',
                            }}
                        >
                            {processing ? 'جاري الإرسال...' : 'إرسال رمز التحقق'}
                        </button>
                        <Link
                            href="/auth/login"
                            className="w-full py-3 rounded-xl font-bold transition-all duration-200 hover:bg-[#EAE8E2] flex items-center justify-center gap-2 border border-[#E2E0DA]"
                            style={{ color: '#5C5950' }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
