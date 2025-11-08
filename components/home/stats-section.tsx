import { Heart, Users, MapPin, Clock } from 'lucide-react'

export function StatsSection() {
  const stats = [
    {
      icon: Users,
      value: '1,247',
      label: 'Registered Donors',
      description: 'Verified blood donors ready to help'
    },
    {
      icon: Heart,
      value: '3,891',
      label: 'Lives Saved',
      description: 'Successful blood donations completed'
    },
    {
      icon: MapPin,
      value: '64',
      label: 'Areas Covered',
      description: 'Districts and cities we serve'
    },
    {
      icon: Clock,
      value: '< 24h',
      label: 'Average Response',
      description: 'Time to find a matching donor'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Making a Real Impact
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform has connected thousands of donors with patients in need, 
            creating a network of hope and healing across the country.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div key={index} className="text-center group">
                <div className="bg-red-50 p-4 rounded-full w-fit mx-auto mb-4 group-hover:bg-red-100 transition-colors">
                  <Icon className="h-8 w-8 text-red-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.description}
                </div>
              </div>
            )
          })}
        </div>

        {/* Blood Type Availability */}
        <div className="mt-16 bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Blood Type Availability
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { type: 'A+', count: 312, available: true },
              { type: 'A-', count: 89, available: true },
              { type: 'B+', count: 267, available: true },
              { type: 'B-', count: 45, available: false },
              { type: 'AB+', count: 156, available: true },
              { type: 'AB-', count: 23, available: false },
              { type: 'O+', count: 445, available: true },
              { type: 'O-', count: 78, available: true }
            ].map((blood) => (
              <div key={blood.type} className="bg-white p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {blood.type}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {blood.count} donors
                </div>
                <div className={`text-xs px-2 py-1 rounded-full ${
                  blood.available 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {blood.available ? 'Available' : 'Limited'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}