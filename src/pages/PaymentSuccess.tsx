/**
 * Payment Success Page
 * Handles payment verification and subscription updates after successful payment
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPaymentAndUpdate, loading } = useSubscription();
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [verificationComplete, setVerificationComplete] = useState(false);

  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  useEffect(() => {
    if (!reference && !trxref) {
      setVerificationStatus('failed');
      setErrorMessage('No payment reference found');
      setVerificationComplete(true);
      return;
    }

    const verifyPayment = async () => {
      try {
        const ref = reference || trxref;
        if (!ref) return;

        // Keep showing verifying state during the process
        const success = await verifyPaymentAndUpdate(ref);
        
        // Only update status after verification is complete
        if (success) {
          setVerificationStatus('success');
          toast.success('Payment verified successfully!');
        } else {
          setVerificationStatus('failed');
          setErrorMessage('Payment verification failed. Please contact support.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setVerificationStatus('failed');
        setErrorMessage(error.message || 'Payment verification failed');
      } finally {
        setVerificationComplete(true);
      }
    };

    // Add a small delay to prevent flash
    const timer = setTimeout(() => {
      verifyPayment();
    }, 1000);

    return () => clearTimeout(timer);
  }, [reference, trxref, verifyPaymentAndUpdate]);

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleContactSupport = () => {
    // You can implement support contact logic here
    toast.info('Support contact feature coming soon');
  };

  if (verificationStatus === 'verifying' || !verificationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">
              Verifying Payment
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please wait while we verify your payment...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              This may take a few moments. Please don't close this page.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verificationStatus === 'failed' && verificationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-xl font-bold text-red-900">
              Payment Verification Failed
            </CardTitle>
            <CardDescription className="text-red-700">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              If you believe this is an error, please contact our support team.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
              >
                Contact Support
              </Button>
              <Button 
                onClick={handleGoToDashboard}
                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="flex justify-center mb-4"
          >
            <CheckCircle className="h-16 w-16 text-green-500" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CardTitle className="text-2xl font-bold text-green-900 mb-2">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-green-700 text-lg">
              Your subscription has been activated successfully.
            </CardDescription>
          </motion.div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-left"
          >
            <h3 className="font-semibold text-gray-900 mb-3">What happens next?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Your account has been upgraded immediately
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                All premium features are now available
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                You'll receive a confirmation email shortly
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                Your subscription will renew automatically
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <p className="text-sm text-green-800">
              <strong>Reference:</strong> {reference || trxref}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Keep this reference for your records
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Button 
              onClick={handleGoToDashboard}
              size="lg"
              className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-white"
            >
              Start Creating Templates
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
