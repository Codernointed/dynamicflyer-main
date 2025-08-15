import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const confirm = async () => {
      try {
        const url = new URL(window.location.href);
        const hashParams = new URLSearchParams(url.hash.replace('#', ''));
        const code = params.get('code') || hashParams.get('code');
        const tokenHash = params.get('token_hash');
        const type = (params.get('type') || 'signup') as 'signup' | 'email_change' | 'recovery' | 'magiclink';

        // 1) Token-hash flow (email confirmations often use this)
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
          if (error) throw error;
          setStatus('success');
          toast.success('Email verified!');
          return;
        }

        // 2) Code flow (magic link)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(window.location.href);
          if (error) {
            // If PKCE error happens, Supabase might have already processed it automatically.
            // Check session before failing the UI.
            const { data: sessionData } = await supabase.auth.getSession();
            if (sessionData.session?.user) {
              setStatus('success');
              toast.success('Email verified!');
              return;
            }
            throw error;
          }
          setStatus('success');
          toast.success('Email verified!');
          return;
        }

        // 3) Fallback: if no params, see if session already exists
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          setStatus('success');
          return;
        }
        throw new Error('Invalid or expired verification link');
      } catch (err: any) {
        setStatus('failed');
        setMessage(err.message || 'Verification failed');
      }
    };
    confirm();
  }, [params]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-3"><Loader2 className="h-12 w-12 text-amber-500 animate-spin" /></div>
            <CardTitle className="text-xl font-bold">Confirming your email…</CardTitle>
            <CardDescription>One moment, please.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-3"><AlertCircle className="h-12 w-12 text-red-500" /></div>
            <CardTitle className="text-xl font-bold text-red-900">Verification failed</CardTitle>
            <CardDescription className="text-red-700">{message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/login')} className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white">Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="flex justify-center mb-3"><CheckCircle className="h-12 w-12 text-green-500" /></div>
          <CardTitle className="text-xl font-bold text-green-900">Email verified!</CardTitle>
          <CardDescription className="text-green-700">Your account is ready.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/dashboard')} className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white">Continue to Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}


