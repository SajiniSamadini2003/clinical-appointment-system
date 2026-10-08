const PatientDashboard = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Patient Dashboard</h2>
      <p className="text-gray-600 mb-8">Welcome back! Manage your appointments below.</p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Upcoming Appointments</h3>
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
            [ Appointment List Placeholder ]
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Profile Information</h3>
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
            [ Profile Details Placeholder ]
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientDashboard
