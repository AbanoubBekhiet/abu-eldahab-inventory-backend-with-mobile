import { useQuery } from '@tanstack/react-query'
import AppLayout from '../../shared/layouts/AppLayout'
import RecentOrders from './components/RecentOrders'
import TopProducts from './components/TopProducts'
import SalesChart from './components/SalesChart'
import api from '../../shared/services/api'

export default function DashboardIndex({
    salesData: initialSalesData,
    topProducts: initialTopProducts,
    recentOrders: initialRecentOrders,
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: async () => {
            const res = await api.get('/dashboard')
            return res.data || {}
        },
        initialData: (initialSalesData && initialSalesData.length) ? {
            salesData: initialSalesData,
            topProducts: initialTopProducts,
            recentOrders: initialRecentOrders,
        } : undefined,
    })

    const salesData = data?.salesData || []
    const topProducts = data?.topProducts || []
    const recentOrders = data?.recentOrders || []

    return (
        <AppLayout title="لوحة التحكم" subtitle="أهلاً بك مجدداً! إليك نظرة سريعة على أداء المتجر.">
            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <p className="text-sm font-semibold text-[#9A978F]">جاري تحميل بيانات لوحة التحكم...</p>
                </div>
            ) : (
                <>
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-5 mb-7">
                        <div className="xl:col-span-2">
                            <SalesChart salesData={salesData} />
                        </div>
                        <TopProducts topProducts={topProducts} />
                    </div>

                    {/* Recent Orders */}
                    <RecentOrders recentOrders={recentOrders} />
                </>
            )}
        </AppLayout>
    )
}
