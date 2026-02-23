import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch, getUser } from '../../api'
import AppShell from '../../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',       path:'/staff/dashboard' },
  { icon:'📥', label:'Incoming',         path:'/incomingRequests' },
  { icon:'📜', label:'Approval History', path:'/approvalHistory' },
  { icon:'⚙️',  label:'Requirements',    path:'/editRequirements' },
  { icon:'👤', label:'Profile',          path:'/staff/profile' },
]

export default function IncomingRequests() {
  const navigate = useNavigate()
  const user = getUser()
  const [requests, setRequests] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [comment,  setComment]  = useState('')
  const [deciding, setDeciding] = useState(false)
  const [decideMsg, setDecideMsg] = useState(null)

  useEffect(() => {
    authFetch('/api/auth/bonafide/incoming/').then(d=>setRequests(d||[])).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const openDetail = async id => {
    setDecideMsg(null); setComment('')
    const data = await authFetch(`/api/auth/bonafide/${id}/`).catch(()=>null)
    if (data) setSelected(data)
  }

  const decide = async action => {
    if (!selected) return
    setDeciding(true); setDecideMsg(null)
    try {
      const updated = await authFetch(`/api/auth/bonafide/${selected.id}/status/`, {
        method:'PATCH', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action, comment })
      })
      setRequests(prev=>prev.map(r=>r.id===updated.id?updated:r).filter(r=>r.tutor_status==='pending'&&r.hod_status==='pending'&&r.dean_status==='pending'))
      setSelected(updated)
      setDecideMsg({ type:action, text: action==='approved'?'✅ Request approved and forwarded.':'❌ Request rejected.' })
      setComment('')
    } catch(err) {
      setDecideMsg({ type:'error', text: err?.detail||'Action failed. Try again.' })
    } finally { setDeciding(false) }
  }

  const chipCfg = r => {
    if (!r.is_valid) return { bg:'#fff7ed',color:'#c2410c',border:'#fed7aa',text:'AI ⚠ Incomplete' }
    return { bg:'#f0fdf4',color:'#15803d',border:'#bbf7d0',text:'AI ✓ Valid' }
  }

  return (
    <AppShell navItems={NAV}>
      <div style={{ display:'grid',gridTemplateColumns:selected?'1fr 420px':'1fr',gap:20,alignItems:'start' }}>
        {/* Left: List */}
        <div>
          <div style={{ marginBottom:20 }}>
            <h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Incoming Requests</h1>
            <p style={{ color:'#64748b',fontSize:14 }}>Awaiting your review at this approval stage</p>
          </div>

          <div style={{ background:'#fff',borderRadius:14,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr auto',padding:'12px 20px',background:'#f8fafc',borderBottom:'1px solid #f1f5f9' }}>
              {['Student','Type','Date','AI Status',''].map(h=><div key={h} style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5 }}>{h}</div>)}
            </div>

            {loading && <div style={{ padding:'40px',textAlign:'center',color:'#94a3b8' }}>Loading requests…</div>}
            {!loading && requests.length===0 && (
              <div style={{ padding:'48px',textAlign:'center' }}>
                <div style={{ fontSize:40,marginBottom:12 }}>🎉</div>
                <div style={{ color:'#64748b',fontSize:14,fontWeight:600 }}>No pending requests — you're all caught up!</div>
              </div>
            )}

            {requests.map(r=>{
              const chip = chipCfg(r)
              const isActive = selected?.id===r.id
              return (
                <div key={r.id} style={{ display:'grid',gridTemplateColumns:'1.5fr 1fr 1fr 1fr auto',alignItems:'center',padding:'14px 20px',borderBottom:'1px solid #f8fafc',background:isActive?'#eff6ff':'transparent',transition:'background .15s',cursor:'pointer' }}
                  onClick={()=>openDetail(r.id)}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='#fafafa' }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent' }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:13,color:'#0f172a' }}>{r.student_name}</div>
                    <div style={{ fontSize:11,color:'#94a3b8',fontFamily:'JetBrains Mono,monospace' }}>{r.student_username}</div>
                  </div>
                  <div style={{ fontSize:13,color:'#475569',textTransform:'capitalize' }}>{r.purpose||'Bonafide'}</div>
                  <div style={{ fontSize:12,color:'#64748b' }}>{new Date(r.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}</div>
                  <div><span style={{ padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,background:chip.bg,color:chip.color,border:`1px solid ${chip.border}` }}>{chip.text}</span></div>
                  <div style={{ width:8,height:8,borderRadius:'50%',background:isActive?'#3b82f6':'#e2e8f0' }}/>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Detail panel */}
        {selected && (
          <div style={{ position:'sticky',top:32 }}>
            <div style={{ background:'#fff',borderRadius:16,boxShadow:'0 4px 20px rgba(0,0,0,.1)',overflow:'hidden' }}>
              {/* Panel header */}
              <div style={{ padding:'18px 20px',background:'linear-gradient(135deg,#0f172a,#1e293b)',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ color:'#fff',fontWeight:700,fontSize:15 }}>{selected.student_name}</div>
                  <div style={{ color:'#94a3b8',fontSize:12,fontFamily:'JetBrains Mono,monospace' }}>{selected.student_username} • #{selected.id}</div>
                </div>
                <button onClick={()=>setSelected(null)} style={{ width:30,height:30,borderRadius:8,border:'1px solid rgba(255,255,255,.15)',background:'rgba(255,255,255,.08)',color:'#fff',cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
              </div>

              <div style={{ padding:'20px',maxHeight:'70vh',overflowY:'auto' }}>
                {/* AI Badge */}
                <div style={{ padding:'12px',borderRadius:10,background:selected.is_valid?'#f0fdf4':'#fff7ed',border:`1px solid ${selected.is_valid?'#bbf7d0':'#fed7aa'}`,marginBottom:16 }}>
                  <div style={{ fontWeight:700,fontSize:13,color:selected.is_valid?'#15803d':'#c2410c',marginBottom:4 }}>
                    {selected.is_valid?'🤖 AI: All fields verified':'🤖 AI: Incomplete document'}
                  </div>
                  {selected.explanation&&<div style={{ fontSize:12,color:'#334155',lineHeight:1.6 }}>{selected.explanation}</div>}
                </div>

                {/* Checklist */}
                {selected.checklist && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:8 }}>DOCUMENT CHECKLIST</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                      {Object.entries(selected.checklist).filter(([k])=>k!=='AI Reasoning').map(([k,v])=>(
                        <div key={k} style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:8,background:v.startsWith('✅')?'#f0fdf4':'#fef2f2' }}>
                          <span>{v.startsWith('✅')?'✅':'❌'}</span>
                          <span style={{ fontSize:12,fontWeight:600,color:'#334155' }}>{k}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted */}
                {selected.extracted && (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:8 }}>EXTRACTED FIELDS</div>
                    <div style={{ background:'#f8fafc',borderRadius:10,overflow:'hidden' }}>
                      {[['Name',selected.extracted.name],['Roll No',selected.extracted.roll_number],['Dept',selected.extracted.department],['Reason',selected.extracted.reason]].filter(([,v])=>v).map(([l,v],i,a)=>(
                        <div key={l} style={{ display:'flex',padding:'8px 12px',borderBottom:i<a.length-1?'1px solid #f1f5f9':undefined }}>
                          <div style={{ width:80,fontSize:11,fontWeight:600,color:'#94a3b8',flexShrink:0 }}>{l}</div>
                          <div style={{ fontSize:12,color:'#0f172a' }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document link */}
                {selected.permission_file_url && (
                  <a href={selected.permission_file_url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none',display:'block',marginBottom:16 }}>
                    <div style={{ padding:'10px 14px',borderRadius:10,background:'#eff6ff',border:'1px solid #bfdbfe',display:'flex',alignItems:'center',gap:10,cursor:'pointer' }}>
                      <span style={{ fontSize:18 }}>📄</span>
                      <span style={{ fontSize:13,fontWeight:600,color:'#2563eb' }}>Open submitted document</span>
                      <span style={{ marginLeft:'auto',fontSize:12 }}>→</span>
                    </div>
                  </a>
                )}

                {/* Decision panel */}
                {selected.status === 'pending' ? (
                  <div>
                    <div style={{ fontSize:11,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:8 }}>YOUR DECISION</div>
                    <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment (optional)..." style={{ width:'100%',minHeight:72,padding:'10px 12px',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:13,fontFamily:'Outfit,sans-serif',resize:'vertical',outline:'none',boxSizing:'border-box',marginBottom:10,color:'#0f172a' }} onFocus={e=>e.target.style.borderColor='#3b82f6'} onBlur={e=>e.target.style.borderColor='#e2e8f0'} />
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
                      <button onClick={()=>decide('approved')} disabled={deciding} style={{ padding:'12px',background:deciding?'#f1f5f9':'#22c55e',border:'none',borderRadius:10,color:deciding?'#94a3b8':'#fff',fontWeight:700,fontSize:14,cursor:deciding?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        {deciding?<span style={{ width:14,height:14,border:'2px solid #94a3b8',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>:'✓'} Approve
                      </button>
                      <button onClick={()=>decide('rejected')} disabled={deciding} style={{ padding:'12px',background:deciding?'#f1f5f9':'#ef4444',border:'none',borderRadius:10,color:deciding?'#94a3b8':'#fff',fontWeight:700,fontSize:14,cursor:deciding?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                        ✕ Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding:'14px',borderRadius:10,background:selected.status==='approved'?'#f0fdf4':'#fef2f2',border:`1px solid ${selected.status==='approved'?'#bbf7d0':'#fecaca'}`,textAlign:'center' }}>
                    <div style={{ fontWeight:700,fontSize:14,color:selected.status==='approved'?'#15803d':'#b91c1c' }}>
                      {selected.status==='approved'?'✅ Approved and forwarded':'❌ Request rejected'}
                    </div>
                  </div>
                )}

                {decideMsg && (
                  <div style={{ marginTop:10,padding:'10px 14px',borderRadius:10,background:decideMsg.type==='error'?'#fef2f2':decideMsg.type==='approved'?'#f0fdf4':'#fef2f2',color:decideMsg.type==='error'?'#dc2626':decideMsg.type==='approved'?'#15803d':'#b91c1c',fontSize:13,fontWeight:600 }}>
                    {decideMsg.text}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
