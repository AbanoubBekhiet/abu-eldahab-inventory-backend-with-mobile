import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Plus, Trash2, Search, X, ShoppingCart, User, Phone, MapPin, Package, CheckCircle, AlertCircle } from 'lucide-react'
import AppLayout from '../../shared/layouts/AppLayout'
import api from '../../shared/services/api'

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
                    className="w-full h-11 px-3 pl-9 rounded-xl border border-[#D6D4CE] bg-white text-sm font-semibold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44] transition-colors"
                />
                <Search className="w-4 h-4 text-[#9A978F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                {value && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange('')
                            setSearch('')
                            setIsOpen(true)
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A978F] hover:text-[#C0392B] p-1 rounded"
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
                                className={`w-full text-right px-3 py-2.5 text-xs transition-colors hover:bg-[#EEF4F1] flex items-center justify-between gap-2 ${
                                    String(value) === String(p.id) ? 'bg-[#EEF4F1] font-bold text-[#2E5A44]' : 'text-[#1A2D23]'
                                }`}
                            >
                                <span className="font-bold truncate">
                                    {p.name}
                                    {p.unit && <span className="text-[11px] font-semibold text-[#2E5A44] mr-1.5">({p.unit})</span>}
                                </span>
                                <span className="text-[10px] text-[#7C7870] flex-shrink-0 bg-[#FAF9F6] px-2 py-0.5 rounded-md border border-[#EAE8E2]">
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

export default function ReceiveOrder({
    suppliers: initialSuppliers = [],
    selectedSupplier: initialSelectedSupplier = null,
    supplier: supplierProp = null,
    products: initialProducts = []
}) {
    const queryClient = useQueryClient()

    // Fetch suppliers & products from API if initial props are missing
    const { data: suppliersData } = useQuery({
        queryKey: ['suppliers'],
        queryFn: async () => {
            const res = await api.get('/suppliers')
            return res.data.suppliers?.data || res.data.data || res.data || []
        },
        initialData: Array.isArray(initialSuppliers) && initialSuppliers.length ? initialSuppliers : undefined,
    })

    const { data: productsData } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const res = await api.get('/products')
            return res.data.products?.data || res.data.data || res.data || []
        },
        initialData: Array.isArray(initialProducts) && initialProducts.length ? initialProducts : undefined,
    })

    const suppliersList = suppliersData || []
    const productsList = productsData || []

    const urlSupplierId = typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : ''

    const initialSupId = (typeof initialSelectedSupplier === 'object' ? initialSelectedSupplier?.id : initialSelectedSupplier)
        || (typeof supplierProp === 'object' ? supplierProp?.id : supplierProp)
        || (urlSupplierId && urlSupplierId !== 'receive' ? urlSupplierId : '')

    const [selectedSupplierId, setSelectedSupplierId] = useState(initialSupId ? String(initialSupId) : '')

    useEffect(() => {
        if (!selectedSupplierId && initialSupId && initialSupId !== 'receive') {
            setSelectedSupplierId(String(initialSupId))
        }
    }, [initialSupId])

    const selectedSupplierObj = suppliersList.find(s => String(s.id) === String(selectedSupplierId)) ||
        (typeof initialSelectedSupplier === 'object' ? initialSelectedSupplier : null) ||
        (typeof supplierProp === 'object' ? supplierProp : null)

    const [items, setItems] = useState([{ product_id: '', quantity: 1, price: '' }])
    const [notes, setNotes] = useState('')
    const [paymentType, setPaymentType] = useState('cash')
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    const addItem = () => setItems([...items, { product_id: '', quantity: 1, price: '' }])
    const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx))

    const updateItem = (idx, field, value) => {
        const next = [...items]
        next[idx] = { ...next[idx], [field]: value }
        if (field === 'product_id' && value) {
            const prod = productsList.find(p => String(p.id) === String(value))
            if (prod) next[idx].price = prod.cost_price ?? prod.price ?? ''
        }
        setItems(next)
    }

    const resetForm = () => {
        setItems([{ product_id: '', quantity: 1, price: '' }])
        setNotes('')
        setPaymentType('cash')
        setErrorMessage('')
    }

    const totalUnits = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0)
    const totalAmount = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0) * (parseFloat(item.price) || 0), 0)

    const receiveMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(`/suppliers/${selectedSupplierId}/received-orders`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setSuccessMessage(data.message || 'تم تسجيل الشحنة الواردة بنجاح وتحديث مخزون المنتجات!')
            resetForm()
            queryClient.invalidateQueries({ queryKey: ['products'] })
            queryClient.invalidateQueries({ queryKey: ['suppliers'] })
        },
        onError: (err) => {
            setErrorMessage(err.response?.data?.message || 'حدث خطأ أثناء حفظ الشحنة الواردة.')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        if (!selectedSupplierId) {
            setErrorMessage('يرجى اختيار المورد أولاً.')
            return
        }

        const validItems = items.filter(it => it.product_id && parseInt(it.quantity) > 0 && it.price !== '')
        if (validItems.length === 0) {
            setErrorMessage('يرجى إضافة صنف واحد على الأقل مع تحديد الكمية وسعر الشراء.')
            return
        }

        receiveMutation.mutate({
            items: validItems,
            notes,
            payment_type: paymentType
        })
    }

    return (
        <AppLayout title="تسجيل طلب وارد من مورد" subtitle="إدخال واستلام البضاعة وتحديث المخزون وحساب المورد">
            <div className="max-w-5xl mx-auto space-y-6 pb-12" dir="rtl">
                
                {/* ── Back Navigation & Header ── */}
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => router.visit(selectedSupplierObj ? `/suppliers/${selectedSupplierObj.id}/orders` : '/suppliers')}
                        className="flex items-center gap-2 text-sm font-bold text-[#2E5A44] hover:opacity-80 transition-opacity"
                    >
                        <ArrowRight className="w-4 h-4" />
                        العودة إلى قائمة الموردين
                    </button>
                </div>

                {successMessage && (
                    <div className="bg-[#EAF6EE] border border-[#ADCBBB] text-[#2E5A44] p-4 rounded-2xl text-sm font-semibold flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{successMessage}</span>
                        </div>
                        <button onClick={() => setSuccessMessage('')} className="opacity-70 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-[#FDEEEC] border border-[#F5C2C0] text-[#C0392B] p-4 rounded-2xl text-sm font-semibold flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                        <button onClick={() => setErrorMessage('')} className="opacity-70 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── 1. Supplier Selection Card ── */}
                    <div className="bg-white rounded-2xl p-6 border border-[#EAE8E2] shadow-sm">
                        <h3 className="text-base font-bold text-[#1A2D23] mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-[#2E5A44]" />
                            بيانات المورد
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="block text-xs font-bold text-[#5C5950] mb-1.5">اختر المورد *</label>
                                <select
                                    value={selectedSupplierId}
                                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                                    className="w-full h-11 px-3 rounded-xl border border-[#D6D4CE] bg-white text-sm font-bold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44]"
                                    required
                                >
                                    <option value="">-- اختر جهة التوريد --</option>
                                    {suppliersList.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} {s.contact_name && s.contact_name !== '—' ? `(${s.contact_name})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSupplierObj && (
                                <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#EAE8E2] space-y-1.5 text-xs text-[#5C5950]">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm text-[#1A2D23]">{selectedSupplierObj.name}</span>
                                        {selectedSupplierObj.balance !== undefined && (
                                            <span className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                                                selectedSupplierObj.balance > 0 ? 'bg-[#FDEEEC] text-[#C0392B]' : 'bg-[#EAF6EE] text-[#2E5A44]'
                                            }`}>
                                                {selectedSupplierObj.balance > 0 ? `رصيد مستحق: ${selectedSupplierObj.balance.toFixed(2)} ج.م` : 'لا توجد مستحقات'}
                                            </span>
                                        )}
                                    </div>
                                    {selectedSupplierObj.phone && selectedSupplierObj.phone !== '—' && (
                                        <div className="flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-[#9A978F]" />
                                            <span>{selectedSupplierObj.phone}</span>
                                        </div>
                                    )}
                                    {selectedSupplierObj.address && selectedSupplierObj.address !== '—' && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-[#9A978F]" />
                                            <span>{selectedSupplierObj.address}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── 2. Received Items List Card ── */}
                    <div className="bg-white rounded-2xl p-6 border border-[#EAE8E2] shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-[#EAE8E2] pb-3">
                            <h3 className="text-base font-bold text-[#1A2D23] flex items-center gap-2">
                                <Package className="w-5 h-5 text-[#2E5A44]" />
                                الأصناف الواردة في الفاتورة
                            </h3>
                            <span className="text-xs font-bold text-[#7C7870]">
                                عدد الأصناف: <strong className="text-[#2E5A44]">{items.length}</strong>
                            </span>
                        </div>

                        <div className="space-y-3">
                            {/* Header label row for desktops */}
                            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-bold text-[#5C5950] px-3">
                                <div className="col-span-5">اسم المنتج</div>
                                <div className="col-span-3">الكمية الواردة</div>
                                <div className="col-span-3">سعر الشراء / التكلفة (ج.م)</div>
                                <div className="col-span-1 text-center">إلغاء</div>
                            </div>

                            {items.map((item, idx) => {
                                const selectedProd = (productsList || []).find(p => String(p.id) === String(item.product_id))
                                return (
                                    <div key={idx} className="grid grid-cols-12 gap-3 items-center bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#EAE8E2]">
                                        {/* Product selection */}
                                        <div className="col-span-12 md:col-span-5">
                                            <label className="block md:hidden text-xs font-bold text-[#5C5950] mb-1">المنتج *</label>
                                            <ProductSearchSelect
                                                products={productsList || []}
                                                value={item.product_id}
                                                onChange={(val) => updateItem(idx, 'product_id', val)}
                                            />
                                        </div>

                                        {/* Quantity */}
                                        <div className="col-span-6 md:col-span-3">
                                            <label className="block md:hidden text-xs font-bold text-[#5C5950] mb-1">الكمية *</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                                                    className="w-full h-11 px-3 rounded-xl border border-[#D6D4CE] bg-white text-sm font-bold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44]"
                                                    required
                                                />
                                                {selectedProd?.unit && (
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#2E5A44] bg-[#EEF4F1] px-1.5 py-0.5 rounded">
                                                        {selectedProd.unit}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Cost Price */}
                                        <div className="col-span-5 md:col-span-3">
                                            <label className="block md:hidden text-xs font-bold text-[#5C5950] mb-1">سعر الشراء *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.price}
                                                onChange={e => updateItem(idx, 'price', e.target.value)}
                                                placeholder="0.00"
                                                className="w-full h-11 px-3 rounded-xl border border-[#D6D4CE] bg-white text-sm font-bold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44]"
                                                required
                                            />
                                        </div>

                                        {/* Delete Action */}
                                        <div className="col-span-1 flex justify-center">
                                            <button
                                                type="button"
                                                onClick={() => removeItem(idx)}
                                                disabled={items.length === 1}
                                                className="p-2 rounded-xl text-[#9A978F] hover:bg-[#FDEEEC] hover:text-[#C0392B] disabled:opacity-30 transition-colors"
                                                title="حذف الصنف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Subtotal line */}
                                        {item.product_id && item.quantity && item.price !== '' && (
                                            <div className="col-span-12 text-left text-xs font-bold text-[#2E5A44] pt-1 border-t border-[#EAE8E2]/60">
                                                إجمالي الصنف: {(parseFloat(item.price) * parseInt(item.quantity || 0)).toFixed(2)} ج.م
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        <button
                            type="button"
                            onClick={addItem}
                            className="w-full py-3 border-2 border-dashed border-[#ADCBBB] rounded-2xl text-sm font-bold text-[#2E5A44] hover:bg-[#EEF4F1] transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> إضافة صنف آخر بالفاتورة
                        </button>
                    </div>

                    {/* ── 3. Payment & Summary Section ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Notes & Payment method */}
                        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-[#EAE8E2] shadow-sm space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-[#5C5950] mb-2">نوع دافع/سداد الفاتورة *</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentType('cash')}
                                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                                            paymentType === 'cash'
                                                ? 'border-[#2E5A44] bg-[#EAF6EE] text-[#2E5A44] font-bold shadow-sm'
                                                : 'border-[#EAE8E2] bg-white text-[#5C5950] hover:bg-[#FAF9F6]'
                                        }`}
                                    >
                                        <span className="text-sm font-bold">نقداً (كاش)</span>
                                        <span className="text-[11px] text-[#7C7870] mt-1">مدفوعة بالكامل للمورد</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentType('credit')}
                                        className={`p-4 rounded-xl border text-right transition-all flex flex-col justify-between ${
                                            paymentType === 'credit'
                                                ? 'border-[#C0392B] bg-[#FDEEEC] text-[#C0392B] font-bold shadow-sm'
                                                : 'border-[#EAE8E2] bg-white text-[#5C5950] hover:bg-[#FAF9F6]'
                                        }`}
                                    >
                                        <span className="text-sm font-bold">آجل (دين للمورد)</span>
                                        <span className="text-[11px] text-[#7C7870] mt-1">تضاف لقائمة مستحقات المورد</span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#5C5950] mb-1.5">ملاحظات على الطلب الوارد (اختياري)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    rows={3}
                                    placeholder="أي ملاحظات حول هذا الطلب الوارد..."
                                    className="w-full p-3 rounded-xl border border-[#D6D4CE] bg-white text-xs font-semibold text-[#1A2D23] focus:outline-none focus:border-[#2E5A44] resize-none"
                                />
                            </div>
                        </div>

                        {/* Summary & Submit Card */}
                        <div className="md:col-span-1 bg-white rounded-2xl p-6 border border-[#EAE8E2] shadow-sm flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                                <h4 className="text-sm font-bold text-[#1A2D23] border-b border-[#EAE8E2] pb-2">
                                    ملخص الطلب الوارد
                                </h4>

                                <div className="flex justify-between text-xs text-[#5C5950]">
                                    <span>إجمالي الأصناف:</span>
                                    <strong className="text-[#1A2D23]">{items.length} صنف</strong>
                                </div>

                                <div className="flex justify-between text-xs text-[#5C5950]">
                                    <span>إجمالي الوحدات/القطع:</span>
                                    <strong className="text-[#1A2D23]">{totalUnits} وحدة</strong>
                                </div>

                                <div className="border-t border-dashed border-[#D6D4CE] pt-3 flex justify-between items-center text-sm font-black text-[#1A2D23]">
                                    <span>إجمالي قيمة الطلب:</span>
                                    <span className="text-lg font-black text-[#2E5A44]">
                                        {totalAmount.toFixed(2)} ج.م
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={receiveMutation.isPending}
                                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#2E5A44] hover:bg-[#234533] transition-all shadow-md active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                {receiveMutation.isPending ? 'جارٍ تسجيل الطلب...' : 'حفظ وتسجيل الطلب الوارد'}
                            </button>
                        </div>

                    </div>

                </form>

            </div>
        </AppLayout>
    )
}
