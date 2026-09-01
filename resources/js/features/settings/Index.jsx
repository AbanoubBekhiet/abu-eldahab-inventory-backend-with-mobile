import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { Store, Save, UploadCloud, X, CheckCircle, AlertCircle, Image as ImageIcon, Phone, FileText } from 'lucide-react'
import api from '../../shared/services/api'

export default function SettingsIndex({ settings: initialSettings = {} }) {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)

    // React Query: Fetch Settings
    const { data: settingsData = {} } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const res = await api.get('/settings')
            return res.data.settings || {}
        },
        initialData: initialSettings,
    })

    const settings = settingsData

    const [receiptName, setReceiptName] = useState(settings.receipt_name || 'أبو الدهب')
    const [phone1, setPhone1]           = useState(settings.phone1 || '')
    const [phone2, setPhone2]           = useState(settings.phone2 || '')
    const [receiptSize, setReceiptSize] = useState(settings.receipt_size || 'A4')
    const [logoFile, setLogoFile]       = useState(null)
    const [logoPreview, setLogoPreview] = useState(settings.receipt_logo_url || null)
    const [logoRemoved, setLogoRemoved] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const fileRef = useRef(null)

    useEffect(() => {
        if (!isInitialized && settingsData && Object.keys(settingsData).length > 0) {
            setReceiptName(settingsData.receipt_name || 'أبو الدهب')
            setPhone1(settingsData.phone1 || '')
            setPhone2(settingsData.phone2 || '')
            setReceiptSize(settingsData.receipt_size || 'A4')
            if (settingsData.receipt_logo_url) {
                setLogoPreview(settingsData.receipt_logo_url)
            }
            setIsInitialized(true)
        }
    }, [settingsData, isInitialized])

    // Update Settings Mutation
    const updateMutation = useMutation({
        mutationFn: async (formData) => {
            const res = await api.post('/settings', formData)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم حفظ الإعدادات بنجاح!' })
            if (data.settings) {
                setReceiptName(data.settings.receipt_name || 'أبو الدهب')
                setPhone1(data.settings.phone1 || '')
                setPhone2(data.settings.phone2 || '')
                setReceiptSize(data.settings.receipt_size || 'A4')
                setLogoPreview(data.settings.receipt_logo_url || null)
                setLogoFile(null)
                setLogoRemoved(false)
            }
            queryClient.invalidateQueries({ queryKey: ['settings'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء حفظ الإعدادات' })
        }
    })

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => setLogoPreview(reader.result)
        reader.readAsDataURL(file)
    }

    const removeLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        setLogoRemoved(true)
        if (fileRef.current) fileRef.current.value = ''
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData()
        formData.append('receipt_name', receiptName)
        formData.append('receipt_size', receiptSize)
        formData.append('phone1', phone1)
        formData.append('phone2', phone2)
        if (logoFile) formData.append('receipt_logo', logoFile)
        if (logoRemoved && !logoFile) formData.append('remove_logo', '1')

        updateMutation.mutate(formData)
    }

    const processing = updateMutation.isPending

    const inputClass = "w-full px-4 py-3 rounded-xl text-sm font-medium focus:outline-none transition-all"
    const inputStyle = { backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }
    const focusStyle = { borderColor: '#3A7259', boxShadow: '0 0 0 3px rgba(58,114,89,0.1)' }
    const blurStyle  = { borderColor: '#E2E0DA', boxShadow: 'none' }

    return (
        <AppLayout title="الإعدادات" subtitle="إعدادات الفاتورة وبيانات المحل">
            <div className="max-w-2xl mx-auto" dir="rtl">

                {/* Flash/Alert messages */}
                {alert && (
                    <div className="mb-6 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-sm font-semibold animate-fade-in"
                        style={{
                            backgroundColor: alert.type === 'success' ? '#EBF5EF' : '#FDEEEC',
                            border: `1px solid ${alert.type === 'success' ? '#ADCBBB' : '#E8A09A'}`,
                            color: alert.type === 'success' ? '#2E5A44' : '#922B21'
                        }}>
                        <div className="flex items-center gap-2">
                            {alert.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                            <span>{alert.message}</span>
                        </div>
                        <button onClick={() => setAlert(null)} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Section header */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: '#EEF4F1' }}>
                            <Store className="w-5 h-5" style={{ color: '#2E5A44' }} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold" style={{ color: '#1A2D23' }}>إعدادات الفاتورة</h2>
                            <p className="text-xs" style={{ color: '#9A978F' }}>هذه البيانات ستظهر على الفاتورة المطبوعة</p>
                        </div>
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl p-6 space-y-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>

                        {/* Receipt Name */}
                        <div>
                            <label className="block text-sm font-bold mb-2" style={{ color: '#1A2D23' }}>
                                اسم البرنامج / المحل
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#9A978F' }}>
                                هذا الاسم سيُطبع في أعلى الفاتورة
                            </p>
                            <input
                                type="text"
                                value={receiptName}
                                onChange={e => setReceiptName(e.target.value)}
                                placeholder="مثال: أبو الدهب للتجارة"
                                required
                                className={inputClass}
                                style={inputStyle}
                                onFocus={e => Object.assign(e.target.style, focusStyle)}
                                onBlur={e => Object.assign(e.target.style, blurStyle)}
                            />
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #EAE8E2' }} />

                        {/* Phone Numbers */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#1A2D23' }}>
                                <Phone className="w-4 h-4" style={{ color: '#2E5A44' }} />
                                أرقام التواصل
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#9A978F' }}>
                                ستظهر أرقام الهاتف أسفل الفاتورة المطبوعة
                            </p>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: '#5C5950' }}>رقم الهاتف الأول</label>
                                    <input
                                        type="text"
                                        value={phone1}
                                        onChange={e => setPhone1(e.target.value)}
                                        placeholder="مثال: 01012345678"
                                        className={inputClass}
                                        style={inputStyle}
                                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1" style={{ color: '#5C5950' }}>رقم الهاتف الثاني</label>
                                    <input
                                        type="text"
                                        value={phone2}
                                        onChange={e => setPhone2(e.target.value)}
                                        placeholder="مثال: 01198765432"
                                        className={inputClass}
                                        style={inputStyle}
                                        onFocus={e => Object.assign(e.target.style, focusStyle)}
                                        onBlur={e => Object.assign(e.target.style, blurStyle)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #EAE8E2' }} />

                        {/* Receipt Size */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-bold mb-2" style={{ color: '#1A2D23' }}>
                                <FileText className="w-4 h-4" style={{ color: '#2E5A44' }} />
                                حجم ورقة الطباعة
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#9A978F' }}>
                                يحدد حجم الورق عند طباعة الفاتورة مباشرةً دون سؤال
                            </p>
                            <div className="flex gap-3">
                                {['A4', 'A5'].map(size => (
                                    <button
                                        key={size}
                                        type="button"
                                        onClick={() => setReceiptSize(size)}
                                        className="flex-1 py-3 rounded-xl text-sm font-bold transition-all border-2"
                                        style={receiptSize === size
                                            ? { backgroundColor: '#EEF4F1', borderColor: '#2E5A44', color: '#2E5A44' }
                                            : { backgroundColor: '#FAF9F6', borderColor: '#E2E0DA', color: '#7C7870' }
                                        }
                                    >
                                        {size}
                                        <span className="block text-xs font-normal mt-0.5" style={{ color: receiptSize === size ? '#3A7259' : '#B8B5AE' }}>
                                            {size === 'A4' ? '210 × 297 ملم' : '148 × 210 ملم'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid #EAE8E2' }} />

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-bold mb-2" style={{ color: '#1A2D23' }}>
                                شعار المحل (اختياري)
                            </label>
                            <p className="text-xs mb-3" style={{ color: '#9A978F' }}>
                                سيظهر الشعار في أعلى الفاتورة المطبوعة — PNG أو JPG بحد أقصى 2 ميجابايت
                            </p>

                            {logoPreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={logoPreview}
                                        alt="شعار المحل"
                                        className="w-40 h-40 object-contain rounded-2xl border"
                                        style={{ borderColor: '#E2E0DA', backgroundColor: '#F4F3EF' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={removeLogo}
                                        className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow-md transition-opacity hover:opacity-90"
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
                                    className="flex flex-col items-center justify-center w-full h-44 rounded-2xl cursor-pointer transition-colors hover:opacity-80"
                                    style={{ border: '2px dashed #E2E0DA', backgroundColor: '#FAF9F6' }}
                                >
                                    <ImageIcon className="w-10 h-10 mb-3" style={{ color: '#B8B5AE' }} />
                                    <p className="text-sm font-semibold" style={{ color: '#5C5950' }}>اضغط لرفع الشعار</p>
                                    <p className="text-xs mt-1" style={{ color: '#B8B5AE' }}>PNG, JPG — حتى 2 ميجابايت</p>
                                    <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </label>
                            )}

                            {/* Hidden file input for change button */}
                            {logoPreview && (
                                <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                            )}
                        </div>
                    </div>


                    {/* Save */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 shadow-md"
                            style={{ backgroundColor: '#2E5A44', boxShadow: '0 4px 12px rgba(46,90,68,0.3)' }}
                        >
                            <Save className="w-4 h-4" />
                            {processing ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    )
}
