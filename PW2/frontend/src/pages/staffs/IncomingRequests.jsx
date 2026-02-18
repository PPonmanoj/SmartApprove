import React, { useEffect, useState } from "react"
import '../students/PendingRequests.css'

const IncomingRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  // new: tutor comment state
  const [tutorComment, setTutorComment] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  // helper to read JWT from localStorage (common keys)
  const getJwtToken = () => {
    const ls = localStorage
    return ls.getItem("access") || ls.getItem("token") || null
  }

  // helper to ensure response is JSON or throw readable text
  const parseJsonOrThrow = async (res) => {
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const txt = await res.text()
      throw new Error(txt || `Expected JSON but got ${contentType}`)
    }
    return res.json()
  }

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

  useEffect(() => {
    const fetchIncoming = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getJwtToken()
        const res = await fetch(`${API_BASE}/api/auth/bonafide/incoming/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || `Failed to load incoming requests (${res.status})`)
        }
        const data = await parseJsonOrThrow(res)
        setRequests(data)
      } catch (err) {
        console.error("fetchIncoming error:", err)
        setError(err.message || "Error")
      } finally {
        setLoading(false)
      }
    }
    fetchIncoming()
  }, [])

  // fetch detail and show modal
  const viewRequest = async (id) => {
    setDetailLoading(true)
    setDetailError(null)
    setTutorComment("")
    try {
      const token = getJwtToken()
      const res = await fetch(`${API_BASE}/api/auth/bonafide/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Failed to fetch details")
      }
      const data = await parseJsonOrThrow(res)
      setSelected(data)
      setModalVisible(true)
    } catch (err) {
      setDetailError(err.message || "Error")
    } finally {
      setDetailLoading(false)
    }
  }

  const refreshList = async () => {
    setLoading(true)
    try {
      const token = getJwtToken()
      const res = await fetch(`${API_BASE}/api/auth/bonafide/incoming/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const d = await parseJsonOrThrow(res)
        setRequests(d)
      } else {
        const txt = await res.text()
        throw new Error(txt || "Failed to refresh list")
      }
    } catch (e) {
      // ignore refresh errors but log to console for debug
      console.error("refreshList error:", e)
    } finally {
      setLoading(false)
    }
  }

  // handle tutor approve/reject
  const handleAction = async (action) => {
    if (!selected || !selected.id) return
    setActionLoading(true)
    setActionError(null)
    try {
      const token = getJwtToken()
      const res = await fetch(`${API_BASE}/api/auth/bonafide/${selected.id}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, comment: tutorComment })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Action failed")
      }
      // close modal and refresh incoming list (tutor should no longer see approved -> PC will)
      setModalVisible(false)
      setSelected(null)
      setTutorComment("")
      await refreshList()
    } catch (err) {
      setActionError(err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const renderExtractedTable = (extracted = {}) => {
    const rows = [
      { key: 'name', label: 'Name' },
      { key: 'roll_number', label: 'Roll Number' },
      { key: 'department', label: 'Department / Class' },
      { key: 'reason', label: 'Reason / Purpose' },
      { key: 'has_signature', label: 'Signature Present' }
    ]

    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:8}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'8px 6px'}}>Field</th>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'8px 6px'}}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            let value = extracted[r.key]
            if (r.key === 'has_signature') value = value ? 'Yes' : 'No'
            if (value === undefined || value === null || value === '') value = '—'
            return (
              <tr key={r.key}>
                <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', width:'35%', color:'#333', fontWeight:600}}>{r.label}</td>
                <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', color:'#222'}}>{value}</td>
              </tr>
            )
          })}
          {/* AI explanation row */}
          <tr>
            <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', width:'35%', color:'#333', fontWeight:600}}>AI Explanation</td>
            <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', color:'#222'}}>{extracted.explanation || '—'}</td>
          </tr>
        </tbody>
      </table>
    )
  }

  const renderChecklistTable = (checklist = {}) => {
    const entries = Object.entries(checklist || {})
    if (!entries.length) return null
    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:10}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'6px'}}>Requirement</th>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'6px'}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k,v]) => (
            <tr key={k}>
              <td style={{padding:'6px', borderBottom:'1px solid #f3f3f3', color:'#333'}}>{k}</td>
              <td style={{padding:'6px', borderBottom:'1px solid #f3f3f3'}}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className='dashboard-container'>
        <br />
        <br />
        <div className='logo-container' onClick={()=>{ /* navigate if needed */ }}><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Staff</div>
        <center><h2 className='titles'>Pending Requests</h2></center>

        <div className='log-table'>
          <div className='table-card header'>
            <div>Type</div>
            <div>Date</div>
            <div>Student</div>
            <div>Action</div>
          </div>

          {loading && <div style={{padding:16}}>Loading...</div>}
          {error && <div style={{color:'red', padding:12}}>{error}</div>}

          {!loading && !requests.length && <div style={{padding:16}}>No incoming requests.</div>}

          {requests.map((r) => (
            <div className='table-card' key={r.id}>
              <div>Bonafide</div>
              <div>{new Date(r.created_at).toLocaleDateString()}</div>
              <div>{r.student_name || r.student_username}</div>
              <div>
                <button className='view-btn' onClick={() => viewRequest(r.id)} disabled={detailLoading}>
                  {detailLoading ? 'Loading…' : 'View'}
                </button>
              </div>
            </div>
          ))}

        </div>

        {modalVisible && selected && (
          <div className="bx-modal-overlay" onClick={() => setModalVisible(false)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
          }}>
            <div className="bx-modal" onClick={(e)=>e.stopPropagation()} style={{
              background:'#fff',
              padding:24,
              width:'90%',
              maxWidth:720,
              borderRadius:8,
              boxShadow:'0 6px 30px rgba(0,0,0,0.18)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxSizing: 'border-box'
            }}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
                <h3 style={{margin:0}}>Bonafide Request</h3>
                <div style={{fontWeight:700, color: selected.is_valid ? '#1a7f37' : '#c23d3d'}}>
                  {selected.is_valid ? 'APPROVED ✅' : 'PENDING / REJECTED ❌'}
                </div>
              </div>

              <div style={{textAlign:'left', marginTop:6}}>
                <h4 style={{marginBottom:6}}>Extracted Fields</h4>
                {renderExtractedTable(selected.extracted || {})}
                <h4 style={{marginTop:12, marginBottom:6}}>Checklist</h4>
                {renderChecklistTable(selected.checklist || {})}
              </div>

              <div className="comment-box" style={{marginTop: 12}}>
                <label style={{fontWeight: 600}}>Comment (optional):</label>
                <textarea
                  value={tutorComment}
                  onChange={(e) => setTutorComment(e.target.value)}
                  placeholder="Add a short comment for the Program Coordinator"
                  rows={3}
                  style={{ width: "100%", padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
                />
              </div>

              {actionError && <div className="error" style={{marginTop:8}}>{actionError}</div>}

              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:14}}>
                <button onClick={() => handleAction("reject")} className='submit-button' disabled={actionLoading} style={{background:'#c23d3d', width:'120px'}}>
                  {actionLoading ? "Processing..." : "Reject"}
                </button>
                <button onClick={() => handleAction("approve")} className='submit-button' disabled={actionLoading} style={{background:'#1a7f37', width:'120px'}}>
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
                <button onClick={() => setModalVisible(false)} className="submit-button" style={{width:'120px'}}>Close</button>
              </div>
              {detailError && <div style={{color:'red', marginTop:8}}>{detailError}</div>}
            </div>
          </div>
        )}

    </div>
  )
}

export default IncomingRequests