import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { Button, SearchInput } from '../../shared/components'
import ProductCard from './components/ProductCard'
import CategoryFilter from './components/CategoryFilter'
import { Plus, LayoutGrid, List, Edit2, Trash2, X, Image as ImageIcon, UploadCloud, Info, Download } from 'lucide-react'
import api from '../../shared/services/api'

export default function ProductsIndex({ products: initialProducts, total_count: initialTotalCount, categories: initialCategories, filters: initialFilters }) {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [search, setSearch] = useState(initialFilters?.search || '')
    const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category_id || 'all')
    const [viewMode, setViewMode] = useState('grid')
    
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState(null)
    const [imagePreview, setImagePreview] = useState(null)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        price: '',
        cost_price: '',
        stock: '',
        unit: 'علبة',
        number_of_items_in_unit: 1,
        category_id: '',
        description: '',
        image: null,
    })
    const [formErrors, setFormErrors] = useState({})

    // React Query: Fetch Products
    const { data: productsData, isLoading: isProductsLoading } = useQuery({
        queryKey: ['products', search, selectedCategory],
        queryFn: async () => {
            const res = await api.get('/products', {
                params: {
                    search: search || undefined,
                    category_id: selectedCategory !== 'all' ? selectedCategory : undefined,
                }
            })
            return res.data
        },
        initialData: initialProducts ? {
            products: initialProducts,
            total_count: initialTotalCount,
            categories: initialCategories,
        } : undefined,
    })

    // React Query: Fetch Categories
    const { data: categoriesData = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories')
            return res.data.categories || []
        },
        initialData: initialCategories || undefined,
    })

    const loadedProducts = productsData?.products?.data || []
    const totalCount = productsData?.total_count || 0
    const categories = categoriesData.length ? categoriesData : (productsData?.categories || [])

    // Add Product Mutation
    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/products', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم إضافة المنتج بنجاح!' })
            setIsAddOpen(false)
            setImagePreview(null)
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء إضافة المنتج' })
            }
        }
    })

    // Edit Product Mutation
    const editMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.post(`/products/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم تحديث المنتج بنجاح!' })
            setEditingProduct(null)
            setImagePreview(null)
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء تحديث المنتج' })
            }
        }
    })

    // Delete Product Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/products/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم حذف المنتج بنجاح!' })
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء حذف المنتج' })
        }
    })

    // Import Products Mutation
    const importMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/products/import', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم استيراد المنتجات بنجاح!' })
            setIsImportOpen(false)
            setImportFile(null)
            queryClient.invalidateQueries({ queryKey: ['products'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء استيراد المنتجات' })
        }
    })

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            setFormData(prev => ({ ...prev, image: file }))
            const reader = new FileReader()
            reader.onloadend = () => setImagePreview(reader.result)
            reader.readAsDataURL(file)
        }
    }

    const openAddModal = () => {
        setFormErrors({})
        setFormData({
            name: '',
            price: '',
            cost_price: '',
            stock: '',
            unit: 'علبة',
            number_of_items_in_unit: 1,
            category_id: categories[0]?.id || '',
            description: '',
            is_available_on_app: true,
            max_app_order_quantity: '',
            image: null,
        })
        setImagePreview(null)
        setIsAddOpen(true)
    }

    const openEditModal = (product) => {
        setFormErrors({})
        setEditingProduct(product)
        setFormData({
            name: product.name,
            price: product.price,
            cost_price: product.cost_price || '',
            stock: product.stock,
            unit: product.unit,
            number_of_items_in_unit: product.number_of_items_in_unit,
            category_id: product.category_id,
            description: product.description || '',
            is_available_on_app: product.is_available_on_app !== undefined ? product.is_available_on_app : true,
            max_app_order_quantity: product.max_app_order_quantity !== null && product.max_app_order_quantity !== undefined ? product.max_app_order_quantity : '',
            image: null,
        })
        setImagePreview(product.image_url || null)
    }

    const handleAddSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        const payload = new FormData()
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) payload.append(key, formData[key])
        })
        addMutation.mutate(payload)
    }

    const handleEditSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        const payload = new FormData()
        payload.append('_method', 'PUT')
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null) payload.append(key, formData[key])
        })
        editMutation.mutate({ id: editingProduct.id, payload })
    }

    const handleDelete = (product) => {
        if (window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
            deleteMutation.mutate(product.id)
        }
    }

    const handleImportSubmit = (e) => {
        e.preventDefault()
        if (!importFile) return
        const payload = new FormData()
        payload.append('file', importFile)
        importMutation.mutate(payload)
    }

    const downloadProductTemplate = () => {
        const headers = ['name', 'price', 'cost_price', 'category', 'stock', 'unit', 'number_of_items_in_unit', 'description']
        const sampleRow = ['منتج تجريبي', '150', '100', 'عام', '50', 'علبة', '12', 'وصف المنتج التجريبي']
        const csvContent = '\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'products_import_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <AppLayout title="المنتجات" subtitle={`إجمالي ${totalCount || loadedProducts.length} منتج متوفر`}>
            {/* Status/Flash Alerts */}
            {alert && (
                <div 
                    className="p-4 rounded-xl text-sm font-semibold text-center mb-6 border transition-all animate-fade-in relative flex items-center justify-between gap-4"
                    style={{
                        backgroundColor: alert.type === 'success' ? '#EBF5EF' : '#FDEEEC',
                        borderColor: alert.type === 'success' ? '#ADCBBB' : '#E8A09A',
                        color: alert.type === 'success' ? '#2E5A44' : '#922B21'
                    }}
                    dir="rtl"
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" dir="rtl">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                    <SearchInput
                        placeholder="البحث عن المنتجات..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="sm:w-72"
                    />
                    <CategoryFilter
                        categories={categories}
                        selected={selectedCategory}
                        onChange={setSelectedCategory}
                    />
                </div>
                <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="flex items-center bg-[#EAE8E2] rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-[#7C7870]'}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-[#7C7870]'}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm border border-[#2E5A44] text-[#2E5A44] transition-all hover:bg-[#EEF4F1] active:scale-95 flex items-center justify-center gap-2"
                    >
                        <UploadCloud className="w-4 h-4" />
                        استيراد من إكسل (CSV)
                    </button>
                    <Button icon={Plus} onClick={openAddModal}>إضافة منتج</Button>
                </div>
            </div>

            {/* Product Grid / List */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                    {loadedProducts.map((product, i) => (
                        <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                            <ProductCard 
                                product={product} 
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        </div>
                    ))}
                    {loadedProducts.length === 0 && (
                        <div className="col-span-full bg-white rounded-2xl p-12 text-center border border-[#EAE8E2]">
                            <p className="text-sm font-semibold text-[#9A978F]">لم يتم العثور على أي منتج مطابق للبحث</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-surface-100 overflow-hidden text-right" dir="rtl">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b border-[#EAE8E2]" style={{ backgroundColor: '#FAF9F6' }}>
                                <th className="text-right text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3">المنتج</th>
                                <th className="text-right text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3 hidden sm:table-cell">القسم</th>
                                <th className="text-right text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3">سعر البيع</th>
                                <th className="text-right text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3 hidden lg:table-cell">سعر التكلفة</th>
                                <th className="text-right text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3 hidden md:table-cell">المخزون</th>
                                <th className="text-left text-xs font-semibold text-[#9A978F] uppercase tracking-wider px-6 py-3">الخيارات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadedProducts.map((product) => (
                                <tr key={product.id} className="border-b border-[#FAF9F6] hover:bg-[#FAF9F6]/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.image_url ? (
                                                <img 
                                                    src={product.image_url} 
                                                    alt={product.name} 
                                                    className="w-10 h-10 rounded-xl object-cover border border-[#EAE8E2]"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-[#EEF4F1] flex items-center justify-center">
                                                    <ImageIcon className="w-5 h-5 text-[#2E5A44]" />
                                                </div>
                                            )}
                                            <span className="text-sm font-semibold text-[#1A2D23]">{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#7C7870] hidden sm:table-cell">{product.category_name}</td>
                                    <td className="px-6 py-4 text-sm font-bold text-[#1A2D23]">{product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 hidden lg:table-cell">
                                        {product.cost_price > 0
                                            ? <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>{product.cost_price.toFixed(2)} ج.م</span>
                                            : <span className="text-xs text-[#B8B5AE]">—</span>
                                        }
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[#7C7870] hidden md:table-cell">
                                        {product.stock === 0 ? (
                                            <span className="text-[#C0392B] font-semibold">نفذت الكمية</span>
                                        ) : product.stock <= 5 ? (
                                            <span className="text-[#D4A017] font-semibold">مخزون منخفض ({Number(product.stock).toLocaleString('en-US')} {product.unit})</span>
                                        ) : (
                                            <span>{Number(product.stock).toLocaleString('en-US')} {product.unit}</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(product)}
                                                className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#7C7870] hover:text-[#2E5A44] transition-colors"
                                                title="تعديل"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product)}
                                                className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#7C7870] hover:text-[#C0392B] transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {loadedProducts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-sm font-semibold text-[#9A978F]">
                                        لم يتم العثور على أي منتج مطابق للبحث
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ADD MODAL with BLURRED BACKGROUND */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F6]/70 backdrop-blur-md overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-3xl border border-[#EAE8E2] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative">
                        <button
                            onClick={() => setIsAddOpen(false)}
                            className="absolute left-6 top-6 p-2 rounded-xl hover:bg-[#FAF9F6] text-[#9A978F] hover:text-[#1A2D23] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-[#1A2D23] mb-6 text-right">إضافة منتج جديد</h3>

                        <form onSubmit={handleAddSubmit} className="space-y-5 text-right" dir="rtl">
                            {/* Image Upload Zone */}
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>صورة المنتج</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-[#FAF9F6] transition-colors" style={{ borderColor: '#E2E0DA' }}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 text-[#9A978F] mb-2" />
                                                <p className="text-xs font-semibold text-[#5C5950]">اضغط لرفع صورة المنتج</p>
                                                <p className="text-[10px] text-[#B8B5AE] mt-1">PNG, JPG أو GIF بحد أقصى 2 ميجابايت</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                                {errors.image && <p className="text-xs text-[#C0392B] mt-1">{errors.image}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>اسم المنتج</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: سماد عضوي 10كجم"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    />
                                    {formErrors.name && <p className="text-xs text-[#C0392B] mt-1">{formErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>القسم</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium appearance-none"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    >
                                        <option value="" disabled>اختر القسم</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.category_id && <p className="text-xs text-[#C0392B] mt-1">{formErrors.category_id}</p>}
                                </div>
                            </div>

                            {/* Price row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>سعر البيع</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.price && <p className="text-xs text-[#C0392B] mt-1">{formErrors.price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>سعر التكلفة</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={formData.cost_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #FDE68A', color: '#1A2D23' }} />
                                    {formErrors.cost_price && <p className="text-xs text-[#C0392B] mt-1">{formErrors.cost_price}</p>}
                                </div>
                            </div>
                            {/* Stock / Unit / Items row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الكمية المتوفرة</label>
                                    <input type="number" placeholder="0" value={formData.stock}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.stock && <p className="text-xs text-[#C0392B] mt-1">{formErrors.stock}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الوحدة</label>
                                    <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium appearance-none"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required>
                                        {['شكارة', 'علبة', 'كرتونة', 'شريط', 'دستة', 'لفة', 'قطعة'].map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    {formErrors.unit && <p className="text-xs text-[#C0392B] mt-1">{formErrors.unit}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>القطع داخل الوحدة</label>
                                    <input type="number" placeholder="1" value={formData.number_of_items_in_unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, number_of_items_in_unit: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.number_of_items_in_unit && <p className="text-xs text-[#C0392B] mt-1">{formErrors.number_of_items_in_unit}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الوصف</label>
                                <textarea
                                    placeholder="اكتب وصفاً مبسطاً للمنتج..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="3"
                                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium resize-none"
                                    style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                />
                                {formErrors.description && <p className="text-xs text-[#C0392B] mt-1">{formErrors.description}</p>}
                            </div>

                            {/* App Specific Options */}
                            <div className="p-4 rounded-2xl border border-[#ADCBBB] bg-[#EBF5EF] space-y-3">
                                <h4 className="text-xs font-bold text-[#2E5A44] flex items-center gap-1.5">
                                    <span>إعدادات العرض والشراء على تطبيق الموبايل</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_available_on_app}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_available_on_app: e.target.checked }))}
                                            className="w-4 h-4 text-[#2E5A44] rounded focus:ring-0"
                                        />
                                        <span className="text-xs font-bold text-[#1A2D23]">متاح للعرض للعملاء على التطبيق</span>
                                    </label>

                                    <div>
                                        <label className="block text-xs font-bold text-[#5C5950] mb-1">أقصى كمية مسموحة للشراء من التطبيق</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="غير محدد (مفتوح)"
                                            value={formData.max_app_order_quantity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_app_order_quantity: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#EAE8E2]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={addMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#2E5A44' }}
                                >
                                    {addMutation.isPending ? 'جاري الحفظ...' : 'إضافة المنتج'}
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

            {/* EDIT MODAL with BLURRED BACKGROUND */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F6]/70 backdrop-blur-md overflow-y-auto animate-fade-in">
                    <div className="bg-white rounded-3xl border border-[#EAE8E2] w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative">
                        <button
                            onClick={() => setEditingProduct(null)}
                            className="absolute left-6 top-6 p-2 rounded-xl hover:bg-[#FAF9F6] text-[#9A978F] hover:text-[#1A2D23] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-[#1A2D23] mb-6 text-right">تعديل المنتج</h3>

                        <form onSubmit={handleEditSubmit} className="space-y-5 text-right" dir="rtl">
                            <div>
                                <label className="block text-sm font-semibold mb-2" style={{ color: '#5C5950' }}>صورة المنتج</label>
                                <div className="flex items-center justify-center w-full">
                                    <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer hover:bg-[#FAF9F6] transition-colors" style={{ borderColor: '#E2E0DA' }}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 text-[#9A978F] mb-2" />
                                                <p className="text-xs font-semibold text-[#5C5950]">اضغط لرفع صورة منتج جديدة</p>
                                                <p className="text-[10px] text-[#B8B5AE] mt-1">PNG, JPG أو GIF بحد أقصى 2 ميجابايت</p>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                                {formErrors.image && <p className="text-xs text-[#C0392B] mt-1">{formErrors.image}</p>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>اسم المنتج</label>
                                    <input
                                        type="text"
                                        placeholder="مثال: سماد عضوي 10كجم"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    />
                                    {formErrors.name && <p className="text-xs text-[#C0392B] mt-1">{formErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>القسم</label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium appearance-none"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                        required
                                    >
                                        <option value="" disabled>اختر القسم</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    {formErrors.category_id && <p className="text-xs text-[#C0392B] mt-1">{formErrors.category_id}</p>}
                                </div>
                            </div>

                            {/* Price row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>سعر البيع</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={formData.price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.price && <p className="text-xs text-[#C0392B] mt-1">{formErrors.price}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>سعر التكلفة</label>
                                    <input type="number" step="0.01" placeholder="0.00" value={formData.cost_price}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #FDE68A', color: '#1A2D23' }} />
                                    {formErrors.cost_price && <p className="text-xs text-[#C0392B] mt-1">{formErrors.cost_price}</p>}
                                </div>
                            </div>
                            {/* Stock / Unit / Items row */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الكمية المتوفرة</label>
                                    <input type="number" placeholder="0" value={formData.stock}
                                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.stock && <p className="text-xs text-[#C0392B] mt-1">{formErrors.stock}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الوحدة</label>
                                    <select value={formData.unit} onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium appearance-none"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required>
                                        {['شكارة', 'علبة', 'كرتونة', 'شريط', 'دستة', 'لفة', 'قطعة'].map((u) => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    {formErrors.unit && <p className="text-xs text-[#C0392B] mt-1">{formErrors.unit}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>القطع داخل الوحدة</label>
                                    <input type="number" placeholder="1" value={formData.number_of_items_in_unit}
                                        onChange={(e) => setFormData(prev => ({ ...prev, number_of_items_in_unit: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium"
                                        style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }} required />
                                    {formErrors.number_of_items_in_unit && <p className="text-xs text-[#C0392B] mt-1">{formErrors.number_of_items_in_unit}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-1.5" style={{ color: '#5C5950' }}>الوصف</label>
                                <textarea
                                    placeholder="اكتب وصفاً مبسطاً للمنتج..."
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    rows="3"
                                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all focus:outline-none text-right font-medium resize-none"
                                    style={{ backgroundColor: '#F4F3EF', border: '1px solid #E2E0DA', color: '#1A2D23' }}
                                />
                                {formErrors.description && <p className="text-xs text-[#C0392B] mt-1">{formErrors.description}</p>}
                            </div>

                            {/* App Specific Options */}
                            <div className="p-4 rounded-2xl border border-[#ADCBBB] bg-[#EBF5EF] space-y-3">
                                <h4 className="text-xs font-bold text-[#2E5A44] flex items-center gap-1.5">
                                    <span>إعدادات العرض والشراء على تطبيق الموبايل</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_available_on_app}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_available_on_app: e.target.checked }))}
                                            className="w-4 h-4 text-[#2E5A44] rounded focus:ring-0"
                                        />
                                        <span className="text-xs font-bold text-[#1A2D23]">متاح للعرض للعملاء على التطبيق</span>
                                    </label>

                                    <div>
                                        <label className="block text-xs font-bold text-[#5C5950] mb-1">أقصى كمية مسموحة للشراء من التطبيق</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="غير محدد (مفتوح)"
                                            value={formData.max_app_order_quantity}
                                            onChange={(e) => setFormData(prev => ({ ...prev, max_app_order_quantity: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-[#EAE8E2]"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={editMutation.isPending}
                                    className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-95 active:scale-95 shadow-md flex items-center justify-center gap-2"
                                    style={{ backgroundColor: '#2E5A44' }}
                                >
                                    {editMutation.isPending ? 'جاري الحفظ...' : 'تعديل المنتج'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingProduct(null)}
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

            {/* Import Excel/CSV Modal */}
            {isImportOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-[#EAE8E2] shadow-2xl">
                        <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                            <h3 className="font-bold text-lg text-[#1A2D23] flex items-center gap-2">
                                <UploadCloud className="w-5 h-5 text-primary-600" />
                                استيراد منتجات من ملف إكسل (CSV)
                            </h3>
                            <button onClick={() => setIsImportOpen(false)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                <X className="w-5 h-5 text-[#9A978F]" />
                            </button>
                        </div>
                        <form onSubmit={handleImportSubmit} className="p-6 space-y-4">
                            <div className="bg-[#FAF9F6] border border-[#EAE8E2] p-4 rounded-xl space-y-3 text-right">
                                <h4 className="font-bold text-xs text-[#1A2D23] flex items-center gap-1.5 justify-end">
                                    <span>تعليمات هامة للاستيراد (Database Column Headers)</span>
                                    <Info className="w-4 h-4 text-primary-600" />
                                </h4>
                                <p className="text-xs text-[#7C7870] leading-relaxed font-semibold">
                                    يرجى حفظ ملف الإكسل بصيغة <strong>CSV (Comma Delimited)</strong>. أسماء الأعمدة في الصف الأول بالإنجليزية حسب أسماء الجدول في قاعدة البيانات:
                                </p>
                                <div className="bg-[#EEF4F1] p-3 rounded-lg border border-[#ADCBBB] text-xs font-mono text-[#2E5A44] text-center select-all block overflow-x-auto whitespace-nowrap dir-ltr">
                                    name, price, cost_price, category, stock, unit, number_of_items_in_unit, description
                                </div>
                                <p className="text-[10px] text-[#9A978F]">
                                    * أعمدة "name" و "price" و "category" مطلوبة أساسياً (ويمكن استخدام المسميات بالعربية: الاسم، السعر، التصنيف).
                                </p>
                                <button
                                    type="button"
                                    onClick={downloadProductTemplate}
                                    className="w-full py-2 px-3 bg-white hover:bg-[#EEF4F1] text-[#2E5A44] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-[#ADCBBB] shadow-sm active:scale-98"
                                >
                                    <Download className="w-4 h-4" />
                                    تنزيل نموذج ملف استيراد المنتجات (CSV Template)
                                </button>
                            </div>

                            <div className="space-y-1 text-right">
                                <label className="text-xs font-bold text-[#7C7870]">اختر ملف CSV أو Excel</label>
                                <input
                                    type="file"
                                    accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                                    onChange={e => setImportFile(e.target.files[0])}
                                    className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                    required
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FAF9F6]">
                                <button
                                    type="button"
                                    onClick={() => setIsImportOpen(false)}
                                    className="px-4 py-2 border border-[#EAE8E2] rounded-xl text-sm font-bold text-[#7C7870] hover:bg-[#FAF9F6]"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile}
                                    className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                    style={{ backgroundColor: '#2E5A44' }}
                                >
                                    بدء الاستيراد
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    )
}
