export default function StatusFilter({ statuses, selected, onChange }) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {statuses.map((s) => {
                const active = selected === s.value
                return (
                    <button
                        key={s.value}
                        onClick={() => onChange(s.value)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={active
                            ? { backgroundColor: '#1A2D23', color: '#fff', boxShadow: '0 2px 8px rgba(26,45,35,0.25)' }
                            : { backgroundColor: '#FFFFFF', color: '#5C5950', border: '1px solid #D6D4CE' }
                        }
                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#7FAF98' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#D6D4CE' }}
                    >
                        {s.label}
                        {s.count !== undefined && (
                            <span
                                className="text-xs px-1.5 py-0.5 rounded-md"
                                style={active
                                    ? { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' }
                                    : { backgroundColor: '#EAE8E2', color: '#7C7870' }
                                }
                            >
                                {s.count}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
