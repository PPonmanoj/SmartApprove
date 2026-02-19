import React, { useEffect, useState } from "react"
import '../students/PendingRequests.css'

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

const IncomingRequests = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // modal state
  const [modalVisible, setModalVisible] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  // comment + action state (generic for tutor/pc/hod)
  const [staffComment, setStaffComment] = useState("")
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState(null)

  const getJwtToken = () => {
    const ls = localStorage
    return ls.getItem("access") || ls.getItem("token") || null
  }

  // parse JSON or surface text
  const parseJsonOrThrow = async (res) => {
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const txt = await res.text()
      throw new Error(txt || `Expected JSON but got ${contentType}`)
    }
    return res.json()
  }

  // read current user designation from localStorage profile
  const getCurrentDesignation = () => {
    try {
      const raw = localStorage.getItem("user") || localStorage.getItem("profile")
      if (!raw) return null
      const u = JSON.parse(raw)
      const staff = u.staff_profile || u.staff || null
      if (staff && staff.designation) return String(staff.designation).toUpperCase()
      if (u.designation) return String(u.designation).toUpperCase()
      return null
    } catch (e) {
      return null
    }
  }

  const currentDesignation = getCurrentDesignation()

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

  const viewRequest = async (id) => {
    setDetailLoading(true)
    setDetailError(null)
    setStaffComment("")
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
      console.error("refreshList error:", e)
    } finally {
      setLoading(false)
    }
  }

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
        body: JSON.stringify({ action, comment: staffComment })
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || "Action failed")
      }
      setModalVisible(false)
      setSelected(null)
      setStaffComment("")
      await refreshList()
    } catch (err) {
      setActionError(err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  const canAct = (designation, status) => {
    if (!designation || !status) return false
    const d = designation.toUpperCase()
    const s = (status || "").toLowerCase()
    if (d === 'TUTOR') return !['pc_pending','hod_pending','approved','rejected'].includes(s)
    if (['PROGRAM_COORDINATOR','PC','COORDINATOR'].includes(d)) return s === 'pc_pending'
    if (['HOD','HEAD','HEAD_OF_DEPARTMENT'].includes(d)) return s === 'hod_pending'
    return false
  }

  const renderExtractedTable = (extracted = {}) => {
    if (!extracted || Object.keys(extracted).length === 0) {
      return <div style={{color:'#666'}}>No extracted fields.</div>
    }
    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:8}}>
        <tbody>
          {Object.entries(extracted).map(([k, v]) => (
            <tr key={k} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:'6px 8px', fontWeight:600, width:'30%', verticalAlign:'top'}}>{k}</td>
              <td style={{padding:'6px 8px', whiteSpace:'pre-wrap'}}>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  const renderChecklistTable = (checklist = {}) => {
    if (!checklist || Object.keys(checklist).length === 0) {
      return <div style={{color:'#666'}}>No checklist available.</div>
    }
    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:8}}>
        <tbody>
          {Object.entries(checklist).map(([k, v]) => (
            <tr key={k} style={{borderBottom:'1px solid #eee'}}>
              <td style={{padding:'6px 8px', fontWeight:600, width:'30%'}}>{k}</td>
              <td style={{padding:'6px 8px', whiteSpace:'pre-wrap'}}>{typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  // open file via server-generated short-lived URL
  const openFile = async (item) => {
    if (!item || !item.id) return
    const token = localStorage.getItem("access") || localStorage.getItem("token") || null
    try {
      const res = await fetch(`${API_BASE}/api/auth/bonafide/${item.id}/file-token/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Failed to get file token (${res.status})`)
      }
      const data = await res.json()
      if (data.url) {
        window.open(data.url, "_blank")
      } else {
        throw new Error("No URL returned")
      }
    } catch (err) {
      console.error("openFile error:", err)
      alert("Unable to open file: " + (err.message || "Error"))
    }
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

        {/* Modal */}
        {modalVisible && selected && (
          <div className="modal">
            <div className="modal-content">
              <h3>Request from {selected.student_name}</h3>
              {detailLoading && <div>Loading details...</div>}
              {detailError && <div className="error">{detailError}</div>}
              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:8}}>
                 <button className="view-btn" onClick={() => openFile(selected)}>View File</button>
                 <button onClick={() => { setModalVisible(false); setSelected(null) }}>Close</button>
              </div>

              <div style={{textAlign:'left', marginTop:6}}>
                <h4 style={{marginBottom:6}}>Extracted Fields</h4>
                {renderExtractedTable(selected.extracted || {})}
                <h4 style={{marginTop:12, marginBottom:6}}>Checklist</h4>
                {renderChecklistTable(selected.checklist || {})}
              </div>

              {/* Tutor comment (read-only) */}
              {(selected.tutor_comment || (selected.extracted && selected.extracted._tutor_comment)) && (
                <div style={{marginTop:12, padding:12, background:'#fafafa', border:'1px solid #eee', borderRadius:6}}>
                  <div style={{fontWeight:700, marginBottom:6}}>Comment from Tutor</div>
                  <div style={{whiteSpace:'pre-wrap', color:'#333'}}>
                    {selected.tutor_comment || selected.extracted._tutor_comment}
                  </div>
                </div>
              )}

              {/* PC comment visible to HoD */}
              {(currentDesignation && ['HOD','HEAD','HEAD_OF_DEPARTMENT'].includes(currentDesignation)) &&
               (selected.pc_comment || (selected.extracted && selected.extracted._pc_comment)) && (
                <div style={{marginTop:12, padding:12, background:'#fff8e6', border:'1px solid #f0e6c8', borderRadius:6}}>
                  <div style={{fontWeight:700, marginBottom:6}}>Comment from Program Coordinator</div>
                  <div style={{whiteSpace:'pre-wrap', color:'#333'}}>
                    {selected.pc_comment || selected.extracted._pc_comment}
                  </div>
                </div>
              )}

              {/* action input (for current staff who will act) */}
              {canAct(currentDesignation, selected.status) && (
                <div className="comment-box" style={{marginTop: 12}}>
                  <label style={{fontWeight: 600}}>Your Comment (optional):</label>
                  <textarea
                    value={staffComment}
                    onChange={(e) => setStaffComment(e.target.value)}
                    placeholder="Add a short comment (optional)"
                    rows={3}
                    style={{ width: "100%", padding: 8, borderRadius: 4, border: '1px solid #ccc', marginTop: 4 }}
                  />
                </div>
              )}

              {actionError && <div className="error">{actionError}</div>}

              <div className="modal-actions">
                {canAct(currentDesignation, selected.status) && (
                  <>
                    <button onClick={() => handleAction("reject")} disabled={actionLoading}>
                      {actionLoading ? "Processing..." : "Reject"}
                    </button>
                    <button onClick={() => handleAction("approve")} disabled={actionLoading}>
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                  </>
                )}
                <button onClick={() => { setModalVisible(false); setSelected(null) }}>Close</button>
              </div>
            </div>
          </div>
        )}

    </div>
  )
}

export default IncomingRequests