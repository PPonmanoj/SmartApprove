import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',   path:'/student/dashboard' },
  { icon:'📋', label:'New Request', path:'/newRequest' },
  { icon:'⏳', label:'My Requests', path:'/pendingRequests' },
  { icon:'📜', label:'History',     path:'/requestHistory' },
  { icon:'👤', label:'Profile',     path:'/student/profile' },
]

const TYPES = [
  { emoji:'📋', title:'Bonafide – Department', desc:'For bank accounts, visa applications, scholarship verification', path:'/bonafideDept', color:'#3b82f6', available:true },
  { emoji:'💼', title:'Internship Letter',      desc:'Upload offer letter, parent consent & permission forms',      path:'/internship',   color:'#6366f1', available:true },
  { emoji:'🏥', title:'Medical Certificate',   desc:'Hospital/clinic attendance or health-related leave',          path:null,            color:'#22c55e', available:false },
  { emoji:'🧾', title:'Fee Receipt Duplicate', desc:'Request copy of paid fee receipt for records',                path:null,            color:'#f59e0b', available:false },
  { emoji:'✈️',  title:'Industrial Visit',      desc:'Permission for college-organized industrial visits',          path:null,            color:'#ef4444', available:false },
  { emoji:'🕐', title:'On Duty',              desc:'For competitions, events and external participation',          path:null,            color:'#8b5cf6', available:false },
  { emoji:'📄', title:'No Objection (NOC)',    desc:'NOC for higher education or employment verification',         path:null,            color:'#06b6d4', available:false },
  { emoji:'🎓', title:'Transcript',            desc:'Official academic transcript with grade details',             path:null,            color:'#ec4899', available:false },
]

export default function NewRequest() {
  const navigate = useNavigate()
  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:820 }}>
        <div style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>New Request</h1>
          <p style={{ color:'#64748b',fontSize:14 }}>Choose the document type you need. AI will validate your submission automatically.</p>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:14 }}>
          {TYPES.map(t=>(
            <div key={t.title} onClick={()=>t.available&&t.path&&navigate(t.path)}
              style={{ background:'#fff',borderRadius:14,padding:'22px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',cursor:t.available?'pointer':'not-allowed',opacity:t.available?1:.55,border:'1.5px solid transparent',transition:'all .2s',position:'relative' }}
              onMouseEnter={e=>{ if(t.available){ e.currentTarget.style.borderColor=t.color; e.currentTarget.style.boxShadow=`0 4px 20px ${t.color}22` }}}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.boxShadow='0 1px 3px rgba(0,0,0,.06)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10 }}>
                <div style={{ width:44,height:44,background:`${t.color}15`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22 }}>{t.emoji}</div>
                {!t.available && <span style={{ fontSize:10,fontWeight:700,color:'#94a3b8',background:'#f1f5f9',padding:'3px 8px',borderRadius:20,letterSpacing:.5 }}>COMING SOON</span>}
                {t.available && <span style={{ fontSize:10,fontWeight:700,color:t.color,background:`${t.color}12`,padding:'3px 8px',borderRadius:20,letterSpacing:.5 }}>AVAILABLE</span>}
              </div>
              <div style={{ fontWeight:700,fontSize:15,color:'#0f172a',marginBottom:6 }}>{t.title}</div>
              <div style={{ fontSize:13,color:'#64748b',lineHeight:1.6 }}>{t.desc}</div>
              {t.available && <div style={{ fontSize:12,color:t.color,fontWeight:600,marginTop:10 }}>Submit request →</div>}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
