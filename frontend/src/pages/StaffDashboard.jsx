import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, authFetch } from '../api'
import AppShell from '../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',       path:'/staff/dashboard' },
  { icon:'📥', label:'Incoming',         path:'/incomingRequests' },
  { icon:'📜', label:'Approval History', path:'/approvalHistory' },
  { icon:'⚙️',  label:'Requirements',    path:'/editRequirements' },
  { icon:'👤', label:'Profile',          path:'/staff/profile' },
]

export default function StaffDashboard() {
  const navigate = useNavigate()
  const user = getUser()
  const name = user?.name || user?.username || 'Staff'
  const designation = user?.designation || 'Staff'

  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    authFetch('/api/auth/bonafide/incoming/').then(d=>setRequests(d||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const pending  = requests.length
  const stageMap = { TUTOR:'Tutor', HOD:'Head of Department', DEAN:'Dean', PRINCIPAL:'Principal', PROGRAM_COORDINATOR:'Program Coordinator' }

  return (
    <AppShell navItems={NAV}>
      <div style={{ marginBottom:28 }}>
        <div style={{ display:'inline-block',padding:'4px 12px',borderRadius:20,background:'#ede9fe',color:'#6d28d9',fontSize:12,fontWeight:600,marginBottom:10 }}>{stageMap[designation]||designation}</div>
        <h1 style={{ fontSize:26,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Welcome, {name.split(' ')[0]} 👋</h1>
        <p style={{ color:'#64748b',fontSize:14 }}>Review and approve student document requests for your class.</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:28 }}>
        {[
          { label:'Pending Review',  val:loading?'…':pending,                                              icon:'⏳', color:'#f59e0b' },
          { label:'Approved Today',  val:loading?'…':requests.filter(r=>r.tutor_status==='approved').length, icon:'✅', color:'#22c55e' },
          { label:'Total Reviewed',  val:loading?'…':requests.filter(r=>r.tutor_status!=='pending').length,  icon:'📊', color:'#6366f1' },
        ].map(s=>(
          <div key={s.label} style={{ background:'#fff',borderRadius:14,padding:'20px 22px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:16 }}>
            <div style={{ width:44,height:44,background:`${s.color}15`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{s.icon}</div>
            <div><div style={{ fontSize:28,fontWeight:700,color:'#0f172a' }}>{s.val}</div><div style={{ fontSize:12,color:'#64748b',fontWeight:500 }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Pending requests quick list */}
      <div style={{ background:'#fff',borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden',marginBottom:20 }}>
        <div style={{ padding:'16px 20px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'#0f172a' }}>Pending Reviews {pending>0&&<span style={{ marginLeft:8,padding:'2px 8px',background:'#fef3c7',color:'#d97706',borderRadius:20,fontSize:11,fontWeight:700 }}>{pending}</span>}</h2>
          <button onClick={()=>navigate('/incomingRequests')} style={{ padding:'7px 14px',background:'#eff6ff',border:'none',borderRadius:8,color:'#2563eb',fontSize:12,fontWeight:600,cursor:'pointer' }}>View All →</button>
        </div>

        {loading && <div style={{ padding:'32px',textAlign:'center',color:'#94a3b8' }}>Loading…</div>}
        {!loading && requests.length===0 && (
          <div style={{ padding:'40px',textAlign:'center' }}>
            <div style={{ fontSize:36,marginBottom:10 }}>🎉</div>
            <div style={{ color:'#64748b',fontSize:14,fontWeight:600 }}>All caught up! No pending requests.</div>
          </div>
        )}

        {requests.slice(0,5).map(r=>(
          <div key={r.id} style={{ display:'flex',alignItems:'center',gap:16,padding:'14px 20px',borderBottom:'1px solid #f8fafc',transition:'background .15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#fafafa'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <div style={{ width:40,height:40,background:'#eff6ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0 }}>📋</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600,fontSize:13,color:'#0f172a' }}>{r.student_name} <span style={{ color:'#94a3b8',fontWeight:400,fontFamily:'JetBrains Mono,monospace',fontSize:11 }}>({r.student_username})</span></div>
              <div style={{ fontSize:12,color:'#64748b',marginTop:2 }}>Bonafide • {new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
            </div>
            <div style={{ display:'flex',alignItems:'center',gap:10 }}>
              <span style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:r.is_valid?'#dcfce7':'#fff7ed',color:r.is_valid?'#15803d':'#c2410c',border:`1px solid ${r.is_valid?'#bbf7d0':'#fed7aa'}` }}>
                {r.is_valid?'AI ✓':'AI ⚠'}
              </span>
              <button onClick={()=>navigate('/incomingRequests')} style={{ padding:'7px 14px',background:'#0f172a',border:'none',borderRadius:8,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer' }}>Review</button>
            </div>
          </div>
        ))}
      </div>

      {/* Designation info card */}
      <div style={{ background:'linear-gradient(135deg,#0f172a,#1e3a5f)',borderRadius:14,padding:'20px 24px',color:'#fff' }}>
        <div style={{ fontWeight:700,fontSize:15,marginBottom:6 }}>Your Role: {stageMap[designation]||designation}</div>
        <div style={{ color:'#94a3b8',fontSize:13,lineHeight:1.7 }}>
          {designation==='TUTOR'&&'You are the first stage in the approval chain. Your approval forwards the request to the HOD for further review.'}
          {designation==='HOD'&&'You review requests approved by Tutors. Your approval forwards them to the Dean.'}
          {designation==='DEAN'&&'You are the final authority. Your approval or rejection is final.'}
          {!['TUTOR','HOD','DEAN'].includes(designation)&&'Review and manage student document requests.'}
        </div>
      </div>
    </AppShell>
  )
}
