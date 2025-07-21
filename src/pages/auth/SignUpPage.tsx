/**
 * Sign Up Page
 * Authentication page for user registration
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  const navigate = useNavigate();

  const handleSignUpSuccess = () => {
    // Navigate to login after successful signup
    navigate('/login');
  };

  return (
    <AuthLayout>
      <SignUpForm onSuccess={handleSignUpSuccess} />
    </AuthLayout>
  );
} 