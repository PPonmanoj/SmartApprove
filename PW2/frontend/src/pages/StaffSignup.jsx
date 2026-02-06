import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postJson, saveAuth } from '../api'

const StaffSignup = () => {
  const navigate = useNavigate()

  const [designation, setDesignation] = useState('')
  const [classValue, setClassValue] = useState('')
  const [hodDept, setHodDept] = useState('')
  const [deanType, setDeanType] = useState('')

  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [mobile, setMobile] = useState('')

  const classOptions = {
    BE_CSE_G1: 'BE CSE G1',
    BE_CSE_G2: 'BE CSE G2',
    BE_CSE_AI_ML: 'BE CSE (AI & ML)',
  }

  const hodDepartments = {
    BE_CSE: 'BE CSE',
    BE_EEE: 'BE EEE',
    BE_ECE: 'BE ECE'
  }

  const deanTypes = {
    ACADEMIC: 'Academic',
    AUTONOMOUS: 'Autonomous',
    ADMIN: 'Administrative',
    PLACEMENT: 'Placement',
    STUDENT_AFFAIRS: 'Student Affairs'
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
        mobile,
        designation: designation || 'OTHER'
      }
      if (designation === 'TUTOR' || designation === 'PROGRAM_COORDINATOR') {
        body.class_code = classValue
      }
      if (designation === 'HOD') {
        body.hod_department_code = hodDept
      }
      if (designation === 'DEAN') {
        body.dean_type = deanType
      }

      const res = await postJson('/api/auth/staff/signup/', body)
      saveAuth(res)
      navigate('/staffDashboard')
    } catch (err) {
      console.error(err)
      alert(typeof err === 'string' ? err : JSON.stringify(err))
    }
  }

  return (
    <div className='startup-container'>
      <div className='logo-container' onClick={() => navigate('/')}>
        <img src="/logo.png" alt="logo" />
      </div>

      <div><h1>ApproveX</h1></div>

      <div className='login-form'>
        <h2>Staff Signup</h2>
        <br />

        <form onSubmit={handleSubmit}>
          <input className='login-input' value={username} onChange={(e)=>setUsername(e.target.value)} type="text" placeholder='Username' />
          <br />
          <input className='login-input' value={name} onChange={(e)=>setName(e.target.value)} type="text" placeholder='Name' />
          <br />

          {/* DESIGNATION */}
          <select
            className='login-input'
            value={designation}
            onChange={(e) => {
              setDesignation(e.target.value)
              setClassValue('')
              setHodDept('')
              setDeanType('')
            }}
          >
            <option value="" disabled>Select Designation</option>
            <option value="TUTOR">Tutor</option>
            <option value="PROGRAM_COORDINATOR">Program Coordinator</option>
            <option value="HOD">Head of the Department</option>
            <option value="DEAN">Dean</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="OTHER">Other</option>
          </select>

          <br />

          {/* CLASS – Tutor / Program Coordinator */}
          {(designation === 'TUTOR' || designation === 'PROGRAM_COORDINATOR') && (
            <>
              <select
                className='login-input'
                value={classValue}
                onChange={(e) => setClassValue(e.target.value)}
              >
                <option value="" disabled>Select Class</option>
                {Object.entries(classOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <br />
            </>
          )}

          {/* HOD DEPARTMENT */}
          {designation === 'HOD' && (
            <>
              <select
                className='login-input'
                value={hodDept}
                onChange={(e) => setHodDept(e.target.value)}
              >
                <option value="" disabled>Select Department</option>
                {Object.entries(hodDepartments).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <br />
            </>
          )}

          {/* DEAN TYPE */}
          {designation === 'DEAN' && (
            <>
              <select
                className='login-input'
                value={deanType}
                onChange={(e) => setDeanType(e.target.value)}
              >
                <option value="" disabled>Select Dean Type</option>
                {Object.entries(deanTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <br />
            </>
          )}

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

export default StaffSignup
