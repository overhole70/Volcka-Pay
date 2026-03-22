import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isRecovery = window.location.hash.includes('type=recovery');

  if (loading) return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  
  if (isRecovery && location.pathname !== '/reset-password' && location.pathname !== '/resetpassword') {
    return <Navigate to={`/reset-password${window.location.hash}`} replace />;
  }

  if (user && !isRecovery) {
    if (location.pathname === '/reset-password' || location.pathname === '/resetpassword') {
      // Allow rendering Outlet for reset password
    } else if (user.email_confirmed_at) {
      if (location.pathname !== '/verify-login-otp') {
        return <Navigate to="/home" replace />;
      }
    } else if (location.pathname !== '/confirm-email') {
      return <Navigate to="/confirm-email" replace />;
    }
  }

  return (
    <div className="min-h-screen flex relative bg-white lg:bg-gray-50">
      {/* Abstract Background for Desktop */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-br from-blue-100 to-indigo-50 blur-3xl opacity-70"></div>
        <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-emerald-50 to-teal-100 blur-3xl opacity-60"></div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10 w-full">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">VolckaPay</h1>
            <p className="text-gray-500 mt-2 text-sm font-medium">النظام المالي الرقمي المتكامل</p>
          </div>
          
          <div className="w-full">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};
