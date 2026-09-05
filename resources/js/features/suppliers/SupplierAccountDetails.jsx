import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from '@inertiajs/react'
import AppLayout from '../../shared/layouts/AppLayout'
import {
    ArrowRight, ArrowDownCircle, ArrowUpCircle, Wallet, Receipt,
    Building2, Phone, MapPin, X, Check, AlertCircle
} from 'lucide-react'
import api from '../../shared/services/api'

export default function SupplierAccountDetails({
    supplier: initialSupplier,
    transactions: initialTransactions,
    balance: initialBalance = 0,
    total_debts: initialTotalDebts = 0,
    total_payments: initialTotalPayments = 0
}) {
    const queryClient = useQueryClient()
    const [alert, setAlert] = useState(null)

    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [showDebtForm, setShowDebtForm] = useState(false)
    const [paymentData, setPaymentData] = useState({ amount: '', description: '' })
    const [debtData, setDebtData] = useState({ amount: '', description: '' })

    // Extract supplierId from prop or window URL pathname
    const supplierId = initialSupplier?.id || (typeof initialSupplier === 'number' || typeof initialSupplier === 'string' ? initialSupplier : window.location.pathname.split('/')[2])

    // React Query: Fetch Supplier Account Details
    const { data: accountData } = useQuery({
        queryKey: ['supplier-account', supplierId],
        queryFn: async () => {
            const res = await api.get(`/suppliers/${supplierId}/account`)
            return res.data
        },
        enabled: !!supplierId,
        initialData: initialSupplier && typeof initialSupplier === 'object' ? {
            supplier: initialSupplier,
            transactions: initialTransactions,
            balance: initialBalance,
            total_debts: initialTotalDebts,
            total_payments: initialTotalPayments,
        } : undefined,
    })

    const supplier = accountData?.supplier || (typeof initialSupplier === 'object' ? initialSupplier : {})
    const balance = accountData?.balance ?? initialBalance
    const rawTransactions = accountData?.transactions ?? initialTransactions
    const loadedTransactions = Array.isArray(rawTransactions)
        ? rawTransactions
        : (Array.isArray(rawTransactions?.data) ? rawTransactions.data : [])

    // Transaction Mutation
    const transactionMutation = useMutation({
        mutationFn: async (payload) => {
            const res = await api.post(`/suppliers/${supplierId}/transaction`, payload)
            return res.data
        },
        onSuccess: (data) => {
            setAlert({ type: 'success', message: data.message || 'تم تسجيل المعاملة بنجاح!' })
            setShowPaymentForm(false)
            setShowDebtForm(false)
            setPaymentData({ amount: '', description: '' })
            setDebtData({ amount: '', description: '' })
            queryClient.invalidateQueries({ queryKey: ['supplier-account', supplierId] })
            queryClient.invalidateQueries({ queryKey: ['suppliers-accounts'] })
        },
        onError: (err) => {
            setAlert({ type: 'error', message: err.response?.data?.message || 'حدث خطأ أثناء تسجيل المعاملة' })
        }
    })

    const handlePayment = (e) => {
        e.preventDefault()
        const amt = parseFloat(paymentData.amount)
        if (!amt || amt <= 0) return
        transactionMutation.mutate({
            amount: -amt,
            description: paymentData.description || null,
        })
    }

    const handleDebt = (e) => {
        e.preventDefault()
        const amt = parseFloat(debtData.amount)
        if (!amt || amt <= 0) return
        transactionMutation.mutate({
            amount: amt,
            description: debtData.description || null,
        })
    }

    return (
        <AppLayout title={`حساب ${supplier.name || ''}`} subtitle="سجل المعاملات والمديونيات">
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

                {/* Back Button */}
                <Link
                    href="/suppliers-accounts"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#2E5A44] bg-white border border-[#EAE8E2] hover:bg-[#EEF4F1] transition-all active:scale-95"
                >
                    <ArrowRight className="w-4 h-4" />
                    رجوع لحسابات الموردين
                </Link>

                {/* Supplier Info + Balance */}
                <div className="bg-white rounded-2xl border border-[#EAE8E2] p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0"
                                style={{ background: balance > 0 ? 'linear-gradient(135deg, #E74C3C, #C0392B)' : 'linear-gradient(135deg, #559476, #2E5A44)' }}
                            >
                                {(supplier.name || 'م').charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#1A2D23]">{supplier.name || 'جارِ التحميل...'}</h2>
                                <div className="flex items-center gap-4 mt-1 text-xs text-[#9A978F]">
                                    {supplier.contact_name !== '—' && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3.5 h-3.5" />
                                            {supplier.contact_name}
                                        </span>
                                    )}
                                    {supplier.phone !== '—' && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-3.5 h-3.5" />
                                            {supplier.phone}
                                        </span>
                                    )}
                                    {supplier.address !== '—' && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {supplier.address}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Balance Summary */}
                    <div className="mt-5 flex justify-center">
                        <div className={`w-full max-w-md text-center p-5 rounded-2xl border ${
                            balance > 0
                                ? 'bg-[#FDEEEC] border-[#F5C2C0]'
                                : balance < 0
                                    ? 'bg-[#EAF6EE] border-[#B7E1C5]'
                                    : 'bg-[#FAF9F6] border-[#EAE8E2]'
                        }`}>
                            <p className="text-xs font-bold text-[#9A978F] mb-1">
                                {balance > 0 ? 'المتبقي عليّ للمورد' : balance < 0 ? 'الفلوس اللي ليا عنده (دفعت زيادة)' : 'حالة الحساب'}
                            </p>
                            <p className={`text-2xl font-black ${
                                balance > 0 ? 'text-[#C0392B]' : balance < 0 ? 'text-[#2E5A44]' : 'text-[#1A2D23]'
                            }`}>
                                {Math.abs(balance).toFixed(2)} <span className="text-xs font-bold">ج.م</span>
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => { setShowPaymentForm(true); setShowDebtForm(false) }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-[#2E5A44] text-white hover:bg-[#234533] transition-all active:scale-95"
                        >
                            <ArrowUpCircle className="w-4 h-4" />
                            تسجيل سداد
                        </button>
                        <button
                            onClick={() => { setShowDebtForm(true); setShowPaymentForm(false) }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-[#C0392B] text-white hover:bg-[#A93226] transition-all active:scale-95"
                        >
                            <ArrowDownCircle className="w-4 h-4" />
                            إضافة دين
                        </button>
                    </div>
                </div>

                {/* Payment Form */}
                {showPaymentForm && (
                    <div className="bg-white rounded-2xl border border-[#B7E1C5] p-5 animate-fade-in">
                        <form onSubmit={handlePayment} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowUpCircle className="w-5 h-5 text-[#2E5A44]" />
                                    <h4 className="text-sm font-bold text-[#1A2D23]">تسجيل سداد للمورد</h4>
                                </div>
                                <button type="button" onClick={() => setShowPaymentForm(false)} className="p-1 rounded-lg hover:bg-[#EAE8E2]">
                                    <X className="w-4 h-4 text-[#9A978F]" />
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#7C7870] mb-1 block">المبلغ المدفوع (ج.م) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={paymentData.amount}
                                    onChange={e => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2.5 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44] text-right"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#7C7870] mb-1 block">ملاحظات (اختياري)</label>
                                <input
                                    type="text"
                                    value={paymentData.description}
                                    onChange={e => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="سبب السداد أو رقم الفاتورة..."
                                    className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#2E5A44] text-right"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={transactionMutation.isPending || !paymentData.amount}
                                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#2E5A44] hover:bg-[#234533] transition-all active:scale-95 disabled:opacity-60"
                            >
                                {transactionMutation.isPending ? 'جاري التسجيل...' : 'تأكيد السداد'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Debt Form */}
                {showDebtForm && (
                    <div className="bg-white rounded-2xl border border-[#F5C2C0] p-5 animate-fade-in">
                        <form onSubmit={handleDebt} className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ArrowDownCircle className="w-5 h-5 text-[#C0392B]" />
                                    <h4 className="text-sm font-bold text-[#1A2D23]">إضافة مبلغ مستحق للمورد</h4>
                                </div>
                                <button type="button" onClick={() => setShowDebtForm(false)} className="p-1 rounded-lg hover:bg-[#EAE8E2]">
                                    <X className="w-4 h-4 text-[#9A978F]" />
                                </button>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#7C7870] mb-1 block">المبلغ (ج.م) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={debtData.amount}
                                    onChange={e => setDebtData(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="0.00"
                                    className="w-full px-3 py-2.5 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#C0392B] text-right"
                                    required
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-[#7C7870] mb-1 block">ملاحظات (اختياري)</label>
                                <input
                                    type="text"
                                    value={debtData.description}
                                    onChange={e => setDebtData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="سبب الإضافة أو رقم الفاتورة..."
                                    className="w-full px-3 py-2 border border-[#EAE8E2] rounded-xl text-sm focus:outline-none focus:border-[#C0392B] text-right"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={transactionMutation.isPending || !debtData.amount}
                                className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-[#C0392B] hover:bg-[#A93226] transition-all active:scale-95 disabled:opacity-60"
                            >
                                {transactionMutation.isPending ? 'جاري التسجيل...' : 'تأكيد إضافة المبلغ'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Transaction History */}
                <div className="bg-white rounded-2xl border border-[#EAE8E2] overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#EAE8E2] bg-[#FAF9F6]">
                        <p className="text-sm font-bold text-[#1A2D23] flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-[#2E5A44]" />
                            سجل المعاملات ({loadedTransactions.length})
                        </p>
                    </div>

                    {loadedTransactions.length === 0 ? (
                        <div className="py-16 text-center">
                            <Wallet className="w-10 h-10 mx-auto mb-3 text-[#D6D4CE]" />
                            <p className="text-sm text-[#9A978F] font-semibold">لا يوجد معاملات مسجلة لهذا المورد</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#F5F4F0]">
                            {loadedTransactions.map((tx) => {
                                const isDebt = tx.amount > 0  // positive = I owe this
                                return (
                                    <div
                                        key={tx.id}
                                        className="px-5 py-4 flex items-center justify-between hover:bg-[#FAFAF8] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                isDebt ? 'bg-[#FDEEEC]' : 'bg-[#EAF6EE]'
                                            }`}>
                                                {isDebt ? (
                                                    <ArrowDownCircle className="w-4 h-4 text-[#C0392B]" />
                                                ) : (
                                                    <ArrowUpCircle className="w-4 h-4 text-[#2E5A44]" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold ${isDebt ? 'text-[#C0392B]' : 'text-[#2E5A44]'}`}>
                                                    {isDebt ? '+' : '-'} {Math.abs(tx.amount).toFixed(2)} ج.م
                                                </p>
                                                {tx.description && (
                                                    <p className="text-xs text-[#7C7870] mt-0.5">{tx.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left flex-shrink-0">
                                            <p className="text-[10px] text-[#B8B5AE] font-semibold">{tx.date}</p>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                isDebt
                                                    ? 'bg-[#FDEEEC] text-[#C0392B]'
                                                    : 'bg-[#EAF6EE] text-[#2E5A44]'
                                            }`}>
                                                {isDebt ? 'مبلغ مستحق' : 'سداد'}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}

                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}
