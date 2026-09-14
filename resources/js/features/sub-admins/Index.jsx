import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput, Badge } from '../../shared/components'
import {
    Plus, ShieldCheck, Mail, Lock, Trash2, Edit2, X,
    Check, AlertCircle, UserCheck, Shield
} from 'lucide-react'
import api from '../../shared/services/api'

const INPUT_CLS   = "w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
const INPUT_STYLE = { backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }
const LABEL_CLS   = "block text-sm font-semibold mb-1.5"
const LABEL_STYLE = { color: '#5C5950' }

function Notice({ message, type, onClose }) {
    if (!message) return null
    const ok = type === 'success'
    return (
        <div className={`p-4 rounded-xl text-sm font-semibold text-center mb-6 border transition-all animate-fade-in relative flex items-center justify-between gap-4`}
            style={{
                backgroundColor: ok ? '#EBF5EF' : '#FDEEEC',
                borderColor: ok ? '#ADCBBB' : '#E8A09A',
                color: ok ? '#2E5A44' : '#922B21'
            }}
            dir="rtl"
        >
            <div className="flex items-center gap-2">
                {ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{message}</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:opacity-75"><X className="w-4 h-4" /></button>
        </div>
    )
}

function EditSubAdminModal({ subAdmin, onClose, onSave, isSubmitting }) {
    const [name, setName]     = useState(subAdmin.name || '')
    const [email, setEmail]   = useState(subAdmin.email || '')
    const [password, setPassword] = useState('')

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = { name, email }
        if (password) payload.password = password
        onSave(subAdmin.id, payload)
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
                <div className="flex items-center justify-between p-5 border-b border-[#EAE8E2]">
                    <h3 className="text-base font-bold text-[#1A2D23]">تعديل بيانات الموظف (Sub Admin)</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#FAF9F6]"><X className="w-5 h-5 text-[#9A978F]" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className={LABEL_CLS} style={LABEL_STYLE}>اسم الموظف *</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required className={INPUT_CLS} style={INPUT_STYLE} />
                    </div>
                    <div>
                        <label className={LABEL_CLS} style={LABEL_STYLE}>البريد الإلكتروني *</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={INPUT_CLS} style={INPUT_STYLE} />
                    </div>
                    <div>
                        <label className={LABEL_CLS} style={LABEL_STYLE}>كلمة المرور الجديدة (اختياري)</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="أدخل كلمة مرور جديدة للتعديل" className={INPUT_CLS} style={INPUT_STYLE} />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#EAE8E2] text-sm font-semibold text-[#5C5950] hover:bg-[#FAF9F6]">إلغاء</button>
                        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: '#2E5A44' }}>
                            {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function SubAdminsIndex() {
    const queryClient = useQueryClient()
    const [search, setSearch]       = useState('')
    const [editTarget, setEditTarget] = useState(null)
    const [notice, setNotice]       = useState(null)

    const [form, setForm] = useState({ name: '', email: '', password: '' })

    // React Query: Fetch Sub-Admins
    const { data: subAdminsData, isLoading } = useQuery({
        queryKey: ['sub-admins', search],
        queryFn: async () => {
            const res = await api.get('/sub-admins', { params: { search: search || undefined } })
            return res.data
        },
    })

    const subAdmins = subAdminsData?.data || []

    // Mutations
    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/sub-admins', payload)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
            setForm({ name: '', email: '', password: '' })
            setNotice({ text: data.message || 'تم إضافة الموظف بنجاح', type: 'success' })
        },
        onError: (err) => {
            setNotice({ text: err.response?.data?.message || 'حدث خطأ أثناء إضافة الموظف', type: 'error' })
        }
    })

    const editMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/sub-admins/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
            setEditTarget(null)
            setNotice({ text: data.message || 'تم تعديل بيانات الموظف بنجاح', type: 'success' })
        },
        onError: (err) => {
            setNotice({ text: err.response?.data?.message || 'حدث خطأ أثناء تعديل الموظف', type: 'error' })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/sub-admins/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['sub-admins'] })
            setNotice({ text: data.message || 'تم حذف الموظف بنجاح', type: 'success' })
        },
        onError: (err) => {
            setNotice({ text: err.response?.data?.message || 'حدث خطأ أثناء حذف الموظف', type: 'error' })
        }
    })

    const handleAdd = (e) => {
        e.preventDefault()
        if (!form.name || !form.email || !form.password) return
        addMutation.mutate(form)
    }

    const handleDelete = (id, name) => {
        if (confirm(`هل أنت تأكد من حذف الموظف: ${name}؟`)) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <AppLayout title="إدارة الموظفين (Sub Admins)" subtitle="إضافة وإدارة الموظفين والمساعدين الإداريين بالمنظومة">
            {editTarget && (
                <EditSubAdminModal
                    subAdmin={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSave={(id, payload) => editMutation.mutate({ id, payload })}
                    isSubmitting={editMutation.isPending}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
                {/* ── Add Form ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-5 border border-[#EAE8E2] sticky top-6">
                        <h3 className="text-base font-bold mb-4 text-right flex items-center gap-2" style={{ color: '#1A2D23' }}>
                            <UserCheck className="w-5 h-5 text-[#2E5A44]" />
                            إضافة موظف جديد (Sub Admin)
                        </h3>

                        <Notice message={notice?.text} type={notice?.type} onClose={() => setNotice(null)} />

                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className={LABEL_CLS} style={LABEL_STYLE}>اسم الموظف *</label>
                                <input
                                    type="text"
                                    placeholder="أدخل اسم الموظف"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    required
                                    className={INPUT_CLS}
                                    style={INPUT_STYLE}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLS} style={LABEL_STYLE}>البريد الإلكتروني *</label>
                                <input
                                    type="email"
                                    placeholder="example@store.com"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    required
                                    className={INPUT_CLS}
                                    style={INPUT_STYLE}
                                />
                            </div>
                            <div>
                                <label className={LABEL_CLS} style={LABEL_STYLE}>كلمة المرور *</label>
                                <input
                                    type="password"
                                    placeholder="كلمة مرور الحساب (على الأقل 6 خانات)"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    required
                                    className={INPUT_CLS}
                                    style={INPUT_STYLE}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={addMutation.isPending}
                                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                                style={{ backgroundColor: '#2E5A44' }}
                            >
                                <Plus className="w-4 h-4" />
                                {addMutation.isPending ? 'جارٍ الحفظ...' : 'تسجيل الموظف'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── Sub-Admins List ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8E2] flex flex-wrap items-center justify-between gap-4">
                        <SearchInput
                            placeholder="ابحث باسم الموظف أو البريد الإلكتروني..."
                            value={search}
                            onChange={setSearch}
                            className="w-full sm:w-72"
                        />
                        <span className="text-xs font-bold text-[#5C5950]">
                            إجمالي الموظفين: {subAdmins.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-[#EAE8E2]">
                            <div className="w-8 h-8 border-2 border-[#2E5A44] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <p className="text-sm font-semibold text-[#5C5950]">جاري تحميل قائمة الموظفين...</p>
                        </div>
                    ) : subAdmins.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center border border-[#EAE8E2]">
                            <Shield className="w-12 h-12 text-[#9A978F] mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-bold text-[#5C5950]">لا يوجد موظفين مسجلين حالياً</p>
                            <p className="text-xs text-[#9A978F] mt-1">يمكنك إضافة موظف مساعد (Sub Admin) باستخدام النموذج جانبه</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subAdmins.map((subAdmin) => (
                                <div key={subAdmin.id} className="bg-white rounded-2xl p-5 border border-[#EAE8E2] hover:border-[#ADCBBB] transition-all shadow-sm flex flex-col justify-between gap-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: '#2E5A44' }}>
                                                {subAdmin.name?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-[#1A2D23]">{subAdmin.name}</h4>
                                                <Badge variant="secondary" className="mt-1 text-[11px]">
                                                    Sub Admin
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditTarget(subAdmin)}
                                                className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#5C5950]"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(subAdmin.id, subAdmin.name)}
                                                className="p-1.5 rounded-lg hover:bg-[#FDEEEC] text-[#922B21]"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-[#F4F3EF] space-y-1.5 text-xs text-[#5C5950]">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-3.5 h-3.5 text-[#9A978F]" />
                                            <span>{subAdmin.email}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
