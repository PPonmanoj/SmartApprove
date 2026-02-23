import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { postJson, saveAuth } from '../api'

const CLASSES = { BE_CSE_G1:'BE CSE – Group 1', BE_CSE_G2:'BE CSE – Group 2', BE_CSE_AI_ML:'BE CSE (AI & ML)' }

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#475569', marginBottom:6, letterSpacing:.3 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize:12, color:'#ef4444', marginTop:5, fontWeight:500 }}>⚠ {error}</p>}
    </div>
  )
}

function Input({ error, ...p }) {
  const [focused, setFocused] = useState(false)
  return <input {...p} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} style={{ width:'100%', padding:'11px 14px', border:`1.5px solid ${error?'#ef4444':focused?'#3b82f6':'#e2e8f0'}`, borderRadius:9, fontSize:14, fontFamily:'Outfit,sans-serif', color:'#0f172a', background:'#fff', outline:'none', boxSizing:'border-box', transition:'border-color .15s' }} />
}

export default function StudentSignup() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username:'', name:'', classCode:'', email:'', mobile:'', password:'', confirm:'' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverErr, setServerErr] = useState('')

  const set = (k,v) => { setForm(f=>({...f,[k]:v})); setErrors(e=>({...e,[k]:''})); setServerErr('') }

  const validate = () => {
    const e = {}
    if (!form.username.trim())            e.username = 'Roll number is required'
    if (!form.name.trim())                e.name = 'Full name is required'
    if (!form.classCode)                  e.classCode = 'Please select your class'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Enter a valid email address'
    if (!/^\d{10}$/.test(form.mobile))   e.mobile = 'Mobile must be exactly 10 digits'
    if (form.password.length < 6)         e.password = 'Password must be at least 6 characters'
    if (form.password !== form.confirm)   e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length) { setErrors(e2); return }
    setLoading(true)
    try {
      const res = await postJson('/api/auth/student/signup/', { username:form.username, password:form.password, name:form.name, email:form.email, class_code:form.classCode, mobile:form.mobile })
      saveAuth(res)
      // Verify student role before redirecting
      if (res.user?.role === 'student') {
        navigate('/student/dashboard')
      } else {
        setServerErr('Account created but role verification failed. Please contact support.')
      }
    } catch(err) {
      setServerErr(typeof err==='string'?err:JSON.stringify(err))
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#f1f5f9' }}>
      {/* Left panel */}
      <div style={{ width:420, background:'linear-gradient(160deg,#0f172a 60%,#1e3a5f)', display:'flex', flexDirection:'column', justifyContent:'center', padding:'60px 48px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:48 }}>
          <div style={{ width:36,height:36,background:'linear-gradient(135deg,#3b82f6,#6366f1)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:18 }}>✓</div>
          <span style={{ color:'#fff',fontWeight:700,fontSize:20,fontFamily:'Outfit,sans-serif' }}>ApproveX</span>
        </div>
        <h1 style={{ color:'#fff',fontSize:32,fontWeight:800,lineHeight:1.2,marginBottom:16,fontFamily:'Outfit,sans-serif' }}>Start your digital approval journey</h1>
        <p style={{ color:'#94a3b8',fontSize:15,lineHeight:1.7,marginBottom:40,fontFamily:'Outfit,sans-serif' }}>Submit requests, track approvals in real-time, and get AI-validated results — all in one place.</p>
        {[['📋','AI-validated submissions'],['⛓','Track Tutor → HOD → Dean'],['🔒','Secure JWT authentication']].map(([i,t])=>(
          <div key={t} style={{ display:'flex',gap:12,alignItems:'center',marginBottom:14 }}>
            <span style={{ fontSize:18 }}>{i}</span>
            <span style={{ color:'#cbd5e1',fontSize:14,fontFamily:'Outfit,sans-serif' }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Right form */}
      <div style={{ flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px' }}>
        <div style={{ width:'100%',maxWidth:460 }}>
          <h2 style={{ fontSize:26,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Create student account</h2>
          <p style={{ color:'#64748b',fontSize:14,marginBottom:32,fontFamily:'Outfit,sans-serif' }}>Already have one? <Link to="/student/login" style={{ color:'#3b82f6',fontWeight:600 }}>Sign in</Link></p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
              <Field label="ROLL NUMBER" error={errors.username}><Input placeholder="21CS001" value={form.username} onChange={e=>set('username',e.target.value)} error={errors.username} /></Field>
              <Field label="FULL NAME" error={errors.name}><Input placeholder="Arjun Kumar" value={form.name} onChange={e=>set('name',e.target.value)} error={errors.name} /></Field>
            </div>

            <Field label="CLASS / SECTION" error={errors.classCode}>
              <select value={form.classCode} onChange={e=>set('classCode',e.target.value)} style={{ width:'100%',padding:'11px 14px',border:`1.5px solid ${errors.classCode?'#ef4444':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box' }}>
                <option value="">Select your class</option>
                {Object.entries(CLASSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </Field>

            <Field label="OFFICIAL EMAIL" error={errors.email}><Input type="email" placeholder="21cs001@college.edu" value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email} /></Field>

            <Field label="MOBILE NUMBER" error={errors.mobile}>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#64748b',fontSize:14 }}>+91</span>
                <Input placeholder="98765 43210" value={form.mobile} onChange={e=>{ const v=e.target.value.replace(/\D/g,'').slice(0,10); set('mobile',v) }} error={errors.mobile} style={{ paddingLeft:48 }} />
              </div>
            </Field>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px' }}>
              <Field label="PASSWORD" error={errors.password}><Input type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} error={errors.password} /></Field>
              <Field label="CONFIRM PASSWORD" error={errors.confirm}><Input type="password" placeholder="Re-enter password" value={form.confirm} onChange={e=>set('confirm',e.target.value)} error={errors.confirm} /></Field>
            </div>

            {serverErr && <div style={{ padding:'12px 14px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#dc2626',fontSize:13,marginBottom:16 }}>{serverErr}</div>}

            <button type="submit" disabled={loading} style={{ width:'100%',padding:'13px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',borderRadius:10,color:'#fff',fontSize:16,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:loading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
              {loading && <span style={{ width:16,height:16,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>}
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
