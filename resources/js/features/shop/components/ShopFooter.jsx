import { Link } from '@inertiajs/react'
import { Leaf, Phone, MapPin, Mail, Clock, ShieldCheck, Truck, Headphones } from 'lucide-react'

export default function ShopFooter() {
    return (
        <footer className="bg-[#1A2D23] text-white pt-12 pb-24 md:pb-12 border-t border-[#234533]" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Value Propositions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-10 border-b border-[#234533] text-center sm:text-right">
                    <div className="flex items-center gap-4 bg-[#234533]/50 p-4 rounded-2xl border border-[#2E5A44]">
                        <div className="w-12 h-12 rounded-xl bg-[#2E5A44] flex items-center justify-center flex-shrink-0">
                            <Truck className="w-6 h-6 text-[#ADCBBB]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-[#FAF9F6]">توصيل سريع وطازج</h4>
                            <p className="text-xs text-[#ADCBBB] mt-0.5">توصيل المنتجات والمواد الغذائية طازجة فور طلبك</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-[#234533]/50 p-4 rounded-2xl border border-[#2E5A44]">
                        <div className="w-12 h-12 rounded-xl bg-[#2E5A44] flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-6 h-6 text-[#ADCBBB]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-[#FAF9F6]">جودة عالية مضمونة</h4>
                            <p className="text-xs text-[#ADCBBB] mt-0.5">أفضل الأصناف والمنتجات بأعلى المعايير</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-[#234533]/50 p-4 rounded-2xl border border-[#2E5A44]">
                        <div className="w-12 h-12 rounded-xl bg-[#2E5A44] flex items-center justify-center flex-shrink-0">
                            <Headphones className="w-6 h-6 text-[#ADCBBB]" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm text-[#FAF9F6]">دعم متواصل 24/7</h4>
                            <p className="text-xs text-[#ADCBBB] mt-0.5">فريقنا متواجد دائماً لخدمتكم والإجابة عن استفساراتكم</p>
                        </div>
                    </div>
                </div>

                {/* Footer Content */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
                    
                    {/* Brand Info */}
                    <div className="md:col-span-1 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#2E5A44] flex items-center justify-center text-white shadow-md">
                                <Leaf className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-black text-white">أبو الدهب ماركت</h3>
                        </div>
                        <p className="text-xs text-[#ADCBBB] leading-relaxed">
                            وجهتك الموثوقة للتسوق الإلكتروني وشراء أفضل المنتجات الغذائية والمستلزمات اليومية بأسعار تنافسية وخيارات تسليم مرنة.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-bold text-sm text-white mb-4">روابط سريعة</h4>
                        <ul className="space-y-2 text-xs text-[#ADCBBB]">
                            <li><Link href="/shop" className="hover:text-white transition-colors">الرئيسية</Link></li>
                            <li><Link href="/shop/products" className="hover:text-white transition-colors">جميع المنتجات</Link></li>
                            <li><Link href="/shop/cart" className="hover:text-white transition-colors">سلة التسوق</Link></li>
                            <li><Link href="/shop/wishlist" className="hover:text-white transition-colors">المفضلة</Link></li>
                        </ul>
                    </div>

                    {/* Customer Service */}
                    <div>
                        <h4 className="font-bold text-sm text-white mb-4">خدمة العملاء</h4>
                        <ul className="space-y-2 text-xs text-[#ADCBBB]">
                            <li><Link href="/shop/profile" className="hover:text-white transition-colors">حسابي والطلبات</Link></li>
                            <li><Link href="/shop/contact" className="hover:text-white transition-colors">اتصل بنا والدعم</Link></li>
                            <li><Link href="/auth/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="font-bold text-sm text-white mb-4">تواصل معنا</h4>
                        <ul className="space-y-2.5 text-xs text-[#ADCBBB]">
                            <li className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[#2E5A44]" />
                                <span>الفرع الرئيسي - أبو الدهب ماركت</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-[#2E5A44]" />
                                <span>01000000000</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-[#2E5A44]" />
                                <span>support@abueldahab.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Rights */}
                <div className="pt-6 border-t border-[#234533] text-center text-xs text-[#ADCBBB]">
                    <p>© {new Date().getFullYear()} أبو الدهb ماركت - جميع الحقوق محفوظة.</p>
                </div>
            </div>
        </footer>
    )
}
