import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import {
    Wallet, User, Phone, Store, ChevronLeft,
    ArrowDownCircle, ArrowUpCircle, X, Check, AlertCircle
} from 'lucide-react'
import api from '../../shared/services/api'

export default function Accounts({ customers: initialCustomers, globalStats: initialGlobalStats, filters: initialFilters }) {
    const [alert, setAlert] = useState(null)
    const [search, setSearch] = useState(initialFilters?.search || '')

    // React Query: Fetch Customer Accounts
    const { data: accountsData, isLoading } = useQuery({
        queryKey: ['customers-accounts', search],
        queryFn: async () => {
            const res = await api.get('/customers-accounts', { params: { search: search || undefined } })
            return res.data
        },
        initialData: initialCustomers ? {
            customers: initialCustomers,
            globalStats: initialGlobalStats,
        } : undefined,
    })

    const loadedCustomers = accountsData?.customers?.data || accountsData?.data || []
    const globalStats = accountsData?.globalStats || {}

    return (
        <AppLayout title="حسابات العملاء" subtitle="إدارة الحسابات والمديونيات">
            <div className="space-y-5" dir="rtl">

                {/* Alert */}
                {alert && (
                    <div
                        className="p-4 rounded-xl text-sm font-semibold text-center border transition-all animate-fade-in relative flex items-center justify-between gap-4"
                        style={{
                            backgroundColor: alert.type === 'success' ? '#EBF5EF' : '#FDEEEC',
                            borderColor: alert.type === 'success' ? '#ADCBBB' : '#E8A09A',
                            color: alert.type === 'success' ? '#2E5A44' : '#922B21'
                        }}
                    >
                        <span className="flex items-center gap-2">
                            {alert.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {alert.message}
                        </span>
                        <button onClick={() => setAlert(null)} className="opacity-70 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Global Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#EEF4F1] flex items-center justify-center">
                                <User className="w-5 h-5 text-[#2E5A44]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">إجمالي العملاء</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#1A2D23]">{globalStats.total_customers || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#FDEEEC] flex items-center justify-center">
                                <ArrowDownCircle className="w-5 h-5 text-[#C0392B]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">الفلوس على العملاء</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#C0392B]">
                            {(globalStats.total_debts_on_customers || 0).toFixed(2)} <span className="text-xs">ج.م</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#EAF6EE] flex items-center justify-center">
                                <ArrowUpCircle className="w-5 h-5 text-[#2E5A44]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">الفلوس للعملاء</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#2E5A44]">
                            {(globalStats.total_debts_for_customers || 0).toFixed(2)} <span className="text-xs">ج.م</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF8E1] flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-[#F39C12]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">عملاء عليهم حسابات</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#F39C12]">{globalStats.customers_with_debt || 0}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8E2]">
                    <SearchInput
                        placeholder="البحث عن عميل بالاسم أو المحل أو الهاتف..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Customers List */}
                {loadedCustomers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <span className="text-4xl block mb-3">💰</span>
                        <p className="font-bold">لا يوجد عملاء مطابقون للبحث</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {loadedCustomers.map((customer, i) => (
                                <Link
                                    key={customer.id}
                                    href={`/customers/${customer.id}/account`}
                                    className="block w-full bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5 hover:border-[#ADCBBB] hover:shadow-md transition-all duration-200 text-right group animate-fade-in"
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0"
                                                style={{ background: customer.balance > 0 ? 'linear-gradient(135deg, #E74C3C, #C0392B)' : 'linear-gradient(135deg, #559476, #2E5A44)' }}
                                            >
                                                {(customer.name || 'ع').charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1A2D23]">{customer.name || 'عميل'}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-[#9A978F]">
                                                    {customer.shop_name !== '—' && (
                                                        <span className="flex items-center gap-1">
                                                            <Store className="w-3 h-3" />
                                                            {customer.shop_name}
                                                        </span>
                                                    )}
                                                    {customer.phone !== '—' && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {customer.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-left">
                                                <p className={`text-lg font-bold ${
                                                    customer.balance > 0 
                                                        ? 'text-[#C0392B]' 
                                                        : customer.balance < 0 
                                                            ? 'text-[#2E5A44]' 
                                                            : 'text-[#9A978F]'
                                                }`}>
                                                    {customer.balance !== 0 ? Math.abs(customer.balance).toFixed(2) : '0.00'}
                                                    <span className="text-xs mr-1">ج.م</span>
                                                </p>
                                                <p className="text-[10px] text-[#9A978F] font-semibold">
                                                    {customer.balance > 0 
                                                        ? 'مديونية (عليه)' 
                                                        : customer.balance < 0 
                                                            ? 'له رصيد' 
                                                            : 'لا يوجد حساب'}
                                                </p>
                                            </div>
                                            <ChevronLeft className="w-5 h-5 text-[#D6D4CE] group-hover:text-[#2E5A44] transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                    </>
                )}
            </div>
        </AppLayout>
    )
}
