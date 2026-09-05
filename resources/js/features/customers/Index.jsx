import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput, Button, Badge } from '../../shared/components'
import { Plus, Mail, Phone, MapPin, Store, Tag, X, Edit2, Trash2, UploadCloud, Info, Eye, Download } from 'lucide-react'
import api from '../../shared/services/api'

export default function CustomersIndex({ customers: initialCustomers, filters: initialFilters }) {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [search, setSearch] = useState(initialFilters?.search || '')
    const [isAddOpen, setIsAddOpen] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState(null)
    const [viewingCustomer, setViewingCustomer] = useState(null)
    const [isImportOpen, setIsImportOpen] = useState(false)
    const [importFile, setImportFile] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        address: '',
        shop_name: '',
        category_of_place: '',
        region_id: '',
    })
    const [formErrors, setFormErrors] = useState({})

    // React Query: Fetch Customers
    const { data: customersData, isLoading: isCustomersLoading } = useQuery({
        queryKey: ['customers', search],
        queryFn: async () => {
            const res = await api.get('/customers', { params: { search: search || undefined } })
            return res.data
        },
        initialData: initialCustomers ? { customers: initialCustomers } : undefined,
    })

    const loadedCustomers = customersData?.customers?.data || customersData?.data || []

    // React Query: Fetch Regions
    const { data: regionsData } = useQuery({
        queryKey: ['regions'],
        queryFn: async () => {
            const res = await api.get('/regions')
            return res.data
        },
    })
    const regions = regionsData?.data || []

    // Add Customer Mutation
    const addMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/customers', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم إضافة العميل بنجاح!' })
            setIsAddOpen(false)
            setFormData({ name: '', phone_number: '', address: '', shop_name: '', category_of_place: '', region_id: '' })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء إضافة العميل' })
            }
        }
    })

    // Update Customer Mutation
    const updateMutation = useMutation({
        mutationFn: async ({ id, payload }) => {
            const res = await api.put(`/customers/${id}`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم تحديث بيانات العميل بنجاح!' })
            setEditingCustomer(null)
            setFormData({ name: '', phone_number: '', address: '', shop_name: '', category_of_place: '', region_id: '' })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
        onError: (err) => {
            const errData = err.response?.data
            if (errData?.errors) {
                setFormErrors(errData.errors)
            } else {
                setAlert({ type: 'error', message: errData?.message || 'حدث خطأ أثناء تحديث العميل' })
            }
        }
    })

    // Delete Customer Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/customers/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم حذف العميل بنجاح!' })
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء حذف العميل' })
        }
    })

    // Import Customers Mutation
    const importMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/customers/import', payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم استيراد العملاء بنجاح!' })
            setIsImportOpen(false)
            setImportFile(null)
            queryClient.invalidateQueries({ queryKey: ['customers'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء استيراد العملاء' })
        }
    })

    const openAddModal = () => {
        setFormErrors({})
        setFormData({ name: '', phone_number: '', address: '', shop_name: '', category_of_place: '', region_id: '' })
        setIsAddOpen(true)
    }

    const openEditModal = (cust) => {
        setFormErrors({})
        setEditingCustomer(cust)
        setFormData({
            name: cust.name,
            phone_number: cust.phone === '—' ? '' : cust.phone,
            address: cust.address === '—' ? '' : cust.address,
            shop_name: cust.shop_name === '—' ? '' : cust.shop_name,
            category_of_place: cust.category_of_place === '—' ? '' : cust.category_of_place,
            region_id: cust.region_id || '',
        })
    }

    const handleAddSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        addMutation.mutate(formData)
    }

    const handleUpdateSubmit = (e) => {
        e.preventDefault()
        setFormErrors({})
        updateMutation.mutate({ id: editingCustomer.id, payload: formData })
    }

    const handleDelete = (id) => {
        if (window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
            deleteMutation.mutate(id)
        }
    }

    const handleImportSubmit = (e) => {
        e.preventDefault()
        if (!importFile) return
        const payload = new FormData()
        payload.append('file', importFile)
        importMutation.mutate(payload)
    }

    const downloadCustomerTemplate = () => {
        const headers = ['name', 'shop_name', 'phone', 'address', 'email', 'category_of_place']
        const sampleRow = ['أحمد محمد', 'محل الأمل', '01000000000', 'القاهرة', 'ahmed@example.com', 'تجزئة']
        const csvContent = '\uFEFF' + [headers.join(','), sampleRow.join(',')].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'customers_import_template.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <AppLayout title="إدارة العملاء" subtitle={`${loadedCustomers.length} عميل مسجل بالنظام`}>
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
                        placeholder="البحث عن العملاء..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full sm:w-80"
                    />
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setIsImportOpen(true)}
                            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm border border-[#2E5A44] text-[#2E5A44] transition-all hover:bg-[#EEF4F1] active:scale-95 flex items-center justify-center gap-2"
                        >
                            <UploadCloud className="w-4.5 h-4.5" />
                            استيراد من إكسل (CSV)
                        </button>
                        <button
                            onClick={openAddModal}
                            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-95 active:scale-95 flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#2E5A44' }}
                        >
                            <Plus className="w-4.5 h-4.5" />
                            إضافة عميل
                        </button>
                    </div>
                </div>

                {/* Cards Grid */}
                {loadedCustomers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <span className="text-4xl block mb-3">👥</span>
                        <p className="font-bold">لا يوجد عملاء مطبقين للبحث أو مسجلين بالنظام حالياً.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                            {loadedCustomers.map((customer, i) => (
                                <div
                                    key={customer.id}
                                    className="rounded-2xl p-5 transition-all duration-300 animate-fade-in hover:shadow-md text-right relative flex flex-col justify-between"
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #EAE8E2',
                                        animationDelay: `${i * 40}ms`,
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = '#ADCBBB'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = '#EAE8E2'}
                                >
                                <div>
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-4 flex-row-reverse">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm"
                                                style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}
                                            >
                                                {(customer.name || 'ع').charAt(0)}
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-sm font-bold" style={{ color: '#1A2D23' }}>{customer.name || 'عميل'}</h3>
                                                    {customer.registered_from_app && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                            style={{ backgroundColor: '#EEF2FF', color: '#4338CA', border: '1px solid #C7D2FE', whiteSpace: 'nowrap' }}>
                                                            📱 تطبيق
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs" style={{ color: '#B8B5AE' }}>عضو منذ {customer.joined}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Shop details */}
                                    <div className="bg-[#FAF9F6] p-3 rounded-xl mb-4 space-y-2 text-sm text-[#7C7870]">
                                        <div className="flex items-center gap-2">
                                            <Store className="w-4 h-4 text-primary-600 flex-shrink-0" />
                                            <span className="font-bold text-[#1A2D23]">{customer.shop_name}</span>
                                        </div>
                                        {customer.category_of_place && customer.category_of_place !== '—' && (
                                            <div className="flex items-center gap-2">
                                                <Tag className="w-3.5 h-3.5" />
                                                <span>تصنيف المحل: {customer.category_of_place}</span>
                                            </div>
                                        )}
                                        {customer.address && customer.address !== '—' && (
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span className="truncate">{customer.address}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-2 mb-4 text-right px-1">
                                        {customer.phone && customer.phone !== '—' && (
                                            <div className="flex items-center gap-2 justify-start">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0 text-[#9A978F]" />
                                                <span className="text-sm" style={{ color: '#7C7870' }}>{customer.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                    {/* Balance row */}
                                    {customer.balance !== undefined && customer.balance !== 0 && (
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl mb-3"
                                            style={{ backgroundColor: customer.balance > 0 ? '#FEF3C7' : '#DCFCE7', border: `1px solid ${customer.balance > 0 ? '#FCD34D' : '#86EFAC'}` }}>
                                            <span className="text-xs font-bold" style={{ color: customer.balance > 0 ? '#92400E' : '#166534' }}>
                                                {customer.balance > 0 ? `${customer.balance.toFixed(2)} ج.م` : 'صافي'}
                                            </span>
                                            <span className="text-xs" style={{ color: customer.balance > 0 ? '#B45309' : '#166534' }}>
                                                {customer.balance > 0 ? '⚠️ ديون مستحقة' : '✓ لا ديون'}
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE8E2]">
                                        <button
                                            onClick={() => setViewingCustomer(customer)}
                                            className="p-2 rounded-xl bg-[#EEF4F1] text-[#2E5A44] hover:bg-[#ADCBBB] transition-all flex items-center justify-center"
                                            title="عرض التفاصيل والطلبات"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(customer)}
                                            className="p-2 rounded-xl bg-[#FAF9F6] text-[#7C7870] hover:text-[#2E5A44] transition-all hover:bg-[#EEF4F1] flex items-center justify-center"
                                            title="تعديل"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(customer.id)}
                                            className="p-2 rounded-xl bg-[#FAF9F6] text-[#7C7870] hover:text-[#C0392B] transition-all hover:bg-[#FDEEEC] flex items-center justify-center"
                                            title="حذف"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                        ))}
                    </div>
                </>
            )}

                {/* Add Customer Modal */}
                {isAddOpen && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#EAE8E2] shadow-2xl">
                            <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                                <h3 className="font-bold text-lg text-[#1A2D23]">إضافة عميل جديد</h3>
                                <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                    <X className="w-5 h-5 text-[#9A978F]" />
                                </button>
                            </div>
                            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">اسم العميل *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                            required
                                        />
                                        {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">اسم المحل / المزرعة *</label>
                                        <input
                                            type="text"
                                            value={formData.shop_name}
                                            onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                            required
                                        />
                                        {formErrors.shop_name && <p className="text-xs text-red-500">{formErrors.shop_name}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-[#7C7870]">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                    />
                                    {formErrors.phone_number && <p className="text-xs text-red-500">{formErrors.phone_number}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">العنوان</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                        />
                                        {formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">المنطقة</label>
                                        <select
                                            value={formData.region_id}
                                            onChange={e => setFormData({ ...formData, region_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44] bg-white"
                                        >
                                            <option value="">-- بدون منطقة --</option>
                                            {regions.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.region_id && <p className="text-xs text-red-500">{formErrors.region_id}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-[#7C7870]">تصنيف النشاط</label>
                                    <input
                                        type="text"
                                        placeholder="مشتل، مزرعة، محل تنسيق..."
                                        value={formData.category_of_place}
                                        onChange={e => setFormData({ ...formData, category_of_place: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                    />
                                    {formErrors.category_of_place && <p className="text-xs text-red-500">{formErrors.category_of_place}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FAF9F6]">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddOpen(false)}
                                        className="px-4 py-2 border border-[#EAE8E2] rounded-xl text-sm font-bold text-[#7C7870] hover:bg-[#FAF9F6]"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addMutation.isPending}
                                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                        style={{ backgroundColor: '#2E5A44' }}
                                    >
                                        {addMutation.isPending ? 'جاري الحفظ...' : 'حفظ العميل'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Customer Modal */}
                {editingCustomer && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#EAE8E2] shadow-2xl">
                            <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                                <h3 className="font-bold text-lg text-[#1A2D23]">تعديل بيانات العميل</h3>
                                <button onClick={() => setEditingCustomer(null)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                    <X className="w-5 h-5 text-[#9A978F]" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">اسم العميل *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                            required
                                        />
                                        {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">اسم المحل / المزرعة *</label>
                                        <input
                                            type="text"
                                            value={formData.shop_name}
                                            onChange={e => setFormData({ ...formData, shop_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                            required
                                        />
                                        {formErrors.shop_name && <p className="text-xs text-red-500">{formErrors.shop_name}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-[#7C7870]">رقم الهاتف</label>
                                    <input
                                        type="text"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                    />
                                    {formErrors.phone_number && <p className="text-xs text-red-500">{formErrors.phone_number}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">العنوان</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                        />
                                        {formErrors.address && <p className="text-xs text-red-500">{formErrors.address}</p>}
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <label className="text-xs font-bold text-[#7C7870]">المنطقة</label>
                                        <select
                                            value={formData.region_id}
                                            onChange={e => setFormData({ ...formData, region_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44] bg-white"
                                        >
                                            <option value="">-- بدون منطقة --</option>
                                            {regions.map(r => (
                                                <option key={r.id} value={r.id}>{r.name}</option>
                                            ))}
                                        </select>
                                        {formErrors.region_id && <p className="text-xs text-red-500">{formErrors.region_id}</p>}
                                    </div>
                                </div>

                                <div className="space-y-1 text-right">
                                    <label className="text-xs font-bold text-[#7C7870]">تصنيف النشاط</label>
                                    <input
                                        type="text"
                                        value={formData.category_of_place}
                                        onChange={e => setFormData({ ...formData, category_of_place: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44]"
                                    />
                                    {formErrors.category_of_place && <p className="text-xs text-red-500">{formErrors.category_of_place}</p>}
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#FAF9F6]">
                                    <button
                                        type="button"
                                        onClick={() => setEditingCustomer(null)}
                                        className="px-4 py-2 border border-[#EAE8E2] rounded-xl text-sm font-bold text-[#7C7870] hover:bg-[#FAF9F6]"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateMutation.isPending}
                                        className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                                        style={{ backgroundColor: '#2E5A44' }}
                                    >
                                        {updateMutation.isPending ? 'جاري الحفظ...' : 'تحديث البيانات'}
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
                                    استيراد عملاء من ملف إكسل (CSV)
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
                                    <p className="text-xs text-[#7C7870] leading-relaxed">
                                        يرجى حفظ ملف الإكسل بصيغة <strong>CSV (Comma Delimited)</strong>. أسماء الأعمدة في الصف الأول بالإنجليزية حسب أسماء الجدول في قاعدة البيانات:
                                    </p>
                                    <div className="bg-[#EEF4F1] p-3 rounded-lg border border-[#ADCBBB] text-xs font-mono text-[#2E5A44] text-center select-all block overflow-x-auto whitespace-nowrap dir-ltr">
                                        name, shop_name, phone, address, email, category_of_place
                                    </div>
                                    <p className="text-[10px] text-[#9A978F]">
                                        * أعمدة "name" و "shop_name" مطلوبة أساسياً (ويمكن استخدام المسميات بالعربية: الاسم، اسم المحل).
                                    </p>
                                    <button
                                        type="button"
                                        onClick={downloadCustomerTemplate}
                                        className="w-full py-2 px-3 bg-white hover:bg-[#EEF4F1] text-[#2E5A44] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-[#ADCBBB] shadow-sm active:scale-98"
                                    >
                                        <Download className="w-4 h-4" />
                                        تنزيل نموذج ملف استيراد العملاء (CSV Template)
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

                {/* View Customer Details Modal */}
                {viewingCustomer && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
                        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden border border-[#EAE8E2] shadow-2xl">
                            <div className="px-6 py-4 border-b border-[#FAF9F6] flex items-center justify-between bg-[#FAF9F6]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                                        style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}>
                                        {viewingCustomer.name.charAt(0)}
                                    </div>
                                    <div className="text-right">
                                        <h3 className="font-bold text-base text-[#1A2D23]">{viewingCustomer.name}</h3>
                                        <p className="text-xs text-[#9A978F]">عضو منذ {viewingCustomer.joined}</p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingCustomer(null)} className="p-1 rounded-lg hover:bg-white transition-colors">
                                    <X className="w-5 h-5 text-[#9A978F]" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4 text-right">
                                {viewingCustomer.registered_from_app && (
                                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] p-3 rounded-xl flex items-center gap-2 text-xs font-bold text-[#4338CA]">
                                        <span>📱 عميل مسجل عبر تطبيق الموبايل</span>
                                    </div>
                                )}

                                <div className="bg-[#FAF9F6] p-4 rounded-xl space-y-3 border border-[#EAE8E2] text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-[#1A2D23]">{viewingCustomer.shop_name}</span>
                                        <span className="text-xs text-[#9A978F]">اسم المحل:</span>
                                    </div>
                                    {viewingCustomer.category_of_place && viewingCustomer.category_of_place !== '—' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#1A2D23]">{viewingCustomer.category_of_place}</span>
                                            <span className="text-xs text-[#9A978F]">تصنيف المحل:</span>
                                        </div>
                                    )}
                                    {viewingCustomer.phone && viewingCustomer.phone !== '—' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#1A2D23]">{viewingCustomer.phone}</span>
                                            <span className="text-xs text-[#9A978F]">رقم الهاتف:</span>
                                        </div>
                                    )}
                                    {viewingCustomer.address && viewingCustomer.address !== '—' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#1A2D23]">{viewingCustomer.address}</span>
                                            <span className="text-xs text-[#9A978F]">العنوان:</span>
                                        </div>
                                    )}
                                    {viewingCustomer.email && viewingCustomer.email !== '—' && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#1A2D23]">{viewingCustomer.email}</span>
                                            <span className="text-xs text-[#9A978F]">البريد الإلكتروني:</span>
                                        </div>
                                    )}
                                    {viewingCustomer.region_id && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#1A2D23]">
                                                {regions.find(r => r.id == viewingCustomer.region_id)?.name || viewingCustomer.region_id}
                                            </span>
                                            <span className="text-xs text-[#9A978F]">المنطقة:</span>
                                        </div>
                                    )}
                                </div>

                                {/* Balance & Orders Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl border bg-[#FAF9F6] border-[#EAE8E2] text-center">
                                        <span className="text-xs text-[#9A978F] block">عدد الطلبات</span>
                                        <span className="text-lg font-bold text-[#1A2D23]">{viewingCustomer.orders_count || 0}</span>
                                    </div>
                                    <div className="p-3 rounded-xl border bg-[#FAF9F6] border-[#EAE8E2] text-center">
                                        <span className="text-xs text-[#9A978F] block">رصيد الحساب</span>
                                        <span className={`text-lg font-bold ${viewingCustomer.balance > 0 ? 'text-[#C0392B]' : 'text-[#2E5A44]'}`}>
                                            {viewingCustomer.balance ? `${viewingCustomer.balance.toFixed(2)} ج.م` : '0.00 ج.م'}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Navigation Buttons */}
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => { const id = viewingCustomer.id; setViewingCustomer(null); router.visit(`/customers/${id}/orders`); }}
                                        className="py-2.5 px-4 bg-[#EEF4F1] hover:bg-[#ADCBBB] text-[#2E5A44] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        سجل الطلبات
                                    </button>
                                    <button
                                        onClick={() => { const id = viewingCustomer.id; setViewingCustomer(null); router.visit(`/customers/${id}/account`); }}
                                        className="py-2.5 px-4 bg-[#2E5A44] hover:bg-[#1A2D23] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        كشف الحساب والمديونيات
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    )
}
