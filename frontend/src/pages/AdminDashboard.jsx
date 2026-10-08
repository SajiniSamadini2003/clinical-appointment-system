const AdminDashboard = () => {
  return (
    <div>
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h2>
      <p className="text-gray-600 mb-8">System administration and oversight.</p>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Manage Doctors</h3>
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200 mb-4">
            [ Doctor Management List Placeholder ]
          </div>
          <button className="bg-primary text-white px-4 py-2 rounded text-sm">Add New Doctor</button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">All System Appointments</h3>
          <div className="p-4 bg-gray-50 rounded text-sm text-gray-500 text-center border border-gray-200">
            [ Global Appointment List Placeholder ]
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
