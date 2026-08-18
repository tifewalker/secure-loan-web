
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, DollarSign, User, Briefcase } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const LoanApplicationPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Loan Details
    loanAmount: '',
    loanPurpose: '',
    loanTerm: '',
    
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    ssn: '',
    
    // Employment Information
    employmentStatus: '',
    employer: '',
    jobTitle: '',
    workExperience: '',
    monthlyIncome: '',
    
    // Financial Information
    monthlyExpenses: '',
    existingDebts: '',
    bankAccount: '',
    
    // Additional Information
    additionalNotes: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Application Submitted",
        description: "Your loan application has been submitted successfully. We'll review it within 24 hours.",
      });
      setIsLoading(false);
      navigate('/dashboard');
    }, 2000);
  };

  const loanPurposes = [
    'Home Purchase',
    'Home Renovation',
    'Debt Consolidation',
    'Car Purchase',
    'Business Expansion',
    'Education',
    'Medical Expenses',
    'Personal Use',
    'Other'
  ];

  const employmentStatuses = [
    'Full-time Employee',
    'Part-time Employee',
    'Self-employed',
    'Contract Worker',
    'Unemployed',
    'Retired',
    'Student'
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Loan Application</h1>
        <p className="text-gray-600 mt-2">Complete this form to apply for a loan. All fields are required.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Loan Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="loanAmount">Loan Amount ($)</Label>
              <Input
                id="loanAmount"
                name="loanAmount"
                type="number"
                placeholder="50000"
                value={formData.loanAmount}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loanPurpose">Loan Purpose</Label>
              <Select onValueChange={(value) => handleSelectChange('loanPurpose', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan purpose" />
                </SelectTrigger>
                <SelectContent>
                  {loanPurposes.map((purpose) => (
                    <SelectItem key={purpose} value={purpose}>{purpose}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="loanTerm">Loan Term</Label>
              <Select onValueChange={(value) => handleSelectChange('loanTerm', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select loan term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                  <SelectItem value="36">36 months</SelectItem>
                  <SelectItem value="48">48 months</SelectItem>
                  <SelectItem value="60">60 months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ssn">Social Security Number</Label>
              <Input
                id="ssn"
                name="ssn"
                type="password"
                placeholder="XXX-XX-XXXX"
                value={formData.ssn}
                onChange={handleInputChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="employmentStatus">Employment Status</Label>
              <Select onValueChange={(value) => handleSelectChange('employmentStatus', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select employment status" />
                </SelectTrigger>
                <SelectContent>
                  {employmentStatuses.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="employer">Employer Name</Label>
              <Input
                id="employer"
                name="employer"
                value={formData.employer}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workExperience">Years of Experience</Label>
              <Input
                id="workExperience"
                name="workExperience"
                type="number"
                value={formData.workExperience}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="monthlyIncome">Monthly Income ($)</Label>
              <Input
                id="monthlyIncome"
                name="monthlyIncome"
                type="number"
                value={formData.monthlyIncome}
                onChange={handleInputChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="monthlyExpenses">Monthly Expenses ($)</Label>
              <Input
                id="monthlyExpenses"
                name="monthlyExpenses"
                type="number"
                value={formData.monthlyExpenses}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="existingDebts">Existing Debts ($)</Label>
              <Input
                id="existingDebts"
                name="existingDebts"
                type="number"
                value={formData.existingDebts}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bankAccount">Primary Bank Account</Label>
              <Input
                id="bankAccount"
                name="bankAccount"
                placeholder="Bank name and account type"
                value={formData.bankAccount}
                onChange={handleInputChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                name="additionalNotes"
                placeholder="Any additional information you'd like to provide..."
                value={formData.additionalNotes}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Submit Button */}
        <div className="flex justify-between items-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/dashboard')}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading}
            className="px-8"
          >
            {isLoading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoanApplicationPage;
