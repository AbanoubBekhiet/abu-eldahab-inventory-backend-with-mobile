import { Badge } from '../../../shared/components'
import { Edit2, Trash2 } from 'lucide-react'

export default function ProductCard({ product, onAddToCart, onEdit, onDelete }) {
    return (
        <div
            className="rounded-2xl overflow-hidden group transition-all duration-300 hover:shadow-lg text-right"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#ADCBBB'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#EAE8E2'}
            dir="rtl"
        >
            {/* Image area */}
            <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: '#F4F3EF' }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500"
                            style={{ backgroundColor: '#EEF4F1' }}
                        >
                            <span className="text-3xl">📦</span>
                        </div>
                    )}
                </div>

                {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-3 right-3">
                        <Badge variant="warning">مخزون منخفض</Badge>
                    </div>
                )}
                {product.stock === 0 && (
                    <div className="absolute top-3 right-3">
                        <Badge variant="danger">نفذت الكمية</Badge>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-right" style={{ color: '#9A978F' }}>{product.category_name}</p>
                <h3 className="text-sm font-bold mt-1 line-clamp-1 transition-colors text-right" style={{ color: '#1A2D23' }}>
                    {product.name}
                </h3>

                {/* Price row */}
                <div className="flex items-center justify-between mt-3 flex-row-reverse">
                    <p className="text-lg font-bold" style={{ color: '#1A2D23' }}>{(Number(product.price) || 0).toFixed(2)} ج</p>
                    <p className="text-xs font-bold" style={{ color: '#2E5A44' }}>المخزون: {Number(product.stock).toLocaleString('en-US')} {product.unit}</p>
                </div>

                {/* Cost price */}
                {product.cost_price > 0 && (
                    <div className="mt-1.5 flex items-center justify-end gap-1">
                        <span className="text-[11px] font-semibold" style={{ color: '#9A978F' }}>سعر التكلفة:</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                            {(Number(product.cost_price) || 0).toFixed(2)} ج
                        </span>
                    </div>
                )}

                {product.number_of_items_in_unit > 1 && (
                    <div className="mt-2 flex items-center justify-end gap-1">
                        <span className="text-[11px] font-semibold text-[#9A978F]">القطع في الوحدة:</span>
                        <span className="text-[11px] font-bold bg-[#EEF4F1] text-[#2E5A44] px-2 py-0.5 rounded-full">{product.number_of_items_in_unit}</span>
                    </div>
                )}

                {/* App Availability Status */}
                <div className="mt-2 flex items-center justify-between text-[11px] font-bold pt-2 border-t border-[#F4F3EF]">
                    <span>تطبيق الموبايل:</span>
                    {product.is_available_on_app ? (
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF5EF] text-[#2E5A44]">
                            متاح {product.max_app_order_quantity ? `(أقصى كمية: ${product.max_app_order_quantity})` : '(كمية مفتوحة)'}
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full bg-[#FDEEEC] text-[#922B21]">
                            مخفي من التطبيق
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#FAF9F6]">
                    <button
                        onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}
                        className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#7C7870] hover:text-[#2E5A44] transition-colors"
                        title="تعديل"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete?.(product); }}
                        className="p-1.5 rounded-lg hover:bg-[#FAF9F6] text-[#7C7870] hover:text-[#C0392B] transition-colors"
                        title="حذف"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
