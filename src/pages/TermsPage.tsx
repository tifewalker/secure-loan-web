
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-lg text-gray-600">Last updated: July 6, 2024</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Welcome to LoanApp. These Terms and Conditions govern your use of our website and services. 
                By accessing or using our services, you agree to be bound by these terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Loan Application Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Our loan application process is designed to be transparent and fair. All applications are 
                subject to credit approval and verification of information provided.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>All information provided must be accurate and complete</li>
                <li>Applications are processed within 24-48 hours</li>
                <li>Additional documentation may be required</li>
                <li>Loan approval is not guaranteed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Interest Rates and Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Interest rates are determined based on creditworthiness, loan amount, and term. 
                All rates and fees will be clearly disclosed before loan approval.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>APR ranges from 4.99% to 29.99%</li>
                <li>No prepayment penalties</li>
                <li>Late payment fees may apply</li>
                <li>All fees disclosed upfront</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. Repayment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Loan repayment terms vary by loan type and amount. Monthly payments are due on the same 
                date each month as specified in your loan agreement.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Automatic payments available</li>
                <li>Grace period of 15 days for late payments</li>
                <li>Early repayment allowed without penalty</li>
                <li>Payment modifications available in hardship situations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Privacy and Data Protection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We take your privacy seriously and protect your personal information in accordance with 
                applicable laws and regulations.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Data encrypted in transit and at rest</li>
                <li>Information used only for loan processing</li>
                <li>No sale of personal data to third parties</li>
                <li>Access to credit bureaus as needed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                LoanApp's liability is limited to the maximum extent permitted by law. We are not 
                responsible for indirect, incidental, or consequential damages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                If you have any questions about these Terms and Conditions, please contact us:
              </p>
              <div className="text-gray-600">
                <p>Email: legal@loanapp.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 123 Finance Street, New York, NY 10001</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
