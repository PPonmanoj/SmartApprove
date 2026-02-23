import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './InternshipEdit.css'

const InternshipEdit = () => {
  const navigate = useNavigate()

  const [fields, setFields] = useState([
    { requirement: '', instruction: '' }
  ])

  const handleChange = (index, key, value) => {
    const updatedFields = [...fields]
    updatedFields[index][key] = value
    setFields(updatedFields)
  }

  const addFieldGroup = () => {
    setFields([...fields, { requirement: '', instruction: '' }])
  }

  const removeFieldGroup = (index) => {
    if (fields.length === 1) return
    setFields(fields.filter((_, i) => i !== index))
  }

  return (
    <div className='dashboard-container'>
      <br /><br /><br />

      <div className='logo-container' onClick={() => navigate('/')}>
        <img src="/logo.png" alt="logo" />
      </div>

      <div className='user-container'>Staff ABC</div>

      <center><h2 className='titles'>Internship Request</h2></center>

      <br /><br />

      <div className="form-wrapper">

        <div className="form-header">
          <h3>Requirement</h3>
          <h3>Instruction / Description</h3>
        </div>

        {fields.map((field, index) => (
          <div key={index} className="form-row">

            <input
              type="text"
              placeholder="Requirement"
              className="form-input"
              value={field.requirement}
              onChange={(e) =>
                handleChange(index, 'requirement', e.target.value)
              }
            />

            <div className="instruction-wrapper">
              <textarea
                placeholder="Instruction / Description"
                className="form-instruction"
                value={field.instruction}
                onChange={(e) =>
                  handleChange(index, 'instruction', e.target.value)
                }
              />

              {fields.length > 1 && (
                <button
                  className="remove-btn"
                  onClick={() => removeFieldGroup(index)}
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        ))}

        <div className="add-btn-container">
          <button className="add-btn" onClick={addFieldGroup}>
            Add +
          </button>
        </div>

        <div className="save-btn-container">
          <button className="save-btn">Save</button>
        </div>

      </div>
    </div>
  )
}

export default InternshipEdit
