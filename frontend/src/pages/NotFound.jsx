import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function NotFound() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#0f172a,#1e293b)',fontFamily:'Outfit,sans-serif',textAlign:'center',padding:24 }}>
      <div style={{ fontSize:100,fontWeight:800,background:'linear-gradient(135deg,#3b82f6,#6366f1)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1,marginBottom:16 }}>404</div>
      <h2 style={{ color:'#fff',fontSize:24,fontWeight:700,marginBottom:10 }}>Page not found</h2>
      <p style={{ color:'#64748b',fontSize:15,maxWidth:360,lineHeight:1.7,marginBottom:32 }}>The page you're looking for doesn't exist or you may not have permission to access it.</p>
      <button onClick={()=>navigate('/')} style={{ padding:'13px 32px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',borderRadius:12,color:'#fff',fontSize:16,fontWeight:700,cursor:'pointer' }}>← Go Home</button>
    </div>
  )
}
