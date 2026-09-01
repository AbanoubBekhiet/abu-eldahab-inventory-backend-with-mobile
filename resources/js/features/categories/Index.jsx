import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import { Plus, Edit2, Trash2, X, Image as ImageIcon, UploadCloud } from 'lucide-react'
import api from '../../shared/services/api'

export default function CategoriesIndex({ categories: initialCategories, filters: initialFilters }) {
    const queryClient = useQueryClient()
    const [search, setSearch] = useState(initialFilters?.search || '')
    const [alert, setAlert] = useState(null)

    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingCategory, setEditingCategory] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [formData, setFormData] = useState({ name: '', image: null })
    const [formErrors, setFormErrors] = useState({})

    // React Query: Fetch Categories
    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories', search],
        queryFn: async () => {
            const res = await api.get('/categories', { params: { search } })
            return res.data.categories || []
        },
        initialData: initialCategories || undefined,
    })

    // React Query: Add Mutation
    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/categories', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم إضافة التصنيف بنجاح' })
            setIsAddOpen(false)
            setFormData({ name: '', image: null })
            setImagePreview(null)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء إضافة التصنيف' })
            }
        },
    })

    // React Query: Update Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.post(`/categories/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم تحديث التصنيف بنجاح' })
            setEditingCategory(null)
            setFormData({ name: '', image: null })
            setImagePreview(null)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء تحديث التصنيف' })
            }
        },
    })

    // React Query: Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/categories/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم حذف التصنيف بنجاح' })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء حذف التصنيف' })
        },
    })

    const openAddModal = () => {
        setFormData({ name: '', image: null })
        setImagePreview(null)
        setFormErrors({})
        setIsAddOpen(true)
    }

    const openEditModal = (cat) => {
        setFormErrors({})
        setEditingCategory(cat)
        setFormData({ name: cat.name, image: null })
        setImagePreview(cat.image_url)
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({ ...prev, image: file }))
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const handleAddSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        const payload = new FormData()
        payload.append('name', formData.name)
        if (formData.image) payload.append('image', formData.image)
        addMutation.mutate(payload)
    }

    const handleUpdateSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        const payload = new FormData()
        payload.append('_method', 'PUT')
        payload.append('name', formData.name)
        if (formData.image) payload.append('image', formData.image)
        updateMutation.mutate({ id: editingCategory.id, payload })
    }

    const handleDelete = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا التصنيف؟')) {
            deleteMutation.mutate(id)
        }
    }

    return (
        <AppLayout title="تصنيفات المخزون" subtitle="إدارة وتصنيف المنتجات لسهولة الوصول والمبيعات">
            <div className="space-y-5" dir="rtl">
                {/* Status/Flash Alerts */}
                {alert && (
                    <div 
                        className="p-4 rounded-xl text-sm font-semibold text-center border transition-all animate-fade-in relative flex items-center justify-between gap-4"
                        style={{
                            backgroundColor: alert.type === 'success' ? '#EBF5EF' : '#FDEEEC',
                            borderColor: alert.type === 'success' ? '#ADCBBB' : '#E8A09A',
                            color: alert.type === 'success' ? '#2E5A44' : '#922B21'
                        }}
                    >
                        <span className="flex-1 text-right">{alert.message}</span>
                        <button 
                            onClick={() => setAlert(null)}
                            className="opacity-70 hover:opacity-100 transition-opacity"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Toolbar */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8E2] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <SearchInput
                        placeholder="ابحث عن تصنيف..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-80"
                    />
                    <button
                        onClick={openAddModal}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 flex items-center justify-center gap-2"
                        style={{ backgroundColor: '#2E5A44' }}
                    >
                        <Plus className="w-4 h-4" />
                        إضافة تصنيف جديد
                    </button>
                </div>

                {/* Categories List */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categories.map((cat, i) => (
                        <div
                            key={cat.id}
                            className="bg-white rounded-2xl p-5 border border-[#EAE8E2] flex flex-col justify-between transition-all hover:shadow-md hover:border-[#ADCBBB] animate-fade-in text-right"
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            <div>
                                {/* Card Image / Emoji Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    {cat.image_url ? (
                                        <img
                                            src={cat.image_url}
                                            alt={cat.name}
                                            className="w-14 h-14 rounded-xl object-cover border border-[#EAE8E2]"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-xl bg-[#FAF9F6] border border-[#EAE8E2] flex items-center justify-center text-2xl text-[#9A978F]">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-sm font-bold text-[#1A2D23]">{cat.name}</h4>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FAF9F6] border border-[#EAE8E2] text-[#5C5950]">
                                            {cat.products_count} منتج
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-[#FAF9F6]">
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => openEditModal(cat)}
                                        className="p-2 rounded-lg hover:bg-[#EAE8E2] text-[#5C5950] transition-colors"
                                        title="تعديل"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(cat.id)}
                                        className="p-2 rounded-lg hover:bg-[#FDEEEC] text-[#C0392B] transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {categories.length === 0 && !isLoading && (
                        <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-[#EAE8E2]">
                            <p className="text-sm font-semibold text-[#9A978F]">لم يتم العثور على أي تصنيف مطابق للبحث</p>
                        </div>
                    )}
                </div>

                {isAddOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F6]/70 backdrop-blur-md overflow-y-auto animate-fade-in">
                        <div className="bg-white rounded-3xl border border-[#EAE8E2] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
                            <button
                                onClick={() => setIsAddOpen(false)}
                                className="absolute left-6 top-6 p-2 rounded-xl hover:bg-[#FAF9F6] text-[#9A978F] hover:text-[#1A2D23] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-bold text-[#1A2D23] mb-6 text-right">إضافة تصنيف جديد</h3>

                            <form onSubmit={handleAddSubmit} className="space-y-5 text-right">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>صورة التصنيف</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-[#FAF9F6] transition-colors" style={{ borderColor: '#E2E0DA' }}>
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud className="w-8 h-8 text-[#9A978F] mb-2" />
                                                    <p className="text-xs font-semibold text-[#5C5950]">اضغط لرفع صورة التصنيف</p>
                                                    <p className="text-[10px] text-[#B8B5AE] mt-1">PNG, JPG أو GIF بحد أقصى 2 ميجابايت</p>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                    {formErrors.image && <p className="text-xs text-[#C0392B] mt-1">{formErrors.image}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>اسم التصنيف</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: نباتات زينة"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    />
                                    {formErrors.name && <p className="text-xs text-[#C0392B] mt-1">{formErrors.name}</p>}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={addMutation.isPending}
                                        className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2"
                                        style={{ backgroundColor: '#2E5A44' }}
                                    >
                                        {addMutation.isPending ? 'جاري الحفظ...' : 'إضافة التصنيف'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsAddOpen(false)}
                                        className="flex-1 py-3 rounded-xl font-bold transition-all hover:bg-[#EAE8E2] border border-[#E2E0DA]"
                                        style={{ color: '#5C5950' }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {editingCategory && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F6]/70 backdrop-blur-md overflow-y-auto animate-fade-in">
                        <div className="bg-white rounded-3xl border border-[#EAE8E2] w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
                            <button
                                onClick={() => setEditingCategory(null)}
                                className="absolute left-6 top-6 p-2 rounded-xl hover:bg-[#FAF9F6] text-[#9A978F] hover:text-[#1A2D23] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <h3 className="text-lg font-bold text-[#1A2D23] mb-6 text-right">تعديل التصنيف: {editingCategory.name}</h3>

                            <form onSubmit={handleUpdateSubmit} className="space-y-5 text-right">
                                <div>
                                    <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>صورة التصنيف</label>
                                    <div className="flex items-center justify-center w-full">
                                        <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-[#FAF9F6] transition-colors" style={{ borderColor: '#E2E0DA' }}>
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloud className="w-8 h-8 text-[#9A978F] mb-2" />
                                                    <p className="text-xs font-semibold text-[#5C5950]">اضغط لرفع صورة التصنيف</p>
                                                    <p className="text-[10px] text-[#B8B5AE] mt-1">PNG, JPG أو GIF بحد أقصى 2 ميجابايت</p>
                                                </div>
                                            )}
                                            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                        </label>
                                    </div>
                                    {formErrors.image && <p className="text-xs text-[#C0392B] mt-1">{formErrors.image}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>اسم التصنيف</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: نباتات زينة"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    />
                                    {formErrors.name && <p className="text-xs text-[#C0392B] mt-1">{formErrors.name}</p>}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2"
                                        style={{ backgroundColor: '#2E5A44' }}
                                    >
                                        {updateMutation.isPending ? 'جاري التحديث...' : 'تحديث التصنيف'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingCategory(null)}
                                        className="flex-1 py-3 rounded-xl font-bold transition-all hover:bg-[#EAE8E2] border border-[#E2E0DA]"
                                        style={{ color: '#5C5950' }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
