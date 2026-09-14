import { Heart, ShoppingBag, Plus, Check } from 'lucide-react'

export default function ProductGridCard({
    product,
    isWishlisted = false,
    isInCart = false,
    onToggleWishlist,
    onAddToCart,
}) {
    const price     = parseFloat(product.price) || 0
    const costPrice = parseFloat(product.cost_price) || 0
    const hasDiscount = costPrice > price

    return (
        <div className="bg-white rounded-3xl p-4 border border-[#EAE8E2] hover:border-[#ADCBBB] transition-all hover:shadow-xl group flex flex-col justify-between relative overflow-hidden" dir="rtl">
            
            {/* Top Badges & Wishlist Button */}
            <div className="flex items-center justify-between gap-2 mb-3">
                {hasDiscount ? (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-[#922B21] text-white shadow-sm">
                        خصم مميز
                    </span>
                ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-[#EBF5EF] text-[#2E5A44]">
                        {product.unit || 'قطع'}
                    </span>
                )}

                <button
                    onClick={() => onToggleWishlist && onToggleWishlist(product)}
                    className={`p-2 rounded-2xl border transition-all ${
                        isWishlisted
                            ? 'bg-[#FDEEEC] border-[#E8A09A] text-[#922B21]'
                            : 'bg-[#FAF9F6] border-[#EAE8E2] text-[#9A978F] hover:text-[#922B21]'
                    }`}
                    title={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#922B21]' : ''}`} />
                </button>
            </div>

            {/* Product Image / Placeholder */}
            <div className="w-full h-36 rounded-2xl bg-[#FAF9F6] border border-[#F4F3EF] flex items-center justify-center mb-4 overflow-hidden group-hover:scale-105 transition-transform duration-300">
                {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center p-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#EEF4F1] text-[#2E5A44] font-black flex items-center justify-center mx-auto mb-1 text-lg">
                            {product.name?.charAt(0) || 'P'}
                        </div>
                        <span className="text-[10px] font-bold text-[#9A978F]">{product.category_name || 'منتج طازج'}</span>
                    </div>
                )}
            </div>

            {/* Product Details */}
            <div className="space-y-1 mb-4 text-right">
                <span className="text-[10px] font-bold text-[#2E5A44] block">{product.category_name || 'طازج وصحي'}</span>
                <h3 className="font-bold text-sm text-[#1A2D23] line-clamp-1 group-hover:text-[#2E5A44] transition-colors">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-[11px] text-[#7C7870] line-clamp-1 font-medium">{product.description}</p>
                )}
            </div>

            {/* Price & Add to Cart Action */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F4F3EF]">
                <div className="text-right">
                    <div className="flex items-baseline gap-1">
                        <span className="font-black text-base text-[#2E5A44]">{price.toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-[#5C5950]">ج.م</span>
                    </div>
                    {hasDiscount && (
                        <span className="text-[10px] font-bold text-[#9A978F] line-through block">
                            {costPrice.toFixed(2)} ج.م
                        </span>
                    )}
                </div>

                <button
                    onClick={() => onAddToCart && onAddToCart(product)}
                    className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 ${
                        isInCart
                            ? 'bg-[#EBF5EF] text-[#2E5A44] border border-[#ADCBBB]'
                            : 'bg-[#2E5A44] hover:bg-[#234533] text-white'
                    }`}
                >
                    {isInCart ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isInCart ? 'في السلة' : 'إضافة'}</span>
                </button>
            </div>

        </div>
    )
}
