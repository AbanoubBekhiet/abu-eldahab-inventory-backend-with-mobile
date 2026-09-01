import { useState, useEffect } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'

export default function CartItem({ item, onIncrement, onDecrement, onQuantityChange, onRemove, onPriceChange }) {
    const [isEditing, setIsEditing] = useState(false)
    const [tempPrice, setTempPrice] = useState(item.price)
    const [tempQty, setTempQty] = useState(item.quantity)

    useEffect(() => {
        setTempQty(item.quantity)
    }, [item.quantity])

    const handleSave = () => {
        setIsEditing(false)
        onPriceChange(item.id, parseFloat(tempPrice) || 0)
    }

    const handleQtyChange = (e) => {
        const valStr = e.target.value
        setTempQty(valStr)
        const val = parseInt(valStr, 10)
        if (!isNaN(val) && val > 0) onQuantityChange(item.id, val)
    }

    const handleQtyBlur = () => {
        const val = parseInt(tempQty, 10)
        if (isNaN(val) || val <= 0) onRemove(item.id)
        else onQuantityChange(item.id, val)
    }

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FAF9F6] transition-colors group border-b border-[#F0EEE8] last:border-0" dir="rtl">

            {/* Name + unit + price (editable) */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                    <p className="text-sm font-bold text-[#1A2D23] truncate leading-tight">{item.name}</p>
                    {item.unit && (
                        <span className="text-[9px] font-bold bg-[#D5E6DC] text-[#2E5A44] px-1 py-0.5 rounded-full leading-tight flex-shrink-0">
                            {item.unit}
                        </span>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex items-center gap-1 mt-0.5">
                        <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                            autoFocus
                            className="w-14 px-1 py-0.5 text-xs text-right border border-[#ADCBBB] rounded focus:outline-none font-semibold text-[#1A2D23]"
                            min="0" step="0.01"
                        />
                        <span className="text-xs text-[#9A978F]">ج</span>
                    </div>
                ) : (
                    <button
                        onClick={() => { setTempPrice(item.price); setIsEditing(true) }}
                        className="text-xs text-[#5C5950] hover:text-[#2E5A44] hover:underline mt-0.5 block"
                        title="تعديل السعر"
                    >
                        {parseFloat(item.price).toFixed(2)} ج
                    </button>
                )}
            </div>

            {/* Quantity controls */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={() => onDecrement(item.id)}
                    className="w-6 h-6 rounded bg-[#EAE8E2] hover:bg-[#D6D4CE] flex items-center justify-center transition-colors"
                >
                    <Minus className="w-3 h-3 text-[#5C5950]" />
                </button>
                <input
                    type="number"
                    value={tempQty}
                    onChange={handleQtyChange}
                    onBlur={handleQtyBlur}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    className="w-8 text-center text-xs font-bold text-[#1A2D23] bg-transparent border-b border-transparent hover:border-[#E2E0DA] focus:border-[#2E5A44] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                    onClick={() => onIncrement(item.id)}
                    className="w-6 h-6 rounded bg-[#D5E6DC] hover:bg-[#B9D8C6] flex items-center justify-center transition-colors"
                >
                    <Plus className="w-3 h-3 text-[#2E5A44]" />
                </button>
            </div>

            {/* Total + delete */}
            <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-sm font-bold text-[#1A2D23] w-16 text-left tabular-nums">
                    {(item.price * item.quantity).toFixed(2)} ج
                </span>
                <button
                    onClick={() => onRemove(item.id)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[#FDEEEC] transition-all"
                >
                    <Trash2 className="w-3 h-3 text-[#C0392B]" />
                </button>
            </div>
        </div>
    )
}
