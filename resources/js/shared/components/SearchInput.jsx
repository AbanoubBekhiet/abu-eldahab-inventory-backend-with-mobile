import { Search } from 'lucide-react'

export default function SearchInput({ placeholder = 'Search...', value, onChange, className = '' }) {
    return (
        <div className={`relative ${className}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#B8B5AE' }} />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all duration-200 focus:outline-none"
                style={{
                    backgroundColor: '#EAE8E2',
                    border: '1px solid #D6D4CE',
                    color: '#3C3A33',
                }}
                onFocus={e => {
                    e.target.style.borderColor = '#3A7259'
                    e.target.style.boxShadow = '0 0 0 3px rgba(58,114,89,0.12)'
                }}
                onBlur={e => {
                    e.target.style.borderColor = '#D6D4CE'
                    e.target.style.boxShadow = 'none'
                }}
            />
        </div>
    )
}
