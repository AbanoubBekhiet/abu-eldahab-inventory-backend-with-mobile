import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { router, usePage } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import {
    ArrowRight, ShoppingBag, DollarSign, TrendingUp,
    Tag, Package, RotateCcw, Phone, MapPin, Store,
    X, ChevronDown, ChevronUp, CalendarDays, AlertCircle,
    BarChart3
} from 'lucide-react'
import api from '../../shared/services/api'

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

// ── Order Card ────────────────────────────────────────────────────────────
function OrderCard({ order }) {
    const [expanded, setExpanded] = useState(false)

    const returnBadge = order.return_status === 'full'
        ? { label: 'إرجاع كامل', bg: '#FEF3C7', color: '#92400E' }
        : order.return_status === 'partial'
            ? { label: 'إرجاع جزئي', bg: '#E0F2FE', color: '#0369A1' }
            : null

    return (
        <div className="bg-white rounded-2xl border border-[#EAE8E2] overflow-hidden hover:shadow-md hover:border-[#ADCBBB] transition-all" dir="rtl">
            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold" style={{ color: '#2E5A44' }}>{order.id}</span>
                        {returnBadge && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: returnBadge.bg, color: returnBadge.color }}>
                                {returnBadge.label}
                            </span>
                        )}
                    </div>
                    <span className="text-xs" style={{ color: '#9A978F' }}>{order.date}</span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                        <p className="text-base font-bold" style={{ color: '#1A2D23' }}>{order.items}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B8B5AE' }}>صنف</p>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold" style={{ color: '#1A2D23' }}>{order.net_total}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B8B5AE' }}>الصافي</p>
                    </div>
                    <div className="text-center">
                        <p className="text-base font-bold" style={{ color: order.profit >= 0 ? '#059669' : '#C0392B' }}>
                            {parseFloat(order.profit).toFixed(2)} ج
                        </p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#B8B5AE' }}>الربح</p>
                    </div>
                </div>

                {order.discount > 0 && (
                    <div className="text-xs text-center mb-2" style={{ color: '#D97706' }}>
                        خصم: {order.discount.toFixed(2)} ج.م
                    </div>
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
                <div className="border-t border-[#EAE8E2] p-4 space-y-3 bg-[#FAF9F6]">
                    {/* Products */}
                    <div>
                        <p className="text-xs font-bold mb-2" style={{ color: '#5C5950' }}>المنتجات</p>
                        <div className="space-y-1.5">
                            {(order.products || []).map((p, i) => (
                                <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#EAE8E2]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF4F1' }}>
                                            <Package className="w-3 h-3" style={{ color: '#2E5A44' }} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold" style={{ color: '#1A2D23' }}>{i + 1} - {p.name}</p>
                                            <p className="text-[10px]" style={{ color: '#9A978F' }}>
                                                {p.quantity} {p.unit || ''} × {p.price.toFixed(2)} ج.م
                                                {p.returned_qty > 0 && <span className="text-amber-600 mr-1">· مُرجع: {p.returned_qty}</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold" style={{ color: '#1A2D23' }}>{p.total_price.toFixed(2)} ج.م</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Returns */}
                    {(order.returns || []).length > 0 && (
                        <div>
                            <p className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: '#5C5950' }}>
                                <RotateCcw className="w-3 h-3" /> المرتجعات
                            </p>
                            <div className="space-y-1.5">
                                {order.returns.map((r, i) => (
                                    <div key={i} className="p-2.5 rounded-xl text-xs space-y-0.5" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-amber-800">{r.product_name}</span>
                                            <span className="font-bold text-amber-800">{r.refund_amount.toFixed(2)} ج.م</span>
                                        </div>
                                        <p className="text-amber-700">الكمية: {r.quantity} · {r.date}</p>
                                        {r.reason && <p className="text-amber-700">السبب: {r.reason}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function CustomerOrders({
    customer: initialCustomer,
    orders: initialOrders,
    stats: initialStats,
}) {
    const customerId = initialCustomer?.id || (typeof initialCustomer === 'number' || typeof initialCustomer === 'string' ? initialCustomer : window.location.pathname.split('/')[2])

    const { data: customerOrdersData } = useQuery({
        queryKey: ['customer-orders', customerId],
        queryFn: async () => {
            const res = await api.get(`/customers/${customerId}/orders`)
            return res.data
        },
        initialData: initialCustomer && typeof initialCustomer === 'object' ? {
            customer: initialCustomer,
            orders: initialOrders,
            stats: initialStats,
        } : undefined,
    })

    const customer = customerOrdersData?.customer || (typeof initialCustomer === 'object' ? initialCustomer : {})
    const loadedOrders = customerOrdersData?.orders?.data || customerOrdersData?.data || []
    const stats = customerOrdersData?.stats || {}

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
            const res = await api.get(`/customers/${customer.id}/stats-range`, {
                params: { from, to }
            })
            setRangeStats(res.data)
        } catch {
            setRangeError('حدث خطأ أثناء جلب البيانات')
        } finally {
            setRangeLoading(false)
        }
    }

    return (
        <AppLayout
            title={`طلبات: ${customer.name}`}
            subtitle={`سجل مشتريات ${customer.shop_name || customer.name}`}
        >
            <div className="space-y-6" dir="rtl">
                {/* Back button */}
                <button
                    onClick={() => router.visit('/customers')}
                    className="flex items-center gap-2 text-sm font-semibold hover:opacity-80 transition-opacity"
                    style={{ color: '#2E5A44' }}
                >
                    <ArrowRight className="w-4 h-4" />
                    العودة إلى العملاء
                </button>

                {/* Customer Info */}
                <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #2E5A44, #3D7A5E)', boxShadow: '0 8px 32px rgba(46,90,68,0.2)' }}>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                            {customer.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">{customer.name}</h2>
                            {customer.shop_name && customer.shop_name !== '—' && (
                                <div className="flex items-center gap-1.5 mt-1">
                                    <Store className="w-3.5 h-3.5 text-white/70" />
                                    <span className="text-sm text-white/80 font-medium">{customer.shop_name}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                                {customer.phone && customer.phone !== '—' && (
                                    <div className="flex items-center gap-1">
                                        <Phone className="w-3 h-3 text-white/60" />
                                        <span className="text-xs text-white/70">{customer.phone}</span>
                                    </div>
                                )}
                                {customer.address && customer.address !== '—' && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-white/60" />
                                        <span className="text-xs text-white/70">{customer.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Today Current Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="بيانات المبيعات والأرباح لليوم الحالي للعميل">اليوم الحالي</SectionTitle>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard title="مبيعات اليوم"     value={stats.today?.sales    ?? '—'} icon={DollarSign}  accent="#2E5A44" bg="#EEF4F1" />
                        <StatCard title="مكسب اليوم"       value={stats.today?.profit   ?? '—'} icon={TrendingUp}  accent="#059669" bg="#D1FAE5" />
                        <StatCard title="عدد طلبات اليوم"  value={stats.today?.orders   ?? '—'} icon={ShoppingBag} accent="#0D9488" bg="#CCFBF1" />
                        <StatCard title="خصومات اليوم"     value={stats.today?.discount ?? '—'} icon={Tag}         accent="#D97706" bg="#FEF3C7" />
                    </div>
                </div>

                {/* Month Current Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="بيانات المبيعات والأرباح للشهر الحالي للعميل">الشهر الحالي</SectionTitle>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatCard title="مبيعات الشهر"     value={stats.month?.sales    ?? '—'} icon={BarChart3}   accent="#7C3AED" bg="#EDE9FE" />
                        <StatCard title="مكسب الشهر"       value={stats.month?.profit   ?? '—'} icon={TrendingUp}  accent="#059669" bg="#D1FAE5" />
                        <StatCard title="عدد طلبات الشهر"  value={stats.month?.orders   ?? '—'} icon={ShoppingBag} accent="#0D9488" bg="#CCFBF1" />
                        <StatCard title="خصومات الشهر"     value={stats.month?.discount ?? '—'} icon={Tag}         accent="#D97706" bg="#FEF3C7" />
                    </div>
                </div>



                {/* Custom Period Statistics */}
                <div className="mb-4" dir="rtl">
                    <SectionTitle sub="اختر نطاق زمني لحساب مؤشرات العميل">إحصائيات فترة مخصصة</SectionTitle>
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
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <StatCard title="المبيعات في الفترة"  value={rangeStats.range.sales    ?? '—'} icon={DollarSign}  accent="#2E5A44" bg="#EEF4F1" />
                                <StatCard title="المكسب في الفترة"   value={rangeStats.range.profit   ?? '—'} icon={TrendingUp}  accent="#059669" bg="#D1FAE5" />
                                <StatCard title="عدد الطلبات"         value={rangeStats.range.orders   ?? '—'} icon={ShoppingBag} accent="#0D9488" bg="#CCFBF1" />
                                <StatCard title="الخصومات في الفترة" value={rangeStats.range.discount ?? '—'} icon={Tag}         accent="#D97706" bg="#FEF3C7" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Orders */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>سجل الطلبات</h3>
                        <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: '#EEF4F1', color: '#2E5A44' }}>
                            {loadedOrders.length} طلب محمّل
                        </span>
                    </div>

                    {loadedOrders.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center">
                            <ShoppingBag className="w-10 h-10 mx-auto mb-3" style={{ color: '#B8B5AE' }} />
                            <p className="font-bold text-sm" style={{ color: '#5C5950' }}>لا توجد طلبات لهذا العميل بعد</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {loadedOrders.map(order => (
                                <OrderCard key={order.raw_id} order={order} />
                            ))}
                        </div>
                    )}

                </div>
            </div>
        </AppLayout>
    )
}
