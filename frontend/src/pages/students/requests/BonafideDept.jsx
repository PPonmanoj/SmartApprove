import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, getAccessToken } from '../../../api'
import AppShell from '../../../components/AppShell'

const NAV = [
  { icon:'🏠', label:'Dashboard',   path:'/student/dashboard' },
  { icon:'📋', label:'New Request', path:'/newRequest' },
  { icon:'⏳', label:'My Requests', path:'/pendingRequests' },
  { icon:'📜', label:'History',     path:'/requestHistory' },
  { icon:'👤', label:'Profile',     path:'/student/profile' },
]

function Field({ label, required, error, children, hint }) {
  return (
    <div style={{ marginBottom:20 }}>
      <label style={{ display:'flex',alignItems:'center',gap:4,fontSize:12,fontWeight:700,color:'#475569',marginBottom:6,letterSpacing:.3 }}>
        {label}{required&&<span style={{ color:'#ef4444' }}>*</span>}
      </label>
      {children}
      {hint&&!error&&<p style={{ fontSize:11,color:'#94a3b8',marginTop:4 }}>{hint}</p>}
      {error&&<p style={{ fontSize:12,color:'#ef4444',marginTop:5,fontWeight:500 }}>⚠ {error}</p>}
    </div>
  )
}

function Input({ error, ...p }) {
  const [f,setF]=useState(false)
  return <input {...p} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{ width:'100%',padding:'11px 14px',border:`1.5px solid ${error?'#ef4444':f?'#3b82f6':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:p.disabled?'#f8fafc':'#fff',outline:'none',boxSizing:'border-box',transition:'border-color .15s' }}/>
}

export default function BonafideDept() {
  const navigate    = useNavigate()
  const user        = getUser()
  const studentName = user?.name || user?.username || ''
  const rollNumber  = user?.username || ''

  const [contact, setContact]   = useState('')
  const [reason, setReason]     = useState('')
  const [file, setFile]         = useState(null)
  const [fileName, setFileName] = useState('')
  const [errors, setErrors]     = useState({})

  const [checkLoading, setCheckLoading] = useState(false)
  const [submitLoading, setSubLoading]  = useState(false)
  const [aiResult, setAiResult]         = useState(null)
  const [showModal, setShowModal]       = useState(false)
  const [submitMsg, setSubmitMsg]       = useState(null)

  const validate = () => {
    const e = {}
    if (!contact || !/^\d{10}$/.test(contact)) e.contact = 'Enter a valid 10-digit mobile number'
    if (!reason.trim())                          e.reason  = 'Reason is required'
    if (!file)                                   e.file    = 'Permission letter PDF is required'
    return e
  }

  const handleFile = e => {
    const f = e.target.files[0]
    if (!f) return
    if (f.type !== 'application/pdf') { setErrors(prev=>({...prev,file:'Only PDF files are accepted'})); return }
    if (f.size > 5*1024*1024)        { setErrors(prev=>({...prev,file:'File size must be under 5MB'})); return }
    setFile(f); setFileName(f.name); setErrors(prev=>({...prev,file:''})); setAiResult(null)
  }

  const checkValidity = async () => {
    const e = {}
    if (!file) { e.file='Attach a PDF before checking'; setErrors(e); return }
    setCheckLoading(true); setErrors({})
    try {
      const form = new FormData()
      form.append('file', file)
      const token = getAccessToken()
      const res = await fetch('http://localhost:8000/api/auth/bonafide/check/', { method:'POST', headers:token?{Authorization:`Bearer ${token}`}:{}, body:form })
      if (!res.ok) throw new Error((await res.json())?.detail||'Check failed')
      const data = await res.json()
      setAiResult(data); setShowModal(true)
    } catch(err) { setErrors({file:err.message||'AI check failed. Try again.'}) }
    finally { setCheckLoading(false) }
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const ev = validate()
    if (Object.keys(ev).length) { setErrors(ev); return }
    setSubLoading(true); setSubmitMsg(null)
    try {
      const form = new FormData()
      form.append('student_name', studentName)
      form.append('roll_number', rollNumber)
      form.append('contact', contact)
      form.append('reason', reason)
      form.append('file', file)
      form.append('purpose', 'bonafide')
      if (aiResult) {
        form.append('pre_extracted', JSON.stringify(aiResult.extracted||{}))
        form.append('pre_checklist', JSON.stringify(aiResult.checklist||{}))
        form.append('pre_is_valid', String(aiResult.is_valid??false))
      }
      const token = getAccessToken()
      const res = await fetch('http://localhost:8000/api/auth/bonafide/submit/', { method:'POST', headers:token?{Authorization:`Bearer ${token}`}:{}, body:form })
      if (!res.ok) { const j=await res.json(); throw new Error(j?.detail||'Submit failed') }
      const data = await res.json()
      setSubmitMsg({ type:'success', id:data.id, text:'🎉 Request submitted! Track it below.' })
      setContact(''); setReason(''); setFile(null); setFileName(''); setAiResult(null)
    } catch(err) { setSubmitMsg({ type:'error', text:err.message||'Submission failed. Try again.' }) }
    finally { setSubLoading(false) }
  }

  return (
    <AppShell navItems={NAV}>
      <div style={{ maxWidth:680,margin:'0 auto' }}>
        <button onClick={()=>navigate('/newRequest')} style={{ background:'none',border:'none',color:'#64748b',fontSize:13,cursor:'pointer',marginBottom:20,padding:0,fontFamily:'Outfit,sans-serif' }}>← Back to Request Types</button>

        <div style={{ marginBottom:24 }}>
          <h1 style={{ fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif' }}>Bonafide Certificate Request</h1>
          <p style={{ color:'#64748b',fontSize:14 }}>Upload your signed permission letter and we'll AI-validate it before submission.</p>
        </div>

        {/* AI tips banner */}
        <div style={{ background:'linear-gradient(135deg,#eff6ff,#f0fdf4)',border:'1px solid #bfdbfe',borderRadius:12,padding:'14px 18px',marginBottom:24,display:'flex',alignItems:'flex-start',gap:12 }}>
          <span style={{ fontSize:22 }}>🤖</span>
          <div>
            <div style={{ fontWeight:700,fontSize:13,color:'#1e40af',marginBottom:3 }}>AI Pre-Validation Active</div>
            <div style={{ fontSize:12,color:'#334155',lineHeight:1.6 }}>Click "Check with AI" after uploading your PDF. The AI will verify name, roll number, department, reason, and signature before you submit — catching errors early.</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ background:'#fff',borderRadius:16,padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:20 }}>STUDENT INFORMATION</h3>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px' }}>
              <Field label="FULL NAME"><Input value={studentName} disabled /></Field>
              <Field label="ROLL NUMBER"><Input value={rollNumber} disabled /></Field>
            </div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 20px' }}>
              <Field label="MOBILE NUMBER" required error={errors.contact} hint="10-digit number, no spaces">
                <div style={{ position:'relative' }}>
                  <span style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:13 }}>+91</span>
                  <Input placeholder="9876543210" value={contact} onChange={e=>{ const v=e.target.value.replace(/\D/g,'').slice(0,10); setContact(v); setErrors(p=>({...p,contact:''})) }} error={errors.contact} style={{ paddingLeft:44 }} />
                </div>
              </Field>
              <Field label="REASON FOR BONAFIDE" required error={errors.reason}>
                <Input placeholder="e.g. Bank account opening" value={reason} onChange={e=>{ setReason(e.target.value); setErrors(p=>({...p,reason:''})) }} error={errors.reason} />
              </Field>
            </div>
          </div>

          <div style={{ background:'#fff',borderRadius:16,padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20 }}>
            <h3 style={{ fontSize:14,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:20 }}>PERMISSION LETTER (PDF)</h3>
            <Field label="UPLOAD DOCUMENT" required error={errors.file} hint="Max 5MB • PDF only">
              <label style={{ display:'block',border:`2px dashed ${errors.file?'#ef4444':file?'#22c55e':'#e2e8f0'}`,borderRadius:12,padding:'28px',textAlign:'center',cursor:'pointer',background:file?'#f0fdf4':'#fafafa',transition:'all .2s' }}
                onMouseEnter={e=>{if(!file)e.currentTarget.style.borderColor='#3b82f6'}}
                onMouseLeave={e=>{if(!file)e.currentTarget.style.borderColor=errors.file?'#ef4444':'#e2e8f0'}}>
                <input type="file" accept=".pdf" hidden onChange={handleFile} />
                <div style={{ fontSize:32,marginBottom:8 }}>{file?'✅':'📄'}</div>
                <div style={{ fontWeight:600,fontSize:14,color:file?'#15803d':'#334155',marginBottom:4 }}>{file?fileName:'Click to upload permission letter'}</div>
                <div style={{ fontSize:12,color:'#94a3b8' }}>{file?'Click to replace file':'PDF files only, max 5MB'}</div>
              </label>
            </Field>

            {/* AI Check Button */}
            <button type="button" onClick={checkValidity} disabled={!file||checkLoading} style={{ width:'100%',padding:'12px',background:file?'linear-gradient(135deg,#0f172a,#1e293b)':'#f1f5f9',border:'none',borderRadius:10,color:file?'#fff':'#94a3b8',fontSize:14,fontWeight:600,cursor:file&&!checkLoading?'pointer':'not-allowed',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:0 }}>
              {checkLoading&&<span style={{ width:15,height:15,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>}
              {checkLoading?'Analyzing document with AI…':'🤖 Check with AI Before Submitting'}
            </button>

            {/* AI result inline summary */}
            {aiResult && !showModal && (
              <div style={{ marginTop:14,padding:'14px 16px',borderRadius:10,background:aiResult.is_valid?'#f0fdf4':'#fff7ed',border:`1px solid ${aiResult.is_valid?'#bbf7d0':'#fed7aa'}`,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:700,fontSize:13,color:aiResult.is_valid?'#15803d':'#c2410c',marginBottom:2 }}>{aiResult.is_valid?'✅ All fields verified — ready to submit':'⚠️ Some fields missing — review before submitting'}</div>
                  <div style={{ fontSize:11,color:'#64748b' }}>{Object.values(aiResult.checklist||{}).filter(v=>v.startsWith('✅')).length} of {Object.keys(aiResult.checklist||{}).length} checks passed</div>
                </div>
                <button type="button" onClick={()=>setShowModal(true)} style={{ padding:'6px 12px',background:'rgba(0,0,0,.06)',border:'none',borderRadius:7,fontSize:12,fontWeight:600,cursor:'pointer',color:'#334155' }}>View Details</button>
              </div>
            )}
          </div>

          {submitMsg && (
            <div style={{ padding:'14px 18px',borderRadius:12,marginBottom:16,background:submitMsg.type==='success'?'#f0fdf4':'#fef2f2',border:`1px solid ${submitMsg.type==='success'?'#bbf7d0':'#fecaca'}` }}>
              <div style={{ fontWeight:700,fontSize:14,color:submitMsg.type==='success'?'#15803d':'#dc2626',marginBottom:submitMsg.id?6:0 }}>{submitMsg.text}</div>
              {submitMsg.id&&<button type="button" onClick={()=>navigate(`/requestStatus/${submitMsg.id}`)} style={{ padding:'7px 14px',background:'#16a34a',border:'none',borderRadius:7,color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer' }}>Track Approval →</button>}
            </div>
          )}

          <button type="submit" disabled={submitLoading} style={{ width:'100%',padding:'13px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:700,cursor:submitLoading?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:submitLoading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            {submitLoading&&<span style={{ width:15,height:15,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>}
            {submitLoading?'Submitting…':'📤 Submit for Approval'}
          </button>
        </form>
      </div>

      {/* AI Result Modal */}
      {showModal && aiResult && (
        <div onClick={()=>setShowModal(false)} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:16 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'#fff',borderRadius:20,width:'100%',maxWidth:580,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,.3)' }}>
            {/* Modal header */}
            <div style={{ padding:'20px 24px',borderBottom:'1px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,background:'#fff',borderRadius:'20px 20px 0 0' }}>
              <div>
                <div style={{ fontWeight:700,fontSize:17,color:'#0f172a' }}>🤖 AI Document Analysis</div>
                <div style={{ fontSize:12,color:'#64748b',marginTop:2 }}>Powered by Llama 3.1 (Groq)</div>
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                <span style={{ padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:700,background:aiResult.is_valid?'#dcfce7':'#fff7ed',color:aiResult.is_valid?'#15803d':'#c2410c',border:`1px solid ${aiResult.is_valid?'#bbf7d0':'#fed7aa'}` }}>
                  {aiResult.is_valid?'✅ Valid':'⚠️ Incomplete'}
                </span>
                <button onClick={()=>setShowModal(false)} style={{ width:32,height:32,borderRadius:8,border:'1px solid #e2e8f0',background:'#f8fafc',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>✕</button>
              </div>
            </div>

            <div style={{ padding:'20px 24px' }}>
              {/* Checklist */}
              <h4 style={{ fontSize:12,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:12 }}>FIELD VALIDATION</h4>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20 }}>
                {Object.entries(aiResult.checklist||{}).filter(([k])=>k!=='AI Reasoning').map(([k,v])=>(
                  <div key={k} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:10,background:v.startsWith('✅')?'#f0fdf4':'#fef2f2',border:`1px solid ${v.startsWith('✅')?'#bbf7d0':'#fecaca'}` }}>
                    <span style={{ fontSize:16 }}>{v.startsWith('✅')?'✅':'❌'}</span>
                    <div><div style={{ fontSize:12,fontWeight:700,color:'#0f172a' }}>{k}</div>
                    {!v.startsWith('✅')&&<div style={{ fontSize:11,color:'#dc2626' }}>Not found in document</div>}</div>
                  </div>
                ))}
              </div>

              {/* Extracted fields */}
              {aiResult.extracted && (
                <>
                  <h4 style={{ fontSize:12,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:12 }}>EXTRACTED DATA</h4>
                  <div style={{ background:'#f8fafc',borderRadius:10,overflow:'hidden',marginBottom:20 }}>
                    {[['Name',aiResult.extracted.name],['Roll Number',aiResult.extracted.roll_number],['Department',aiResult.extracted.department],['Reason',aiResult.extracted.reason],['Signature',aiResult.extracted.has_signature?'Present ✓':'Not found']].filter(([,v])=>v).map(([l,v],i)=>(
                      <div key={l} style={{ display:'flex',padding:'10px 14px',borderBottom:i<4?'1px solid #f1f5f9':undefined }}>
                        <div style={{ width:120,fontSize:12,fontWeight:600,color:'#64748b',flexShrink:0 }}>{l}</div>
                        <div style={{ fontSize:13,color:'#0f172a' }}>{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* AI reasoning */}
              {aiResult.extracted?.explanation && (
                <div style={{ padding:'14px',borderRadius:10,background:'#f0f9ff',border:'1px solid #bae6fd',marginBottom:20 }}>
                  <div style={{ fontSize:11,fontWeight:700,color:'#0369a1',marginBottom:6 }}>🤖 AI REASONING</div>
                  <div style={{ fontSize:13,color:'#0c4a6e',lineHeight:1.7 }}>{aiResult.extracted.explanation}</div>
                </div>
              )}

              {!aiResult.is_valid && (
                <div style={{ padding:'12px 14px',borderRadius:10,background:'#fff7ed',border:'1px solid #fed7aa',marginBottom:16 }}>
                  <div style={{ fontWeight:700,fontSize:13,color:'#c2410c',marginBottom:4 }}>⚠️ Fix before submitting</div>
                  <div style={{ fontSize:12,color:'#78350f',lineHeight:1.6 }}>Your document is missing required fields. You can still submit, but the tutor may reject it. Consider getting a corrected letter signed by your HOD.</div>
                </div>
              )}

              <div style={{ display:'flex',gap:10 }}>
                <button onClick={()=>setShowModal(false)} style={{ flex:1,padding:'12px',background:'#f1f5f9',border:'none',borderRadius:10,fontWeight:600,fontSize:14,cursor:'pointer',fontFamily:'Outfit,sans-serif',color:'#475569' }}>Close</button>
                <button onClick={()=>{setShowModal(false);document.querySelector('form')?.requestSubmit?.()}} style={{ flex:2,padding:'12px',background:'linear-gradient(135deg,#3b82f6,#6366f1)',border:'none',borderRadius:10,color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer',fontFamily:'Outfit,sans-serif' }}>Submit Anyway →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
