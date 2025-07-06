
import { Card, CardContent } from '@/components/ui/card';
import { Shield, Users, Award, TrendingUp } from 'lucide-react';

const AboutUsPage = () => {
  const values = [
    {
      icon: Shield,
      title: 'Trust & Security',
      description: 'Your financial information is protected with the highest level of security and privacy.'
    },
    {
      icon: Users,
      title: 'Customer First',
      description: 'We put our customers at the center of everything we do, providing personalized solutions.'
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in all our services and continuously improve our offerings.'
    },
    {
      icon: TrendingUp,
      title: 'Growth',
      description: 'We help our customers achieve their financial goals and grow their wealth.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">About LoanApp</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're a modern financial technology company dedicated to making loans accessible, 
            transparent, and affordable for everyone.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-xl leading-relaxed max-w-4xl mx-auto">
                To democratize access to financial services by providing fast, fair, and transparent 
                lending solutions that empower individuals and businesses to achieve their goals.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <value.icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                LoanApp was founded in 2020 with a simple vision: to make borrowing money as easy 
                as ordering food online. Our founders, experienced professionals from the fintech 
                and banking industries, recognized the need for a more transparent and efficient 
                lending platform.
              </p>
              <p>
                Since our inception, we've helped thousands of customers secure loans for their 
                personal and business needs. Our innovative approach combines cutting-edge 
                technology with human expertise to provide the best possible experience.
              </p>
              <p>
                Today, we're proud to be one of the fastest-growing fintech companies in the 
                region, with a team of dedicated professionals committed to helping our customers 
                achieve their financial goals.
              </p>
            </div>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2020</h3>
                <p className="text-gray-600">LoanApp founded with $2M in seed funding</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2021</h3>
                <p className="text-gray-600">Reached 1,000 customers and $10M in loans disbursed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2022</h3>
                <p className="text-gray-600">Expanded to business loans and launched mobile app</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2024</h3>
                <p className="text-gray-600">Serving 10,000+ customers with $100M+ disbursed</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <Card className="bg-gray-900 text-white">
          <CardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">10,000+</div>
                <div className="text-gray-300">Happy Customers</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">$100M+</div>
                <div className="text-gray-300">Loans Disbursed</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">24hrs</div>
                <div className="text-gray-300">Average Approval Time</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
                <div className="text-gray-300">Customer Satisfaction</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AboutUsPage;
