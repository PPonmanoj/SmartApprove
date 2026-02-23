import React, { useEffect, useState } from 'react'
import { authFetch } from '../../api'
import AppShell from '../../components/AppShell'
const NAV=[{icon:'🏠',label:'Dashboard',path:'/staff/dashboard'},{icon:'📥',label:'Incoming',path:'/incomingRequests'},{icon:'📜',label:'Approval History',path:'/approvalHistory'},{icon:'⚙️',label:'Requirements',path:'/editRequirements'},{icon:'👤',label:'Profile',path:'/staff/profile'}]
export default function ApprovalHistory() {
  const [reqs,setReqs]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(()=>{ authFetch('/api/auth/bonafide/incoming/').then(d=>setReqs((d||[]).filter(r=>r.status!=='pending'))).finally(()=>setLoading(false)) },[])
  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:780 }}>
        <div style={{ marginBottom:20 }}><h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',fontFamily:'Outfit,sans-serif' }}>Approval History</h1><p style={{ color:'#64748b',fontSize:14 }}>Requests you have already decided on</p></div>
        <div style={{ background:'#fff',borderRadius:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden' }}>
          <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr',padding:'12px 20px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9' }}>
            {['Student','Type','Date','Decision'].map(h=><div key={h} style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5 }}>{h}</div>)}
          </div>
          {loading&&<div style={{ padding:'40px',textAlign:'center',color:'#94a3b8' }}>Loading…</div>}
          {!loading&&reqs.length===0&&<div style={{ padding:'40px',textAlign:'center',color:'#94a3b8' }}>No decisions made yet.</div>}
          {reqs.map(r=>(
            <div key={r.id} style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #f8fafc' }}>
              <div><div style={{ fontWeight:600,fontSize:13,color:'#0f172a' }}>{r.student_name}</div><div style={{ fontSize:11,color:'#94a3b8' }}>{r.student_username}</div></div>
              <div style={{ fontSize:13,color:'#475569',textTransform:'capitalize' }}>{r.purpose||'Bonafide'}</div>
              <div style={{ fontSize:12,color:'#64748b' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
              <div><span style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:r.status==='approved'?'#f0fdf4':'#fef2f2',color:r.status==='approved'?'#15803d':'#b91c1c',border:`1px solid ${r.status==='approved'?'#bbf7d0':'#fecaca'}` }}>{r.status==='approved'?'✓ Approved':'✕ Rejected'}</span></div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
