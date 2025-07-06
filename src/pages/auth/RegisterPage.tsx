
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DollarSign, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  confirmEmail: "",
  staffId: "",
  role: "",
  designation: "",
  department: "",
  accessLevel: "",
  twoFaEnabled: "",
  twoFactorMethod: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (!formData.acceptTerms) {
      toast({
        title: "Terms required",
        description: "Please accept the terms and conditions",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await register(formData.email, formData.password, formData.firstName, formData.lastName);
      if (success) {
        toast({
          title: "Registration successful",
          description: "Welcome to LoanApp!",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Registration failed",
          description: "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-h-full">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-7 h-7 text-white" />
          </div>
          <span className="ml-3 text-3xl font-bold text-gray-900">LoanApp</span>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join thousands of satisfied customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex min-w-full gap-4">
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="name">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="Enter your first name"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Enter your last name"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
              </div>

              <div className="flex w-full gap-4">
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="email2">Confirm Email</Label>
                    <Input
                      id="email2"
                      name="email2"
                      type="email"
                      placeholder="Confirm your email"
                      value={formData.confirmEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
              </div>
              <div className="flex w-full gap-4">
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                    />
                    </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      name="role"
                      type="text"
                      placeholder="Enter your role (e.g., User, Admin)"
                      value={formData.role}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="staffId">Staff ID</Label>
                    <Input
                      id="staffId"
                      name="staffId"
                      type="text"
                      placeholder="Enter your staff ID"
                      value={formData.staffId}
                      onChange={handleChange}
                    />
                  </div>
              </div>
              <div className="flex w-full gap-4">
                    <div className="space-y-2 flex-1">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      name="designation"
                      type="text"
                      placeholder="Enter your designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                    </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="twoFaEnabled">Department</Label>
                    <Input
                      id="Department"
                      name="Department"
                      type="text"
                      placeholder="Operations, HR, etc."
                      value={formData.twoFaEnabled}
                      onChange={handleChange}
                    />
                    </div>
                  </div>
                  <div className="flex w-full gap-4">
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      name="department"
                      type="text"
                      placeholder="Enter your department"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Input
                      id="accessLevel"
                      name="accessLevel"
                      type="text"
                      placeholder="Enter your access level"
                      value={formData.accessLevel}
                      onChange={handleChange}
                    />
                  </div>
              </div>
              
              <div className="flex w-full gap-4">
                <div className="space-y-2 flex-1">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))
                  }
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-800">
                    Terms and Conditions
                  </Link>
                </Label>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
