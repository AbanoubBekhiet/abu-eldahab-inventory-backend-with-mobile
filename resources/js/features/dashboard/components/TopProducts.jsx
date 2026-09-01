export default function TopProducts({ topProducts = [] }) {
    const maxSales = Math.max(...topProducts.map(p => p.sales), 1)

    return (
        <div className="rounded-2xl p-5 sm:p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }} dir="rtl">
            <div className="mb-5 text-right">
                <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>المنتجات الأكثر مبيعاً</h3>
                <p className="text-sm mt-0.5" style={{ color: '#9A978F' }}>الأكثر طلباً منذ البداية</p>
            </div>

            {topProducts.length === 0 ? (
                <div className="py-8 text-center text-sm font-semibold" style={{ color: '#B8B5AE' }}>
                    لا توجد بيانات مبيعات بعد
                </div>
            ) : (
                <div className="space-y-4">
                    {topProducts.map((product, i) => (
                        <div key={product.id} className="group animate-fade-in text-right" style={{ animationDelay: `${i * 60}ms` }}>
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold w-5" style={{ color: '#B8B5AE' }}>#{i + 1}</span>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: '#1A2D23' }}>{product.name}</p>
                                        <p className="text-xs" style={{ color: '#B8B5AE' }}>{product.category}</p>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold" style={{ color: '#1A2D23' }}>{product.revenue}</p>
                                    <p className="text-xs" style={{ color: '#B8B5AE' }}>تم بيع {product.sales}</p>
                                </div>
                            </div>
                            <div className="mr-8 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#EAE8E2' }}>
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${(product.sales / maxSales) * 100}%`,
                                        background: 'linear-gradient(to left, #2E5A44, #7FAF98)',
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
