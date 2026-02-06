import React, { use } from 'react'
import './NewRequest.css'
import { useNavigate } from 'react-router-dom'
const NewRequest = () => {
    const navigate = useNavigate();
  return (
    <div className='dashboard-container'>
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div className='user-container'>Manish V</div>
        <div className='request-group'>
            <div onClick={()=>navigate('/internship')}>Internships</div>
            <div>Fee Receipt</div>
            <div onClick={()=>navigate('/bonafideDept')}>Bonafide Dept</div>
            <div>Bonafide College</div>
            <div>Medical</div>
            <div>IVs</div>
            <div>On Duty</div>
            <div>Resources</div>
        </div>
    </div>
  )
}

export default NewRequest