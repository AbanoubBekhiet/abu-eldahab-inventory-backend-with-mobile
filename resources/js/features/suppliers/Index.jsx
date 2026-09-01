import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router, usePage } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput, Badge } from '../../shared/components'
import {
    Plus, Phone, MapPin, Trash2, Edit2, X,
    Package, Check, AlertCircle,
    ShoppingCart, Minus, Eye, Search
} from 'lucide-react'
import api from '../../shared/services/api'

// ── Helpers ───────────────────────────────────────────────────────────────
const INPUT_CLS   = "w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
const INPUT_STYLE = { backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }
const LABEL_CLS   = "block text-sm font-semibold mb-1.5"
const LABEL_STYLE = { color: '#5C5950' }

// ── Notification Banner ───────────────────────────────────────────────────
function Notice({ message, type, onClose }) {
    if (!message) return null
    const ok = type === 'success'
    return (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold mb-4 ${ok ? 'bg-[#EEF4F1] text-[#2E5A44]' : 'bg-[#FDEEEC] text-[#C0392B]'}`} dir="rtl">
            {ok ? <Check className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1">{message}</span>
            <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
    )
}

// ── Searchable Product Select ──────────────────────────────────────────────
function ProductSearchSelect({ products, value, onChange }) {
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    const selectedProduct = products.find(p => String(p.id) === String(value))

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.unit && p.unit.toLowerCase().includes(search.toLowerCase()))
    )

    const getProductLabel = (p) => {
        if (!p) return ''
        return p.unit ? `${p.name} (${p.unit})` : p.name
    }

    return (
        <div ref={containerRef} className="relative w-full text-right">
            <label className={LABEL_CLS} style={LABEL_STYLE}>المنتج *</label>
            <div className="relative">
                <input
                    type="text"
                    value={isOpen ? search : getProductLabel(selectedProduct)}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        if (!isOpen) setIsOpen(true)
                    }}
                    onFocus={() => {
                        setSearch('')
                        setIsOpen(true)
                    }}
                    placeholder={selectedProduct ? getProductLabel(selectedProduct) : "ابحث عن المنتج..."}
                    className={INPUT_CLS + " pl-8 text-xs sm:text-sm font-semibold"}
                    style={INPUT_STYLE}
                />
                <Search className="w-4 h-4 text-[#9A978F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('')
                            setSearch('')
                            setIsOpen(true)
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9A978F] hover:text-[#C0392B] p-0.5 rounded"
                        title="إلغاء التحديد"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#EAE8E2] rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-[#FAF9F6] text-right">
                    {filteredProducts.length === 0 ? (
                        <div className="p-3 text-xs text-[#9A978F] text-center">لا يوجد منتج مطابق للبحث</div>
                    ) : (
                        filteredProducts.map(p => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                    onChange(p.id)
                                    setSearch('')
                                    setIsOpen(false)
                                }}
                                className={`w-full text-right px-3 py-2 text-xs transition-colors hover:bg-[#EEF4F1] flex items-center justify-between gap-2 ${
                                    String(value) === String(p.id) ? 'bg-[#EEF4F1] font-bold text-[#2E5A44]' : 'text-[#1A2D23]'
                                }`}
                            >
                                <span className="font-bold truncate">
                                    {p.name}
                                    {p.unit && <span className="text-[11px] font-semibold text-[#2E5A44] mr-1.5">({p.unit})</span>}
                                </span>
                                <span className="text-[10px] text-[#7C7870] flex-shrink-0 bg-[#FAF9F6] px-2 py-0.5 rounded-md border border-[#EAE8E2]">
                                    {p.unit && <span className="text-[#2E5A44] font-bold ml-1">الوحدة: {p.unit} | </span>}
                                    مخزون: <strong className="text-[#2E5A44]">{p.stock}</strong> | تكلفة: <strong>{p.cost_price || p.price || 0}ج</strong>
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

// ── Received Order Modal ──────────────────────────────────────────────────
function ReceivedOrderModal({ supplier, products, onClose }) {
    const queryClient = useQueryClient()
    const [items, setItems]       = useState([{ product_id: '', quantity: 1, price: '' }])
    const [notes, setNotes]       = useState('')
    const [paymentType, setPaymentType] = useState('cash') // 'cash' | 'credit'
    const [error, setError]       = useState('')

    const addItem    = () => setItems([...items, { product_id: '', quantity: 1, price: '' }])
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

    const updateItem = (idx, field, value) => {
        const next = [...items]
        next[idx] = { ...next[idx], [field]: value }
        if (field === 'product_id' && value) {
            const prod = products.find(p => p.id === parseInt(value))
            if (prod) next[idx].price = prod.cost_price ?? prod.price ?? ''
        }
        setItems(next)
    }

    const total = items.reduce((sum, it) => {
        return sum + (parseInt(it.quantity) || 0) * (parseFloat(it.price) || 0)
    }, 0)

    const receiveMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(`/suppliers/${supplier.id}/received-orders`, payload)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
            queryClient.invalidateQueries({ queryKey: ['products'] })
            onClose()
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'حدث خطأ أثناء حفظ الطلب الوارد')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const validItems = items.filter(it => it.product_id && it.quantity > 0 && it.price !== '')
        if (!validItems.length) return
        receiveMutation.mutate({ items: validItems, notes, payment_type: paymentType })
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#EAE8E2]">
                    <div>
                        <h3 className="text-base font-bold text-[#1A2D23]">تسجيل طلب وارد</h3>
                        <p className="text-xs text-[#9A978F] mt-0.5">المورد: <span className="font-semibold text-[#5C5950]">{supplier.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#FAF9F6] transition-colors">
                        <X className="w-5 h-5 text-[#9A978F]" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="space-y-3">
                        {items.map((item, idx) => (
                            <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-[#FAF9F6] p-3 rounded-xl border border-[#EAE8E2]">
                                {/* Product */}
                                <div className="col-span-5">
                                    <ProductSearchSelect
                                        products={products}
                                        value={item.product_id}
                                        onChange={(val) => updateItem(idx, 'product_id', val)}
                                    />
                                </div>
                                {/* Quantity */}
                                <div className="col-span-3">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>الكمية</label>
                                    <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className={INPUT_CLS} style={INPUT_STYLE} required />
                                </div>
                                {/* Price */}
                                <div className="col-span-3">
                                    <label className={LABEL_CLS} style={LABEL_STYLE}>سعر الشراء</label>
                                    <input type="number" min="0" step="0.01" value={item.price} onChange={e => updateItem(idx, 'price', e.target.value)} placeholder="0.00" className={INPUT_CLS} style={INPUT_STYLE} required />
                                </div>
                                {/* Remove */}
                                <div className="col-span-1 flex justify-center">
                                    {items.length > 1 && (
                                        <button type="button" onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-[#FDEEEC] text-[#B8B5AE] hover:text-[#C0392B] transition-colors">
                                            <Minus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                {/* Subtotal */}
                                {item.product_id && item.quantity && item.price && (
                                    <div className="col-span-12 text-left text-xs text-[#2E5A44] font-bold">
                                        الإجمالي: {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)} ج
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="button" onClick={addItem} className="w-full py-2.5 border-2 border-dashed border-[#ADCBBB] rounded-xl text-sm font-semibold text-[#2E5A44] hover:bg-[#EEF4F1] transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> إضافة منتج آخر
                    </button>

                    {/* Notes */}
                    <div>
                        <label className={LABEL_CLS} style={LABEL_STYLE}>ملاحظات (اختياري)</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="أي ملاحظات على هذا الطلب..." className={INPUT_CLS + " resize-none"} style={INPUT_STYLE} />
                    </div>

                    {/* Payment Type */}
                    <div>
                        <label className={LABEL_CLS} style={LABEL_STYLE}>نوع الفاتورة *</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentType('cash')}
                                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                    paymentType === 'cash'
                                        ? 'border-[#2E5A44] bg-[#EEF4F1] text-[#2E5A44]'
                                        : 'border-[#EAE8E2] bg-white text-[#9A978F]'
                                }`}
                            >
                                💵 كاش
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaymentType('credit')}
                                className={`py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                                    paymentType === 'credit'
                                        ? 'border-[#C0392B] bg-[#FDEEEC] text-[#C0392B]'
                                        : 'border-[#EAE8E2] bg-white text-[#9A978F]'
                                }`}
                            >
                                📋 آجل (عليّ)
                            </button>
                        </div>
                        {paymentType === 'credit' && (
                            <p className="text-xs text-[#C0392B] font-semibold mt-2 bg-[#FDEEEC] px-3 py-2 rounded-lg">
                                ⚠️ سيتم إضافة مبلغ {total.toFixed(2)} ج على حساب المورد كدين عليك
                            </p>
                        )}
                    </div>

                    {/* Grand total */}
                    <div className="flex items-center justify-between py-3 border-t border-[#EAE8E2]">
                        <span className="text-sm font-semibold text-[#5C5950]">إجمالي الطلب:</span>
                        <div className="text-left">
                            <span className="text-lg font-bold text-[#2E5A44]">{total.toFixed(2)} ج</span>
                            <span className={`mr-2 text-xs font-bold px-2 py-0.5 rounded-full ${paymentType === 'cash' ? 'bg-[#EEF4F1] text-[#2E5A44]' : 'bg-[#FDEEEC] text-[#C0392B]'}`}>
                                {paymentType === 'cash' ? 'كاش' : 'آجل'}
                            </span>
                        </div>
                    </div>
                </form>


                {/* Footer */}
                <div className="p-5 border-t border-[#EAE8E2] flex gap-3">
                    <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#EAE8E2] text-sm font-semibold text-[#5C5950] hover:bg-[#FAF9F6] transition-colors">
                        إلغاء
                    </button>
                    <button onClick={handleSubmit} disabled={receiveMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                        style={{ backgroundColor: '#2E5A44' }}>
                        <Check className="w-4 h-4" />
                        {receiveMutation.isPending ? 'جارٍ الحفظ...' : 'تأكيد الطلب وتحديث المخزون'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function EditModal({ supplier, onClose, onSave, isSubmitting }) {
    const [form, setForm]         = useState({
        name:         supplier.name,
        contact_name: supplier.contact_name === '—' ? '' : supplier.contact_name,
        phone:        supplier.phone === '—' ? '' : supplier.phone,
        address:      supplier.address === '—' ? '' : supplier.address,
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(supplier.id, form)
    }

    const field = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={INPUT_CLS} style={INPUT_STYLE} />
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
                <div className="flex items-center justify-between p-5 border-b border-[#EAE8E2]">
                    <h3 className="text-base font-bold text-[#1A2D23]">تعديل بيانات المورد</h3>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-[#FAF9F6]"><X className="w-5 h-5 text-[#9A978F]" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {field('اسم المورد / الشركة *', 'name', 'text', 'اسم الشركة أو المورد')}
                    {field('المسؤول عن التوريد', 'contact_name', 'text', 'الاسم الكامل')}
                    {field('رقم الهاتف', 'phone', 'text', '0100xxxxxxx')}
                    {field('العنوان', 'address', 'text', 'المنطقة، المدينة')}
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

// ── Main Page ─────────────────────────────────────────────────────────────
export default function SuppliersIndex({ suppliers: initialSuppliers, products = [], filters: initialFilters = {} }) {
    const queryClient = useQueryClient()
    const [search, setSearch]       = useState(initialFilters?.search || '')
    const [editTarget, setEditTarget]   = useState(null)
    const [orderTarget, setOrderTarget] = useState(null)
    const [notice, setNotice]       = useState(null)

    const [form, setForm] = useState({ name: '', contact_name: '', phone: '', address: '' })

    // React Query: Fetch Suppliers
    const { data: suppliersData, isLoading } = useQuery({
        queryKey: ['suppliers', search],
        queryFn: async () => {
            const res = await api.get('/suppliers', { params: { search: search || undefined } })
            return res.data
        },
        initialData: initialSuppliers ? { suppliers: initialSuppliers } : undefined,
    })

    const loadedSuppliers = suppliersData?.suppliers?.data || suppliersData?.data || []

    // Add Supplier Mutation
    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/suppliers', payload)
            return res.data
        },
        onSuccess: (data) => {
            setForm({ name: '', contact_name: '', phone: '', address: '' })
            setNotice({ type: 'success', text: data.message || 'تم إضافة المورد بنجاح.' })
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء إضافة المورد' })
        }
    })

    // Edit Supplier Mutation
    const editMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/suppliers/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setEditTarget(null)
            setNotice({ type: 'success', text: data.message || 'تم تحديث بيانات المورد بنجاح.' })
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء تعديل المورد' })
        }
    })

    // Delete Supplier Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/suppliers/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            setNotice({ type: 'success', text: data.message || 'تم حذف المورد.' })
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        },
        onError: (err) => {
            setNotice({ type: 'error', text: err.response?.data?.message || 'حدث خطأ أثناء حذف المورد' })
        }
    })

    const handleAdd = (e) => {
        e.preventDefault()
        if (!form.name.trim()) return
        addMutation.mutate(form)
    }

    const handleDelete = (id) => {
        if (!window.confirm('هل أنت متأكد من حذف بيانات هذا المورد؟')) return
        deleteMutation.mutate(id)
    }

    const fieldInput = (label, key, type = 'text', placeholder = '') => (
        <div>
            <label className={LABEL_CLS} style={LABEL_STYLE}>{label}</label>
            <input type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={INPUT_CLS} style={INPUT_STYLE} />
        </div>
    )

    return (
        <AppLayout title="إدارة الموردين" subtitle="متابعة جهات التوريد وتسجيل الطلبات الواردة">
            {editTarget  && <EditModal supplier={editTarget} onClose={() => setEditTarget(null)} onSave={(id, payload) => editMutation.mutate({ id, payload })} isSubmitting={editMutation.isPending} />}
            {orderTarget && <ReceivedOrderModal supplier={orderTarget} products={products} onClose={() => setOrderTarget(null)} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" dir="rtl">
                {/* ── Add Form ── */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl p-5 border border-[#EAE8E2] sticky top-6">
                        <h3 className="text-base font-bold mb-4 text-right" style={{ color: '#1A2D23' }}>إضافة مورد جديد</h3>
                        <Notice message={notice?.text} type={notice?.type} onClose={() => setNotice(null)} />
                        <form onSubmit={handleAdd} className="space-y-4" dir="rtl">
                            {fieldInput('اسم المورد / الشركة *', 'name', 'text', 'اسم الشركة أو المورد')}
                            {fieldInput('المسؤول عن التوريد', 'contact_name', 'text', 'الاسم الكامل')}
                            {fieldInput('رقم الهاتف', 'phone', 'text', 'مثال: 0100xxxxxxx')}
                            {fieldInput('العنوان', 'address', 'text', 'المنطقة، المدينة')}
                            <button type="submit" disabled={addMutation.isPending}
                                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-60"
                                style={{ backgroundColor: '#2E5A44' }}>
                                <Plus className="w-4 h-4" />
                                {addMutation.isPending ? 'جارٍ الحفظ...' : 'تسجيل المورد'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* ── List ── */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8E2] flex flex-wrap items-center justify-between gap-4">
                        <SearchInput
                            placeholder="ابحث عن مورد أو مسؤول..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full max-w-xs"
                        />
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.visit('/suppliers/receive')}
                                className="px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-[#2E5A44] hover:bg-[#234533] transition-all shadow flex items-center gap-1.5"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>استلام بضاعة جديدة</span>
                            </button>
                            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: '#9A978F' }}>
                                {loadedSuppliers.length} جهة توريد
                            </span>
                        </div>
                    </div>

                    {loadedSuppliers.length === 0 && (
                        <div className="bg-white rounded-2xl p-12 border border-[#EAE8E2] flex flex-col items-center gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-[#FAF9F6] flex items-center justify-center">
                                <Package className="w-7 h-7 text-[#B8B5AE]" />
                            </div>
                            <p className="text-sm font-bold text-[#5C5950]">لا توجد جهات توريد مسجلة</p>
                            <p className="text-xs text-[#9A978F]">أضف أول مورد باستخدام النموذج على اليسار</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {loadedSuppliers.map((sup, i) => (
                            <div key={sup.id}
                                className="bg-white rounded-2xl border border-[#EAE8E2] transition-all hover:shadow-md hover:border-[#ADCBBB] text-right"
                                style={{ animationDelay: `${i * 60}ms` }}>
                                <div className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        {/* Info */}
                                        <div className="text-right flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-[#1A2D23]">{sup.name}</h4>
                                            {sup.contact_name !== '—' && (
                                                <p className="text-xs text-[#9A978F] mt-0.5">
                                                    المسؤول: <span className="font-bold text-[#5C5950]">{sup.contact_name}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 sm:self-start">
                                            <button onClick={() => router.visit(`/suppliers/${sup.id}/orders`)} title="عرض الطلبات الواردة"
                                                className="p-2 rounded-lg bg-[#EEF4F1] text-[#2E5A44] hover:bg-[#ADCBBB] transition-colors">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => router.visit(`/suppliers/${sup.id}/receive`)} title="تسجيل طلب وارد"
                                                className="px-2.5 py-1.5 rounded-lg bg-[#EEF4F1] text-[#2E5A44] hover:bg-[#ADCBBB] transition-colors flex items-center gap-1 font-bold text-xs">
                                                <ShoppingCart className="w-4 h-4" />
                                                <span>استلام بضاعة</span>
                                            </button>
                                            <button onClick={() => setEditTarget(sup)}
                                                className="p-2 rounded-lg hover:bg-[#EAE8E2] text-[#B8B5AE] hover:text-[#5C5950] transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(sup.id)}
                                                className="p-2 rounded-lg hover:bg-[#FDEEEC] text-[#B8B5AE] hover:text-[#C0392B] transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-[#FAF9F6]">
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-[#9A978F] flex-shrink-0" />
                                            <span className="text-xs font-semibold text-[#5C5950]">{sup.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-[#9A978F] flex-shrink-0" />
                                            <span className="text-xs font-semibold text-[#5C5950] truncate">{sup.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
