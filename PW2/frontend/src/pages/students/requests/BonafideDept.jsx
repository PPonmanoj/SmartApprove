import React from 'react'
import './BonafideDept.css'
import { getUser } from '../../../api'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BonafideDept = () => {
  const [files, setFiles] = useState({
    permission: 'Permission Letter (required)'
  })
  const [fileObjs, setFileObjs] = useState({
    permission: null
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // URL for previewing the uploaded permission PDF
  const [fileUrl, setFileUrl] = useState(null)

  // add state for submit feedback
  const [submitMessage, setSubmitMessage] = useState(null)

  // helper to read JWT from localStorage (common keys)
  const getJwtToken = () => {
    return localStorage.getItem('access') ||
           localStorage.getItem('token') ||
           localStorage.getItem('jwt') ||
           null
  }

  async function checkValidity(e) {
    e.preventDefault()
    setError(null)
    setResult(null)
    setModalVisible(false)

    // Permission letter is required — only use permission for AI check
    const fileToSend = fileObjs.permission
    if (!fileToSend) {
      setError("Please attach the Permission Letter (required) to check.")
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', fileToSend)

      const token = getJwtToken()
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const resp = await fetch('http://localhost:8000/api/auth/bonafide/check/', {
        method: 'POST',
        headers,
        body: form,
      })

      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || 'Server error')
      }
      const data = await resp.json()
      setResult(data)
      setModalVisible(true)
    } catch (err) {
      setError(err.message || 'Failed to check document')
    } finally {
      setLoading(false)
    }
  }

  // new handler to submit final request (uses permission file only)
  const submitForm = async (e) => {
    e.preventDefault()
    setSubmitMessage(null)
    const fileToSend = fileObjs.permission
    if (!fileToSend) {
      setSubmitMessage({ type: 'error', text: 'Please attach the Permission Letter (required) before submitting.' })
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      const formEl = e.target
      form.append('student_name', formEl.querySelector("input[placeholder='Student Name']")?.value || '')
      form.append('roll_number', formEl.querySelector("input[placeholder='Student Roll Number']")?.value || '')
      form.append('contact', formEl.querySelector("input[placeholder='Student Contact']")?.value || '')
      form.append('reason', formEl.querySelector("input[placeholder='Reason for Bonafide']")?.value || '')
      form.append('file', fileToSend)

      const token = getJwtToken()
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}

      const resp = await fetch('http://localhost:8000/api/auth/bonafide/submit/', {
        method: 'POST',
        headers,
        body: form,
      })

      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || 'Server error')
      }
      const data = await resp.json()
      setSubmitMessage({ type: 'success', text: 'Bonafide submitted.' })
      // optionally clear form
      setFiles({ permission: 'Permission Letter (required)' })
      setFileObjs({ permission: null })
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Failed to submit' })
    } finally {
      setLoading(false)
    }
  }

  const user = getUser();
  const displayName = user?.name || user?.username || 'Student';
  // lock identity fields so students can only submit for themselves
  const studentName = user?.name || user?.full_name || user?.username || ''
  const rollNumber = user?.roll_number || user?.username || ''
  const navigate = useNavigate();

  const handleFileChange = (e, key) => {
    const file = e.target.files[0]
    const fileName = file?.name || files[key]
    setFiles(prev => ({ ...prev, [key]: fileName }))
    setFileObjs(prev => ({ ...prev, [key]: file || null }))
    // clear any previous preview url when a new file is selected
    if (fileUrl) {
      try { URL.revokeObjectURL(fileUrl) } catch {}
      setFileUrl(null)
    }
  }

  // cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (fileUrl) {
        try { URL.revokeObjectURL(fileUrl) } catch {}
      }
    }
  }, [fileUrl])

  // open uploaded permission file in a new tab (create object URL if needed)
  const viewFile = () => {
    const file = fileObjs.permission
    if (!file) {
      setError("No permission file available to view.")
      return
    }
    try {
      let url = fileUrl
      if (!url) {
        url = URL.createObjectURL(file)
        setFileUrl(url)
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError("Unable to open the file.")
    }
  }

  // Helper to render extracted fields in an ordered, professional table
  const renderExtractedTable = (extracted = {}) => {
    const rows = [
      { key: 'name', label: 'Name' },
      { key: 'roll_number', label: 'Roll Number' },
      { key: 'department', label: 'Department / Class' },
      { key: 'reason', label: 'Reason / Purpose' },
      { key: 'has_signature', label: 'Signature Present' }
    ]

    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:8}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'8px 6px'}}>Field</th>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'8px 6px'}}>Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            let value = extracted[r.key]
            if (r.key === 'has_signature') value = value ? 'Yes' : 'No'
            if (value === undefined || value === null || value === '') value = '—'
            return (
              <tr key={r.key}>
                <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', width:'35%', color:'#333', fontWeight:600}}>{r.label}</td>
                <td style={{padding:'8px 6px', borderBottom:'1px solid #f3f3f3', color:'#222'}}>{value}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )
  }

  const renderChecklistTable = (checklist = {}) => {
    const entries = Object.entries(checklist || {})
    if (!entries.length) return null
    return (
      <table style={{width:'100%', borderCollapse:'collapse', marginTop:10}}>
        <thead>
          <tr>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'6px'}}>Requirement</th>
            <th style={{textAlign:'left', borderBottom:'2px solid #eee', padding:'6px'}}>Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k,v]) => (
            <tr key={k}>
              <td style={{padding:'6px', borderBottom:'1px solid #f3f3f3', color:'#333'}}>{k}</td>
              <td style={{padding:'6px', borderBottom:'1px solid #f3f3f3'}}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className='dashboard-container'>
      <br /><br /><br />
      <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
      <div className='user-container'>{displayName}</div>
      <center><h2 className='titles'>Bonafide Request</h2></center>
      <br /><br />

      <form className='input-group' onSubmit={submitForm}>
        <input className='request-text' value={studentName} disabled type="text" placeholder='Student Name' />
        <input className='request-text' value={rollNumber} disabled type="text" placeholder='Student Roll Number' />
        <input className='request-text' type="text" placeholder='Student Contact' />
        <input className='request-text' type="text" placeholder='Reason for Bonafide' />

        {/* Permission Letter - required */}
        <label className="custom-file">
          <span>{files.permission}</span>
          <input type="file" hidden onChange={(e) => handleFileChange(e, 'permission')} />
        </label>

        <input className='request-text' type="text" placeholder='Comments (Optional)' />
        <br />
        <button className='submit-button' onClick={checkValidity} disabled={loading}>
          {loading ? 'Checking...' : 'Check Validity'}
        </button>
        <button className='submit-button' type='submit' disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Form'}
        </button>
      </form>

      {submitMessage && (
        <div style={{marginTop:12, color: submitMessage.type === 'error' ? 'red' : 'green'}}>
          {submitMessage.text}
        </div>
      )}

      {modalVisible && result && (
        <div className="bx-modal-overlay" onClick={() => {
          // revoke temp URL when closing modal
          if (fileUrl) { try { URL.revokeObjectURL(fileUrl) } catch {} setFileUrl(null) }
          setModalVisible(false)
        }} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999
        }}>
          <div className="bx-modal" onClick={(e)=>e.stopPropagation()} style={{
            background:'#fff',
            padding:24,
            width:'90%',
            maxWidth:720,
            borderRadius:8,
            boxShadow:'0 6px 30px rgba(0,0,0,0.18)',
            maxHeight: '90vh',        // limit modal height to 90% of viewport
            overflowY: 'auto',       // enable vertical scrolling inside modal
            boxSizing: 'border-box'  // ensure padding included in height calculations
          }}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
              <h3 style={{margin:0}}>Bonafide Validation Result</h3>
              <div style={{fontWeight:700, color: result.is_valid ? '#1a7f37' : '#c23d3d'}}>
                {result.is_valid ? 'ALL FIELDS SATISFIED ✅' : 'FIELDS MISSING ❌'}
              </div>
            </div>

            <div style={{textAlign:'left', marginTop:6}}>
              <h4 style={{marginBottom:6}}>Extracted Fields</h4>
              {renderExtractedTable(result.extracted)}
              <h4 style={{marginTop:12, marginBottom:6}}>Checklist</h4>
              {renderChecklistTable(result.checklist)}
            </div>

            <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:14}}>
              <button onClick={viewFile} className="submit-button" style={{background:'#2b7cff'}}>View File</button>
              <button onClick={() => {
                if (fileUrl) { try { URL.revokeObjectURL(fileUrl) } catch {} setFileUrl(null) }
                setModalVisible(false)
              }} className="submit-button">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default BonafideDept;