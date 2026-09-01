const styles = {
    success: { bg: '#EBF5EF', text: '#2E5A44', dot: '#3A7259', ring: '#ADCBBB' },
    warning: { bg: '#FEF9EC', text: '#92610E', dot: '#D4A017', ring: '#F0D080' },
    danger:  { bg: '#FDEEEC', text: '#922B21', dot: '#C0392B', ring: '#E8A09A' },
    info:    { bg: '#EDF2FB', text: '#1A4A8A', dot: '#2E6DD4', ring: '#93B4E8' },
    neutral: { bg: '#F4F3EF', text: '#5C5950', dot: '#9A978F', ring: '#D6D4CE' },
    primary: { bg: '#EEF4F1', text: '#2E5A44', dot: '#3A7259', ring: '#ADCBBB' },
}

export default function Badge({ children, variant = 'neutral', dot = false, className = '' }) {
    const s = styles[variant] || styles.neutral
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
            style={{ backgroundColor: s.bg, color: s.text, boxShadow: `0 0 0 1px ${s.ring}` }}
        >
            {dot && (
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
            )}
            {children}
        </span>
    )
}
