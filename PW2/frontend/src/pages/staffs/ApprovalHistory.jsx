import React, { useEffect, useState } from 'react'
import '../students/PendingRequests.css'

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

const ApprovalHistory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // modal / detail state
  const [modalVisible, setModalVisible] = useState(false)
  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState(null)

  const getJwtToken = () => {
    const ls = localStorage
    return ls.getItem("access") || ls.getItem("token") || null
  }

  const parseJsonOrThrow = async (res) => {
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      const txt = await res.text()
      throw new Error(txt || `Expected JSON but got ${contentType}`)
    }
    return res.json()
  }

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getJwtToken()
        const res = await fetch(`${API_BASE}/api/auth/bonafide/history/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) {
          const txt = await res.text()
          throw new Error(txt || `Failed to load history (${res.status})`)
        }
        const data = await parseJsonOrThrow(res)
        setItems(data)
      } catch (err) {
        console.error("fetchHistory error:", err)
        setError(err.message || "Error")
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  const renderStatusBadge = (status) => {
    if (!status) return <span style={{padding:'4px 8px', borderRadius:12, background:'#ddd'}}>Unknown</span>
    const s = String(status).toLowerCase()
    let bg = '#ddd', color = '#111', label = status.replace(/_/g,' ')
    if (s === 'approved') { bg = '#e6ffea'; color = '#0a7a3a'; label = 'Approved' }
    else if (s === 'rejected') { bg = '#ffe6e6'; color = '#b30f0f'; label = 'Rejected' }
    else if (s === 'pc_pending' || s === 'hod_pending' || s === 'pending') { bg = '#fff7d6'; color = '#8a6d00'; label = 'Pending' }
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: 12,
        background: bg,
        color,
        fontWeight: 600,
        fontSize: '0.9rem',
        display: 'inline-block',
        minWidth: 76,
        textAlign: 'center'
      }}>
        {label}
      </span>
    )
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

  const viewHistoryItem = async (id) => {
    setDetailLoading(true)
    setDetailError(null)
    try {
      const token = getJwtToken()
      const res = await fetch(`${API_BASE}/api/auth/bonafide/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Failed to fetch detail')
      }
      const data = await parseJsonOrThrow(res)
      setSelected(data)
      setModalVisible(true)
    } catch (e) {
      setDetailError(e.message || 'Error')
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <div className='dashboard-container'>
      <br />
      <br />
      <div className='logo-container'><img src="/logo.png" alt="logo" /></div>
      <div className='user-container'>Staff</div>
      <center><h2 className='titles'>Approval History</h2></center>

      <div className='log-table'>
        <div className='table-card header'>
          <div>Type</div>
          <div>Date</div>
          <div>Student</div>
          <div>Action</div>
          <div>Comments</div>
        </div>

        {loading && <div style={{padding:16}}>Loading...</div>}
        {error && <div style={{color:'red', padding:12}}>{error}</div>}
        {!loading && !items.length && <div style={{padding:16}}>No history available.</div>}

        {items.map((r) => (
          <div className='table-card' key={r.id}>
            <div>{r.request_type || 'Bonafide'}</div>
            <div>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</div>
            <div>{r.student_name || r.student_username}</div>
            <div>{renderStatusBadge(r.status)}</div>
            <div>
              <button className='view-btn' onClick={() => viewHistoryItem(r.id)}>View</button>
            </div>
          </div>
        ))}
      </div>

      {/* Read-only modal for history detail */}
      {modalVisible && selected && (
        <div className="modal">
          <div className="modal-content">
            <h3>Request from {selected.student_name || selected.student_username}</h3>
            {detailLoading && <div>Loading...</div>}
            {detailError && <div style={{color:'red'}}>{detailError}</div>}

            <div style={{marginTop:8}}>
              <div style={{marginBottom:8}}>{renderStatusBadge(selected.status)}</div>

              <h4 style={{marginBottom:6}}>Extracted Fields</h4>
              {renderExtractedTable(selected.extracted || {})}

              <h4 style={{marginTop:12, marginBottom:6}}>Checklist</h4>
              {renderChecklistTable(selected.checklist || {})}

              {/* Comments: show all available in read-only fashion */}
              {(selected.tutor_comment || (selected.extracted && selected.extracted._tutor_comment)) && (
                <div style={{marginTop:12, padding:12, background:'#fafafa', border:'1px solid #eee', borderRadius:6}}>
                  <div style={{fontWeight:700, marginBottom:6}}>Comment from Tutor</div>
                  <div style={{whiteSpace:'pre-wrap'}}>{selected.tutor_comment || selected.extracted._tutor_comment}</div>
                </div>
              )}

              {(selected.pc_comment || (selected.extracted && selected.extracted._pc_comment)) && (
                <div style={{marginTop:12, padding:12, background:'#fff8e6', border:'1px solid #f0e6c8', borderRadius:6}}>
                  <div style={{fontWeight:700, marginBottom:6}}>Comment from Program Coordinator</div>
                  <div style={{whiteSpace:'pre-wrap'}}>{selected.pc_comment || selected.extracted._pc_comment}</div>
                </div>
              )}

              {(selected.hod_comment || (selected.extracted && selected.extracted._hod_comment)) && (
                <div style={{marginTop:12, padding:12, background:'#e9f7ff', border:'1px solid #d7eefb', borderRadius:6}}>
                  <div style={{fontWeight:700, marginBottom:6}}>Comment from HoD</div>
                  <div style={{whiteSpace:'pre-wrap'}}>{selected.hod_comment || selected.extracted._hod_comment}</div>
                </div>
              )}
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', marginTop:12}}>
              <button className="view-btn" onClick={() => { setModalVisible(false); setSelected(null) }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ApprovalHistory