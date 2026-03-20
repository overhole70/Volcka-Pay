/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthLayout } from './components/layout/AuthLayout';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ConfirmEmail } from './pages/auth/ConfirmEmail';
import { VerifyLoginOtp } from './pages/auth/VerifyLoginOtp';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Transfer } from './pages/Transfer';
import { Transactions } from './pages/Transactions';
import { Notifications } from './pages/Notifications';
import { Ads } from './pages/Ads';
import { Earnings } from './pages/Earnings';
import { Account } from './pages/Account';

import { Settings } from './pages/Settings';
import { SecuritySettings } from './pages/SecuritySettings';
import { Support } from './pages/Support';
import { Deposit } from './pages/Deposit';
import { AdminDashboard } from './pages/AdminDashboard';

import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-center" />
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Register />} />
            <Route path="/confirm-email" element={<ConfirmEmail />} />
            <Route path="/verify-login-otp" element={<VerifyLoginOtp />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Dashboard />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/earnings" element={<Earnings />} />
            <Route path="/account" element={<Account />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/settings/security" element={<SecuritySettings />} />
            <Route path="/settings/support" element={<Support />} />
            <Route path="/deposit" element={<Deposit />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
