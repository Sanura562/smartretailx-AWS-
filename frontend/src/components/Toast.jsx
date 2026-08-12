import { useEffect } from 'react'

const TYPE_STYLES = {
  success: 'bg-[#1D7A1D] text-white',
  error: 'bg-[#FF3B30] text-white',
}

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-[fadeIn_0.2s_ease]">
      <div
        className={`flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium shadow-[0_8px_24px_rgba(0,0,0,0.2)] ${TYPE_STYLES[type] ?? TYPE_STYLES.success}`}
      >
        {message}
        <button onClick={onClose} className="text-white/80 hover:text-white" aria-label="Dismiss">
          &times;
        </button>
      </div>
    </div>
  )
}
