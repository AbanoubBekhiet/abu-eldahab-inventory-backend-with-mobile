import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import api from '../../shared/services/api'
import {
    ArrowRight, Package, DollarSign, BarChart3,
    ShoppingCart, Phone, MapPin, User,
    ChevronDown, ChevronUp, Tag, CalendarDays, AlertCircle
} from 'lucide-react'

// ── Section Title ─────────────────────────────────────────────────────────
function SectionTitle({ children, sub }) {
    return (
        <div className="mb-4 text-right">
            <h2 className="text-base font-bold" style={{ color: '#1A2D23' }}>{children}</h2>
            {sub && <p className="text-xs mt-0.5" style={{ color: '#9A978F' }}>{sub}</p>}
        </div>
    )
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function StatCard({ title, value, icon: Icon, accent = '#2E5A44', bg = '#EEF4F1' }) {
    return (
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                <Icon className="w-5 h-5" style={{ color: accent }} />
            </div>
            <div className="text-right min-w-0">
                <p className="text-xs font-semibold mb-0.5" style={{ color: '#9A978F' }}>{title}</p>
                <p className="text-lg font-bold truncate" style={{ color: '#1A2D23' }}>{value}</p>
            </div>
        </div>
    )
}

// ── Order Card ─────────────────────────────────────────────────────────────
function ReceivedOrderCard({ order }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div className="bg-white rounded-2xl border border-[#EAE8E2] overflow-hidden hover:shadow-md hover:border-[#ADCBBB] transition-all" dir="rtl">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold" style={{ color: '#2E5A44' }}>
                        طلب وارد #{order.id}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            order.payment_type === 'cash'
                                ? 'bg-[#EEF4F1] text-[#2E5A44]'
                                : 'bg-[#FDEEEC] text-[#C0392B]'
                        }`}>
                            {order.payment_type === 'cash' ? '💵 كاش' : '📋 آجل'}
                        </span>
                        <span className="text-xs" style={{ color: '#9A978F' }}>{order.created_at}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center">
                        <p className="text-base font-bold" style={{ color: '#1A2D23' }}>{order.items?.length ?? 0}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B8B5AE' }}>صنف</p>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold" style={{ color: '#2E5A44' }}>{parseFloat(order.total_price).toFixed(2)} ج.م</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B8B5AE' }}>الإجمالي</p>
                    </div>
                </div>


                {order.notes && (
                    <p className="text-xs mb-2 text-center" style={{ color: '#9A978F' }}>ملاحظة: {order.notes}</p>
                )}

                <button
                    onClick={() => setExpanded(!expanded)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-xl text-xs font-semibold transition-colors hover:bg-[#FAF9F6]"
                    style={{ color: '#5C5950' }}
                >
                    {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {expanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                </button>
            </div>

            {expanded && (
                <div className="border-t border-[#EAE8E2] p-4 bg-[#FAF9F6]">
                    <p className="text-xs font-bold mb-2" style={{ color: '#5C5950' }}>المنتجات</p>
                    <div className="space-y-1.5">
                        {(order.items || []).map((item, i) => (
                            <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EAE8E2]">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF4F1' }}>
                                        <Package className="w-3 h-3" style={{ color: '#2E5A44' }} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold" style={{ color: '#1A2D23' }}>{i + 1} - {item.product_name}</p>
                                        <p className="text-[10px]" style={{ color: '#9A978F' }}>
                                            {item.quantity} × {parseFloat(item.price).toFixed(2)} ج.م
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold" style={{ color: '#1A2D23' }}>{parseFloat(item.total_price).toFixed(2)} ج.م</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SupplierOrders({
    supplier: initialSupplier,
    orders: initialOrders,
    stats: initialStats,
}) {
    const supplierId = initialSupplier?.id || (typeof initialSupplier === 'number' || typeof initialSupplier === 'string' ? initialSupplier : window.location.pathname.split('/')[2])

    const { data: supplierOrdersData } = useQuery({
        queryKey: ['supplier-orders', supplierId],
        queryFn: async () => {
            const res = await api.get(`/suppliers/${supplierId}/orders`)
            return res.data
        },
        initialData: initialSupplier && typeof initialSupplier === 'object' ? {
            supplier: initialSupplier,
            orders: initialOrders,
            stats: initialStats,
        } : undefined,
    })

    const supplier = supplierOrdersData?.supplier || (typeof initialSupplier === 'object' ? initialSupplier : {})
    const loadedOrders = supplierOrdersData?.orders?.data || supplierOrdersData?.data || []
    const stats = supplierOrdersData?.stats || {}

    const todayStr = new Date().toISOString().slice(0, 10)
    const [from, setFrom] = useState(todayStr)
    const [to, setTo] = useState(todayStr)
    const [rangeStats, setRangeStats] = useState(null)
    const [rangeLoading, setRangeLoading] = useState(false)
    const [rangeError, setRangeError] = useState('')

    const fetchRange = async (e) => {
        e.preventDefault()
        setRangeLoading(true)
        setRangeError('')
        try {
            const res = await api.get(`/suppliers/${supplierId}/stats-range`, { params: { from, to } })
            setRangeStats(res.data)
        } catch {
            setRangeError('حدث خطأ أثناء جلب البيانات')
        } finally {
            setRangeLoading(false)
        }
    }

    return (
        <AppLayout
            title={`طلبات: ${supplier.name || ''}`}
            subtitle={`سجل الطلبات الواردة من ${supplier.name || ''}`}
        >
            <div className="space-y-6" dir="rtl">
                {/* Back button & Action */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.visit('/suppliers')}
                        className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: '#2E5A44' }}
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة إلى الموردين
                    </button>
                    <button
                        onClick={() => router.visit(supplier?.id ? `/suppliers/${supplier.id}/receive` : '/suppliers/receive')}
                        className="px-4 py-2 rounded-xl font-bold text-xs text-white bg-[#2E5A44] hover:bg-[#234533] transition-all shadow flex items-center gap-1.5"
                    >
                        <ShoppingCart className="w-4 h-4" />
                        <span>تسجيل طلب وارد جديد</span>
                    </button>
                </div>

                {/* Supplier Info */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #1A2D23, #2E5A44)', boxShadow: '0 8px 32px rgba(26,45,35,0.25)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                            {(supplier.name || 'م').charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">{supplier.name || 'جارِ التحميل...'}</h2>
                            {supplier.contact_name && supplier.contact_name !== '—' && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <User className="w-3.5 h-3.5 text-white/70" />
                                    <span className="text-sm text-white/80 font-medium">{supplier.contact_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                {supplier.phone && supplier.phone !== '—' && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-white/60" />
                                        <span className="text-xs text-white/70">{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.address && supplier.address !== '—' && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-white/60" />
                                        <span className="text-xs text-white/70">{supplier.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today Current Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="بيانات المشتريات والطلبات لليوم الحالي من المورد">اليوم الحالي</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title="مشتريات اليوم"     value={stats.today?.spent   ?? '—'} icon={DollarSign}   accent="#7C3AED" bg="#EDE9FE" />
                        <StatCard title="عدد طلبات اليوم"   value={stats.today?.orders  ?? '—'} icon={ShoppingCart} accent="#2E5A44" bg="#EEF4F1" />
                        <StatCard title="عدد الوحدات المستلمة" value={stats.today?.items   ?? '—'} icon={Package}      accent="#0D9488" bg="#CCFBF1" />
                    </div>
                </div>

                {/* Month Current Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="بيانات المشتريات والطلبات للشهر الحالي من المورد">الشهر الحالي</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard title="مشتريات الشهر"     value={stats.month?.spent   ?? '—'} icon={DollarSign}   accent="#7C3AED" bg="#EDE9FE" />
                        <StatCard title="عدد طلبات الشهر"   value={stats.month?.orders  ?? '—'} icon={ShoppingCart} accent="#2E5A44" bg="#EEF4F1" />
                        <StatCard title="عدد الوحدات المستلمة" value={stats.month?.items   ?? '—'} icon={Package}      accent="#0D9488" bg="#CCFBF1" />
                    </div>
                </div>



                {/* Custom Period Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="اختر نطاق زمني لحساب مؤشرات المورد">إحصائيات فترة مخصصة</SectionTitle>
                    <form onSubmit={fetchRange} className="rounded-2xl p-5 mb-5 flex flex-col sm:flex-row items-end gap-4"
                        style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
                        <div className="flex-1 space-y-1 w-full">
                            <label className="text-xs font-bold" style={{ color: '#5C5950' }}>من تاريخ</label>
                            <input type="date" value={from} onChange={e => setFrom(e.target.value)} max={to}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                                style={{ backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }} />
                        </div>
                        <div className="flex-1 space-y-1 w-full">
                            <label className="text-xs font-bold" style={{ color: '#5C5950' }}>إلى تاريخ</label>
                            <input type="date" value={to} onChange={e => setTo(e.target.value)} min={from}
                                className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                                style={{ backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }} />
                        </div>
                        <button type="submit" disabled={rangeLoading}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
                            style={{ backgroundColor: '#2E5A44' }}>
                            <CalendarDays className="w-4 h-4" />
                            {rangeLoading ? 'جارٍ الحساب...' : 'احسب'}
                        </button>
                    </form>

                    {rangeError && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-4">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />{rangeError}
                        </div>
                    )}

                    {rangeStats && rangeStats.range && (
                        <div>
                            <p className="text-xs font-semibold mb-3" style={{ color: '#9A978F' }}>
                                النتائج من <span style={{ color: '#2E5A44' }}>{rangeStats.range.from}</span> إلى <span style={{ color: '#2E5A44' }}>{rangeStats.range.to}</span>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <StatCard title="المشتريات في الفترة"  value={rangeStats.range.spent   ?? '—'} icon={DollarSign}   accent="#7C3AED" bg="#EDE9FE" />
                                <StatCard title="عدد الطلبات"         value={rangeStats.range.orders  ?? '—'} icon={ShoppingCart} accent="#2E5A44" bg="#EEF4F1" />
                                <StatCard title="الوحدات المستلمة"    value={rangeStats.range.items   ?? '—'} icon={Package}      accent="#0D9488" bg="#CCFBF1" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Orders */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>الطلبات الواردة</h3>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#EEF4F1', color: '#2E5A44' }}>
                            {loadedOrders.length} طلب محمّل
                        </span>
                    </div>

                    {loadedOrders.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center">
                            <Package className="w-10 h-10 mx-auto mb-3" style={{ color: '#B8B5AE' }} />
                            <p className="font-bold text-sm" style={{ color: '#5C5950' }}>لا توجد طلبات واردة من هذا المورد بعد</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {loadedOrders.map(order => (
                                <ReceivedOrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    )
}
