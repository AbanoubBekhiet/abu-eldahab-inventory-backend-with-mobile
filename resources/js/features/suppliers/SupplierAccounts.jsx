import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import { SearchInput } from '../../shared/components'
import {
    Wallet, Building2, Phone, ChevronLeft,
    ArrowDownCircle, ArrowUpCircle, X, Check, AlertCircle, TrendingUp
} from 'lucide-react'
import api from '../../shared/services/api'

export default function SupplierAccounts({
    suppliers: initialSuppliers,
    globalStats: initialGlobalStats,
    suppliersWithDebtList: initialSuppliersWithDebtList = [],
    filters: initialFilters = {}
}) {
    const [search, setSearch] = useState(initialFilters?.search || '')
    const [alert, setAlert] = useState(null)

    // React Query: Fetch Supplier Accounts
    const { data: accountsData, isLoading } = useQuery({
        queryKey: ['suppliers-accounts', search],
        queryFn: async () => {
            const res = await api.get('/suppliers-accounts', { params: { search: search || undefined } })
            return res.data
        },
        initialData: initialSuppliers ? {
            suppliers: initialSuppliers,
            globalStats: initialGlobalStats,
            suppliersWithDebtList: initialSuppliersWithDebtList,
        } : undefined,
    })

    const loadedSuppliers = accountsData?.suppliers?.data || accountsData?.data || []
    const globalStats = accountsData?.globalStats || {}
    const suppliersWithDebtList = accountsData?.suppliersWithDebtList || []

    return (
        <AppLayout title="حسابات الموردين" subtitle="إدارة المبالغ المستحقة للموردين">
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
                                <Building2 className="w-5 h-5 text-[#2E5A44]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">إجمالي الموردين</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#1A2D23]">{globalStats.total_suppliers || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#FDEEEC] flex items-center justify-center">
                                <ArrowDownCircle className="w-5 h-5 text-[#C0392B]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">المبالغ عليّ للموردين</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#C0392B]">
                            {(globalStats.total_owed || 0).toFixed(2)} <span className="text-xs">ج.م</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#EAF6EE] flex items-center justify-center">
                                <ArrowUpCircle className="w-5 h-5 text-[#2E5A44]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">إجمالي المدفوع</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#2E5A44]">
                            {(globalStats.total_paid || 0).toFixed(2)} <span className="text-xs">ج.م</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-[#FFF8E1] flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-[#F39C12]" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-bold text-[#9A978F]">موردين عليهم حسابات</span>
                        </div>
                        <p className="text-xl sm:text-2xl font-bold text-[#F39C12]">{globalStats.suppliers_with_debt || 0}</p>
                    </div>
                </div>

                {/* Suppliers With Debt Banner */}
                {suppliersWithDebtList.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#F5C2C0] overflow-hidden">
                        <div className="px-5 py-3 bg-[#FDEEEC] border-b border-[#F5C2C0] flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#C0392B]" />
                            <p className="text-sm font-bold text-[#C0392B]">الموردين اللي عليّ فلوس ليهم</p>
                        </div>
                        <div className="divide-y divide-[#FAF9F6]">
                            {suppliersWithDebtList.map((s, i) => (
                                <Link
                                    key={s.id}
                                    href={`/suppliers/${s.id}/account`}
                                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#FAFAF8] transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #E74C3C, #C0392B)' }}
                                        >
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#1A2D23]">{s.name}</p>
                                            {s.phone !== '—' && (
                                                <p className="text-xs text-[#9A978F] flex items-center gap-1">
                                                    <Phone className="w-3 h-3" />
                                                    {s.phone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-left">
                                            <p className="text-base font-bold text-[#C0392B]">
                                                {s.balance.toFixed(2)} <span className="text-xs">ج.م</span>
                                            </p>
                                            <p className="text-[10px] text-[#9A978F] font-semibold">مستحق عليّ</p>
                                        </div>
                                        <ChevronLeft className="w-4 h-4 text-[#D6D4CE] group-hover:text-[#C0392B] transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EAE8E2]">
                    <SearchInput
                        placeholder="البحث عن مورد بالاسم أو الهاتف أو المسؤول..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                    />
                </div>

                {/* Suppliers List */}
                {loadedSuppliers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-[#EAE8E2] p-12 text-center text-[#7C7870]">
                        <span className="text-4xl block mb-3">🏢</span>
                        <p className="font-bold">لا يوجد موردين مطابقون للبحث</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-3">
                            {loadedSuppliers.map((supplier, i) => (
                                <Link
                                    key={supplier.id}
                                    href={`/suppliers/${supplier.id}/account`}
                                    className="block w-full bg-white rounded-2xl border border-[#EAE8E2] p-4 sm:p-5 hover:border-[#ADCBBB] hover:shadow-md transition-all duration-200 text-right group animate-fade-in"
                                    style={{ animationDelay: `${i * 30}ms` }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm flex-shrink-0"
                                                style={{ background: supplier.balance > 0 ? 'linear-gradient(135deg, #E74C3C, #C0392B)' : 'linear-gradient(135deg, #559476, #2E5A44)' }}
                                            >
                                                {supplier.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#1A2D23]">{supplier.name}</h3>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-[#9A978F]">
                                                    {supplier.contact_name !== '—' && (
                                                        <span className="flex items-center gap-1">
                                                            <Building2 className="w-3 h-3" />
                                                            {supplier.contact_name}
                                                        </span>
                                                    )}
                                                    {supplier.phone !== '—' && (
                                                        <span className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3" />
                                                            {supplier.phone}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-left">
                                                <p className={`text-lg font-bold ${
                                                    supplier.balance > 0
                                                        ? 'text-[#C0392B]'
                                                        : supplier.balance < 0
                                                            ? 'text-[#2E5A44]'
                                                            : 'text-[#9A978F]'
                                                }`}>
                                                    {supplier.balance !== 0 ? Math.abs(supplier.balance).toFixed(2) : '0.00'}
                                                    <span className="text-xs mr-1">ج.م</span>
                                                </p>
                                                <p className="text-[10px] text-[#9A978F] font-semibold">
                                                    {supplier.balance > 0
                                                        ? 'مستحق عليّ'
                                                        : supplier.balance < 0
                                                            ? 'دفعت زيادة'
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
