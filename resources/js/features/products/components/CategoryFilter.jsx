import { useRef, useState } from 'react'

export default function CategoryFilter({ categories, selected, onChange }) {
    const scrollRef = useRef(null)
    const isMouseDown = useRef(false)
    const isDragging = useRef(false)
    const startX = useRef(0)
    const scrollLeft = useRef(0)
    const [isGrabbed, setIsGrabbed] = useState(false)

    const handleMouseDown = (e) => {
        isMouseDown.current = true
        isDragging.current = false
        startX.current = e.pageX - scrollRef.current.offsetLeft
        scrollLeft.current = scrollRef.current.scrollLeft
        setIsGrabbed(true)
    }

    const handleMouseMove = (e) => {
        if (!isMouseDown.current) return
        const x = e.pageX - scrollRef.current.offsetLeft
        const walk = x - startX.current
        if (Math.abs(walk) > 5) {
            isDragging.current = true
        }
        if (isDragging.current) {
            e.preventDefault()
            scrollRef.current.scrollLeft = scrollLeft.current - walk
        }
    }

    const handleMouseUpOrLeave = () => {
        isMouseDown.current = false
        setIsGrabbed(false)
        setTimeout(() => {
            isDragging.current = false
        }, 50)
    }

    const handleCategoryClick = (id) => {
        if (isDragging.current) return
        onChange(id)
    }

    return (
        <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none ${
                isGrabbed ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            dir="rtl"
        >
            <button
                type="button"
                onClick={() => handleCategoryClick('all')}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={selected === 'all'
                    ? { backgroundColor: '#2E5A44', color: '#fff', boxShadow: '0 2px 8px rgba(46,90,68,0.25)' }
                    : { backgroundColor: '#FFFFFF', color: '#5C5950', border: '1px solid #D6D4CE' }
                }
                onMouseEnter={e => { if (selected !== 'all') e.currentTarget.style.borderColor = '#7FAF98' }}
                onMouseLeave={e => { if (selected !== 'all') e.currentTarget.style.borderColor = '#D6D4CE' }}
            >
                الكل
            </button>
            {categories.map((cat) => {
                const active = String(selected) === String(cat.id)
                return (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={active
                            ? { backgroundColor: '#2E5A44', color: '#fff', boxShadow: '0 2px 8px rgba(46,90,68,0.25)' }
                            : { backgroundColor: '#FFFFFF', color: '#5C5950', border: '1px solid #D6D4CE' }
                        }
                        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#7FAF98' }}
                        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#D6D4CE' }}
                    >
                        {cat.name}
                    </button>
                )
            })}
        </div>
    )
}
