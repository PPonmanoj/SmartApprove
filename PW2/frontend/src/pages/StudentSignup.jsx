import React from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postJson, saveAuth } from '../api'

const StudentSignup = () => {
  const navigate = useNavigate()
  const [department, setDepartment] = useState('')
  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')

  const departments = {
    "BE_CSE_G1": "BE CSE G1",
    "BE_CSE_G2": "BE CSE G2",
    "BE_CSE_AI_ML": "BE CSE (AI & ML)"
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }
    try {
      const body = {
        username,
        password,
        name,
        email,
        class_code: department,
        mobile
      }
      const res = await postJson('/api/auth/student/signup/', body)
      saveAuth(res)
      navigate('/studentDashboard')
    } catch (err) {
      console.error(err)
      alert(typeof err === 'string' ? err : JSON.stringify(err))
    }
  }

  return (
     <div className='startup-container'>
      <div className='logo-container' onClick={()=>navigate('/')}><img src="/logo.png" alt="logo" /></div>
        <div><h1>ApproveX</h1></div>
        <div className='login-form'>
            <h2>Student Signup</h2>
            <br />
            <form onSubmit={handleSubmit}>
                <input className='login-input' value={username} onChange={(e)=>setUsername(e.target.value)} type="text" placeholder='Roll No' /><br />
                <input className='login-input' value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder='Student Name' /><br />
                    <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="form-select login-input"
                    >
                    <option value="" disabled>
                        Select Department
                    </option>

                    {Object.entries(departments).map(([key, label]) => (
                        <option key={key} value={key}>
                        {label}
                        </option>
                    ))}
                    </select>
                    <br />
                <br />
                <input className='login-input' value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder='Password' />
                <br />
                <input className='login-input' value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} type="password" placeholder='Confirm Password' />
                <br />
                <input className='login-input' value={mobile} onChange={(e)=>setMobile(e.target.value)} type="number" placeholder='Mobile Number' />
                <br />
                <input className='login-input' value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder='Official Email' />
                <br />
                <button className='student' type='submit'>Signup</button>
            </form>
        </div>
    </div>
  )
}

export default StudentSignup