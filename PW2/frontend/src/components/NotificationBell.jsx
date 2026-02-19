import React, { useEffect, useState } from "react"
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const token = (localStorage.getItem("access") || localStorage.getItem("token") || null)

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/auth/notifications/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setItems(data)
      }
    } catch (e) {
      console.error("fetch notifications", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotes()
    // poll every 30s (optional)
    const id = setInterval(fetchNotes, 30000)
    return () => clearInterval(id)
  }, [])

  const unreadCount = items.filter(i => i.unread).length

  const markRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/auth/notifications/${id}/mark-read/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      // optimistic update
      setItems(items.map(it => it.id === id ? { ...it, unread: false } : it))
    } catch (e) {
      console.error("mark read", e)
    }
  }

  return (
    <div style={{position:'relative', display:'inline-block'}}>
      <button aria-label="Notifications" onClick={() => { setOpen(!open); if(!open) fetchNotes() }} style={{position:'relative'}}>
        🔔
        {unreadCount > 0 && <span style={{
          position:'absolute', top:-6, right:-6, background:'#d32f2f', color:'#fff', borderRadius:12, padding:'2px 6px', fontSize:12
        }}>{unreadCount}</span>}
      </button>

      {open && (
        <div style={{
          position:'absolute', right:0, top:'calc(100% + 8px)', width:360, maxHeight:420, overflow:'auto',
          boxShadow:'0 6px 18px rgba(0,0,0,0.12)', background:'#fff', borderRadius:8, zIndex:2000, padding:12
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
            <strong>Notifications</strong>
            <button onClick={() => { setOpen(false) }}>Close</button>
          </div>
          {loading && <div>Loading...</div>}
          {!loading && !items.length && <div style={{color:'#666'}}>No notifications</div>}
          {items.map(i => (
            <div key={i.id} style={{
              padding:8,
              borderRadius:6,
              background: i.unread ? '#f4f8ff' : '#fff',
              marginBottom:8,
              border: '1px solid #eee'
            }}>
              <div style={{fontSize:13, color:'#222', fontWeight:600}}>{i.verb.replace(/_/g,' ')}</div>
              <div style={{fontSize:13, color:'#444', whiteSpace:'pre-wrap', marginTop:6}}>{i.message}</div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:8}}>
                <small style={{color:'#888'}}>{new Date(i.created_at).toLocaleString()}</small>
                {i.unread ? <button onClick={() => markRead(i.id)} style={{color:'#007bff'}}>Mark read</button> : <span style={{color:'#888'}}>Read</span>}
              </div>
            </div>
          ))}
          <div style={{textAlign:'center', marginTop:8}}>
            <button onClick={() => fetchNotes()}>Refresh</button>
          </div>
        </div>
      )}
    </div>
  )
}