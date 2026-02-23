import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { postJson, saveAuth } from '../api'
const CLASSES={BE_CSE_G1:'BE CSE – Group 1',BE_CSE_G2:'BE CSE – Group 2',BE_CSE_AI_ML:'BE CSE (AI & ML)'}
const DEPTS={BE_CSE:'BE CSE',BE_EEE:'BE EEE',BE_ECE:'BE ECE'}
const DEANS={ACADEMIC:'Academic',AUTONOMOUS:'Autonomous',ADMIN:'Administrative',PLACEMENT:'Placement',STUDENT_AFFAIRS:'Student Affairs'}
function Field({label,error,children}){return(<div style={{marginBottom:16}}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#475569',marginBottom:5,fontFamily:'Outfit,sans-serif'}}>{label}</label>{children}{error&&<p style={{fontSize:12,color:'#ef4444',marginTop:4,fontWeight:500}}>⚠ {error}</p>}</div>)}
function Input({error,...p}){const[f,setF]=useState(false);return<input {...p} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:'100%',padding:'10px 13px',border:`1.5px solid ${error?'#ef4444':f?'#6366f1':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box'}}/>}
function Sel({error,children,...p}){return<select {...p} style={{width:'100%',padding:'10px 13px',border:`1.5px solid ${error?'#ef4444':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box'}}>{children}</select>}
export default function StaffSignup(){
  const navigate=useNavigate()
  const[form,setForm]=useState({username:'',name:'',designation:'',classCode:'',hodDept:'',deanType:'',email:'',mobile:'',password:'',confirm:''})
  const[errors,setErrors]=useState({});const[loading,setLoading]=useState(false);const[serverErr,setServerErr]=useState('')
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:''}));setServerErr('')}
  const validate=()=>{const e={};if(!form.username.trim())e.username='Username is required';if(!form.name.trim())e.name='Full name required';if(!form.designation)e.designation='Select designation';if(!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))e.email='Valid email required';if(!/^\d{10}$/.test(form.mobile))e.mobile='10-digit mobile required';if(form.password.length<6)e.password='Min 6 characters';if(form.password!==form.confirm)e.confirm='Passwords do not match';return e}
  const handleSubmit=async e=>{e.preventDefault();const ev=validate();if(Object.keys(ev).length){setErrors(ev);return}setLoading(true)
    try{const body={username:form.username,password:form.password,name:form.name,email:form.email,mobile:form.mobile,designation:form.designation||'OTHER'}
    if(['TUTOR','PROGRAM_COORDINATOR'].includes(form.designation))body.class_code=form.classCode
    if(form.designation==='HOD')body.hod_department_code=form.hodDept
    if(form.designation==='DEAN')body.dean_type=form.deanType
    const res=await postJson('/api/auth/staff/signup/',body);saveAuth(res);if(res.user?.role==='staff'){navigate('/staff/dashboard')}else{setServerErr('Account created but role verification failed. Please contact support.')}}
    catch(err){setServerErr(typeof err==='string'?err:JSON.stringify(err))}finally{setLoading(false)}}
  return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f1f5f9 0%,#ede9fe 100%)',padding:'24px'}}>
      <div style={{width:'100%',maxWidth:520,background:'#fff',borderRadius:20,boxShadow:'0 8px 40px rgba(0,0,0,.12)',padding:'40px'}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:28,cursor:'pointer'}} onClick={()=>navigate('/')}>
          <div style={{width:34,height:34,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:16}}>✓</div>
          <span style={{fontWeight:700,fontSize:17,fontFamily:'Outfit,sans-serif',color:'#0f172a'}}>ApproveX</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif'}}>Staff Registration</h2>
        <p style={{color:'#64748b',fontSize:13,marginBottom:24,fontFamily:'Outfit,sans-serif'}}>Already registered? <Link to="/staff/login" style={{color:'#6366f1',fontWeight:600}}>Sign in</Link></p>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="USERNAME" error={errors.username}><Input placeholder="staff_username" value={form.username} onChange={e=>set('username',e.target.value)} error={errors.username}/></Field>
            <Field label="FULL NAME" error={errors.name}><Input placeholder="Dr. Priya Sharma" value={form.name} onChange={e=>set('name',e.target.value)} error={errors.name}/></Field>
          </div>
          <Field label="DESIGNATION" error={errors.designation}>
            <Sel value={form.designation} onChange={e=>set('designation',e.target.value)} error={errors.designation}>
              <option value="">Select your role</option>
              <option value="TUTOR">Tutor</option><option value="PROGRAM_COORDINATOR">Program Coordinator</option>
              <option value="HOD">Head of Department</option><option value="DEAN">Dean</option>
              <option value="PRINCIPAL">Principal</option><option value="OTHER">Other</option>
            </Sel>
          </Field>
          {['TUTOR','PROGRAM_COORDINATOR'].includes(form.designation)&&<Field label="CLASS ASSIGNED"><Sel value={form.classCode} onChange={e=>set('classCode',e.target.value)}><option value="">Select class</option>{Object.entries(CLASSES).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Sel></Field>}
          {form.designation==='HOD'&&<Field label="DEPARTMENT"><Sel value={form.hodDept} onChange={e=>set('hodDept',e.target.value)}><option value="">Select department</option>{Object.entries(DEPTS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Sel></Field>}
          {form.designation==='DEAN'&&<Field label="DEAN TYPE"><Sel value={form.deanType} onChange={e=>set('deanType',e.target.value)}><option value="">Select dean type</option>{Object.entries(DEANS).map(([k,v])=><option key={k} value={k}>{v}</option>)}</Sel></Field>}
          <Field label="OFFICIAL EMAIL" error={errors.email}><Input type="email" placeholder="you@college.edu" value={form.email} onChange={e=>set('email',e.target.value)} error={errors.email}/></Field>
          <Field label="MOBILE NUMBER" error={errors.mobile}><div style={{position:'relative'}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:13}}>+91</span><Input placeholder="9876543210" value={form.mobile} onChange={e=>set('mobile',e.target.value.replace(/\D/g,'').slice(0,10))} error={errors.mobile} style={{paddingLeft:44}}/></div></Field>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
            <Field label="PASSWORD" error={errors.password}><Input type="password" placeholder="Min 6 chars" value={form.password} onChange={e=>set('password',e.target.value)} error={errors.password}/></Field>
            <Field label="CONFIRM" error={errors.confirm}><Input type="password" placeholder="Re-enter" value={form.confirm} onChange={e=>set('confirm',e.target.value)} error={errors.confirm}/></Field>
          </div>
          {serverErr&&<div style={{padding:'10px 13px',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:8,color:'#dc2626',fontSize:13,marginBottom:14}}>{serverErr}</div>}
          <button type="submit" disabled={loading} style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:700,cursor:loading?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:loading?.7:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
            {loading&&<span style={{width:15,height:15,border:'2px solid #fff',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block'}}/>}{loading?'Creating account…':'Create Staff Account →'}
          </button>
        </form>
      </div>
    </div>
  )
}
