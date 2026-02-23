import React from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../components/AppShell'
const NAV=[{icon:'🏠',label:'Dashboard',path:'/staff/dashboard'},{icon:'📥',label:'Incoming',path:'/incomingRequests'},{icon:'📜',label:'Approval History',path:'/approvalHistory'},{icon:'⚙️',label:'Requirements',path:'/editRequirements'},{icon:'👤',label:'Profile',path:'/staff/profile'}]
const ITEMS=[{emoji:'💼',title:'Internship',route:'/internshipEdit',available:true},{emoji:'📋',title:'Bonafide',route:null,available:false},{emoji:'🧾',title:'Fee Receipt',route:null,available:false},{emoji:'🏥',title:'Medical',route:null,available:false}]
export default function EditRequirements(){
  const navigate=useNavigate()
  return(
    <AppShell navItems={NAV}>
      <div style={{maxWidth:600}}>
        <div style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700,color:'#0f172a',fontFamily:'Outfit,sans-serif'}}>Edit Requirements</h1><p style={{color:'#64748b',fontSize:14}}>Configure what documents and fields are required per request type.</p></div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {ITEMS.map(i=><div key={i.title} onClick={()=>i.available&&i.route&&navigate(i.route)} style={{background:'#fff',borderRadius:14,padding:'20px',boxShadow:'0 1px 3px rgba(0,0,0,.06)',cursor:i.available?'pointer':'not-allowed',opacity:i.available?1:.5,border:'1.5px solid transparent',transition:'all .2s'}} onMouseEnter={e=>{if(i.available)e.currentTarget.style.borderColor='#6366f1'}} onMouseLeave={e=>e.currentTarget.style.borderColor='transparent'}>
            <div style={{fontSize:28,marginBottom:10}}>{i.emoji}</div>
            <div style={{fontWeight:700,fontSize:15,color:'#0f172a',marginBottom:4}}>{i.title}</div>
            {!i.available&&<div style={{fontSize:11,color:'#94a3b8'}}>Coming soon</div>}
            {i.available&&<div style={{fontSize:12,color:'#6366f1',fontWeight:600}}>Edit requirements →</div>}
          </div>)}
        </div>
      </div>
    </AppShell>
  )
}
