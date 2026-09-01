import { TrendingUp, TrendingDown } from 'lucide-react'

const colorMap = {
    green:  { iconBg: '#EEF4F1', iconColor: '#2E5A44', ring: '#ADCBBB' },
    teal:   { iconBg: '#E6F4F1', iconColor: '#1A7A6A', ring: '#8ECDC4' },
    amber:  { iconBg: '#FEF9EC', iconColor: '#92610E', ring: '#F0D080' },
    rose:   { iconBg: '#FDEEEC', iconColor: '#922B21', ring: '#E8A09A' },
}

export default function StatCard({ title, value, change, changeLabel, icon: Icon, color = 'green' }) {
    const isPositive = change >= 0
    const c = colorMap[color] || colorMap.green

    return (
        <div
            className="rounded-2xl p-5 sm:p-6 transition-all duration-300 group hover:shadow-md"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#D6D4CE'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#EAE8E2'}
        >
            <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                    <p className="text-sm font-medium" style={{ color: '#9A978F' }}>{title}</p>
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: '#1A2D23' }}>{value}</p>
                    {change !== undefined && (
                        <div className="flex items-center gap-1.5">
                            {isPositive
                                ? <TrendingUp className="w-3.5 h-3.5" style={{ color: '#3A7259' }} />
                                : <TrendingDown className="w-3.5 h-3.5" style={{ color: '#C0392B' }} />
                            }
                            <span className="text-xs font-semibold" style={{ color: isPositive ? '#2E5A44' : '#922B21' }}>
                                {isPositive ? '+' : ''}{change}%
                            </span>
                            {changeLabel && (
                                <span className="text-xs" style={{ color: '#B8B5AE' }}>{changeLabel}</span>
                            )}
                        </div>
                    )}
                </div>
                {Icon && (
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                        style={{ backgroundColor: c.iconBg, boxShadow: `0 0 0 1px ${c.ring}` }}
                    >
                        <Icon className="w-6 h-6" style={{ color: c.iconColor }} />
                    </div>
                )}
            </div>
        </div>
    )
}
