import React from 'react'
import { useNavigate } from 'react-router-dom'

const TYPES = [
  { emoji:'📋', label:'Bonafide' },     { emoji:'💼', label:'Internship' },
  { emoji:'🏥', label:'Medical' },      { emoji:'🧾', label:'Fee Receipt' },
  { emoji:'✈️',  label:'Industrial Visit' }, { emoji:'🕐', label:'On Duty' },
  { emoji:'📄', label:'NOC' },          { emoji:'🎓', label:'Transcript' },
]

export default function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh', background:'var(--navy)', overflow:'hidden', position:'relative' }}>

      {/* Background mesh */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% -10%, #1d4ed820, transparent), radial-gradient(ellipse 60% 40% at 80% 80%, #6366f115, transparent)' }}/>

      {/* Nav */}
      <nav style={{ position:'relative', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 40px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, background:'var(--blue-g)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>✓</div>
          <span style={{ color:'#fff', fontWeight:700, fontSize:20, letterSpacing:'-0.5px' }}>ApproveX</span>
        </div>
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={() => navigate('/student/login')} style={{ padding:'9px 22px', background:'rgba(255,255,255,.08)', border:'1px solid rgba(255,255,255,.15)', borderRadius:8, color:'#fff', fontWeight:500, cursor:'pointer', fontSize:14, transition:'all .2s' }}
            onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,.15)'}} onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,.08)'}}>
            Student Login
          </button>
          <button onClick={() => navigate('/staff/login')} style={{ padding:'9px 22px', background:'var(--blue)', border:'none', borderRadius:8, color:'#fff', fontWeight:600, cursor:'pointer', fontSize:14, transition:'all .2s' }}
            onMouseEnter={e=>{e.target.style.background='var(--blue2)'}} onMouseLeave={e=>{e.target.style.background='var(--blue)'}}>
            Staff Login
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ position:'relative', textAlign:'center', padding:'80px 40px 60px' }}>
        <div style={{ display:'inline-block', background:'rgba(59,130,246,.15)', border:'1px solid rgba(59,130,246,.3)', borderRadius:100, padding:'6px 18px', marginBottom:24 }}>
          <span style={{ color:'#93c5fd', fontSize:13, fontWeight:500, letterSpacing:.5 }}>AI-Powered Academic Approvals</span>
        </div>
        <h1 style={{ color:'#fff', fontSize:'clamp(44px,7vw,80px)', fontWeight:800, lineHeight:1.05, letterSpacing:'-2px', marginBottom:20 }}>
          Smart approvals,<br/><span style={{ background:'var(--blue-g)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>zero paperwork.</span>
        </h1>
        <p style={{ color:'#94a3b8', fontSize:18, maxWidth:520, margin:'0 auto 40px', lineHeight:1.7 }}>
          Submit document requests, track them through the approval chain, and get AI-validated results — instantly.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/student/signup')} style={{ padding:'14px 32px', background:'var(--blue-g)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer', boxShadow:'0 4px 20px rgba(99,102,241,.4)', transition:'transform .2s' }}
            onMouseEnter={e=>{e.target.style.transform='translateY(-2px)'}} onMouseLeave={e=>{e.target.style.transform='none'}}>
            Get Started as Student →
          </button>
          <button onClick={() => navigate('/staff/signup')} style={{ padding:'14px 32px', background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, color:'#e2e8f0', fontWeight:600, fontSize:16, cursor:'pointer' }}>
            Join as Staff
          </button>
        </div>
      </div>

      {/* Request Types Grid */}
      <div style={{ position:'relative', maxWidth:900, margin:'0 auto', padding:'0 40px 80px' }}>
        <p style={{ textAlign:'center', color:'#64748b', fontSize:13, fontWeight:500, letterSpacing:2, textTransform:'uppercase', marginBottom:24 }}>Supported Request Types</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
          {TYPES.map((t,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:12, padding:'20px 16px', textAlign:'center', transition:'all .2s', cursor:'default', animation:`fadeUp .4s ease ${i*0.05}s both` }}
              onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.08)'; e.currentTarget.style.borderColor='rgba(59,130,246,.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,.08)'}}>
              <div style={{ fontSize:28, marginBottom:8 }}>{t.emoji}</div>
              <div style={{ color:'#cbd5e1', fontSize:13, fontWeight:500 }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features strip */}
      <div style={{ borderTop:'1px solid rgba(255,255,255,.06)', padding:'28px 40px', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
        {['🤖 AI Document Validation','⛓ Multi-stage Approval Chain','🔒 JWT Secured Access','📊 Real-time Status Tracking'].map((f,i)=>(
          <span key={i} style={{ color:'#64748b', fontSize:13, fontWeight:500 }}>{f}</span>
        ))}
      </div>
    </div>
  )
}
