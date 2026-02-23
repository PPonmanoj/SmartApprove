import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../../api'
import AppShell from '../../components/AppShell'
const NAV=[{icon:'🏠',label:'Dashboard',path:'/student/dashboard'},{icon:'📋',label:'New Request',path:'/newRequest'},{icon:'⏳',label:'My Requests',path:'/pendingRequests'},{icon:'📜',label:'History',path:'/requestHistory'},{icon:'👤',label:'Profile',path:'/student/profile'}]
export default function StudentProfile() {
  const navigate=useNavigate(); const user=getUser(); const name=user?.name||user?.username||'Student'
  const initials=name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const rows=[['Roll Number',user?.username],['Full Name',user?.name||'—'],['Email',user?.email],['Mobile',user?.mobile_number?`+91 ${user.mobile_number}`:'—'],['Class',user?.student_class||'—'],['Department',user?.department||'—']]
  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:520 }}>
        <h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:24,fontFamily:'Outfit,sans-serif' }}>My Profile</h1>
        <div style={{ background:'linear-gradient(135deg,#1e3a5f,#2563eb)',borderRadius:16,padding:'28px',marginBottom:20,display:'flex',alignItems:'center',gap:18 }}>
          <div style={{ width:64,height:64,background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:800,fontSize:24,flexShrink:0 }}>{initials}</div>
          <div><div style={{ color:'#fff',fontWeight:700,fontSize:18 }}>{name}</div><div style={{ color:'#bfdbfe',fontSize:13 }}>{user?.student_class||'Student'}</div></div>
        </div>
        <div style={{ background:'#fff',borderRadius:16,boxShadow:'0 1px 3px rgba(0,0,0,.06)',overflow:'hidden',marginBottom:16 }}>
          {rows.map(([l,v],i)=><div key={l} style={{ display:'flex',padding:'14px 20px',borderBottom:i<rows.length-1?'1px solid #f1f5f9':undefined }}>
            <div style={{ width:140,fontSize:12,fontWeight:600,color:'#94a3b8',flexShrink:0 }}>{l}</div>
            <div style={{ fontSize:14,color:'#0f172a',fontWeight:500 }}>{v||'—'}</div>
          </div>)}
        </div>
        <button onClick={()=>{logout();navigate('/')}} style={{ width:'100%',padding:'13px',background:'#fef2f2',border:'1.5px solid #fecaca',borderRadius:12,color:'#dc2626',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif' }}>Sign Out</button>
      </div>
    </AppShell>
  )
}
