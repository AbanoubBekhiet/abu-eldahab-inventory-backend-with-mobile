import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { Button, SearchInput } from '../../shared/components'
import { Plus, Trash2, X, Tag, Clock, Package, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import api from '../../shared/services/api'

export default function OffersIndex() {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [productsSearch, setProductsSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState(null)

    const [formData, setFormData] = useState({
        product_id: '',
        offer_price: '',
        offer_max_quantity: '',
        expires_at: '',
    })
    const [formErrors, setFormErrors] = useState({})

    // Fetch Offers
    const { data: offersData, isLoading } = useQuery({
        queryKey: ['offers'],
        queryFn: async () => {
            const res = await api.get('/offers')
            return res.data
        },
    })

    // Fetch Products for dropdown
    const { data: productsData } = useQuery({
        queryKey: ['products-for-offers', productsSearch],
        queryFn: async () => {
            const res = await api.get('/products', {
                params: { search: productsSearch || undefined, all: 1 }
            })
            return res.data
        },
        enabled: isAddOpen,
    })

    const offers = offersData?.offers?.data || []
    const availableProducts = productsData?.products?.data || []

    // Create Offer
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/offers', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم إضافة العرض بنجاح!' })
            setIsAddOpen(false)
            resetForm()
            queryClient.invalidateQueries({ queryKey: ['offers'] })
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'حدث خطأ أثناء إضافة العرض'
            setAlert({ type: 'error', message: msg })
            if (err.response?.data?.errors) {
                setFormErrors(err.response.data.errors)
            }
        },
    })

    // Delete Offer
    const deleteMutation = useMutation({
        mutationFn: async (offerId) => {
            const res = await api.delete(`/offers/${offerId}`)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم إلغاء العرض بنجاح!' })
            queryClient.invalidateQueries({ queryKey: ['offers'] })
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ' })
        },
    })

    const resetForm = () => {
        setFormData({ product_id: '', offer_price: '', offer_max_quantity: '', expires_at: '' })
        setSelectedProduct(null)
        setFormErrors({})
        setProductsSearch('')
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const errors = {}
        if (!formData.product_id) errors.product_id = ['يرجى اختيار المنتج']
        if (!formData.offer_price || parseFloat(formData.offer_price) < 0) errors.offer_price = ['يرجى إدخال سعر العرض']
        if (!formData.expires_at) errors.expires_at = ['يرجى تحديد وقت انتهاء العرض']

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        const payload = {
            product_id: formData.product_id,
            offer_price: parseFloat(formData.offer_price),
            expires_at: formData.expires_at,
        }
        if (formData.offer_max_quantity) {
            payload.offer_max_quantity = parseInt(formData.offer_max_quantity)
        }

        createMutation.mutate(payload)
    }

    const handleSelectProduct = (product) => {
        setSelectedProduct(product)
        setFormData(prev => ({ ...prev, product_id: product.id }))
    }

    const getTimeRemaining = (expiresAt) => {
        const now = new Date()
        const exp = new Date(expiresAt)
        const diff = exp - now

        if (diff <= 0) return 'منتهي'

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (days > 0) return `${days} يوم ${hours} ساعة`
        if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`
        return `${minutes} دقيقة`
    }

    // Clear alert after 5 seconds
    useEffect(() => {
        if (alert) {
            const timer = setTimeout(() => setAlert(null), 5000)
            return () => clearTimeout(timer)
        }
    }, [alert])

    return (
        <AppLayout title="العروض" subtitle="إدارة عروض المنتجات">
            {/* Alert Toast */}
            {alert && (
                <div className={`mb-4 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium shadow-sm ${
                    alert.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                    {alert.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    <span>{alert.message}</span>
                    <button onClick={() => setAlert(null)} className="mr-auto"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Header Row */}
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => { resetForm(); setIsAddOpen(true) }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm transition-all hover:shadow-md"
                    style={{ backgroundColor: '#2E5A44' }}
                >
                    <Plus className="w-4 h-4" />
                    <span>إضافة عرض جديد</span>
                </button>

                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5" style={{ color: '#2E5A44' }} />
                    <h2 className="text-lg font-bold" style={{ color: '#1A1D16' }}>العروض الحالية</h2>
                </div>
            </div>

            {/* Offers List */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-3 border-t-transparent rounded-full" style={{ borderColor: '#2E5A44', borderTopColor: 'transparent' }} />
                </div>
            ) : offers.length === 0 ? (
                <div className="text-center py-20">
                    <Tag className="w-12 h-12 mx-auto mb-4" style={{ color: '#9A978F' }} />
                    <p className="text-lg font-bold" style={{ color: '#5C5950' }}>لا توجد عروض حالياً</p>
                    <p className="text-sm mt-1" style={{ color: '#9A978F' }}>أضف عرضاً جديداً لجذب العملاء</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers.map((offer) => {
                        const isActive = offer.is_currently_active
                        const isExpired = offer.is_expired

                        return (
                            <div
                                key={offer.id}
                                className={`rounded-2xl border p-5 transition-all ${
                                    isActive
                                        ? 'bg-white border-green-200 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 opacity-70'
                                }`}
                            >
                                {/* Status Badge */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                                        isActive
                                            ? 'bg-green-100 text-green-800'
                                            : isExpired
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                        {isActive ? 'فعال' : isExpired ? 'منتهي' : 'ملغي'}
                                    </div>

                                    {isActive && (
                                        <button
                                            onClick={() => {
                                                if (confirm('هل أنت متأكد من إلغاء هذا العرض؟ سيتم استعادة السعر الأصلي.')) {
                                                    deleteMutation.mutate(offer.id)
                                                }
                                            }}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                            title="إلغاء العرض"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex items-center gap-3 mb-3" style={{ direction: 'rtl' }}>
                                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                                        {offer.product_image_url ? (
                                            <img src={offer.product_image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Package className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold" style={{ color: '#1A1D16' }}>{offer.product_name}</h3>
                                        <p className="text-xs" style={{ color: '#9A978F' }}>{offer.category_name}</p>
                                    </div>
                                </div>

                                {/* Price Info */}
                                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: '#F4F3EF', direction: 'rtl' }}>
                                    <div className="text-center">
                                        <p className="text-[10px] font-medium" style={{ color: '#9A978F' }}>السعر الأصلي</p>
                                        <p className="text-sm font-bold line-through" style={{ color: '#BA1A1A' }}>{offer.original_price} ج.م</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-medium" style={{ color: '#9A978F' }}>سعر العرض</p>
                                        <p className="text-sm font-bold" style={{ color: '#2E5A44' }}>{offer.offer_price} ج.م</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[10px] font-medium" style={{ color: '#9A978F' }}>الخصم</p>
                                        <p className="text-sm font-bold" style={{ color: '#2E5A44' }}>{offer.discount_percentage}%</p>
                                    </div>
                                </div>

                                {/* Limit & Expiry */}
                                <div className="space-y-1.5 text-xs" style={{ direction: 'rtl' }}>
                                    {offer.offer_max_quantity && (
                                        <div className="flex items-center gap-1.5" style={{ color: '#5C5950' }}>
                                            <Package className="w-3.5 h-3.5" />
                                            <span>حد الشراء: <strong>{offer.offer_max_quantity}</strong> قطعة</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5" style={{ color: isActive ? '#2E5A44' : '#BA1A1A' }}>
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{isActive ? `متبقي: ${getTimeRemaining(offer.expires_at)}` : `انتهى: ${new Date(offer.expires_at).toLocaleDateString('ar-EG')}`}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5" style={{ color: '#9A978F' }}>
                                        <span>بواسطة: {offer.created_by_name}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Add Offer Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E2E0DA' }}>
                            <h3 className="text-lg font-bold" style={{ color: '#1A1D16' }}>إضافة عرض جديد</h3>
                            <button onClick={() => setIsAddOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                                <X className="w-5 h-5" style={{ color: '#5C5950' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Product Selection */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>اختيار المنتج *</label>

                                {selectedProduct ? (
                                    <div className="flex items-center justify-between px-4 py-3 rounded-xl border" style={{ borderColor: '#2E5A44', backgroundColor: '#F0F7F1' }}>
                                        <button type="button" onClick={() => { setSelectedProduct(null); setFormData(prev => ({...prev, product_id: ''})) }} className="text-red-500 text-xs font-bold">تغيير</button>
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-sm font-bold" style={{ color: '#1A1D16' }}>{selectedProduct.name}</p>
                                                <p className="text-xs" style={{ color: '#5C5950' }}>السعر الحالي: {selectedProduct.price} ج.م</p>
                                            </div>
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {selectedProduct.image_url ? (
                                                    <img src={selectedProduct.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <Package className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="ابحث عن المنتج..."
                                            value={productsSearch}
                                            onChange={(e) => setProductsSearch(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                            style={{ borderColor: formErrors.product_id ? '#BA1A1A' : '#E2E0DA' }}
                                        />
                                        {availableProducts.length > 0 && (
                                            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border" style={{ borderColor: '#E2E0DA' }}>
                                                {availableProducts.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => handleSelectProduct(p)}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-right border-b last:border-b-0"
                                                        style={{ borderColor: '#F4F3EF' }}
                                                    >
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium" style={{ color: '#1A1D16' }}>{p.name}</p>
                                                            <p className="text-xs" style={{ color: '#9A978F' }}>{p.price} ج.م — {p.category_name}</p>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                            {p.image_url ? (
                                                                <img src={p.image_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Package className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        {formErrors.product_id && <p className="text-xs text-red-600 mt-1">{formErrors.product_id[0]}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Offer Price */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>سعر العرض (ج.م) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.offer_price}
                                    onChange={(e) => setFormData(prev => ({...prev, offer_price: e.target.value}))}
                                    placeholder={selectedProduct ? `السعر الأصلي: ${selectedProduct.price} ج.م` : 'أدخل سعر العرض'}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: formErrors.offer_price ? '#BA1A1A' : '#E2E0DA' }}
                                />
                                {selectedProduct && formData.offer_price && parseFloat(formData.offer_price) < selectedProduct.price && (
                                    <p className="text-xs mt-1 font-medium" style={{ color: '#2E5A44' }}>
                                        خصم: {Math.round((1 - parseFloat(formData.offer_price) / selectedProduct.price) * 100)}%
                                    </p>
                                )}
                                {formErrors.offer_price && <p className="text-xs text-red-600 mt-1">{formErrors.offer_price[0]}</p>}
                            </div>

                            {/* Max Quantity (Optional) */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>
                                    حد الشراء (اختياري)
                                    <span className="text-xs font-normal mr-2" style={{ color: '#9A978F' }}>الحد الأقصى لكل عميل</span>
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.offer_max_quantity}
                                    onChange={(e) => setFormData(prev => ({...prev, offer_max_quantity: e.target.value}))}
                                    placeholder={selectedProduct?.max_app_order_quantity ? `الحد الحالي: ${selectedProduct.max_app_order_quantity}` : 'بدون حد'}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: '#E2E0DA' }}
                                />
                            </div>

                            {/* Expiry Date */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>تاريخ ووقت انتهاء العرض *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.expires_at}
                                    onChange={(e) => setFormData(prev => ({...prev, expires_at: e.target.value}))}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: formErrors.expires_at ? '#BA1A1A' : '#E2E0DA' }}
                                />
                                {formErrors.expires_at && <p className="text-xs text-red-600 mt-1">{formErrors.expires_at[0]}</p>}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddOpen(false)}
                                    className="flex-1 py-2.5 rounded-xl border text-sm font-bold"
                                    style={{ borderColor: '#E2E0DA', color: '#5C5950' }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#2E5A44', opacity: createMutation.isPending ? 0.7 : 1 }}
                                >
                                    {createMutation.isPending ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <>
                                            <Tag className="w-4 h-4" />
                                            <span>إضافة العرض وإرسال إشعار</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
