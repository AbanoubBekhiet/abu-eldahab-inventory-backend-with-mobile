export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            {Icon && (
                <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-surface-400" />
                </div>
            )}
            <h3 className="text-lg font-semibold text-surface-800">{title}</h3>
            {description && (
                <p className="text-sm text-surface-500 mt-1 max-w-sm">{description}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    )
}
