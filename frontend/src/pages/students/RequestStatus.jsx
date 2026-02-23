import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { authFetch } from '../../api'
import AppShell from '../../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',   path:'/student/dashboard' },
  { icon:'📋', label:'New Request', path:'/newRequest' },
  { icon:'⏳', label:'My Requests', path:'/pendingRequests' },
  { icon:'📜', label:'History',     path:'/requestHistory' },
  { icon:'👤', label:'Profile',     path:'/student/profile' },
]

function StageNode({ icon, title, subtitle, stageKey, stageStatus, currentStage, overall, idx, total }) {
  // Determine visual state
  let state = 'waiting' // waiting | active | done | rejected
  if (stageStatus === 'approved') state = 'done'
  else if (stageStatus === 'rejected') state = 'rejected'
  else if (currentStage === stageKey && overall !== 'rejected' && overall !== 'approved') state = 'active'

  const cfg = {
    waiting:  { bg:'#f8fafc', border:'#e2e8f0', iconBg:'#f1f5f9', iconColor:'#94a3b8', titleColor:'#94a3b8', dot:'#e2e8f0' },
    active:   { bg:'#eff6ff', border:'#3b82f6', iconBg:'#dbeafe', iconColor:'#2563eb', titleColor:'#1e40af', dot:'#3b82f6' },
    done:     { bg:'#f0fdf4', border:'#22c55e', iconBg:'#dcfce7', iconColor:'#16a34a', titleColor:'#15803d', dot:'#22c55e' },
    rejected: { bg:'#fef2f2', border:'#ef4444', iconBg:'#fee2e2', iconColor:'#dc2626', titleColor:'#b91c1c', dot:'#ef4444' },
  }[state]

  return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',flex:1,position:'relative' }}>
      {/* Connector line */}
      {idx < total-1 && (
        <div style={{ position:'absolute', top:28, left:'50%', width:'100%', height:2, background: state==='done'?'#22c55e':'#e2e8f0', zIndex:0 }}/>
      )}
      {/* Node */}
      <div style={{ position:'relative',zIndex:1,display:'flex',flexDirection:'column',alignItems:'center',width:'100%',maxWidth:140 }}>
        {/* Circle */}
        <div style={{ width:56,height:56,borderRadius:'50%',background:cfg.iconBg,border:`2.5px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,marginBottom:10,boxShadow:state==='active'?`0 0 0 6px ${cfg.dot}25`:undefined,transition:'all .3s' }}>
          {state==='done' ? '✓' : state==='rejected' ? '✕' : icon}
        </div>
        <div style={{ fontSize:12,fontWeight:700,color:cfg.titleColor,textAlign:'center',marginBottom:2 }}>{title}</div>
        {subtitle && <div style={{ fontSize:11,color:'#94a3b8',textAlign:'center',marginBottom:6 }}>{subtitle}</div>}
        {/* Badge */}
        <span style={{ padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:700,
          background:state==='done'?'#dcfce7':state==='rejected'?'#fee2e2':state==='active'?'#dbeafe':'#f1f5f9',
          color:state==='done'?'#15803d':state==='rejected'?'#b91c1c':state==='active'?'#1d4ed8':'#94a3b8',
          letterSpacing:.3
        }}>
          {state==='done'?'APPROVED':state==='rejected'?'REJECTED':state==='active'?'IN REVIEW':'WAITING'}
        </span>
      </div>
    </div>
  )
}

export default function RequestStatus() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const [req, setReq] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    authFetch(`/api/auth/bonafide/${id}/`)
      .then(d => setReq(d))
      .catch(e => setError(e?.detail||'Failed to load request'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppShell navItems={NAV}><div style={{ display:'flex',justifyContent:'center',alignItems:'center',height:300,color:'#94a3b8' }}>Loading request…</div></AppShell>
  if (error)   return <AppShell navItems={NAV}><div style={{ color:'#ef4444',padding:32 }}>{error}</div></AppShell>
  if (!req)    return null

  const stages = [
    { key:'tutor', icon:'👨‍🏫', title:'Tutor',          subtitle:req.tutor_name||undefined,   status:req.tutor_status,  at:req.tutor_at,  comment:req.tutor_comment },
    { key:'hod',   icon:'🏛',   title:'Head of Dept',   subtitle:req.hod_name||undefined,     status:req.hod_status,    at:req.hod_at,    comment:req.hod_comment },
    { key:'dean',  icon:'👔',   title:'Dean',           subtitle:req.dean_name||undefined,    status:req.dean_status,   at:req.dean_at,   comment:req.dean_comment },
  ]

  const overallChip = req.status==='approved'
    ? { bg:'#f0fdf4',color:'#15803d',border:'#bbf7d0',text:'🎉 Fully Approved' }
    : req.status==='rejected'
    ? { bg:'#fef2f2',color:'#b91c1c',border:'#fecaca',text:'❌ Request Rejected' }
    : { bg:'#eff6ff',color:'#1d4ed8',border:'#bfdbfe',text:`⏳ In Review — ${({tutor:'Tutor',hod:'HOD',dean:'Dean'})[req.current_stage]||'Processing'}` }

  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:740,margin:'0 auto' }}>
        {/* Back */}
        <button onClick={()=>navigate('/pendingRequests')} style={{ background:'none',border:'none',color:'#64748b',fontSize:13,cursor:'pointer',marginBottom:20,display:'flex',alignItems:'center',gap:6,fontFamily:'Outfit,sans-serif',padding:0 }}>← Back to My Requests</button>

        {/* Header card */}
        <div style={{ background:'#fff',borderRadius:16,padding:'24px 28px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:16 }}>
            <div>
              <h1 style={{ fontSize:20,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif',textTransform:'capitalize' }}>{req.purpose||'Bonafide'} Certificate Request</h1>
              <div style={{ color:'#64748b',fontSize:13 }}>Submitted {new Date(req.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
            </div>
            <span style={{ padding:'8px 16px',borderRadius:20,fontSize:13,fontWeight:700,background:overallChip.bg,color:overallChip.color,border:`1.5px solid ${overallChip.border}` }}>{overallChip.text}</span>
          </div>

          {/* Meta */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12 }}>
            {[['Request ID',`#${req.id}`],['Roll Number',req.roll_number||'—'],['Reason',req.reason||'—']].map(([l,v])=>(
              <div key={l} style={{ background:'#f8fafc',borderRadius:10,padding:'12px 14px' }}>
                <div style={{ fontSize:11,fontWeight:600,color:'#94a3b8',letterSpacing:.5,marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:13,fontWeight:600,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Approval Chain Tracker */}
        <div style={{ background:'#fff',borderRadius:16,padding:'28px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:24,fontFamily:'Outfit,sans-serif' }}>Approval Chain</h2>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',padding:'0 16px',position:'relative' }}>
            {stages.map((s,i)=>(
              <StageNode key={s.key} {...s} stageKey={s.key} stageStatus={s.status} currentStage={req.current_stage} overall={req.status} idx={i} total={stages.length} />
            ))}
          </div>

          {/* Stage detail cards */}
          <div style={{ marginTop:28,display:'flex',flexDirection:'column',gap:10 }}>
            {stages.map(s=>{
              if (s.status==='pending' && req.current_stage!==s.key) return null
              const isDone = s.status==='approved'||s.status==='rejected'
              if (!isDone && req.current_stage!==s.key) return null
              return (
                <div key={s.key} style={{ padding:'14px 18px',borderRadius:10,background:s.status==='approved'?'#f0fdf4':s.status==='rejected'?'#fef2f2':'#eff6ff',border:`1px solid ${s.status==='approved'?'#bbf7d0':s.status==='rejected'?'#fecaca':'#bfdbfe'}` }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:s.comment?8:0 }}>
                    <span style={{ fontWeight:700,fontSize:13,color:'#0f172a' }}>{s.title}{s.subtitle&&` — ${s.subtitle}`}</span>
                    <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                      {s.at && <span style={{ fontSize:11,color:'#94a3b8' }}>{new Date(s.at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</span>}
                      <span style={{ fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:20,background:s.status==='approved'?'#dcfce7':s.status==='rejected'?'#fee2e2':'#dbeafe',color:s.status==='approved'?'#15803d':s.status==='rejected'?'#b91c1c':'#1d4ed8' }}>
                        {s.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  {s.comment && <div style={{ fontSize:13,color:'#334155',fontStyle:'italic' }}>"{s.comment}"</div>}
                </div>
              )
            })}
          </div>
        </div>

        {/* AI Analysis */}
        {req.extracted && (
          <div style={{ background:'#fff',borderRadius:16,padding:'24px 28px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20 }}>
            <h2 style={{ fontSize:15,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>🤖 AI Document Analysis</h2>
            <div style={{ fontSize:12,color:'#64748b',marginBottom:16 }}>Automatically extracted from your permission letter</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16 }}>
              {Object.entries(req.checklist||{}).filter(([k])=>k!=='AI Reasoning').map(([k,v])=>(
                <div key={k} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'#f8fafc',borderRadius:8 }}>
                  <span style={{ fontSize:14 }}>{v.startsWith('✅')?'✅':'❌'}</span>
                  <span style={{ fontSize:12,fontWeight:600,color:'#334155' }}>{k}</span>
                </div>
              ))}
            </div>
            {req.explanation && (
              <div style={{ padding:'12px 16px',background:'#f8fafc',borderRadius:10,borderLeft:'3px solid #3b82f6' }}>
                <div style={{ fontSize:11,fontWeight:700,color:'#64748b',marginBottom:4 }}>AI REASONING</div>
                <div style={{ fontSize:13,color:'#334155',lineHeight:1.6 }}>{req.explanation}</div>
              </div>
            )}
          </div>
        )}

        {/* Document link */}
        {req.permission_file_url && (
          <a href={req.permission_file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
            <div style={{ background:'#fff',borderRadius:14,padding:'16px 20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',display:'flex',alignItems:'center',gap:12,cursor:'pointer',border:'1.5px solid #e2e8f0',transition:'all .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#3b82f6'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#e2e8f0'}}>
              <div style={{ width:40,height:40,background:'#eff6ff',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20 }}>📄</div>
              <div><div style={{ fontWeight:600,fontSize:14,color:'#0f172a' }}>View Submitted Document</div><div style={{ fontSize:12,color:'#64748b' }}>Your uploaded permission letter</div></div>
              <div style={{ marginLeft:'auto',color:'#3b82f6',fontSize:18 }}>→</div>
            </div>
          </a>
        )}
      </div>
    </AppShell>
  )
}
