import React from 'react'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../api'
import NotificationBell from "../components/NotificationBell"

const StaffDashboard = () => {
  const navigate = useNavigate()
  const user = getUser()
  const designation = user?.designation
  const displayName = user?.name || user?.username || 'Staff'

  return (
    <div className='dashboard-container'>
      <div className='logo-container' onClick={() => navigate('/')}><img src="/logo.png" alt="logo" /></div>
      <div style={{position:'absolute', top:'20px' , right:'200px', display:'flex', gap:12, alignItems:'center', marginLeft:'200px'}}>
        <NotificationBell />
      </div>
      <div className='user-container'>{displayName}</div>

      <div className='dashboard-inner'>
        <div className='new' onClick={() => navigate('/incomingRequests')}>
          <div className='image'><img src="/pending.png" alt="" /></div>
          <div className='purpose'>
            <h3>Pending Requests</h3>
          </div>
        </div>

        <div className='pending' onClick={() => navigate('/approvalHistory')}>
          <div className='image'><img src="/history.png" alt="" /></div>
          <div className='purpose'>
            <h3>Approval History</h3>
          </div>
        </div>

        {/* show Edit Requirements only to tutors */}
        {designation === 'TUTOR' && (
          <div className='history' onClick={() => navigate('/editRequirements')}>
            <div className='image'><img src="/plus.png" alt="" /></div>
            <div className='purpose'>
              <h3>Edit Requirements</h3>
            </div>
          </div>
        )}

        <div className='profile'>
          <div className='image'><img src="/profile.png" alt="" /></div>
          <div className='purpose'>
            <h3>Profile</h3>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard