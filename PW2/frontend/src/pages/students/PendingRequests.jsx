import React from 'react'
import './PendingRequests.css'

const PendingRequests = () => {
  return (
    <div className='dashboard-container'>
        <br />
        <br />
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Manish V</div>
        <center><h2 className='titles'>Pending Requests</h2></center>
        <div className='log-table'>
          <div className='table-card header'>
            <div>Type</div>
            <div>Date</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          <div className='table-card'>
            <div>Internship</div>
            <div>12-12-2025</div>
            <div>HoD Verification</div>
            <div><button className='view-btn'>View</button> <button className='cancel-btn'>Cancel</button></div>
          </div>

          <div className='table-card'>
            <div>Bonafide</div>
            <div>16-12-2025</div>
            <div>Tutor Verification</div>
            <div><button className='view-btn'>View</button> <button className='cancel-btn'>Cancel</button></div>
          </div>
        </div>
    </div>
  )
}

export default PendingRequests