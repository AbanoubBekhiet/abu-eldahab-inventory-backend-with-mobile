import { useState, useEffect } from 'react'
import ShopHeader from './components/ShopHeader'
import ShopFooter from './components/ShopFooter'
import MobileBottomNav from './components/MobileBottomNav'
import { Mail, Phone, MapPin, Send, CheckCircle, Headphones } from 'lucide-react'

export default function ShopContact() {
    const [cart, setCart]         = useState([])
    const [wishlist, setWishlist] = useState([])
    const [submitted, setSubmitted] = useState(false)
    const [form, setForm]         = useState({ name: '', email: '', phone: '', message: '' })

    useEffect(() => {
        try {
            const c = localStorage.getItem('shop_cart')
            const w = localStorage.getItem('shop_wishlist')
            if (c) setCart(JSON.parse(c))
            if (w) setWishlist(JSON.parse(w))
        } catch {}
    }, [])

    const handleSubmit = (e) => {
        e.preventDefault()
        setSubmitted(true)
        setForm({ name: '', email: '', phone: '', message: '' })
    }

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-[#1A2D23] font-sans flex flex-col" dir="rtl">
            <ShopHeader
                cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
                wishlistCount={wishlist.length}
            />

            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
                
                <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-[#EBF5EF] text-[#2E5A44] flex items-center justify-center mx-auto mb-2 font-bold">
                        <Headphones className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black text-[#1A2D23]">تواصل مع فريق الدعم والخدمة</h2>
                    <p className="text-xs text-[#7C7870] max-w-md mx-auto">نحن هنا دائماً لمساعدتك والإجابة على تساؤلاتك ومتابعة طلباتك بـ أبو الدهب ماركت.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#2E5A44] text-white flex items-center justify-center flex-shrink-0">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#1A2D23]">الهاتف والدعم السريع</h4>
                                    <p className="text-xs text-[#7C7870] dir-ltr text-right">01000000000</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#2E5A44] text-white flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#1A2D23]">البريد الإلكتروني</h4>
                                    <p className="text-xs text-[#7C7870]">support@abueldahab.com</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl p-6 border border-[#EAE8E2] space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-[#2E5A44] text-white flex items-center justify-center flex-shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-[#1A2D23]">العنوان والمقر الرئيسي</h4>
                                    <p className="text-xs text-[#7C7870]">أبو الدهب ماركت - الفرع الرئيسي</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inquiry Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE8E2] space-y-6">
                            <h3 className="text-lg font-black text-[#1A2D23]">أرسل لنا استفسارك أو رسالتك</h3>

                            {submitted && (
                                <div className="p-4 rounded-2xl bg-[#EBF5EF] border border-[#ADCBBB] text-[#2E5A44] text-xs font-bold flex items-center gap-2 animate-fade-in">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                                    <span>تم استلام رسالتك بنجاح وسيقوم فريق الدعم بالتواصل معك قريباً!</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-[#5C5950] mb-1.5">الاسم بالكامل *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            placeholder="أدخل اسمك"
                                            className="w-full px-4 py-2.5 rounded-2xl text-xs border border-[#EAE8E2] bg-[#FAF9F6] focus:outline-none focus:border-[#2E5A44]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-[#5C5950] mb-1.5">البريد الإلكتروني *</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            placeholder="example@mail.com"
                                            className="w-full px-4 py-2.5 rounded-2xl text-xs border border-[#EAE8E2] bg-[#FAF9F6] focus:outline-none focus:border-[#2E5A44]"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-1.5">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="0100xxxxxxx"
                                        className="w-full px-4 py-2.5 rounded-2xl text-xs border border-[#EAE8E2] bg-[#FAF9F6] focus:outline-none focus:border-[#2E5A44]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-1.5">نص الرسالة أو الاستفسار *</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={form.message}
                                        onChange={e => setForm({ ...form, message: e.target.value })}
                                        placeholder="اكتب استفسارك هنا بالتفصيل..."
                                        className="w-full p-4 rounded-2xl text-xs border border-[#EAE8E2] bg-[#FAF9F6] focus:outline-none focus:border-[#2E5A44]"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="px-8 py-3.5 rounded-2xl bg-[#2E5A44] hover:bg-[#234533] text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <Send className="w-4 h-4" />
                                    <span>إرسال الرسالة</span>
                                </button>
                            </form>
                        </div>
                    </div>

                </div>

            </main>

            <ShopFooter />
            <MobileBottomNav active="contact" cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)} wishlistCount={wishlist.length} />
        </div>
    )
}
