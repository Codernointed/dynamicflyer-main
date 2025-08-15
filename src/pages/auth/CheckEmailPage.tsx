import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckEmailPage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-3">
            <MailCheck className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">Verify your email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to {email || 'your email address'}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Open your inbox and click the link to activate your account. This helps us keep your account secure.
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 border rounded p-3 text-left">
            - Check the Promotions/Spam folder if you don't see it in a minute.<br />
            - Keep this tab open. After confirming, come back and sign in.
          </div>
          <div className="flex gap-2 justify-center">
            <Link to="/login">
              <Button variant="outline">Back to Login</Button>
            </Link>
            <Link to="/signup">
              <Button variant="ghost">Use a different email</Button>
            </Link>
          </div>
          <div className="flex items-center justify-center text-xs text-gray-400">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Waiting for confirmation
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


