const variants = {
    primary: {
        style: { backgroundColor: '#2E5A44', color: '#fff', boxShadow: '0 2px 8px rgba(46,90,68,0.25)' },
        hover: '#234535',
    },
    secondary: {
        style: { backgroundColor: '#EAE8E2', color: '#3C3A33', border: '1px solid #D6D4CE' },
        hover: '#D6D4CE',
    },
    danger: {
        style: { backgroundColor: '#C0392B', color: '#fff', boxShadow: '0 2px 8px rgba(192,57,43,0.25)' },
        hover: '#A93226',
    },
    success: {
        style: { backgroundColor: '#3A7259', color: '#fff', boxShadow: '0 2px 8px rgba(58,114,89,0.25)' },
        hover: '#2E5A44',
    },
    ghost: {
        style: { backgroundColor: 'transparent', color: '#5C5950' },
        hover: '#EAE8E2',
    },
}

const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
}

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconRight: IconRight,
    className = '',
    style: extraStyle = {},
    ...props
}) {
    const v = variants[variant] || variants.primary

    return (
        <button
            className={`
                inline-flex items-center justify-center gap-2
                rounded-xl font-semibold
                transition-all duration-200 active:scale-[0.97]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
                ${sizes[size]}
                ${className}
            `}
            style={{ ...v.style, ...extraStyle }}
            onMouseEnter={e => { if (!props.disabled) e.currentTarget.style.backgroundColor = v.hover }}
            onMouseLeave={e => { if (!props.disabled) e.currentTarget.style.backgroundColor = v.style.backgroundColor }}
            {...props}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {children}
            {IconRight && <IconRight className="w-4 h-4" />}
        </button>
    )
}
