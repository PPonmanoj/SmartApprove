import React, { useEffect, useState } from 'react'
import './PendingRequests.css'

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"
const PAGE_SIZE = 5

const RequestHistory = () => {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const getJwtToken = () => localStorage.getItem("access") || localStorage.getItem("token") || null

  useEffect(() => {
    const fetchMine = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = getJwtToken()
        const res = await fetch(`${API_BASE}/api/auth/bonafide/mine/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (!res.ok) throw new Error(await res.text() || `Failed (${res.status})`)
        const data = await res.json()
        // keep only approved/rejected
        const filtered = (data || []).filter(d => {
          const s = (d.status || "").toLowerCase()
          return s === 'approved' || s === 'rejected'
        })
        setItems(filtered)
        setCurrentPage(1)
      } catch (e) {
        setError(e.message || 'Error')
      } finally {
        setLoading(false)
      }
    }
    fetchMine()
  }, [])

  const totalPages = Math.max(1, Math.ceil((items || []).length / PAGE_SIZE))
  const visibleItems = items.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE)

  return (
    <div className='dashboard-container'>
        <br />
        <br />
        <div className='logo-container'><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Student</div>
        <center><h2 className='titles'>Request History</h2></center>

        <div style={{display:'flex', justifyContent:'flex-end', width:'80%', margin:'0 auto 8px'}}>
          <div style={{alignSelf:'center'}}>Page {currentPage} / {totalPages}</div>
          <div style={{marginLeft:8}}>
            <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage<=1}>Prev</button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage>=totalPages} style={{marginLeft:6}}>Next</button>
          </div>
        </div>

        <div className='log-table'>
          <div className='table-card header'>
            <div>Type</div>
            <div>Date</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          {loading && <div style={{padding:16}}>Loading...</div>}
          {error && <div style={{color:'red', padding:12}}>{error}</div>}
          {!loading && !items.length && <div style={{padding:16}}>No history available.</div>}

          {visibleItems.map(item => (
            <div className='table-card' key={item.id}>
              <div>{item.request_type || 'Bonafide'}</div>
              <div>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</div>
              <div style={{textTransform:'capitalize'}}>{(item.status || 'unknown').replace(/_/g,' ')}</div>
              <div><button className='view-btn' onClick={() => window.open(`${API_BASE}/api/auth/bonafide/${item.id}/`, '_blank')}>View</button></div>
            </div>
          ))}
        </div>
    </div>
  )
}

export default RequestHistory