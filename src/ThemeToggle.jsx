import { Moon, Sun } from 'lucide-react'

export default function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
      aria-pressed={theme === 'light'}
      className="theme-toggle inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-[#120B1B] px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.16em] text-white transition hover:border-violet-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400"
      onClick={onToggle}
    >
      {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
      {theme === 'dark' ? 'Light theme' : 'Dark theme'}
    </button>
  )
}
