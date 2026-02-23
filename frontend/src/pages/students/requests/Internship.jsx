import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../../../components/AppShell'
const NAV=[{icon:'🏠',label:'Dashboard',path:'/student/dashboard'},{icon:'📋',label:'New Request',path:'/newRequest'},{icon:'⏳',label:'My Requests',path:'/pendingRequests'},{icon:'📜',label:'History',path:'/requestHistory'},{icon:'👤',label:'Profile',path:'/student/profile'}]
function Field({label,required,error,children}){return(<div style={{marginBottom:18}}><label style={{display:'block',fontSize:12,fontWeight:700,color:'#475569',marginBottom:6}}>{label}{required&&<span style={{color:'#ef4444',marginLeft:3}}>*</span>}</label>{children}{error&&<p style={{fontSize:12,color:'#ef4444',marginTop:5,fontWeight:500}}>⚠ {error}</p>}</div>)}
function Input({error,...p}){const[f,setF]=useState(false);return<input {...p} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:'100%',padding:'11px 14px',border:`1.5px solid ${error?'#ef4444':f?'#3b82f6':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box'}}/>}
export default function Internship(){
  const navigate=useNavigate()
  const[form,setForm]=useState({company:'',type:'',start:'',end:'',parentMobile:''})
  const[files,setFiles]=useState({permission:'',offer:'',parent:''})
  const[fileObjs,setFileObjs]=useState({permission:null,offer:null,parent:null})
  const[errors,setErrors]=useState({});const[msg,setMsg]=useState(null)
  const set=(k,v)=>{setForm(f=>({...f,[k]:v}));setErrors(e=>({...e,[k]:''})) }
  const handleFile=(e,key)=>{const f=e.target.files[0];if(!f)return;setFiles(p=>({...p,[key]:f.name}));setFileObjs(p=>({...p,[key]:f}))}
  const validate=()=>{const e={};if(!form.company.trim())e.company='Company name required';if(!form.type)e.type='Select internship type';if(!form.start)e.start='Start date required';if(!form.end)e.end='End date required';if(form.parentMobile&&!/^\d{10}$/.test(form.parentMobile))e.parentMobile='10-digit number';if(!fileObjs.permission)e.permission='Permission letter required';if(!fileObjs.offer)e.offer='Offer letter required';return e}
  const handleSubmit=e=>{e.preventDefault();const ev=validate();if(Object.keys(ev).length){setErrors(ev);return}setMsg({type:'info',text:'⏳ Internship backend coming soon. All data validated and saved locally.'})}
  return(
    <AppShell navItems={NAV}>
      <div style={{maxWidth:680,margin:'0 auto'}}>
        <button onClick={()=>navigate('/newRequest')} style={{background:'none',border:'none',color:'#64748b',fontSize:13,cursor:'pointer',marginBottom:20,padding:0,fontFamily:'Outfit,sans-serif'}}>← Back to Request Types</button>
        <div style={{marginBottom:24}}><h1 style={{fontSize:24,fontWeight:700,color:'#0f172a',marginBottom:4,fontFamily:'Outfit,sans-serif'}}>Internship Request</h1><p style={{color:'#64748b',fontSize:14}}>Upload your offer letter, permission and parent consent forms.</p></div>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:20}}>INTERNSHIP DETAILS</h3>
            <Field label="COMPANY NAME" required error={errors.company}><Input placeholder="Google India Pvt. Ltd." value={form.company} onChange={e=>set('company',e.target.value)} error={errors.company}/></Field>
            <Field label="INTERNSHIP TYPE" required error={errors.type}>
              <select value={form.type} onChange={e=>set('type',e.target.value)} style={{width:'100%',padding:'11px 14px',border:`1.5px solid ${errors.type?'#ef4444':'#e2e8f0'}`,borderRadius:9,fontSize:14,fontFamily:'Outfit,sans-serif',color:'#0f172a',background:'#fff',outline:'none',boxSizing:'border-box'}}>
                <option value="">Select type</option><option>Summer Internship</option><option>Winter Internship</option><option>Part-time</option><option>Industrial Training</option>
              </select>
            </Field>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 16px'}}>
              <Field label="START DATE" required error={errors.start}><Input type="date" value={form.start} onChange={e=>set('start',e.target.value)} error={errors.start}/></Field>
              <Field label="END DATE"   required error={errors.end}><Input type="date" value={form.end} onChange={e=>set('end',e.target.value)} error={errors.end}/></Field>
            </div>
            <Field label="PARENT CONTACT" error={errors.parentMobile}><div style={{position:'relative'}}><span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',fontSize:13}}>+91</span><Input placeholder="9876543210" value={form.parentMobile} onChange={e=>set('parentMobile',e.target.value.replace(/\D/g,'').slice(0,10))} error={errors.parentMobile} style={{paddingLeft:44}}/></div></Field>
          </div>
          <div style={{background:'#fff',borderRadius:16,padding:'24px',boxShadow:'0 1px 3px rgba(0,0,0,.08)',marginBottom:20}}>
            <h3 style={{fontSize:13,fontWeight:700,color:'#94a3b8',letterSpacing:.5,marginBottom:20}}>DOCUMENTS</h3>
            {[['permission','Permission Letter','Required'],['offer','Offer Letter','Required'],['parent','Parent Consent','Optional']].map(([key,label,hint])=>(
              <div key={key} style={{marginBottom:14}}>
                <label style={{display:'block',border:`2px dashed ${errors[key]?'#ef4444':fileObjs[key]?'#22c55e':'#e2e8f0'}`,borderRadius:10,padding:'16px',textAlign:'center',cursor:'pointer',background:fileObjs[key]?'#f0fdf4':'#fafafa'}}>
                  <input type="file" accept=".pdf" hidden onChange={e=>handleFile(e,key)}/>
                  <div style={{fontSize:18,marginBottom:4}}>{fileObjs[key]?'✅':'📎'}</div>
                  <div style={{fontWeight:600,fontSize:13,color:fileObjs[key]?'#15803d':'#334155'}}>{fileObjs[key]?files[key]:label}</div>
                  <div style={{fontSize:11,color:'#94a3b8',marginTop:2}}>{hint} • PDF only</div>
                </label>
                {errors[key]&&<p style={{fontSize:12,color:'#ef4444',marginTop:4,fontWeight:500}}>⚠ {errors[key]}</p>}
              </div>
            ))}
          </div>
          {msg&&<div style={{padding:'14px 18px',borderRadius:12,marginBottom:16,background:'#eff6ff',border:'1px solid #bfdbfe',color:'#1d4ed8',fontSize:13,fontWeight:600}}>{msg.text}</div>}
          <button type="submit" style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:10,color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',fontFamily:'Outfit,sans-serif',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>📤 Submit Internship Request</button>
        </form>
      </div>
    </AppShell>
  )
}
