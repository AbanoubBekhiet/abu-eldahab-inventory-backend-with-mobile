import { X, Printer, Package, RotateCcw, Tag } from 'lucide-react'
import { usePage } from '@inertiajs/react'

// Helper: safely parse a number from a possibly formatted string like "3,025.00 ج.م"
function safeParseNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Remove any non-numeric chars except dot and minus
    const cleaned = String(val).replace(/[^0-9.\-]/g, '');
    return parseFloat(cleaned) || 0;
}

// Silent print via hidden iframe — no print dialog shown
export function silentPrint(html) {
    // Remove any existing silent-print iframe
    const existing = document.getElementById('__silent_print_frame')
    if (existing) existing.remove()

    const iframe = document.createElement('iframe')
    iframe.id = '__silent_print_frame'
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:0;height:0;border:none;'
    document.body.appendChild(iframe)

    const doc = iframe.contentWindow.document
    doc.open()
    doc.write(html)
    doc.close()

    iframe.contentWindow.focus()
    setTimeout(() => {
        try {
            iframe.contentWindow.print()
        } catch (e) {
            console.error('Silent print failed:', e)
        }
        setTimeout(() => iframe.remove(), 2000)
    }, 500)
}

export default function OrderDetailsModal({ order, onClose, onDiscount, onReturn }) {
    const { appSettings } = usePage().props
    const handlePrint = () => {
        const printContent = buildPrintHTML(order, appSettings)
        silentPrint(printContent)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" dir="rtl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-[#EAE8E2] flex-shrink-0">
                    <div>
                        <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>تفاصيل الطلب</h3>
                        <p className="text-xs font-semibold" style={{ color: '#2E5A44' }}>{order.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} title="طباعة" className="p-1.5 rounded-lg hover:bg-[#EEF4F1] transition-colors">
                            <Printer className="w-4 h-4" style={{ color: '#2E5A44' }} />
                        </button>
                        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F3EF] transition-colors">
                            <X className="w-4 h-4 text-[#9A978F]" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 text-[#111] space-y-4" style={{ fontFamily: "Arial, sans-serif" }}>
                    {/* Header Section */}
                    <div className="flex justify-between items-start pb-4 mb-4 border-b-2 border-[#1A2D23] text-right gap-4">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-[#1A2D23] mb-4">
                                {appSettings?.receipt_name || 'فاتورة طلب'}
                            </h2>
                            <table className="w-full border-collapse border-[1.5px] border-black text-[12px] sm:text-[13px] text-right">
                                <tbody>
                                    <tr>
                                        <th className="bg-[#f5f5f5] p-2 border border-black font-bold w-[18%]">العميل</th>
                                        <td className="p-2 border border-black font-bold">
                                            {order.customer || order.customer_name || 'عميل نقدي'}
                                        </td>
                                        <th className="bg-[#f5f5f5] p-2 border border-black font-bold w-[15%]">التاريخ</th>
                                        <td className="p-2 border border-black font-bold w-[22%]">{order.date}</td>
                                    </tr>
                                    <tr>
                                        <th className="bg-[#f5f5f5] p-2 border border-black font-bold">العنوان</th>
                                        <td className="p-2 border border-black">
                                            {order.customer_address && order.customer_address !== '—' ? order.customer_address : ''}
                                        </td>
                                        <th className="bg-[#f5f5f5] p-2 border border-black font-bold">التليفون</th>
                                        <td className="p-2 border border-black font-bold" dir="ltr">
                                            {order.customer_phone || order.customer_phone_number || order.phone || ''}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col items-end text-left w-[120px] shrink-0">
                            {appSettings?.receipt_logo_url ? (
                                <img
                                    src={appSettings.receipt_logo_url}
                                    alt="logo"
                                    className="max-h-[90px] max-w-full object-contain mb-1"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl mb-1 shadow"
                                    style={{ background: 'linear-gradient(135deg, #559476, #2E5A44)' }}>
                                    {(appSettings?.receipt_name || 'م').charAt(0).toUpperCase()}
                                </div>
                            )}
                            {(appSettings?.phone1 || appSettings?.phone2) && (
                                <div className="text-[11px] text-[#333] font-bold text-left leading-relaxed whitespace-pre-line mt-1">
                                    📞 {[appSettings.phone1, appSettings.phone2].filter(Boolean).join('\n📞 ')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <table className="w-full text-sm border-collapse mb-4 border-[1.5px] border-black">
                        <thead>
                            <tr className="bg-[#f5f5f5]">
                                <th className="py-2 px-1 text-right font-bold text-[#333] border border-black">المنتج</th>
                                <th className="py-2 px-1 text-center font-bold text-[#333] border border-black">الكمية</th>
                                <th className="py-2 px-1 text-center font-bold text-[#333] border border-black">السعر</th>
                                <th className="py-2 px-1 text-center font-bold text-[#333] border border-black">الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(order.products || []).map((p, idx) => (
                                <tr key={idx}>
                                    <td className="py-2 px-1 text-right text-[#111] border border-black">
                                        {idx + 1} - {p.name}
                                        {p.returned_qty > 0 && (
                                            <span className="text-amber-600 mr-2 text-xs">
                                                (مرتجع: {p.returned_qty})
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-2 px-1 text-center text-[#111] border border-black">
                                        {p.quantity}{p.unit ? ' ' + p.unit : ''}
                                        {parseInt(p.number_of_items_in_unit || 0) > 1 && (
                                            <div className="text-[10px] text-[#777]">
                                                ({parseInt(p.number_of_items_in_unit) * p.quantity} قطعة)
                                            </div>
                                        )}
                                    </td>
                                    <td className="py-2 px-1 text-center text-[#111] border border-black">
                                        {parseFloat(p.price || 0).toFixed(2)}
                                    </td>
                                    <td className="py-2 px-1 text-center text-[#111] font-semibold border border-black">
                                        {parseFloat(p.total_price || 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Total Units Count */}
                    <div className="py-2 text-xs text-[#333] text-right mb-2 font-bold">
                        إجمالي الوحدات: <strong>{(order.products || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0)}</strong>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="py-2 border-t border-dashed border-[#ccc] text-sm text-right mb-2">
                            <span className="text-[#555] text-xs block mb-1">ملاحظات</span>
                            <p className="text-xs px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#F7F5F0', color: '#5C5A53' }}>📝 {order.notes}</p>
                        </div>
                    )}

                    {/* Returns history */}
                    {(order.returns || []).length > 0 && (
                        <div className="border-t border-dashed border-[#ccc] pt-2 mb-2">
                            <p className="text-xs font-bold mb-2 flex items-center gap-1 text-[#777]">
                                <RotateCcw className="w-3 h-3" /> سجل المرتجعات
                            </p>
                            <div className="space-y-1">
                                {order.returns.map((r, i) => (
                                    <div key={i} className="p-2 rounded-lg text-xs space-y-0.5" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FCD34D' }}>
                                        <div className="flex justify-between font-bold text-amber-800">
                                            <span>{r.product_name}</span>
                                            <span>{parseFloat(r.refund_amount || 0).toFixed(2)} ج.م</span>
                                        </div>
                                        <div className="flex justify-between text-amber-700 text-[10px]">
                                            <span>الكمية: {r.quantity} · {r.date}</span>
                                            {r.reason && <span>السبب: {r.reason}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary / Totals */}
                    <div className="border-t-2 border-[#111] pt-3 text-sm space-y-2">
                        <div className="flex justify-between font-bold text-base sm:text-lg">
                            <span className="text-[#333] font-bold">الإجمالي</span>
                            <span className="font-extrabold text-[#111] text-lg sm:text-xl">{safeParseNumber(order.total_price || order.total || 0).toFixed(2)} ج.م</span>
                        </div>
                        {safeParseNumber(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-orange-600 font-semibold">
                                <span>الخصم</span>
                                <span>- {safeParseNumber(order.discount).toFixed(2)} ج.م</span>
                            </div>
                        )}
                        <div className="flex justify-between border-t border-[#ccc] pt-2 font-black text-xl sm:text-2xl">
                            <span className="text-[#1A2D23] font-black">صافي الطلب</span>
                            <span className="text-[#2E5A44] font-black text-xl sm:text-2xl">{safeParseNumber(order.net_total || order.total_price || order.total || 0).toFixed(2)} ج.م</span>
                        </div>

                        {/* Customer balance details */}
                        {(safeParseNumber(order.previous_balance || 0) !== 0 || safeParseNumber(order.credit_used || 0) > 0) && (
                            <>
                                <div className="flex justify-between text-sm pt-1 border-t border-dashed border-[#ccc]">
                                    <span className="text-[#555]">رصيد الحساب السابق</span>
                                    {safeParseNumber(order.previous_balance || 0) > 0 ? (
                                        <span className="font-semibold text-[#C0392B]">
                                            {safeParseNumber(order.previous_balance).toFixed(2)} ج.م (دين)
                                        </span>
                                    ) : safeParseNumber(order.previous_balance || 0) < 0 ? (
                                        <span className="font-semibold text-[#2E5A44]">
                                            {Math.abs(safeParseNumber(order.previous_balance)).toFixed(2)} - ج.م (دائن)
                                        </span>
                                    ) : (
                                        <span className="font-semibold text-[#555]">0.00 ج.م</span>
                                    )}
                                </div>
                                {safeParseNumber(order.credit_used || 0) > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#555]">رصيد دائن مستخدم للخصم</span>
                                        <span className="font-bold text-[#2E5A44]">
                                            {safeParseNumber(order.credit_used).toFixed(2)} - ج.م
                                        </span>
                                    </div>
                                )}
                            </>
                        )}

                        <div className="flex justify-between text-sm pt-1 border-t border-[#eee]">
                            <span className="text-[#555]">المبلغ المدفوع</span>
                            <span className="font-bold text-[#2E5A44]">{safeParseNumber(order.paid_amount || 0).toFixed(2)} ج.م</span>
                        </div>

                        {/* Final Balance */}
                        <div className="flex justify-between border-t border-dashed border-[#ccc] pt-2 font-bold text-sm">
                            <span className="text-[#555]">رصيد الحساب بعد الطلب</span>
                            {(() => {
                                const netVal = safeParseNumber(order.net_total || order.total_price || order.total || 0);
                                const finalBalance = safeParseNumber(order.previous_balance || 0) + netVal - safeParseNumber(order.paid_amount || 0);
                                if (finalBalance > 0) {
                                    return (
                                        <span className="font-bold text-[#C0392B]">
                                            {finalBalance.toFixed(2)} ج.م (دين متبقي)
                                        </span>
                                    );
                                } else if (finalBalance < 0) {
                                    return (
                                        <span className="font-bold text-[#2E5A44]">
                                            {Math.abs(finalBalance).toFixed(2)} - ج.م (رصيد دائن للعميل)
                                        </span>
                                    );
                                }
                                return <span className="font-bold text-[#555]">0.00 ج.م</span>;
                            })()}
                        </div>

                        {order.profit !== undefined && (
                            <div className="border-t border-dashed border-[#ccc] pt-2 flex justify-between text-xs text-[#2E5A44] font-bold">
                                <span>أرباح الطلب (الفوائد)</span>
                                <span>{parseFloat(order.profit || 0).toFixed(2)} ج.م</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer actions */}
                <div className="flex gap-2 p-4 border-t border-[#EAE8E2] flex-shrink-0">
                    <button onClick={() => { onClose(); onDiscount(order) }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-[#EAE8E2] hover:bg-[#F4F3EF] transition-colors"
                        style={{ color: '#5C5950' }}>
                        <Tag className="w-3.5 h-3.5" /> خصم
                    </button>
                    <button onClick={() => { onClose(); onReturn(order) }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border hover:opacity-90 transition-colors"
                        style={{ backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#92400E' }}>
                        <RotateCcw className="w-3.5 h-3.5" /> مرتجع
                    </button>
                    <button onClick={handlePrint}
                        className="flex-1 py-2 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-all hover:opacity-90"
                        style={{ backgroundColor: '#2E5A44' }}>
                        <Printer className="w-3.5 h-3.5" /> طباعة
                    </button>
                </div>
            </div>
        </div>
    )
}


export function buildPrintHTML(order, appSettings = {}) {
    const {
        receipt_name     = '',
        receipt_logo_url = null,
        receipt_size     = 'A4',
        phone1           = '',
        phone2           = '',
    } = appSettings || {};

    const id = order.id || order.order_number || '';
    const date = order.date || '';
    const customer = order.customer || order.customer_name || 'عميل نقدي';
    const address = order.customer_address || '';
    const customerPhone = order.customer_phone || order.customer_phone_number || order.phone || '';
    const products = order.products || order.items || [];
    const total = safeParseNumber(order.total || order.total_price || 0);
    const discount = safeParseNumber(order.discount || 0);
    const net_total = safeParseNumber(order.net_total || order.total_price || 0);
    const paymentType = order.payment_type || '';
    const paidAmount = safeParseNumber(order.paid_amount || 0);
    const previousBalance = parseFloat(order.previous_balance || 0);
    const creditUsed = parseFloat(order.credit_used || 0);
    const finalBalance = previousBalance + net_total - paidAmount;

    const logoHtml = receipt_logo_url
        ? `<img src="${receipt_logo_url}" alt="logo" />`
        : '';

    const rows = products.map((p, idx) => {
        const qty = parseFloat(p.quantity || 0);
        const price = parseFloat(p.price || 0);
        const totalPrice = parseFloat(p.total_price || (qty * price));
        const unitLabel = p.unit ? ` ${p.unit}` : '';
        const pieces = parseInt(p.number_of_items_in_unit || 0);
        const piecesLabel = pieces > 1 ? `<br><small style="color:#777;font-size:11px">(${pieces * qty} قطعة)</small>` : '';
        return `
        <tr>
            <td style="text-align:right">${idx + 1} - ${p.name}</td>
            <td>${qty}${unitLabel}${piecesLabel}</td>
            <td>${price.toFixed(2)}</td>
            <td>${totalPrice.toFixed(2)}</td>
        </tr>`;
    }).join('');

    const totalUnits = products.reduce((sum, p) => sum + parseFloat(p.quantity || 0), 0);
    const pageSize = 'A5'; // Always print on A5

    let balanceHtml = '';
    if (previousBalance !== 0 || creditUsed > 0) {
        let prevBalanceText = '';
        if (previousBalance > 0) {
            prevBalanceText = `<span style="font-weight:bold;color:#C0392B">${previousBalance.toFixed(2)} ج.م (دين على العميل)</span>`;
        } else if (previousBalance < 0) {
            prevBalanceText = `<span style="font-weight:bold;color:#2E5A44">${Math.abs(previousBalance).toFixed(2)} - ج.م (رصيد دائن)</span>`;
        } else {
            prevBalanceText = `<span>0.00 ج.م</span>`;
        }

        balanceHtml += `
        <div style="margin-top:6px;font-size:13px;display:flex;justify-content:space-between">
            <span>رصيد الحساب السابق</span>
            ${prevBalanceText}
        </div>`;

        if (creditUsed > 0) {
            balanceHtml += `
            <div style="margin-top:4px;font-size:13px;display:flex;justify-content:space-between">
                <span>رصيد دائن مستخدم للخصم</span>
                <span style="font-weight:bold;color:#2E5A44">${creditUsed.toFixed(2)} - ج.م</span>
            </div>`;
        }
    }

    let finalBalanceText = '';
    if (finalBalance > 0) {
        finalBalanceText = `<span style="color:#C0392B">${finalBalance.toFixed(2)} ج.م (دين متبقي)</span>`;
    } else if (finalBalance < 0) {
        finalBalanceText = `<span style="color:#2E5A44">${Math.abs(finalBalance).toFixed(2)} - ج.م (رصيد دائن للعميل)</span>`;
    } else {
        finalBalanceText = `<span>0.00 ج.م</span>`;
    }

    const finalBalanceHtml = `
    <div style="margin-top:8px;padding-top:6px;border-top:1px dashed #ccc;font-size:14px;font-weight:bold;display:flex;justify-content:space-between">
        <span>رصيد الحساب بعد الطلب</span>
        ${finalBalanceText}
    </div>`;

    return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة طباعة</title><base href="${window.location.origin}/" />
    <style>
        @page { size: ${pageSize}; margin: 12mm; }
        * { margin:0; padding:0; box-sizing:border-box }
        body { font-family: Arial, 'Noto Sans Arabic', sans-serif; font-size:13px; color:#111; padding: 10px; }
        .print-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 2px solid #222;
        }
        .print-header img {
            height: 90px;
            width: auto;
            max-width: 200px;
            object-fit: contain;
            margin-bottom: 4px;
        }
        .header-right {
            text-align: right;
        }
        .header-right h1 {
            font-size: 17px;
            font-weight: bold;
            color: #1A2D23;
            margin-bottom: 3px;
        }
        .header-right .sub-type {
            display: none;
        }
        .meta-info {
            font-size: 11px;
            line-height: 1.4;
        }
        .header-left {
            text-align: left;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }
        .header-left .phones {
            font-size: 11px;
            color: #333;
            font-weight: bold;
            line-height: 1.4;
            text-align: left;
        }
        table { width:100%; border-collapse:collapse; margin-top: 6px; margin-bottom:10px; border: 1.5px solid #000; }
        th { background:#f5f5f5; padding:6px 4px; text-align:center; font-size:12px; font-weight:bold; border: 1px solid #000; }
        th:first-child { text-align:right }
        td { padding:6px 4px; text-align:center; font-size:12px; border: 1px solid #000; }
        td:first-child { text-align:right }
        .unit-count { font-size:11px; color:#333; padding:5px 0; text-align:right; margin-bottom:6px; }
        .totals { border-top:1.5px solid #111; padding-top:6px }
        .totals div { display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px }
        .totals .net { font-weight:bold; font-size:14px; margin-top:4px; border-top:1px solid #ccc; padding-top:5px }
        .footer { display:none; }
    </style>
    </head><body>
    <div class="print-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; padding-bottom:8px; border-bottom:2px solid #222;">
        <div class="header-right" style="flex:1; text-align:right;">
            <h1 style="font-size:24px; margin-top:0px; margin-bottom:10px;">${receipt_name || 'فاتورة طلب'}</h1>
            <table style="width:100%; border-collapse:collapse; border: 1.5px solid #000; font-size:12px;">
                <tr>
                    <th style="background:#f5f5f5; padding:4px; border:1px solid #000; text-align:right; font-weight:bold; width:18%;">العميل</th>
                    <td style="padding:4px; border:1px solid #000; font-weight:bold; text-align:right;">${customer}</td>
                    <th style="background:#f5f5f5; padding:4px; border:1px solid #000; text-align:right; font-weight:bold; width:15%;">التاريخ</th>
                    <td style="padding:4px; border:1px solid #000; font-weight:bold; text-align:right; width:22%;">${date}</td>
                </tr>
                <tr>
                    <th style="background:#f5f5f5; padding:4px; border:1px solid #000; text-align:right; font-weight:bold;">العنوان</th>
                    <td style="padding:4px; border:1px solid #000; text-align:right;">${address && address !== '—' ? address : ''}</td>
                    <th style="background:#f5f5f5; padding:4px; border:1px solid #000; text-align:right; font-weight:bold;">التليفون</th>
                    <td style="padding:4px; border:1px solid #000; font-weight:bold; text-align:right;" dir="ltr">${customerPhone || ''}</td>
                </tr>
            </table>
        </div>
        <div class="header-left" style="margin-right:15px; text-align:left; display:flex; flex-direction:column; align-items:flex-end;">
            ${logoHtml}
            ${phone1 || phone2 ? `<div class="phones" style="font-size:11px; margin-top:4px;">📞 ${[phone1, phone2].filter(Boolean).join('<br>')}</div>` : ''}
        </div>
    </div>
    <table>
        <thead>
            <tr>
                <th style="text-align:right">المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
            </tr>
        </thead>
        <tbody>${rows}</tbody>
    </table>
    <div class="unit-count">إجمالي الوحدات: <strong>${totalUnits}</strong></div>
    <div class="totals">
        <div style="font-size:16px; font-weight:bold; display:flex; justify-content:space-between; margin-bottom:4px;"><span>الإجمالي</span><span style="font-size:17px; font-weight:bold;">${total.toFixed(2)} ج.م</span></div>
        ${discount > 0 ? `<div><span>الخصم</span><span>- ${discount.toFixed(2)} ج.م</span></div>` : ''}
        <div class="net" style="font-size:19px; font-weight:800;"><span>صافي قيمة الطلب</span><span style="font-size:20px; font-weight:black;">${net_total.toFixed(2)} ج.م</span></div>
        ${balanceHtml}
        <div style="margin-top:6px;font-size:13px;display:flex;justify-content:space-between"><span>المبلغ المدفوع</span><span style="font-weight:bold;color:#2E5A44">${paidAmount.toFixed(2)} ج.م</span></div>
        ${finalBalanceHtml}
    </div>
    <div class="footer">شكراً لتعاملكم معنا</div>
    </body></html>`;
}
