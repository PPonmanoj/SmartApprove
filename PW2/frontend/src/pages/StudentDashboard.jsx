import React from 'react'
import './Dashboard.css'
import { useNavigate } from 'react-router-dom'
import { getUser } from '../api'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const user = getUser()
  const displayName = user?.name || user?.username || 'Student'

  return (
    <div className='dashboard-container'>
      <div className='logo-container' onClick={() => navigate('/')}><img src="/logo.png" alt="logo" /></div>
      <div className='user-container'>{displayName}</div>

      <div className='dashboard-inner'>
        <div className='new' onClick={() => navigate('/newRequest')}>
          <div className='image'><img src="/pending.png" alt="" /></div>
          <div className='purpose'>
            <h3>New Request</h3>
          </div>
        </div>

        <div className='pending' onClick={() => navigate('/pendingRequests')}>
          <div className='image'><img src="/history.png" alt="" /></div>
          <div className='purpose'>
            <h3>Pending Requests</h3>
          </div>
        </div>

        <div className='history' onClick={() => navigate('/requestHistory')}>
          <div className='image'><img src="/plus.png" alt="" /></div>
          <div className='purpose'>
            <h3>Request History</h3>
          </div>
        </div>

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

export default StudentDashboard