import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import { Bell, Send, Users, User, X, CheckCircle2, AlertTriangle, Search, Loader2, Trash2 } from 'lucide-react'
import api from '../../shared/services/api'

export default function NotificationsIndex() {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)
    const [isSendOpen, setIsSendOpen] = useState(false)
    const [page, setPage] = useState(1)

    // Form State
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [targetType, setTargetType] = useState('all') // 'all' or 'specific'
    const [selectedUser, setSelectedUser] = useState(null)
    const [userSearch, setUserSearch] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [formErrors, setFormErrors] = useState({})

    const showAlert = (type, msg) => {
        setAlert({ type, msg })
        setTimeout(() => setAlert(null), 4000)
    }

    // Search users for targeting
    const handleSearchUsers = async (query) => {
        setUserSearch(query)
        setIsSearchingUsers(true)
        try {
            const endpoint = query.trim()
                ? `/notifications/search-users?search=${encodeURIComponent(query.trim())}`
                : `/notifications/search-users`
            const res = await api.get(endpoint)
            setSearchResults(res.data.users || [])
        } catch (e) {
            console.error('Failed to search users:', e)
        } finally {
            setIsSearchingUsers(false)
        }
    }

    // Fetch Sent Notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['admin-notifications', page],
        queryFn: async () => {
            const res = await api.get(`/notifications/sent?page=${page}`)
            return res.data
        },
    })

    const notifications = notificationsData?.notifications?.data || []
    const nextPage = notificationsData?.notifications?.next_page

    // Send Notification Mutation
    const sendMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post('/notifications', payload)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['admin-notifications'])
            showAlert('success', data.message || 'تم إرسال الإشعار بنجاح!')
            handleCloseModal()
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'فشل إرسال الإشعار'
            showAlert('error', msg)
        },
    })

    // Delete Notification Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            const res = await api.delete(`/notifications/${id}`)
            return res.data
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['admin-notifications'])
            showAlert('success', data.message || 'تم حذف الإشعار بنجاح!')
        },
        onError: (err) => {
            const msg = err.response?.data?.message || 'فشل حذف الإشعار'
            showAlert('error', msg)
        },
    })

    const handleDelete = (notification) => {
        if (window.confirm(`هل أنت متأكد من حذف الإشعار "${notification.title}"؟`)) {
            deleteMutation.mutate(notification.id)
        }
    }

    const handleCloseModal = () => {
        setIsSendOpen(false)
        setTitle('')
        setBody('')
        setTargetType('all')
        setSelectedUser(null)
        setUserSearch('')
        setSearchResults([])
        setFormErrors({})
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const errors = {}

        if (!title.trim()) errors.title = 'يرجى كتابة عنوان الإشعار'
        if (!body.trim()) errors.body = 'يرجى كتابة نص الإشعار'
        if (targetType === 'specific' && !selectedUser) {
            errors.user = 'يرجى اختيار العميل المستهدف'
        }

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }

        sendMutation.mutate({
            title: title.trim(),
            body: body.trim(),
            user_id: targetType === 'specific' ? selectedUser.id : null,
        })
    }

    const formatDate = (isoStr) => {
        if (!isoStr) return '—'
        try {
            const d = new Date(isoStr)
            return d.toLocaleString('ar-EG', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch (e) {
            return isoStr
        }
    }

    return (
        <AppLayout title="إدارة الإشعارات">
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                {/* Alert Banner */}
                {alert && (
                    <div
                        className={`flex items-center gap-3 p-4 rounded-xl border animate-fade-in ${
                            alert.type === 'success'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                    >
                        {alert.type === 'success' ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        )}
                        <span className="text-sm font-medium">{alert.msg}</span>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E0DA] shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#EEF4F1] border border-[#D0E2D8] flex items-center justify-center text-[#2E5A44]">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[#1A2D23]">إدارة الإشعارات الفورية</h1>
                            <p className="text-sm text-[#7C7870] mt-0.5">
                                إرسال تنبيهات ورسائل لجميع عملاء التطبيق أو لعميل محدد في أي وقت
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsSendOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md hover:opacity-90 active:scale-95"
                        style={{ backgroundColor: '#2E5A44' }}
                    >
                        <Send className="w-4 h-4" />
                        <span>إرسال إشعار جديد</span>
                    </button>
                </div>

                {/* Sent Notifications History */}
                <div className="bg-white rounded-2xl border border-[#E2E0DA] shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-[#E2E0DA] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="w-5 h-5 text-[#2E5A44]" />
                            <h2 className="font-bold text-[#1A2D23] text-base">سجل الإشعارات المرسلة</h2>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#F4F3EF] text-[#5C5950]">
                            {notifications.length} إشعار
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="p-12 text-center text-[#7C7870] flex flex-col items-center justify-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-[#2E5A44]" />
                            <span className="text-sm">جاري تحميل سجل الإشعارات...</span>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-12 text-center text-[#7C7870] flex flex-col items-center justify-center gap-2">
                            <Bell className="w-12 h-12 text-[#9A978F] stroke-[1.5]" />
                            <p className="text-base font-semibold text-[#1A2D23]">لا توجد إشعارات سابقة</p>
                            <p className="text-sm">اضغط على زر "إرسال إشعار جديد" لإرسال أول إشعار لعملائك</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-[#FAF9F6] text-[#5C5950] border-b border-[#E2E0DA]">
                                    <tr>
                                        <th className="py-3.5 px-4 font-semibold">عنوان الإشعار</th>
                                        <th className="py-3.5 px-4 font-semibold">نص الرسالة</th>
                                        <th className="py-3.5 px-4 font-semibold">المستلم</th>
                                        <th className="py-3.5 px-4 font-semibold">المرسل</th>
                                        <th className="py-3.5 px-4 font-semibold">تاريخ الإرسال</th>
                                        <th className="py-3.5 px-4 font-semibold text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E0DA]">
                                    {notifications.map((n) => (
                                        <tr key={n.id} className="hover:bg-[#FAF9F6] transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-[#1A2D23]">
                                                {n.title}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#5C5950] max-w-md truncate" title={n.body}>
                                                {n.body}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                {n.user_id ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <User className="w-3.5 h-3.5" />
                                                        {n.target_user_name}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Users className="w-3.5 h-3.5" />
                                                        جميع المستخدمين
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#7C7870]">
                                                {n.sent_by_name}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#7C7870] whitespace-nowrap">
                                                {formatDate(n.created_at)}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(n)}
                                                    disabled={deleteMutation.isPending}
                                                    title="حذف الإشعار"
                                                    className="p-2 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors inline-flex items-center justify-center disabled:opacity-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {(nextPage || page > 1) && (
                        <div className="p-4 border-t border-[#E2E0DA] flex items-center justify-between bg-[#FAF9F6]">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#E2E0DA] bg-white disabled:opacity-50"
                            >
                                السابق
                            </button>
                            <span className="text-xs text-[#7C7870] font-medium">صفحة {page}</span>
                            <button
                                disabled={!nextPage}
                                onClick={() => setPage((p) => p + 1)}
                                className="px-4 py-2 rounded-xl text-sm font-semibold border border-[#E2E0DA] bg-white disabled:opacity-50"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </div>

                {/* Send Notification Modal */}
                {isSendOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-2xl border border-[#E2E0DA] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-5 border-b border-[#E2E0DA] flex items-center justify-between bg-[#FAF9F6]">
                                <div className="flex items-center gap-2">
                                    <Send className="w-5 h-5 text-[#2E5A44]" />
                                    <h3 className="font-bold text-[#1A2D23] text-base">إرسال إشعار فوري</h3>
                                </div>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-1.5 rounded-lg text-[#7C7870] hover:bg-[#EAE8E2] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                                {/* Target Audience Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-2">
                                        الفئة المستهدفة للإشعار
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTargetType('all')
                                                setSelectedUser(null)
                                            }}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                                                targetType === 'all'
                                                    ? 'bg-[#EEF4F1] border-[#2E5A44] text-[#2E5A44] shadow-sm'
                                                    : 'bg-[#FAF9F6] border-[#E2E0DA] text-[#5C5950] hover:bg-[#F4F3EF]'
                                            }`}
                                        >
                                            <Users className="w-4 h-4" />
                                            <span>جميع العملاء</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTargetType('specific')
                                                if (searchResults.length === 0) {
                                                    handleSearchUsers('')
                                                }
                                            }}
                                            className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${
                                                targetType === 'specific'
                                                    ? 'bg-[#EEF4F1] border-[#2E5A44] text-[#2E5A44] shadow-sm'
                                                    : 'bg-[#FAF9F6] border-[#E2E0DA] text-[#5C5950] hover:bg-[#F4F3EF]'
                                            }`}
                                        >
                                            <User className="w-4 h-4" />
                                            <span>عميل محدد</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Specific User Search & Select */}
                                {targetType === 'specific' && (
                                    <div className="space-y-2 p-3.5 rounded-xl bg-[#FAF9F6] border border-[#E2E0DA]">
                                        <label className="block text-xs font-bold text-[#5C5950]">
                                            اختيار العميل
                                        </label>

                                        {selectedUser ? (
                                            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#2E5A44]">
                                                <div>
                                                    <p className="font-bold text-sm text-[#1A2D23]">{selectedUser.name}</p>
                                                    <p className="text-xs text-[#7C7870]">
                                                        {selectedUser.phone || selectedUser.email}
                                                        {selectedUser.shop_name ? ` • ${selectedUser.shop_name}` : ''}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedUser(null)
                                                        handleSearchUsers('')
                                                    }}
                                                    className="p-1 rounded-lg text-red-600 hover:bg-red-50 text-xs font-bold"
                                                >
                                                    تغيير
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        value={userSearch}
                                                        onChange={(e) => handleSearchUsers(e.target.value)}
                                                        placeholder="ابحث باسم العميل أو رقم الهاتف..."
                                                        className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#E2E0DA] text-sm focus:outline-none focus:border-[#2E5A44] bg-white"
                                                    />
                                                    <Search className="w-4 h-4 text-[#9A978F] absolute right-3.5 top-3" />
                                                    {isSearchingUsers && (
                                                        <Loader2 className="w-4 h-4 animate-spin text-[#2E5A44] absolute left-3.5 top-3" />
                                                    )}
                                                </div>

                                                {/* Search Dropdown */}
                                                {searchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1.5 bg-white rounded-xl border border-[#E2E0DA] shadow-lg max-h-48 overflow-y-auto divide-y divide-[#E2E0DA]">
                                                        {searchResults.map((u) => (
                                                            <button
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedUser(u)
                                                                    setSearchResults([])
                                                                    setUserSearch('')
                                                                }}
                                                                className="w-full text-right p-3 hover:bg-[#FAF9F6] transition-colors flex items-center justify-between"
                                                            >
                                                                <div>
                                                                    <p className="font-bold text-sm text-[#1A2D23]">{u.name}</p>
                                                                    <p className="text-xs text-[#7C7870]">
                                                                        {u.phone || u.email}
                                                                        {u.shop_name ? ` • ${u.shop_name}` : ''}
                                                                    </p>
                                                                </div>
                                                                <span className="text-xs font-semibold text-[#2E5A44]">اختيار</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {formErrors.user && (
                                            <p className="text-xs text-red-600 font-semibold">{formErrors.user}</p>
                                        )}
                                    </div>
                                )}

                                {/* Title Input */}
                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-1.5">
                                        عنوان الإشعار <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="مثال: خصم خاص اليوم! أو تنبيه بخصوص طلبك"
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2E0DA] text-sm focus:outline-none focus:border-[#2E5A44]"
                                    />
                                    {formErrors.title && (
                                        <p className="text-xs text-red-600 font-semibold mt-1">{formErrors.title}</p>
                                    )}
                                </div>

                                {/* Body Textarea */}
                                <div>
                                    <label className="block text-xs font-bold text-[#5C5950] mb-1.5">
                                        نص الرسالة / الإشعار <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        placeholder="اكتب الرسالة التي ستظهر للمستخدمين عند استلام الإشعار..."
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#E2E0DA] text-sm focus:outline-none focus:border-[#2E5A44] resize-none"
                                    />
                                    {formErrors.body && (
                                        <p className="text-xs text-red-600 font-semibold mt-1">{formErrors.body}</p>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E2E0DA]">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        className="px-5 py-2.5 rounded-xl border border-[#E2E0DA] text-sm font-semibold text-[#5C5950] hover:bg-[#FAF9F6] transition-colors"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendMutation.isLoading}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md hover:opacity-90 active:scale-95 disabled:opacity-50"
                                        style={{ backgroundColor: '#2E5A44' }}
                                    >
                                        {sendMutation.isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>جاري الإرسال...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                <span>إرسال الآن</span>
                                            </>
                                        )}
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
