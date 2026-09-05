import { useState } from 'react'
import AppLayout from '../../shared/layouts/AppLayout'
import {
    Lock, ShieldCheck, X, AlertCircle,
    TrendingUp, ShoppingBag, DollarSign,
    CalendarDays, BarChart3, Wallet, Tag,
} from 'lucide-react'
import api from '../../shared/services/api'

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

function SectionTitle({ children, sub }) {
    return (
        <div className="mb-4 text-right">
            <h2 className="text-base font-bold" style={{ color: '#1A2D23' }}>{children}</h2>
            {sub && <p className="text-xs mt-0.5" style={{ color: '#9A978F' }}>{sub}</p>}
        </div>
    )
}

function PasswordGate({ onUnlock }) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await api.post('/statistics/verify-admin', { email, password })
            if (res.data.ok) {
                onUnlock(res.data.stats)
            } else {
                setError(res.data.message || 'بيانات غير صحيحة')
            }
        } catch (err) {
            setError(err.response?.data?.message || 'حدث خطأ في الاتصال')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center" dir="rtl">
            <div className="w-full max-w-sm">
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#2E5A44' }}>
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                </div>
                <div className="text-center mb-6">
                    <h2 className="text-xl font-bold" style={{ color: '#1A2D23' }}>صفحة محمية</h2>
                    <p className="text-sm mt-1" style={{ color: '#9A978F' }}>أدخل بيانات حساب المسؤول للمتابعة</p>
                </div>
                <form onSubmit={submit} className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
                    <div className="space-y-1">
                        <label className="text-xs font-bold" style={{ color: '#5C5950' }}>البريد الإلكتروني</label>
                        <input type="email" required value={email}
                            onChange={e => { setEmail(e.target.value); setError('') }}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                            style={{ backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold" style={{ color: '#5C5950' }}>كلمة المرور</label>
                        <input type="password" required value={password}
                            onChange={e => { setPassword(e.target.value); setError('') }}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                            style={{ backgroundColor: '#F4F3EF', border: '1.5px solid #E2E0DA', color: '#1A2D23' }} />
                    </div>
                    {error && (
                        <div className="flex items-center gap-2 text-xs font-semibold text-red-600 bg-red-50 rounded-xl px-3 py-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                        </div>
                    )}
                    <button type="submit" disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                        style={{ backgroundColor: '#2E5A44' }}>
                        {loading ? 'جارٍ التحقق...' : 'دخول'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function StatisticsIndex({ unlocked: _initialUnlocked, stats: _initialStats }) {
    const [unlocked, setUnlocked] = useState(false)
    const [stats, setStats] = useState(null)

    const today = new Date().toISOString().slice(0, 10)
    const [from, setFrom] = useState(today)
    const [to, setTo] = useState(today)
    const [rangeStats, setRangeStats] = useState(null)
    const [rangeLoading, setRangeLoading] = useState(false)
    const [rangeError, setRangeError] = useState('')

    const handleUnlock = (statsData) => {
        setStats(statsData)
        setUnlocked(true)
    }

    const fetchRange = async (e) => {
        e.preventDefault()
        setRangeLoading(true)
        setRangeError('')
        try {
            const res = await api.get(`/statistics/range`, { params: { from, to } })
            // apiRange returns { ok: true, stats: { range: {...}, today, month, ... } }
            const data = res.data
            if (data.ok === false) {
                setRangeError(data.message || 'حدث خطأ أثناء جلب البيانات')
                return
            }
            // Support both shapes: { ok, stats } or direct stats object
            setRangeStats(data.stats ?? data)
        } catch (err) {
            setRangeError(err.response?.data?.message || 'حدث خطأ أثناء جلب البيانات')
        } finally {
            setRangeLoading(false)
        }
    }

    if (!unlocked) {
        return (
            <AppLayout title="الإحصائيات" subtitle="مؤشرات الأداء والمبيعات">
                <PasswordGate onUnlock={handleUnlock} />
            </AppLayout>
        )
    }

    return (
        <AppLayout title="الإحصائيات" subtitle="مؤشرات الأداء والمبيعات">
            {/* رأس المال الكلي */}
            <div className="mb-8 rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #2E5A44, #3D7A5E)', boxShadow: '0 8px 32px rgba(46,90,68,0.2)' }} dir="rtl">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                        <Wallet className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white/70">رأس المال الكلي</p>
                        <p className="text-3xl font-black text-white mt-0.5">{stats?.total_capital ?? '—'}</p>
                        <p className="text-xs text-white/60 mt-1">إجمالي قيمة المخزون (الكمية × سعر التكلفة)</p>
                    </div>
                </div>
            </div>

            {/* اليوم الحالي */}
            <div className="mb-8" dir="rtl">
                <SectionTitle sub="بيانات ثابتة للوقت الحالي">اليوم الحالي</SectionTitle>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <StatCard title="مبيعات اليوم"     value={stats?.today?.sales    ?? '—'} icon={DollarSign}  accent="#2E5A44" bg="#EEF4F1" />
                    <StatCard title="مكسب اليوم"       value={stats?.today?.profit   ?? '—'} icon={TrendingUp}  accent="#059669" bg="#D1FAE5" />
                    <StatCard title="عدد طلبات اليوم"  value={stats?.today?.orders   ?? '—'} icon={ShoppingBag} accent="#0D9488" bg="#CCFBF1" />
                    <StatCard title="خصومات اليوم"     value={stats?.today?.discount ?? '—'} icon={Tag}         accent="#D97706" bg="#FEF3C7" />
                </div>
            </div>

            {/* الشهر الحالي */}
            <div className="mb-8" dir="rtl">
                <SectionTitle sub="بيانات الشهر الجاري حتى الآن">الشهر الحالي</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard title="مبيعات الشهر"  value={stats?.month?.sales    ?? '—'} icon={BarChart3}  accent="#7C3AED" bg="#EDE9FE" />
                    <StatCard title="مكسب الشهر"    value={stats?.month?.profit   ?? '—'} icon={TrendingUp} accent="#D97706" bg="#FEF3C7" />
                    <StatCard title="خصومات الشهر"  value={stats?.month?.discount ?? '—'} icon={Tag}        accent="#BE185D" bg="#FCE7F3" />
                </div>
            </div>

            {/* الأشهر الـ 12 الأخيرة */}
            <div className="mb-8" dir="rtl">
                <SectionTitle sub="تقرير الأرباح والمبيعات لكل شهر من الأشهر الـ 12 الماضية">الأشهر الـ 12 الأخيرة</SectionTitle>
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: '#FAF9F6' }}>
                                    <th className="px-6 py-3 text-xs font-bold" style={{ color: '#5C5950', borderBottom: '1px solid #EAE8E2' }}>الشهر</th>
                                    <th className="px-6 py-3 text-xs font-bold" style={{ color: '#5C5950', borderBottom: '1px solid #EAE8E2' }}>المبيعات</th>
                                    <th className="px-6 py-3 text-xs font-bold" style={{ color: '#5C5950', borderBottom: '1px solid #EAE8E2' }}>الأرباح (المكسب)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(stats?.last_12_months || []).map((m, idx) => (
                                    <tr key={idx} className="transition-colors hover:bg-[#FAF9F6]" style={{ borderBottom: idx < 11 ? '1px solid #EAE8E2' : 'none' }}>
                                        <td className="px-6 py-4 text-sm font-bold" style={{ color: '#1A2D23' }}>{m.label}</td>
                                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#5C5950' }}>{m.sales}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">{m.profit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* فترة زمنية مخصصة */}
            <div dir="rtl">
                <SectionTitle sub="اختر نطاق زمني لحساب المؤشرات">إحصائيات فترة مخصصة</SectionTitle>
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

                {rangeStats && (
                    <div>
                        <p className="text-xs font-semibold mb-3" style={{ color: '#9A978F' }}>
                            النتائج من <span style={{ color: '#2E5A44' }}>{rangeStats.range?.from}</span> إلى <span style={{ color: '#2E5A44' }}>{rangeStats.range?.to}</span>
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard title="المبيعات في الفترة"  value={rangeStats.range?.sales    ?? '—'} icon={DollarSign}  accent="#2E5A44" bg="#EEF4F1" />
                            <StatCard title="المكسب في الفترة"   value={rangeStats.range?.profit   ?? '—'} icon={TrendingUp}  accent="#059669" bg="#D1FAE5" />
                            <StatCard title="عدد الطلبات"         value={rangeStats.range?.orders   ?? '—'} icon={ShoppingBag} accent="#0D9488" bg="#CCFBF1" />
                            <StatCard title="الخصومات في الفترة" value={rangeStats.range?.discount ?? '—'} icon={Tag}         accent="#D97706" bg="#FEF3C7" />
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs font-semibold" style={{ color: '#ADCBBB' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                جلسة مسؤول نشطة
            </div>
        </AppLayout>
    )
}
