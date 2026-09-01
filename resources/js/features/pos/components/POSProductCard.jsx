export default function POSProductCard({ product, onAdd }) {
    return (
        <button
            onClick={() => onAdd(product)}
            disabled={product.stock === 0}
            className={`
                w-full text-right bg-white rounded-xl border border-[#EAE8E2] px-2 py-2
                transition-all duration-150 flex flex-col gap-1
                ${product.stock === 0
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:border-[#ADCBBB] hover:shadow-sm active:scale-[0.97] cursor-pointer hover:bg-[#F7FAF8]'
                }
            `}
            dir="rtl"
        >
            {/* Product name */}
            <p className="text-sm font-bold text-[#1A2D23] leading-snug line-clamp-2 text-right">{product.name}</p>

            {/* Unit + stock badges row */}
            <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                    {product.unit && (
                        <span className="text-[11px] font-bold bg-[#D5E6DC] text-[#2E5A44] px-1.5 py-0.5 rounded-full leading-tight">
                            {product.unit}
                        </span>
                    )}
                    {product.stock === 0 ? (
                        <span className="text-[11px] font-bold bg-[#FDEEEC] text-[#C0392B] px-1.5 py-0.5 rounded-full leading-tight">نفذ</span>
                    ) : product.stock <= 5 ? (
                        <span className="text-[11px] font-bold bg-[#FEF3CD] text-[#B7860B] px-1.5 py-0.5 rounded-full leading-tight">بقي {product.stock}</span>
                    ) : (
                        <span className="text-[11px] text-[#9A978F] bg-[#F4F3EF] px-1.5 py-0.5 rounded-full leading-tight">{product.stock}</span>
                    )}
                </div>
                <span className="text-xs font-bold text-[#2E5A44] leading-tight">{product.price.toFixed(2)} ج</span>
            </div>
        </button>
    )
}
