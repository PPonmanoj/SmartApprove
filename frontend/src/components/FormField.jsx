import React from 'react'

export function FormField({ label, error, children, required }) {
  return (
    <div style={{ marginBottom:20 }}>
      {label && <label style={{ display:'block',fontSize:13,fontWeight:600,color:'var(--navy2)',marginBottom:6 }}>
        {label}{required&&<span style={{color:'var(--red)',marginLeft:3}}>*</span>}
      </label>}
      {children}
      {error && <p style={{ fontSize:12,color:'var(--red)',marginTop:5,fontWeight:500 }}>⚠ {error}</p>}
    </div>
  )
}

export function Input({ error, ...props }) {
  return (
    <input {...props} style={{
      width:'100%', padding:'11px 14px', border:`1.5px solid ${error?'var(--red)':'var(--border)'}`,
      borderRadius:9, fontSize:14, fontFamily:'var(--font)', color:'var(--navy)',
      background:'var(--white)', outline:'none', transition:'border-color .15s',
      ...props.style
    }}
    onFocus={e=>{ if(!error) e.target.style.borderColor='var(--blue)' }}
    onBlur={e=>{ if(!error) e.target.style.borderColor='var(--border)' }} />
  )
}

export function Select({ error, children, ...props }) {
  return (
    <select {...props} style={{
      width:'100%', padding:'11px 14px', border:`1.5px solid ${error?'var(--red)':'var(--border)'}`,
      borderRadius:9, fontSize:14, fontFamily:'var(--font)', color:'var(--navy)',
      background:'var(--white)', outline:'none', cursor:'pointer', ...props.style
    }}>
      {children}
    </select>
  )
}

export function Btn({ variant='primary', loading, children, ...props }) {
  const styles = {
    primary:  { background:'var(--blue)',border:'none',color:'#fff' },
    success:  { background:'var(--green)',border:'none',color:'#fff' },
    danger:   { background:'var(--red)',border:'none',color:'#fff' },
    ghost:    { background:'transparent',border:'1.5px solid var(--border)',color:'var(--navy2)' },
  }
  return (
    <button {...props} disabled={loading||props.disabled} style={{
      padding:'11px 24px', borderRadius:9, fontSize:14, fontWeight:600, cursor:loading||props.disabled?'not-allowed':'pointer',
      opacity:loading||props.disabled?.85:1, transition:'all .2s', display:'inline-flex', alignItems:'center', gap:8,
      ...styles[variant], ...props.style
    }}
    onMouseEnter={e=>{ if(!loading&&!props.disabled) e.currentTarget.style.opacity='.85' }}
    onMouseLeave={e=>{ e.currentTarget.style.opacity='1' }}>
      {loading && <span style={{ width:14,height:14,border:'2px solid currentColor',borderTopColor:'transparent',borderRadius:'50%',animation:'spin .7s linear infinite',display:'inline-block' }}/>}
      {children}
    </button>
  )
}
