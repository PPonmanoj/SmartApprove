import React from 'react'
import './Landing.css'
import { useNavigate } from "react-router-dom";

const Landing = () => {
    const navigate = useNavigate();

  return (
    <div className='startup-container'>
        <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div className='hero'>
            <h1 className='hero-title'>ApproveX</h1>
            <p className='hero-description'>Smart, Secure, Standardized Approvals</p>
        </div>

        <div className='button-container'>
            <button className='student' onClick={() => navigate("/student/login")}>Student</button><br />
            <button className='staff' onClick={() => navigate("/staff/login")}>Staff</button>
        </div>

        <div className='icon-group'>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
            <div className='icon-item'>
                <div className='icon-image'> <img src="https://cdn-icons-png.flaticon.com/512/1945/1945648.png" alt="" /></div>
                <div className='icon-name'>Internships</div>
            </div>
        </div>
    </div>
  )
}

export default Landing