import React from 'react'
import '../students/PendingRequests.css'

const ApprovalHistory = () => {
  return (
    <div className='dashboard-container'>
        <br />
        <br />
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Staff ABC</div>
        <center><h2 className='titles'>Approval History</h2></center>
        <div className='log-table'>
          <div className='table-card header'>
            <div>Type</div>
            <div>Date</div>
            <div>Student</div>
            <div>Action</div>
            <div>Comments</div>
          </div>

          <div className='table-card'>
            <div>Internship</div>
            <div>12-12-2025</div>
            <div>Manish V</div>
            <div>Approved</div>
            <div><button className='view-btn'>View</button></div>
          </div>

          <div className='table-card'>
            <div>Bonafide</div>
            <div>16-12-2025</div>
            <div>Abinaya S</div>
            <div>Rejected</div>
            <div><button className='view-btn'>View</button></div>
          </div>
        </div>
    </div>
  )
}

export default ApprovalHistory