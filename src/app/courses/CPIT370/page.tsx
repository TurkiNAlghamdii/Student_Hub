'use client'

export default function CPIT370Page() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">CPIT370 - Computer Networks</h1>
      <div className="bg-gray-900/50 backdrop-blur-md rounded-xl border border-gray-800/50 p-6">
        <div className="space-y-4">
          <h2 className="text-xl text-emerald-500 font-semibold">Course Information</h2>
          <p className="text-gray-300">
            Introduction to computer networks and the Internet. Protocol layers and the OSI model.
            Application layer protocols. Network programming.
          </p>
          {/* Add more course content here */}
        </div>
      </div>
    </div>
  )
}