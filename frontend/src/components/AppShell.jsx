import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getUser, logout } from '../api'

export default function AppShell({ children, navItems = [] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user     = getUser()
  const name     = user?.name || user?.username || 'User'
  const initials = name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--light)' }}>
      <aside style={{ width:220, background:'var(--navy)', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:100 }}>
        <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,.08)', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }} onClick={()=>navigate('/')}>
          <div style={{ width:32,height:32,background:'var(--blue-g)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16 }}>✓</div>
          <span style={{ color:'#fff',fontWeight:700,fontSize:17 }}>ApproveX</span>
        </div>
        <nav style={{ flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:3 }}>
          {navItems.map((item,i)=>{
            const active = location.pathname === item.path
            return (
              <button key={i} onClick={()=>navigate(item.path)} style={{
                display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,border:'none',cursor:'pointer',
                textAlign:'left',fontSize:14,fontWeight:active?600:400,width:'100%',
                background:active?'rgba(59,130,246,.18)':'transparent',
                color:active?'#93c5fd':'#94a3b8',
                borderLeft:active?'3px solid var(--blue)':'3px solid transparent',
                transition:'all .15s',
              }}
              onMouseEnter={e=>{ if(!active){e.currentTarget.style.background='rgba(255,255,255,.05)';e.currentTarget.style.color='#e2e8f0'}}}
              onMouseLeave={e=>{ if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#94a3b8'}}}>
                <span style={{fontSize:16}}>{item.icon}</span>{item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding:'16px 12px',borderTop:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:10 }}>
            <div style={{ width:34,height:34,background:'var(--blue-g)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0 }}>{initials}</div>
            <div style={{overflow:'hidden'}}>
              <div style={{color:'#e2e8f0',fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</div>
              <div style={{color:'#64748b',fontSize:11,fontFamily:'var(--mono)'}}>{user?.designation||'Student'}</div>
            </div>
          </div>
          <button onClick={()=>{logout();navigate('/')}} style={{width:'100%',padding:'8px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.2)',borderRadius:7,color:'#fca5a5',fontSize:12,fontWeight:500,cursor:'pointer'}}>Sign Out</button>
        </div>
      </aside>
      <main style={{ marginLeft:220,flex:1,padding:'32px',minHeight:'100vh' }}>{children}</main>
    </div>
  )
}
