import { useState, useRef, useEffect } from 'react'
import CartItem from './CartItem'
import { ShoppingBag, Trash2, User, Pause, Search, X, ChevronDown, AlertCircle, CheckCircle, Eye, EyeOff, CreditCard, Banknote } from 'lucide-react'

export default function Cart({
    items,
    onIncrement,
    onDecrement,
    onQuantityChange,
    onRemove,
    onPriceChange,
    onClear,
    onSaveCart,
    onCompleteOrder,
    customers,
    selectedCustomer,
    setSelectedCustomer,
    isSaving = false
}) {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    const benefits = items.reduce((sum, item) => {
        const cost = parseFloat(item.cost_price || 0)
        const price = parseFloat(item.price || 0)
        return sum + (price - cost) * item.quantity
    }, 0)

    const [showBenefits, setShowBenefits] = useState(() => {
        return localStorage.getItem('show_benefits_pos') === 'true'
    })

    const toggleBenefits = () => {
        const nextVal = !showBenefits
        setShowBenefits(nextVal)
        localStorage.setItem('show_benefits_pos', String(nextVal))
    }

    const [customerSearch, setCustomerSearch]     = useState('')
    const [showDropdown, setShowDropdown]         = useState(false)
    const [saveError, setSaveError]               = useState(false)
    const [errorMessage, setErrorMessage]         = useState('')
    const [paymentType, setPaymentType]           = useState('آجل')
    const [paidAmount, setPaidAmount]             = useState('')

    const dropdownRef = useRef(null)

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(customerSearch.toLowerCase())
    )

    // Close dropdown on outside click
    useEffect(() => {
        const handleOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleOutside)
        return () => document.removeEventListener('mousedown', handleOutside)
    }, [])

    const selectCustomer = (customer) => {
        setSelectedCustomer(customer)
        setCustomerSearch('')
        setShowDropdown(false)
        setSaveError(false)
        setErrorMessage('')
    }

    const clearCustomer = (e) => {
        e.stopPropagation()
        setSelectedCustomer(null)
        setCustomerSearch('')
    }

    const handleSaveCart = () => {
        if (!selectedCustomer) {
            setErrorMessage('يجب اختيار عميل أولاً لحفظ السلة')
            setSaveError(true)
            setShowDropdown(true)
            setTimeout(() => setSaveError(false), 3000)
            return
        }
        onSaveCart?.(selectedCustomer)
    }

    const handleCompleteOrder = () => {
        if (!selectedCustomer) {
            setErrorMessage('يجب اختيار عميل أولاً لإتمام الطلب')
            setSaveError(true)
            setShowDropdown(true)
            setTimeout(() => setSaveError(false), 3000)
            return
        }
        const paid = paymentType === 'كاش' ? total : parseFloat(paidAmount || '0')
        onCompleteOrder?.(selectedCustomer, paymentType, paid)
    }

    return (
        <div className="bg-white rounded-2xl border border-[#EAE8E2] flex flex-col h-full text-right" dir="rtl">

            {/* ── Header ── */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#EAE8E2] flex-wrap">

                {/* Title + counts */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#2E5A44]" />
                    <h2 className="text-sm font-bold text-[#1A2D23] whitespace-nowrap">الطلب الحالي</h2>
                    {items.length > 0 && (
                        <div className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded-full bg-[#D5E6DC] text-[#2E5A44] text-[10px] font-bold">
                                {items.length} صنف
                            </span>
                            <span className="px-1.5 py-0.5 rounded-full bg-[#EAE8E2] text-[#5C5950] text-[10px] font-bold">
                                {items.reduce((s, i) => s + i.quantity, 0)} قطعة
                            </span>
                        </div>
                    )}
                </div>

                {/* Payment toggle + input — shown when cart has items */}
                {items.length > 0 && (
                    <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        {/* كاش / آجل toggle */}
                        <button
                            onClick={() => setPaymentType('كاش')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                paymentType === 'كاش'
                                    ? 'bg-[#2E5A44] text-white border-[#2E5A44] shadow-sm'
                                    : 'bg-white text-[#5C5950] border-[#E2E0DA] hover:bg-[#FAF9F6]'
                            }`}
                        >
                            <Banknote className="w-3 h-3" />
                            كاش
                        </button>
                        <button
                            onClick={() => setPaymentType('آجل')}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                                paymentType === 'آجل'
                                    ? 'bg-[#C0392B] text-white border-[#C0392B] shadow-sm'
                                    : 'bg-white text-[#5C5950] border-[#E2E0DA] hover:bg-[#FAF9F6]'
                            }`}
                        >
                            <CreditCard className="w-3 h-3" />
                            آجل
                        </button>

                        {/* Paid amount input (آجل only) */}
                        {paymentType === 'آجل' && (
                            <div className="flex items-center gap-1 flex-1 min-w-0">
                                <input
                                    type="number"
                                    step="0.01" min="0" max={total}
                                    value={paidAmount}
                                    onChange={e => setPaidAmount(e.target.value)}
                                    placeholder="مدفوع..."
                                    className="w-0 flex-1 px-2 py-1 border border-[#F5C2C0] rounded text-[11px] focus:outline-none focus:border-[#C0392B] text-right bg-[#FFF8F7] min-w-0"
                                />
                                <span className="text-[10px] text-[#9A978F] font-bold whitespace-nowrap">ج.م</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Action icons */}
                <div className="flex items-center gap-0.5 flex-shrink-0 mr-auto">
                    {items.length > 0 && (
                        <button
                            onClick={toggleBenefits}
                            className="p-1.5 rounded-lg hover:bg-[#EEF4F1] text-[#2E5A44] transition-colors"
                            title={showBenefits ? "إخفاء الأرباح" : "إظهار الأرباح"}
                        >
                            {showBenefits ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                    )}
                    {items.length > 0 && (
                        <button
                            onClick={onClear}
                            className="p-1.5 rounded-lg hover:bg-[#FDEEEC] text-[#9A978F] hover:text-[#C0392B] transition-colors"
                            title="تفريغ السلة"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Customer Searchable Dropdown ── */}
            <div className="p-3 border-b border-[#FAF9F6] bg-[#FAF9F6]/50">
                <div className="relative" ref={dropdownRef}>

                    {/* Trigger */}
                    <button
                        onClick={() => setShowDropdown(v => !v)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 focus:outline-none ${
                            saveError
                                ? 'border-2 border-[#C0392B] bg-[#FDEEEC] animate-[pulse_0.5s_ease-in-out_3]'
                                : selectedCustomer
                                    ? 'border border-[#ADCBBB] bg-white'
                                    : 'border border-[#E2E0DA] bg-white'
                        }`}
                    >
                        <User className="w-4 h-4 text-[#9A978F] flex-shrink-0" />
                        <span className={`flex-1 text-right font-semibold flex items-center justify-between ${selectedCustomer ? 'text-[#1A2D23]' : 'text-[#9A978F]'}`}>
                            {selectedCustomer ? (
                                <>
                                    <span>{selectedCustomer.name}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                        selectedCustomer.balance > 0
                                            ? 'bg-[#FDEEEC] text-[#C0392B]'
                                            : selectedCustomer.balance < 0
                                                ? 'bg-[#EAF6EE] text-[#2E5A44]'
                                                : 'bg-[#FAF9F6] text-[#7C7870]'
                                    }`}>
                                        رصيد: {selectedCustomer.balance > 0 ? `${selectedCustomer.balance.toFixed(2)} ج.م (عليه)` : selectedCustomer.balance < 0 ? `${Math.abs(selectedCustomer.balance).toFixed(2)} - ج.م (له)` : '0.00 ج.م'}
                                    </span>
                                </>
                            ) : (
                                <span>اختر العميل...</span>
                            )}
                        </span>
                        {selectedCustomer ? (
                            <button onClick={clearCustomer} className="p-0.5 rounded hover:bg-[#EAE8E2]">
                                <X className="w-3.5 h-3.5 text-[#9A978F]" />
                            </button>
                        ) : (
                            <ChevronDown className={`w-4 h-4 text-[#9A978F] transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
                        )}
                    </button>

                    {/* Error hint */}
                    {saveError && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-1">
                            <AlertCircle className="w-3.5 h-3.5 text-[#C0392B] flex-shrink-0" />
                            <span className="text-xs text-[#C0392B] font-semibold">{errorMessage}</span>
                        </div>
                    )}

                    {/* Dropdown */}
                    {showDropdown && (
                        <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-[#EAE8E2] rounded-xl shadow-lg z-50 overflow-hidden font-sans">
                            {/* Search box */}
                            <div className="p-2 border-b border-[#F0EDE8]">
                                <div className="relative">
                                    <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9A978F]" />
                                    <input
                                        type="text"
                                        value={customerSearch}
                                        onChange={(e) => setCustomerSearch(e.target.value)}
                                        placeholder="ابحث عن عميل..."
                                        autoFocus
                                        className="w-full pr-8 pl-3 py-1.5 text-sm rounded-lg border border-[#E2E0DA] focus:outline-none focus:border-[#ADCBBB] text-right"
                                    />
                                </div>
                            </div>

                            {/* List */}
                            <div className="max-h-48 overflow-y-auto">
                                {filteredCustomers.length === 0 ? (
                                    <div className="py-6 text-center text-xs text-[#9A978F]">لا يوجد عملاء مطابقون</div>
                                ) : (
                                    filteredCustomers.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => selectCustomer(c)}
                                            className="w-full text-right px-3 py-2.5 text-sm hover:bg-[#FAF9F6] transition-colors flex items-center justify-between gap-2 border-b border-[#F9F7F4] last:border-0"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-[#D5E6DC] flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3 h-3 text-[#2E5A44]" />
                                                </div>
                                                <span className="text-[#1A2D23] font-medium">{c.name}</span>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                                                c.balance > 0
                                                    ? 'bg-[#FDEEEC] text-[#C0392B]'
                                                    : c.balance < 0
                                                        ? 'bg-[#EAF6EE] text-[#2E5A44]'
                                                        : 'bg-[#FAF9F6] text-[#7C7870]'
                                            }`}>
                                                {c.balance > 0 ? `${c.balance.toFixed(2)} ج.م (عليه)` : c.balance < 0 ? `${Math.abs(c.balance).toFixed(2)} - ج.م (له)` : '0.00 ج.م'}
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Cart Items ── */}
            <div className="flex-1 overflow-y-auto p-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-[#FAF9F6] flex items-center justify-center mb-3 border border-[#EAE8E2]">
                            <ShoppingBag className="w-8 h-8" style={{ stroke: '#B8B5AE' }} />
                        </div>
                        <p className="text-sm font-bold text-[#5C5950]">السلة فارغة حالياً</p>
                        <p className="text-xs text-[#9A978F] mt-1">اضغط على أي منتج لإضافته</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <CartItem
                                key={item.id}
                                item={item}
                                onIncrement={onIncrement}
                                onDecrement={onDecrement}
                                onQuantityChange={onQuantityChange}
                                onRemove={onRemove}
                                onPriceChange={onPriceChange}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Footer ── */}
            {items.length > 0 && (
                <div className="border-t border-[#EAE8E2] px-4 py-3 space-y-2">

                    {/* Total row */}
                    <div className="flex items-center justify-between flex-row-reverse">
                        <span className="text-sm font-bold text-[#1A2D23]">الإجمالي الكلي</span>
                        <div className="flex items-center gap-2">
                            {paymentType === 'آجل' && paidAmount && (
                                <span className="text-[10px] text-[#9A978F]">دين: <span className="font-bold text-[#C0392B]">{(total - parseFloat(paidAmount || '0')).toFixed(2)} ج</span></span>
                            )}
                            <span className="text-lg font-bold text-[#2E5A44]">{total.toFixed(2)} ج</span>
                        </div>
                    </div>

                    {/* Benefits row */}
                    {showBenefits && (
                        <div className="flex items-center justify-between flex-row-reverse text-[11px] font-semibold px-2.5 py-1.5 rounded-lg bg-[#EEF4F1] text-[#2E5A44] border border-[#ADCBBB]">
                            <span>أرباح الطلب</span>
                            <span className="font-bold">{benefits.toFixed(2)} ج.م</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        {/* Complete Order Button */}
                        <button
                            onClick={handleCompleteOrder}
                            disabled={isSaving}
                            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 active:scale-95 text-white disabled:opacity-60 ${
                                paymentType === 'آجل'
                                    ? 'bg-[#C0392B] hover:bg-[#A93226]'
                                    : 'bg-[#2E5A44] hover:bg-[#234533]'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            {isSaving ? 'جاري التسجيل...' : paymentType === 'آجل' ? 'إتمام الطلب (آجل)' : 'إتمام الطلب (كاش)'}
                        </button>

                        {/* Save Pending Cart Button */}
                        <button
                            onClick={handleSaveCart}
                            disabled={isSaving}
                            className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg font-bold text-xs transition-all duration-150 active:scale-95 bg-[#FAF9F6] border border-[#D6D4CE] text-[#5C5950] hover:bg-[#EAE8E2] disabled:opacity-60"
                        >
                            <Pause className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
                            حفظ كسلة معلقة
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
