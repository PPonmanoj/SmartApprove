import React from 'react'
import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

import Landing         from './pages/Landing'
import LoginStudent    from './pages/LoginStudent'
import LoginStaff      from './pages/LoginStaff'
import StudentSignup   from './pages/StudentSignup'
import StaffSignup     from './pages/StaffSignup'
import NotFound        from './pages/NotFound'

import StudentDashboard from './pages/StudentDashboard'
import StaffDashboard   from './pages/StaffDashboard'

import NewRequest      from './pages/students/NewRequest'
import PendingRequests from './pages/students/PendingRequests'
import RequestHistory  from './pages/students/RequestHistory'
import RequestStatus   from './pages/students/RequestStatus'
import StudentProfile  from './pages/students/StudentProfile'
import BonafideDept    from './pages/students/requests/BonafideDept'
import Internship      from './pages/students/requests/Internship'

import IncomingRequests from './pages/staffs/IncomingRequests'
import ApprovalHistory  from './pages/staffs/ApprovalHistory'
import EditRequirements from './pages/staffs/EditRequirements'
import StaffProfile     from './pages/staffs/StaffProfile'
import InternshipEdit   from './pages/staffs/requests/InternshipEdit'

const S = (Component) => (
  <ProtectedRoute allowedRoles={['student']} redirectTo="/student/login">
    <Component />
  </ProtectedRoute>
)
const ST = (Component) => (
  <ProtectedRoute allowedRoles={['staff']} redirectTo="/staff/login">
    <Component />
  </ProtectedRoute>
)

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"               element={<Landing />} />
      <Route path="/student/login"  element={<LoginStudent />} />
      <Route path="/staff/login"    element={<LoginStaff />} />
      <Route path="/student/signup" element={<StudentSignup />} />
      <Route path="/staff/signup"   element={<StaffSignup />} />

      {/* Student — protected */}
      <Route path="/student/dashboard"       element={S(StudentDashboard)} />
      <Route path="/newRequest"              element={S(NewRequest)} />
      <Route path="/pendingRequests"         element={S(PendingRequests)} />
      <Route path="/requestHistory"          element={S(RequestHistory)} />
      <Route path="/requestStatus/:id"       element={S(RequestStatus)} />
      <Route path="/student/profile"         element={S(StudentProfile)} />
      <Route path="/bonafideDept"            element={S(BonafideDept)} />
      <Route path="/internship"              element={S(Internship)} />

      {/* Staff — protected */}
      <Route path="/staff/dashboard"    element={ST(StaffDashboard)} />
      <Route path="/incomingRequests"   element={ST(IncomingRequests)} />
      <Route path="/approvalHistory"    element={ST(ApprovalHistory)} />
      <Route path="/editRequirements"   element={ST(EditRequirements)} />
      <Route path="/staff/profile"      element={ST(StaffProfile)} />
      <Route path="/internshipEdit"     element={ST(InternshipEdit)} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
