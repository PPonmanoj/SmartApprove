import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { postJson, saveAuth } from '../api'

function Input({ label, error, ...p }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#475569',marginBottom:6,fontFamily:'Outfit,sans-serif' }}>{label}</label>
      <input {...p} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:'100%',padding:'12px 14px',border:`1.5px solid ${error?'#ef4444':focused?'#3b82f6':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box',transition:'border-color .15s' }} />
      {error && <p style={{ fontSize:12,color:'#ef4444',marginTop:5,fontWeight:500 }}>⚠ {error}</p>}
    </div>
  )
}

export default function LoginStudent() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ username:'', password:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setServerErr('') }

  const validate = () => {
    const e = {}
    if (!form.username.trim()) e.username = 'Roll number or email is required'
    if (!form.password)        e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const res = await postJson('/api/auth/login/', { username:form.username, password:form.password })
      saveAuth(res)
      // Check role from response and redirect accordingly
      const userRole = res.user?.role
      if (userRole === 'student') {
        navigate('/student/dashboard')
      } else if (userRole === 'staff') {
        // Staff user shouldn't login from student portal
        setServerErr('You are registered as staff. Please use the staff login instead.')
      } else {
        setServerErr('Invalid user role. Please contact support.')
      }
    } catch(err) {
      setServerErr('Invalid credentials. Please check your roll number and password.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f1f5f9 0%,#e0e7ff 100%)' }}>
      <div style={{ width:'100%',maxWidth:420,background:'#fff',borderRadius:20,boxShadow:'0 8px 40px rgba(0,0,0,.12)',padding:'48px 40px' }}>
        <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:36 }}>
          <div style={{ width:38,height:38,background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18,cursor:'pointer' }} onClick={()=>navigate('/')}>✓</div>
          <span style={{ fontWeight:700,fontSize:18,fontFamily:'Outfit,sans-serif',color:'#0f172a' }}>ApproveX</span>
        </div>

        <h2 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:6,fontFamily:'Outfit,sans-serif' }}>Welcome back 👋</h2>
        <p style={{ color:'#64748b',fontSize:14,marginBottom:28,fontFamily:'Outfit,sans-serif' }}>Sign in to your student account</p>

        <form onSubmit={handleSubmit} noValidate>
          <Input label="ROLL NUMBER / EMAIL" placeholder="21CS001 or you@college.edu" value={form.username} onChange={e=>set('username',e.target.value)} error={errors.username} />
          <Input label="PASSWORD" type="password" placeholder="Your password" value={form.password} onChange={e=>set('password',e.target.value)} error={errors.password} />

          {serverErr && <div style={{ padding:'11px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#dc2626',fontSize:13,marginBottom:16 }}>{serverErr}</div>}

          <button type="submit" disabled={loading} style={{ width:'100%',padding:'13px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:loading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:20 }}>
            {loading && <span style={{ width:15,height:15,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>}
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ textAlign:'center',color:'#64748b',fontSize:13,fontFamily:'Outfit,sans-serif' }}>
          Don't have an account? <Link to="/student/signup" style={{ color:'#3b82f6',fontWeight:600 }}>Sign up</Link>
        </p>
        <p style={{ textAlign:'center',marginTop:12,color:'#94a3b8',fontSize:13,fontFamily:'Outfit,sans-serif' }}>
          Are you staff? <Link to="/staff/login" style={{ color:'#6366f1',fontWeight:600 }}>Staff Login →</Link>
        </p>
      </div>
    </div>
  )
}
