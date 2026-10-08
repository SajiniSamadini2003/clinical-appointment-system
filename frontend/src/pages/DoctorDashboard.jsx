const DoctorDashboard = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Doctor Dashboard</h2>
      <p className="text-gray-600 mb-8">Manage your schedule and view upcoming patient appointments.</p>
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Today's Appointments</h3>
            <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
              [ Daily Schedule Placeholder ]
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">All Appointments</h3>
            <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
              [ Full Appointment List Placeholder ]
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-fit">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Availability Settings</h3>
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
            [ Availability Config Placeholder ]
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDashboard
