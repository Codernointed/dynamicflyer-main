/**
 * Login Page
 * Authentication page for user sign-in
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    // Navigate to dashboard after successful login
    navigate('/dashboard');
  };

  return (
    <AuthLayout>
      <LoginForm onSuccess={handleLoginSuccess} />
    </AuthLayout>
  );
} 