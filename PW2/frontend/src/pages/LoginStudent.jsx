import React, { useState } from 'react'
import './Login.css'
import { useNavigate } from 'react-router-dom'
import { postJson, saveAuth } from '../api'

const LoginStudent = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await postJson('/api/auth/login/', { username, password })
      saveAuth(res)
      navigate('/student/dashboard')
    } catch (err) {
      console.error(err)
      alert('Login failed')
    }
  }

  return (
    <div className='startup-container'>
      <div className='logo-container' onClick={() => navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div><h1>ApproveX</h1></div>
        <div className='login-form'>
            <h2>Student Login</h2>
            <br />
            <form onSubmit={handleSubmit}>
                <input className='login-input' value={username} onChange={(e)=>setUsername(e.target.value)} type="text" placeholder='Roll No or Email' />
                <br />
                <input className='login-input' value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder='Password' />
                <br />
                <button className='student' type='submit'>Login</button>
            </form>
        </div>

        <div className='button-container'>
            <button className='staff' onClick={() => navigate("/staff/login")}>Staff</button><br />
            <button className='staff' onClick={() => navigate("/")}>Back</button>
        </div>
    </div>
  )
}

export default LoginStudent