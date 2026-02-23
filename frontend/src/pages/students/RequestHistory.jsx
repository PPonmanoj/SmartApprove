import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../../api'
import AppShell from '../../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',   path:'/student/dashboard' },
  { icon:'📋', label:'New Request', path:'/newRequest' },
  { icon:'⏳', label:'My Requests', path:'/pendingRequests' },
  { icon:'📜', label:'History',     path:'/requestHistory' },
  { icon:'👤', label:'Profile',     path:'/student/profile' },
]

export default function RequestHistory() {
  const navigate = useNavigate()
  const [reqs, setReqs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      authFetch('/api/auth/bonafide/my/?status=approved'),
      authFetch('/api/auth/bonafide/my/?status=rejected'),
    ]).then(([a,r])=>{
      const all=[...(a||[]),...(r||[])].sort((x,y)=>new Date(y.created_at)-new Date(x.created_at))
      setReqs(all)
    }).finally(()=>setLoading(false))
  }, [])

  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:780 }}>
        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Request History</h1>
          <p style={{ color:'#64748b',fontSize:14 }}>Completed and rejected requests</p>
        </div>
        <div style={{ background:'#fff',borderRadius:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',padding:'12px 20px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9' }}>
            {['Type','Date','Outcome',''].map(h=><div key={h} style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5 }}>{h}</div>)}
          </div>
          {loading && <div style={{ padding:'40px',textAlign:'center',color:'#94a3b8' }}>Loading…</div>}
          {!loading&&reqs.length===0&&<div style={{ padding:'48px',textAlign:'center',color:'#94a3b8',fontSize:14 }}>No completed requests yet.</div>}
          {reqs.map(r=>(
            <div key={r.id} style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #f8fafc' }}
              onMouseEnter={e=>e.currentTarget.style.background='#fafafa'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{ fontWeight:600,fontSize:13,color:'#0f172a',textTransform:'capitalize' }}>{r.purpose||'Bonafide'}</div>
              <div style={{ fontSize:12,color:'#64748b' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
              <div><span style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,
                background:r.status==='approved'?'#f0fdf4':'#fef2f2',
                color:r.status==='approved'?'#15803d':'#b91c1c',
                border:`1px solid ${r.status==='approved'?'#bbf7d0':'#fecaca'}`
              }}>{r.status==='approved'?'✓ Approved':'✕ Rejected'}</span></div>
              <button onClick={()=>navigate(`/requestStatus/${r.id}`)} style={{ padding:'7px 14px',background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:7,color:'#475569',fontSize:12,fontWeight:600,cursor:'pointer' }}>View →</button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
