
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  Shield, 
  Clock, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Star
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Clock,
      title: 'Quick Approval',
      description: 'Get approved in as little as 24 hours with our streamlined process.'
    },
    {
      icon: Shield,
      title: 'Secure & Safe',
      description: 'Your data is protected with bank-level security and encryption.'
    },
    {
      icon: DollarSign,
      title: 'Competitive Rates',
      description: 'Enjoy some of the most competitive interest rates in the market.'
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: 'Our dedicated team is here to help you every step of the way.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      text: 'The loan application process was incredibly smooth and fast. Highly recommended!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      text: 'Great customer service and competitive rates. Made my home renovation possible.',
      rating: 5
    },
    {
      name: 'Emily Davis',
      text: 'Professional team and transparent process. Very satisfied with their service.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="ml-3 text-2xl font-bold text-gray-900">LoanApp</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/about" className="text-gray-600 hover:text-gray-900">About</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
              <Link to="/terms" className="text-gray-600 hover:text-gray-900">Terms</Link>
            </nav>
            <div className="flex space-x-4">
              <Button variant="outline" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your Financial Goals,
            <span className="text-blue-600"> Our Support</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Get the funding you need with our simple, fast, and secure loan application process. 
            From personal loans to business financing, we're here to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4" asChild>
              <Link to="/register">
                Apply Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" asChild>
              <Link to="/login">Login to Dashboard</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose LoanApp?</h2>
            <p className="text-lg text-gray-600">We make lending simple, fast, and transparent</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">Don't just take our word for it</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-4">"{testimonial.text}"</p>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of satisfied customers who chose LoanApp for their financing needs.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8 py-4" asChild>
            <Link to="/register">Apply for a Loan Today</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold">LoanApp</span>
              </div>
              <p className="text-gray-400">
                Your trusted partner for all financing needs.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Personal Loans</li>
                <li>Business Loans</li>
                <li>Auto Loans</li>
                <li>Home Loans</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Help Center</li>
                <li>FAQ</li>
                <li>Live Chat</li>
                <li>Customer Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 LoanApp. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
