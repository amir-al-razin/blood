import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, ArrowRight, Phone, Clock } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-8 lg:p-12 text-center text-white mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Save Lives?
            </h2>
            <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto">
              Join our community of heroes. Whether you need blood or want to donate, 
              we're here to connect you with the right people at the right time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-red-600 hover:bg-red-50 text-lg px-8 py-4" asChild>
                <Link href="/request">
                  <Heart className="mr-2 h-5 w-5" />
                  Request Blood
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-4" asChild>
                <Link href="/donate">
                  Become a Donor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Help */}
          <div className="bg-red-50 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <div className="bg-red-600 p-3 rounded-full mr-4">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Emergency Help</h3>
                <p className="text-gray-600">Need blood urgently?</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              For critical emergencies, call our 24/7 hotline. Our team will 
              immediately connect you with the nearest available donors.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">+880 1700-000000</div>
                <div className="text-sm text-gray-600">Available 24/7</div>
              </div>
              <Button className="bg-red-600 hover:bg-red-700">
                Call Now
              </Button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="flex items-center mb-4">
              <div className="bg-gray-600 p-3 rounded-full mr-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">How It Works</h3>
                <p className="text-gray-600">Simple 3-step process</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  1
                </div>
                <span className="text-gray-700">Submit your request or register as donor</span>
              </div>
              <div className="flex items-center">
                <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  2
                </div>
                <span className="text-gray-700">Get matched with verified donors/requests</span>
              </div>
              <div className="flex items-center">
                <div className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                  3
                </div>
                <span className="text-gray-700">Coordinate donation and save lives</span>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}