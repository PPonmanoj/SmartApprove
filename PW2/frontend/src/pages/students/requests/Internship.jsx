import React, { useState } from 'react'
import './Internship.css'
import { getUser } from '../../../api'

const Internship = () => {

  const [files, setFiles] = useState({
    permission: 'Permission Letter',
    offer: 'Offer Letter',
    parent: 'Parent Consent Letter'
  })
  
  const user = getUser()
  const displayName = user?.name || user?.username || 'Student'

  const handleFileChange = (e, key) => {
    const fileName = e.target.files[0]?.name || files[key]
    setFiles(prev => ({ ...prev, [key]: fileName }))
  }

  return (
    <div className='dashboard-container'>
      <br /><br />
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
      <div className='user-container'>{displayName}</div>
      <center><h2 className='titles'>Internship Request</h2></center>
      <br /><br />

      <form className='input-group'>
        <input className='request-text' type="text" placeholder='Industry Name' />
        <input className='request-text' type="text" placeholder='Internship Type (Summer / Winter)' />
        <input className='request-text' type="text" placeholder='Start Date' />
        <input className='request-text' type="text" placeholder='End Date' />

        {/* Permission Letter */}
        <label className="custom-file">
          <span>{files.permission}</span>
          <input type="file" hidden onChange={(e) => handleFileChange(e, 'permission')} />
        </label>

        {/* Offer Letter */}
        <label className="custom-file">
          <span>{files.offer}</span>
          <input type="file" hidden onChange={(e) => handleFileChange(e, 'offer')} />
        </label>

        {/* Parent Consent Letter */}
        <label className="custom-file">
          <span>{files.parent}</span>
          <input type="file" hidden onChange={(e) => handleFileChange(e, 'parent')} />
        </label>

        <input className='request-text' type="text" placeholder='Parents Contact' />
        <br />
        <button className='submit-button' type='submit'>Submit Form</button>
      </form>
    </div>
  )
}

export default Internship
