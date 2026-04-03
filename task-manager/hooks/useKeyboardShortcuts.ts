import { useEffect } from 'react'

interface UseKeyboardShortcutsOptions {
  onNewTask: () => void
  onFocusSearch: () => void
  onKanban: () => void
  onEscape: () => void
  onToggleCheatSheet: () => void
}

function isInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  )
}

export function useKeyboardShortcuts({
  onNewTask,
  onFocusSearch,
  onKanban,
  onEscape,
  onToggleCheatSheet,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey

      // Cmd+Shift+A — new task (no input guard)
      if (cmd && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        onNewTask()
        return
      }

      // Cmd+Shift+K — go to kanban (no input guard)
      if (cmd && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        onKanban()
        return
      }

      // Cmd+K — focus search (no input guard)
      if (cmd && !e.shiftKey && e.key === 'k') {
        e.preventDefault()
        onFocusSearch()
        return
      }

      // Cmd+/ — toggle cheat sheet (no input guard)
      if (cmd && e.key === '/') {
        e.preventDefault()
        onToggleCheatSheet()
        return
      }

      // Input-guarded shortcuts below
      if (isInInput(e.target)) return

      // / — focus search
      if (!cmd && e.key === '/') {
        e.preventDefault()
        onFocusSearch()
        return
      }

      // Esc — close topmost overlay (no preventDefault: allows browser default Esc behavior to coexist)
      if (e.key === 'Escape') {
        onEscape()
      }
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onNewTask, onFocusSearch, onKanban, onEscape, onToggleCheatSheet])
}
