import { useState } from 'react'

const W = 560
const H = 200
const PAD = { top: 24, right: 16, bottom: 10, left: 12 }
const chartW = W - PAD.left - PAD.right
const chartH = H - PAD.top - PAD.bottom

function smoothPath(pts) {
    if (pts.length < 2) return ''
    return pts.reduce((path, pt, i) => {
        if (i === 0) return `M ${pt.x},${pt.y}`
        const prev = pts[i - 1]
        const cpx = (prev.x + pt.x) / 2
        return `${path} C ${cpx},${prev.y} ${cpx},${pt.y} ${pt.x},${pt.y}`
    }, '')
}

export default function SalesChart({ salesData = [] }) {
    const [hovered, setHovered] = useState(null)

    if (salesData.length === 0) {
        return (
            <div className="rounded-2xl p-6 h-full flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
                <div className="mb-4 text-right">
                    <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>نظرة عامة على المبيعات</h3>
                    <p className="text-sm mt-0.5" style={{ color: '#9A978F' }}>الإيرادات الشهرية · آخر 7 أشهر</p>
                </div>
                <div className="flex-1 flex items-center justify-center text-sm font-semibold" style={{ color: '#B8B5AE' }}>
                    لا توجد بيانات مبيعات بعد
                </div>
            </div>
        )
    }

    const maxVal = Math.max(...salesData.map(d => d.sales), 1)
    const totalRevenue = salesData.reduce((s, d) => s + d.sales, 0)

    const pts = salesData.map((d, i) => ({
        x: PAD.left + (i / (salesData.length - 1)) * chartW,
        y: PAD.top + (1 - d.sales / maxVal) * chartH,
        ...d,
    }))

    const linePath  = smoothPath(pts)
    const areaPath  = pts.length > 1
        ? `${linePath} L ${pts.at(-1).x},${PAD.top + chartH} L ${pts[0].x},${PAD.top + chartH} Z`
        : ''

    // Y-axis grid values
    const gridSteps = [0, 0.33, 0.66, 1]

    const fmt = (v) =>
        v === 0 ? '0' :
        v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}م` :
        v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}ك` :
        v.toFixed(0)

    return (
        <div className="rounded-2xl p-5 sm:p-6 h-full" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EAE8E2' }}>
            {/* Header */}
            <div className="flex items-start justify-between mb-5" dir="rtl">
                <div className="text-right">
                    <h3 className="text-base font-bold" style={{ color: '#1A2D23' }}>نظرة عامة على المبيعات</h3>
                    <p className="text-sm mt-0.5" style={{ color: '#9A978F' }}>الإيرادات الشهرية · آخر 7 أشهر</p>
                </div>
                <div className="text-left">
                    <p className="text-xs font-semibold" style={{ color: '#9A978F' }}>إجمالي الفترة</p>
                    <p className="text-base font-bold" style={{ color: '#2E5A44' }}>{fmt(totalRevenue)} ج.م</p>
                </div>
            </div>

            {/* SVG */}
            <div style={{ direction: 'ltr' }}>
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    className="w-full"
                    style={{ height: '200px', overflow: 'visible' }}
                >
                    <defs>
                        {/* Gradient fill under curve */}
                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#2E5A44" stopOpacity="0.22" />
                            <stop offset="55%"  stopColor="#2E5A44" stopOpacity="0.07" />
                            <stop offset="100%" stopColor="#2E5A44" stopOpacity="0"    />
                        </linearGradient>

                        {/* Glow on the line */}
                        <filter id="lineGlow" x="-10%" y="-50%" width="120%" height="200%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>

                        {/* Dot glow */}
                        <filter id="dotGlow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>

                        {/* Clip chart area */}
                        <clipPath id="chartClip">
                            <rect x={PAD.left} y={PAD.top - 4} width={chartW} height={chartH + 4} />
                        </clipPath>
                    </defs>

                    {/* Horizontal grid lines */}
                    {gridSteps.map((ratio, i) => {
                        const y = PAD.top + (1 - ratio) * chartH
                        const val = maxVal * ratio
                        return (
                            <g key={i}>
                                <line
                                    x1={PAD.left} y1={y}
                                    x2={W - PAD.right} y2={y}
                                    stroke={ratio === 0 ? '#D4D1C9' : '#EAE8E2'}
                                    strokeWidth={ratio === 0 ? 1.5 : 1}
                                    strokeDasharray={ratio === 0 ? '0' : '5 4'}
                                />
                                {ratio > 0 && (
                                    <text x={W - PAD.right + 5} y={y + 4} fontSize="9.5" fill="#B8B5AE" textAnchor="start" fontFamily="Arial">
                                        {fmt(val)}
                                    </text>
                                )}
                            </g>
                        )
                    })}

                    {/* Area under the curve */}
                    <path d={areaPath} fill="url(#salesFill)" clipPath="url(#chartClip)" />

                    {/* Main curve */}
                    <path
                        d={linePath}
                        fill="none"
                        stroke="#2E5A44"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        filter="url(#lineGlow)"
                        clipPath="url(#chartClip)"
                        style={{
                            strokeDasharray: 1600,
                            strokeDashoffset: 1600,
                            animation: 'drawCurve 1.2s cubic-bezier(0.4,0,0.2,1) forwards',
                        }}
                    />

                    {/* Data points + hover regions */}
                    {pts.map((pt, i) => {
                        const isHov = hovered === i
                        return (
                            <g key={i}>
                                {/* Invisible wide hit area */}
                                <rect
                                    x={pt.x - (chartW / salesData.length) / 2}
                                    y={PAD.top}
                                    width={chartW / salesData.length}
                                    height={chartH}
                                    fill="transparent"
                                    style={{ cursor: 'crosshair' }}
                                    onMouseEnter={() => setHovered(i)}
                                    onMouseLeave={() => setHovered(null)}
                                />

                                {/* Vertical drop line on hover */}
                                {isHov && (
                                    <line
                                        x1={pt.x} y1={pt.y}
                                        x2={pt.x} y2={PAD.top + chartH}
                                        stroke="#2E5A44" strokeWidth="1"
                                        strokeDasharray="3 3" opacity="0.4"
                                    />
                                )}

                                {/* Tooltip bubble */}
                                {isHov && (() => {
                                    const bw = 86, bh = 34
                                    const bx = Math.min(Math.max(pt.x - bw / 2, PAD.left), W - PAD.right - bw)
                                    const by = pt.y - bh - 12
                                    return (
                                        <g>
                                            <rect x={bx} y={by} width={bw} height={bh} rx="7" fill="#1A2D23" />
                                            {/* small arrow */}
                                            <polygon
                                                points={`${pt.x - 5},${by + bh} ${pt.x + 5},${by + bh} ${pt.x},${by + bh + 6}`}
                                                fill="#1A2D23"
                                            />
                                            <text x={bx + bw / 2} y={by + 13} textAnchor="middle" fontSize="9.5" fill="#ADCBBB" fontFamily="Arial">
                                                {pt.month}
                                            </text>
                                            <text x={bx + bw / 2} y={by + 26} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold" fontFamily="Arial">
                                                {pt.sales.toFixed(2)} ج.م
                                            </text>
                                        </g>
                                    )
                                })()}

                                {/* Outer glow ring */}
                                <circle
                                    cx={pt.x} cy={pt.y} r={isHov ? 10 : 6}
                                    fill="#2E5A44" opacity={isHov ? 0.18 : 0.1}
                                    style={{ transition: 'r 0.15s, opacity 0.15s' }}
                                    filter={isHov ? "url(#dotGlow)" : undefined}
                                />
                                {/* White inner ring */}
                                <circle cx={pt.x} cy={pt.y} r={isHov ? 6 : 4}
                                    fill="white"
                                    stroke="#2E5A44"
                                    strokeWidth={isHov ? 2.5 : 2}
                                    style={{ transition: 'r 0.15s, stroke-width 0.15s' }}
                                />
                            </g>
                        )
                    })}
                </svg>

                {/* Month labels */}
                <div className="flex justify-between mt-1 px-2" style={{ direction: 'ltr' }}>
                    {salesData.map((d, i) => (
                        <span
                            key={i}
                            className="text-xs flex-1 text-center font-medium"
                            style={{
                                color: hovered === i ? '#2E5A44' : '#B8B5AE',
                                fontWeight: hovered === i ? '700' : '500',
                                transition: 'color 0.15s',
                            }}
                        >
                            {d.month}
                        </span>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes drawCurve {
                    to { stroke-dashoffset: 0; }
                }
            `}</style>
        </div>
    )
}
