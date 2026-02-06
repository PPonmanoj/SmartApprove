import React from 'react'
import '../students/NewRequest.css'
import { useNavigate } from 'react-router-dom'

const EditRequirements = () => {
  const navigate = useNavigate()

  return (
    <div className='dashboard-container'>
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Staff ABC</div>
        <div className='request-group'>
            <div onClick={() => navigate('/internshipEdit')}>Internships</div>
            <div onClick={() => navigate('/feeReceiptEdit')}>Fee Receipt</div>
            <div onClick={() => navigate('/bonafideEdit')}>Bonafide Dept</div>
            <div onClick={() => navigate('/resourcesEdit')}>Bonafide College</div>
            <div onClick={() => navigate('/medicalEdit')}>Medical</div>
            <div onClick={() => navigate('/ivsEdit')}>IVs</div>
            <div onClick={() => navigate('/onDutyEdit')}>On Duty</div>
            <div onClick={() => navigate('/eventsEdit')}>Resources</div>
        </div>
    </div>
  )
}

export default EditRequirements