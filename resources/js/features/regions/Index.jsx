import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { Plus, Trash2, X, MapPin, AlertTriangle, CheckCircle2, XCircle, Edit } from 'lucide-react'
import api from '../../shared/services/api'

export default function RegionsIndex() {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editRegion, setEditRegion] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        min_order_total: '0',
        min_products_count: '1',
    })
    const [formErrors, setFormErrors] = useState({})

    // Fetch Regions
    const { data: regionsData, isLoading } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const res = await api.get('/regions')
            return res.data
        },
    })

    const regions = regionsData?.data || []

    const showAlert = (type, msg) => {
        setAlert({ type, msg })
        setTimeout(() => setAlert(null), 3000)
    }

    const resetForm = () => {
        setFormData({ name: '', min_order_total: '0', min_products_count: '1' })
        setFormErrors({})
        setIsAddOpen(false)
        setEditRegion(null)
    }

    const handleEdit = (r) => {
        setFormData({
            name: r.name,
            min_order_total: r.min_order_total,
            min_products_count: r.min_products_count,
        })
        setEditRegion(r)
        setIsAddOpen(true)
    }

    // Create Region
    const createMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/regions', payload)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['regions'])
            showAlert('success', data.message)
            resetForm()
        },
        onError: (err) => {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors)
            } else {
                showAlert('error', err.response?.data?.message || 'حدث خطأ')
            }
        }
    })

    // Update Region
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/regions/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['regions'])
            showAlert('success', data.message)
            resetForm()
        },
        onError: (err) => {
            if (err.response?.status === 422) {
                setFormErrors(err.response.data.errors)
            } else {
                showAlert('error', err.response?.data?.message || 'حدث خطأ')
            }
        }
    })

    // Delete Region
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/regions/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['regions'])
            showAlert('success', data.message)
        },
        onError: (err) => {
            showAlert('error', err.response?.data?.message || 'حدث خطأ أثناء الحذف')
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editRegion) {
            updateMutation.mutate({ id: editRegion.id, payload: formData })
        } else {
            createMutation.mutate(formData)
        }
    }

    return (
        <AppLayout title="مناطق التوصيل">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة مناطق التوصيل</h1>
                        <p className="text-sm text-gray-500 mt-1">تحديد المناطق وقواعد الحد الأدنى للطلبات الخاصة بها</p>
                    </div>

                    <button
                        onClick={() => { resetForm(); setIsAddOpen(true) }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm hover:shadow active:scale-95"
                        style={{ backgroundColor: '#2E5A44' }}
                    >
                        <Plus className="w-5 h-5" />
                        إضافة منطقة
                    </button>
                </div>

                {/* Alert Toast */}
                {alert && (
                    <div className={`fixed bottom-4 right-4 max-w-sm w-full p-4 rounded-xl shadow-lg flex items-start gap-3 z-50 animate-slide-up border ${
                        alert.type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                        {alert.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <p className={`text-sm font-medium ${alert.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {alert.msg}
                        </p>
                    </div>
                )}

                {/* Regions Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : regions.length === 0 ? (
                    <div className="bg-white rounded-2xl border p-12 text-center" style={{ borderColor: '#E2E0DA' }}>
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">لا توجد مناطق</h3>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto">لم يتم إضافة أي مناطق توصيل حتى الآن.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {regions.map((region) => (
                            <div
                                key={region.id}
                                className="bg-white rounded-2xl border p-5 flex flex-col transition-all hover:shadow-md"
                                style={{ borderColor: '#E2E0DA' }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#F4F3EF', color: '#2E5A44' }}>
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{region.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleEdit(region)}
                                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                                            title="تعديل"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
                                                    deleteMutation.mutate(region.id)
                                                }
                                            }}
                                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3 mt-auto">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">الحد الأدنى لقيمة الطلب:</span>
                                        <span className="font-bold text-gray-900">{region.min_order_total} ج.م</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">الحد الأدنى لعدد المنتجات:</span>
                                        <span className="font-bold text-gray-900">{region.min_products_count} منتج</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={resetForm}
                    />
                    
                    <div className="relative w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-slide-up">
                        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E2E0DA' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#F4F3EF', color: '#2E5A44' }}>
                                    {editRegion ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold" style={{ color: '#1A1D16' }}>{editRegion ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}</h2>
                                </div>
                            </div>
                            <button
                                onClick={resetForm}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="w-5 h-5" style={{ color: '#5C5950' }} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Region Name */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>اسم المنطقة *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="مثال: مدينة نصر"
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: formErrors.name ? '#BA1A1A' : '#E2E0DA' }}
                                />
                                {formErrors.name && <p className="text-xs text-red-600 mt-1">{formErrors.name[0]}</p>}
                            </div>

                            {/* Min Order Total */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>الحد الأدنى لقيمة الطلب (ج.م) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.min_order_total}
                                    onChange={(e) => setFormData(prev => ({...prev, min_order_total: e.target.value}))}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: formErrors.min_order_total ? '#BA1A1A' : '#E2E0DA' }}
                                />
                                {formErrors.min_order_total && <p className="text-xs text-red-600 mt-1">{formErrors.min_order_total[0]}</p>}
                            </div>

                            {/* Min Products Count */}
                            <div>
                                <label className="block text-sm font-bold mb-2" style={{ color: '#1A1D16' }}>الحد الأدنى لعدد المنتجات *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.min_products_count}
                                    onChange={(e) => setFormData(prev => ({...prev, min_products_count: e.target.value}))}
                                    className="w-full px-4 py-2.5 rounded-xl border text-sm text-right"
                                    style={{ borderColor: formErrors.min_products_count ? '#BA1A1A' : '#E2E0DA' }}
                                />
                                {formErrors.min_products_count && <p className="text-xs text-red-600 mt-1">{formErrors.min_products_count[0]}</p>}
                            </div>

                            {/* Submit */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-2.5 rounded-xl border text-sm font-bold"
                                    style={{ borderColor: '#E2E0DA', color: '#5C5950' }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#2E5A44' }}
                                >
                                    {(createMutation.isPending || updateMutation.isPending) ? (
                                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                    ) : (
                                        <span>{editRegion ? 'حفظ التعديلات' : 'إضافة المنطقة'}</span>
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
