import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, authFetch } from '../api'
import AppShell from '../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',       path:'/student/dashboard' },
  { icon:'📋', label:'New Request',     path:'/newRequest' },
  { icon:'⏳', label:'My Requests',     path:'/pendingRequests' },
  { icon:'📜', label:'History',         path:'/requestHistory' },
  { icon:'👤', label:'Profile',         path:'/student/profile' },
]

const QUICK = [
  { emoji:'📋', title:'Bonafide Certificate', desc:'For bank, visa or verification', path:'/bonafideDept', color:'#3b82f6' },
  { emoji:'💼', title:'Internship Letter',     desc:'Upload offer letter + forms',   path:'/internship',   color:'#6366f1' },
  { emoji:'🏥', title:'Medical Certificate',  desc:'Hospital/clinic attendance',    path:null,            color:'#22c55e' },
  { emoji:'🧾', title:'Fee Receipt',          desc:'Duplicate fee receipt request', path:null,            color:'#f59e0b' },
]

export default function StudentDashboard() {
  const navigate = useNavigate()
  const user     = getUser()
  const name     = user?.name || user?.username || 'Student'
  const [recent, setRecent]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/auth/bonafide/my/').then(d=>setRecent((d||[]).slice(0,3))).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const stageLabel  = s => ({ tutor:'Tutor Review', hod:'HOD Review', dean:'Dean Review', done:'Completed' }[s]||s)
  const statusChip  = (status, stage) => {
    if (status==='approved') return { bg:'#f0fdf4',color:'#16a34a',text:'Approved ✓',border:'#bbf7d0' }
    if (status==='rejected') return { bg:'#fef2f2',color:'#dc2626',text:'Rejected',border:'#fecaca' }
    return { bg:'#eff6ff',color:'#2563eb',text:`In Review — ${stageLabel(stage)}`,border:'#bfdbfe' }
  }

  return (
    <AppShell navItems={NAV}>
      {/* Header */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Good morning, {name.split(' ')[0]} 👋</h1>
        <p style={{ color:'#64748b',fontSize:14 }}>Manage your document requests and track approvals in real-time.</p>
      </div>

      {/* Stats strip */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28 }}>
        {[
          { label:'Total Requests', val: loading?'…':recent.length, icon:'📊', color:'#3b82f6' },
          { label:'Pending',        val: loading?'…':recent.filter(r=>r.status==='pending').length,  icon:'⏳', color:'#f59e0b' },
          { label:'Approved',       val: loading?'…':recent.filter(r=>r.status==='approved').length, icon:'✅', color:'#22c55e' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff',borderRadius:14,padding:'20px 22px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ width:44,height:44,background:`${s.color}15`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{s.icon}</div>
            <div><div style={{ fontSize:24,fontWeight:700,color:'#0f172a' }}>{s.val}</div><div style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start' }}>
        {/* Quick Actions */}
        <div>
          <h2 style={{ fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:14 }}>New Request</h2>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:28 }}>
            {QUICK.map(q=>(
              <div key={q.title} onClick={()=>q.path&&navigate(q.path)} style={{ background:'#fff',borderRadius:14,padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',cursor:q.path?'pointer':'not-allowed',opacity:q.path?1:.6,border:'1.5px solid transparent',transition:'all .2s' }}
                onMouseEnter={e=>{ if(q.path){e.currentTarget.style.borderColor=q.color;e.currentTarget.style.boxShadow=`0 4px 16px ${q.color}20`}}}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='transparent';e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)' }}>
                <div style={{ fontSize:28,marginBottom:10 }}>{q.emoji}</div>
                <div style={{ fontWeight:600,fontSize:15,color:'#0f172a',marginBottom:4 }}>{q.title}</div>
                <div style={{ fontSize:12,color:'#64748b' }}>{q.desc}</div>
                {!q.path&&<div style={{ fontSize:11,color:'#94a3b8',marginTop:6 }}>Coming soon</div>}
              </div>
            ))}
          </div>

          {/* Recent requests table */}
          <h2 style={{ fontSize:16,fontWeight:700,color:'#0f172a',marginBottom:14 }}>Recent Requests</h2>
          <div style={{ background:'#fff',borderRadius:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1.5fr auto',gap:0,padding:'12px 20px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9' }}>
              {['Type','Date','Status',''].map(h=><div key={h} style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5 }}>{h}</div>)}
            </div>
            {loading && <div style={{ padding:'24px',textAlign:'center',color:'#94a3b8',fontSize:14 }}>Loading…</div>}
            {!loading && recent.length===0 && <div style={{ padding:'32px',textAlign:'center',color:'#94a3b8',fontSize:14 }}>No requests yet. <span style={{ color:'#3b82f6',cursor:'pointer' }} onClick={()=>navigate('/newRequest')}>Submit your first →</span></div>}
            {recent.map(r=>{
              const chip=statusChip(r.status,r.current_stage)
              return (
                <div key={r.id} style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1.5fr auto',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #f8fafc',transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ fontSize:13,fontWeight:600,color:'#0f172a',textTransform:'capitalize' }}>{r.purpose||'Bonafide'}</div>
                  <div style={{ fontSize:12,color:'#64748b' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</div>
                  <div><span style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:chip.bg,color:chip.color,border:`1px solid ${chip.border}` }}>{chip.text}</span></div>
                  <button onClick={()=>navigate(`/requestStatus/${r.id}`)} style={{ padding:'5px 12px',background:'#eff6ff',border:'none',borderRadius:7,color:'#2563eb',fontSize:12,fontWeight:600,cursor:'pointer' }}>Track</button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
          {/* Profile card */}
          <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)',borderRadius:14,padding:'22px' }}>
            <div style={{ width:48,height:48,background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18,marginBottom:12 }}>
              {name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()}
            </div>
            <div style={{ color:'#fff',fontWeight:700,fontSize:16,marginBottom:2 }}>{name}</div>
            <div style={{ color:'#94a3b8',fontSize:13,marginBottom:2,fontFamily:'JetBrains Mono,monospace' }}>{user?.username}</div>
            <div style={{ display:'inline-block',padding:'3px 10px',background:'rgba(59,130,246,.2)',borderRadius:20,color:'#93c5fd',fontSize:11,fontWeight:600,marginTop:4 }}>{user?.student_class||'CSE'}</div>
          </div>

          {/* How it works */}
          <div style={{ background:'#fff',borderRadius:14,padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)' }}>
            <h3 style={{ fontSize:13,fontWeight:700,color:'#0f172a',marginBottom:14 }}>HOW APPROVALS WORK</h3>
            {[['🤖','AI validates your document','instant'],['👨‍🏫','Tutor reviews','1-2 days'],['🏛','HOD approves','1-2 days'],['👔','Dean signs off','1 day']].map(([icon,step,time],i)=>(
              <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10,marginBottom:i<3?14:0 }}>
                <div style={{ width:28,height:28,background:'#f1f5f9',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0 }}>{icon}</div>
                <div><div style={{ fontSize:12,fontWeight:600,color:'#0f172a' }}>{step}</div><div style={{ fontSize:11,color:'#94a3b8' }}>{time}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
