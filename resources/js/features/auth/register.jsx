import { useState, useRef } from 'react'
import { Leaf, User, Store, Mail, Lock, CheckCircle2, Phone, UploadCloud, X, Image as ImageIcon } from 'lucide-react'
import api, { setAuthToken } from '../../shared/services/api'

const inputCls = "w-full pl-4 pr-11 py-2.5 rounded-xl transition-all duration-200 focus:outline-none text-sm font-semibold"
const inputStyle = { backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }
const focusOn  = (e) => { e.target.style.borderColor = '#2E5A44'; e.target.style.boxShadow = '0 0 0 3px rgba(46,90,68,0.1)' }
const focusOff = (e) => { e.target.style.borderColor = '#E2E0DA'; e.target.style.boxShadow = 'none' }

function Field({ label, icon: Icon, children }) {
    return (
        <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: '#5C5950' }}>{label}</label>
            <div className="relative">
                {children}
                {Icon && <Icon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B8B5AE' }} />}
            </div>
        </div>
    )
}

export default function Register() {
    const [storeName, setStoreName] = useState('')
    const [phone, setPhone] = useState('')
    const [phone2, setPhone2] = useState('')
    const [receiptLogo, setReceiptLogo] = useState(null)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [errors, setErrors] = useState([])
    const [processing, setProcessing] = useState(false)
    const [logoPreview, setLogoPreview] = useState(null)
    const fileRef = useRef(null)

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setReceiptLogo(file)
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const removeLogo = () => {
        setReceiptLogo(null)
        setLogoPreview(null)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setProcessing(true)
        setErrors([])

        const formData = new FormData()
        formData.append('store_name', storeName)
        formData.append('phone', phone)
        formData.append('phone2', phone2)
        if (receiptLogo) formData.append('receipt_logo', receiptLogo)
        formData.append('name', name)
        formData.append('email', email)
        formData.append('password', password)
        formData.append('password_confirmation', passwordConfirmation)

        try {
            const response = await api.post('/auth/register', formData)
            if (response.data.success && response.data.access_token) {
                setAuthToken(response.data.access_token, response.data.user)
                window.location.href = '/'
            } else {
                setErrors([response.data.message || 'حدث خطأ أثناء التسجيل'])
            }
        } catch (err) {
            const errData = err.response?.data
            if (errData?.errors) {
                setErrors(Object.values(errData.errors).flat())
            } else {
                setErrors([errData?.message || 'حدث خطأ أثناء التسجيل'])
            }
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
                className="w-full max-w-2xl rounded-3xl p-6 sm:p-8 transition-all duration-300 shadow-xl"
                style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #EAE8E2',
                    boxShadow: '0 4px 20px rgba(46, 50, 48, 0.05)',
                }}
            >
                {/* Brand / Logo */}
                <div className="flex flex-col items-center text-center mb-8">
                    <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-md"
                        style={{ backgroundColor: '#2E5A44' }}
                    >
                        <Leaf className="w-7 h-7 text-white animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#2E5A44', fontFamily: 'Literata, serif' }}>
                        تهيئة النظام لأول مرة
                    </h1>
                    <p className="text-sm mt-1 font-medium" style={{ color: '#5C5950' }}>
                        يرجى إدخال بيانات المتجر وإنشاء حساب المسؤول الرئيسي للبدء
                    </p>
                </div>

                {/* Validation Errors */}
                {errors.length > 0 && (
                    <div
                        className="p-4 mb-5 rounded-xl text-sm font-semibold text-right space-y-1 animate-fade-in"
                        style={{ backgroundColor: '#FDEEEC', color: '#922B21', border: '1px solid #E8A09A' }}
                    >
                        {errors.map((err, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                {err}
                            </div>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ── Section: Store Info ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid #EAE8E2' }}>
                            <Store className="w-4 h-4" style={{ color: '#2E5A44' }} />
                            <h2 className="text-sm font-bold" style={{ color: '#2E5A44' }}>بيانات المتجر</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="اسم المتجر / النشاط التجاري *" icon={Store}>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={e => setStoreName(e.target.value)}
                                    placeholder="مثال: متجر أبو الدهب للمستلزمات"
                                    className={inputCls} style={inputStyle}
                                    onFocus={focusOn} onBlur={focusOff} required
                                />
                            </Field>

                            <Field label="رقم الهاتف الرئيسي *" icon={Phone}>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="مثال: 0100XXXXXXX"
                                    className={`${inputCls} text-left`} style={inputStyle}
                                    onFocus={focusOn} onBlur={focusOff} required
                                />
                            </Field>

                            <Field label="رقم الهاتف الثاني (اختياري)" icon={Phone}>
                                <input
                                    type="text"
                                    value={phone2}
                                    onChange={e => setPhone2(e.target.value)}
                                    placeholder="مثال: 0111XXXXXXX"
                                    className={`${inputCls} text-left`} style={inputStyle}
                                    onFocus={focusOn} onBlur={focusOff}
                                />
                            </Field>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold mb-1.5" style={{ color: '#5C5950' }}>
                                    شعار المتجر (اختياري)
                                </label>
                                {logoPreview ? (
                                    <div className="relative inline-block mt-1">
                                        <img
                                            src={logoPreview}
                                            alt="شعار المتجر"
                                            className="w-32 h-32 object-contain rounded-2xl border"
                                            style={{ borderColor: '#E2E0DA', backgroundColor: '#F4F3EF' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={removeLogo}
                                            className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-opacity hover:opacity-90 animate-scale-in"
                                            style={{ backgroundColor: '#C0392B' }}
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className="mt-3 flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
                                            style={{ color: '#2E5A44', backgroundColor: '#EEF4F1', border: '1px solid #ADCBBB' }}
                                        >
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            تغيير الشعار
                                        </button>
                                    </div>
                                ) : (
                                    <label
                                        className="flex flex-col items-center justify-center w-full h-32 rounded-2xl cursor-pointer transition-colors hover:opacity-85"
                                        style={{ border: '2px dashed #E2E0DA', backgroundColor: '#FAF9F6' }}
                                    >
                                        <ImageIcon className="w-8 h-8 mb-2" style={{ color: '#B8B5AE' }} />
                                        <p className="text-xs font-semibold" style={{ color: '#5C5950' }}>اضغط لرفع الشعار من الجهاز</p>
                                        <p className="text-[10px] mt-0.5" style={{ color: '#B8B5AE' }}>PNG, JPG — حتى 2 ميجابايت</p>
                                        <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                    </label>
                                )}
                                {logoPreview && (
                                    <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Section: Admin Account ── */}
                    <div>
                        <div className="flex items-center gap-2 mb-4 pb-2" style={{ borderBottom: '1px solid #EAE8E2' }}>
                            <User className="w-4 h-4" style={{ color: '#2E5A44' }} />
                            <h2 className="text-sm font-bold" style={{ color: '#2E5A44' }}>حساب المسؤول</h2>
                        </div>
                        <div className="space-y-4">
                            <Field label="اسم المسؤول (المدير) *" icon={User}>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="مثال: أحمد أبو الدهب"
                                    className={inputCls} style={inputStyle}
                                    onFocus={focusOn} onBlur={focusOff} required
                                />
                            </Field>

                            <Field label="البريد الإلكتروني *" icon={Mail}>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="admin@example.com"
                                    className={`${inputCls} text-left`} style={inputStyle}
                                    onFocus={focusOn} onBlur={focusOff} required
                                />
                            </Field>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="كلمة المرور *" icon={Lock}>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className={inputCls} style={inputStyle}
                                        onFocus={focusOn} onBlur={focusOff} required
                                    />
                                </Field>
                                <Field label="تأكيد كلمة المرور *" icon={Lock}>
                                    <input
                                        type="password"
                                        value={passwordConfirmation}
                                        onChange={e => setPasswordConfirmation(e.target.value)}
                                        placeholder="••••••••"
                                        className={inputCls} style={inputStyle}
                                        onFocus={focusOn} onBlur={focusOff} required
                                    />
                                </Field>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3 rounded-xl font-bold text-white transition-all duration-200 hover:opacity-95 active:scale-[0.98] shadow-md disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                        style={{ backgroundColor: '#2E5A44', boxShadow: '0 4px 12px rgba(46,90,68,0.25)' }}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        {processing ? 'جاري إعداد النظام...' : 'حفظ وإعداد النظام للعمل'}
                    </button>
                </form>
            </div>

            <p className="text-[11px] mt-6 font-medium text-center" style={{ color: '#B8B5AE' }}>
                نظام إدارة نقاط البيع والمخازن الذكي © {new Date().getFullYear()}
            </p>
        </div>
    )
}
