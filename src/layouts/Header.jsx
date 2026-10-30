import { Bell, Menu } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api'
import { usePolling } from '../hooks/usePolling'
import { formatDateTime } from '../utils/format'

const NOTIFICATION_POLL_MS = 4000

/** Fallback destinations when a notification has no explicit link. */
function fallbackLink(note) {
  if (note.link) return note.link
  const title = (note.title || '').toLowerCase()
  if (title.includes('approval') || title.includes('waiting for approval')) return '/visitor-approvals'
  if (title.includes('approved') || title.includes('rejected') || title.includes('visitor')) return '/current-visitors'
  if (title.includes('hospital visit') || title.includes('screening')) return '/screening'
  if (title.includes('queue') || title.includes('clinic')) return '/clinic-queues'
  if (title.includes('bed') || title.includes('admission')) return '/bed-assignment'
  return '/dashboard'
}

export function Header({ user, onMenu }) {
  const navigate = useNavigate()
  const [openNotes, setOpenNotes] = useState(false)
  const [notes, setNotes] = useState([])

  const loadNotes = useCallback(async () => {
    try {
      const items = await notificationsApi.list()
      setNotes(items || [])
    } catch {
      /* keep last known list */
    }
  }, [])

  usePolling(loadNotes, NOTIFICATION_POLL_MS)

  const unread = notes.filter((item) => !item.read).length

  async function markAllRead() {
    try {
      const updated = await notificationsApi.markRead()
      setNotes(updated || [])
    } catch {
      /* ignore */
    }
  }

  async function openNotification(note) {
    setOpenNotes(false)
    if (!note.read) {
      try {
        await notificationsApi.markOneRead(note.id)
        setNotes((current) => (current || []).map((item) => (
          item.id === note.id ? { ...item, read: true, read_at: new Date().toISOString() } : item
        )))
      } catch {
        /* still navigate */
      }
    }
    navigate(fallbackLink(note))
  }

  async function toggleNotes() {
    const next = !openNotes
    setOpenNotes(next)
    if (next) await loadNotes()
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button type="button" className="lg:hidden text-slate-600" onClick={onMenu} aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <p className="text-sm text-slate-500">Welcome back,</p>
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
        </div>
      </div>
      <div className="relative">
        <button type="button" className="relative p-2 rounded-lg hover:bg-slate-100" aria-label="Notifications" onClick={toggleNotes}>
          <Bell className="w-5 h-5 text-slate-600" />
          {unread ? (
            <span className="absolute top-1 right-1 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </button>
        {openNotes ? (
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-30">
            <div className="flex items-center justify-between mb-2 sticky top-0 bg-white pb-1">
              <p className="text-sm font-semibold">Notifications</p>
              <button type="button" className="text-xs text-blue-600" onClick={markAllRead}>Mark all read</button>
            </div>
            {notes.length ? null : <p className="text-xs text-slate-400 py-2">No notifications yet</p>}
            {notes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => openNotification(note)}
                className={`w-full text-left py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 rounded px-1 ${note.read ? '' : 'bg-blue-50/60'}`}
              >
                <p className="text-sm font-medium text-slate-800">{note.title}</p>
                <p className="text-xs text-slate-500">{note.body}</p>
                {note.created_at ? <p className="text-[10px] text-slate-400 mt-0.5">{formatDateTime(note.created_at)}</p> : null}
                <p className="text-[10px] text-blue-600 mt-0.5">Open related page →</p>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  )
}
