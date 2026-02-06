import React, { useEffect, useState } from 'react'
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

  // helper to read JWT from localStorage (common keys)
  const getJwtToken = () => {
    return localStorage.getItem('access') ||
           localStorage.getItem('token') ||
           localStorage.getItem('jwt') ||
           null
  }

  useEffect(() => {
    const fetchIncoming = async () => {
      setLoading(true)
      try {
        const token = getJwtToken()
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
        const resp = await fetch('http://localhost:8000/api/auth/bonafide/incoming/', {
          method: 'GET',
          headers
        })
        if (!resp.ok) {
          const txt = await resp.text()
          throw new Error(txt || 'Failed to fetch')
        }
        const data = await resp.json()
        setRequests(data)
      } catch (err) {
        setError(err.message || 'Failed to load incoming requests')
      } finally {
        setLoading(false)
      }
    }
    fetchIncoming()
  }, [])

  // fetch detail and show modal
  const viewRequest = async (id) => {
    setDetailError(null)
    setDetailLoading(true)
    try {
      const token = getJwtToken()
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const resp = await fetch(`http://localhost:8000/api/auth/bonafide/${id}/`, {
        method: 'GET',
        headers
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || 'Failed to fetch detail')
      }
      const data = await resp.json()
      setSelected(data)
      setModalVisible(true)
    } catch (err) {
      setDetailError(err.message || 'Failed to load request detail')
    } finally {
      setDetailLoading(false)
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

              <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:14}}>
                {selected.permission_file_url && (
                  <a href={selected.permission_file_url} target="_blank" rel="noopener noreferrer">
                    <button className='submit-button' style={{background:'#2b7cff', width:'200px'}}>Open Document</button>
                  </a>
                )}
                <button onClick={() => setModalVisible(false)} className="submit-button">Close</button>
              </div>
              {detailError && <div style={{color:'red', marginTop:8}}>{detailError}</div>}
            </div>
          </div>
        )}

    </div>
  )
}

export default IncomingRequests