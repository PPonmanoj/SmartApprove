import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import StudentSignup from './pages/StudentSignup'
import StaffSignup from './pages/StaffSignup'
import LoginStudent from './pages/LoginStudent'
import LoginStaff from './pages/LoginStaff'
import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard from './pages/StaffDashboard'
import ProtectedRoute from './ProtectedRoute'
import './App.css'
import NewRequest from './pages/students/NewRequest.jsx';
import EditRequirements from './pages/staffs/EditRequirements.jsx';
import PendingRequests from './pages/students/PendingRequests.jsx';
import ApprovalHistory from './pages/staffs/ApprovalHistory.jsx';
import IncomingRequests from './pages/staffs/IncomingRequests.jsx';
import RequestHistory from './pages/students/RequestHistory.jsx';
import Internship from './pages/students/requests/Internship.jsx';
import InternshipEdit from './pages/staffs/requests/InternshipEdit.jsx';
import BonafideDept from './pages/students/requests/BonafideDept.jsx'

function App() {
  return (
    <Routes>
      {/* public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/student/signup" element={<StudentSignup />} />
      <Route path="/staff/signup" element={<StaffSignup />} />
      <Route path="/student/login" element={<LoginStudent />} />
      <Route path="/staff/login" element={<LoginStaff />} />

      {/* protected routes (no Router here) */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']} redirectTo="/student/login">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff/dashboard"
        element={
          <ProtectedRoute allowedRoles={['staff']} redirectTo="/staff/login">
            <StaffDashboard />
          </ProtectedRoute>
        }
      />

      <Route path = "/newRequest" element = {<NewRequest/>}/>
      <Route path = "/editRequirements" element = {<EditRequirements/>}/>
      <Route path = "/pendingRequests" element = {<PendingRequests/>}/>
      <Route path = "/approvalHistory" element = {<ApprovalHistory/>}/>
      <Route path = "/incomingRequests" element = {<IncomingRequests/>}/>
      <Route path='/requestHistory' element = {<RequestHistory/>}/>
      <Route path='/internshipEdit' element={<InternshipEdit />} />
      <Route path='/internship' element={<Internship />} />
      <Route path='/bonafideDept' element={<BonafideDept />} />
    </Routes>
  )
}

export default App
