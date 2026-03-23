import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Key, Smartphone, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { db, doc, updateDoc } from '../lib/firebase';
import { createNotification } from '../lib/notifications';

export const SecuritySettings: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [resetSent, setResetSent] = useState(false);
  const [updatingOtp, setUpdatingOtp] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  const handlePasswordReset = async () => {
    navigate('/reset-password');
  };

  const toggleOtpVerification = async () => {
    if (!profile?.uid) return;
    setUpdatingOtp(true);
    try {
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        requiresOtpOnLogin: !profile.requiresOtpOnLogin
      });
      await refreshProfile();
    } catch (error) {
      console.error('Error updating OTP settings:', error);
      alert('حدث خطأ أثناء تحديث إعدادات الأمان');
    } finally {
      setUpdatingOtp(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 md:pt-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <button 
          onClick={() => navigate('/settings')}
          className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">إعدادات الأمان</h1>
          <p className="text-gray-500 text-sm font-medium">حماية حسابك وبياناتك</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0 text-gray-500">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 mb-1">البريد الإلكتروني المسجل</h3>
              <p className="text-sm text-gray-500 font-medium mb-3">هذا هو البريد الإلكتروني المرتبط بحسابك</p>
              <p className="font-bold text-gray-900 bg-gray-50 px-4 py-2.5 rounded-xl inline-block border border-gray-100" dir="ltr">{profile?.email || user?.email}</p>
            </div>
          </div>
        </div>

        {/* OTP Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-600">
              <Smartphone size={20} />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">التحقق بخطوتين (OTP)</h3>
                  <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md">
                    تفعيل التحقق بكود OTP عند تسجيل الدخول. سيطلب منك إدخال رمز تحقق يرسل لبريدك عند كل عملية تسجيل دخول لزيادة أمان حسابك.
                  </p>
                </div>
                <button
                  onClick={toggleOtpVerification}
                  disabled={updatingOtp}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 shrink-0 ${
                    profile?.requiresOtpOnLogin ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      profile?.requiresOtpOnLogin ? '-translate-x-8' : '-translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
              <Key size={20} />
            </div>
            <div className="flex-1">
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-900 mb-1">كلمة المرور</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md">
                  قم بتغيير كلمة المرور الخاصة بحسابك بانتظام لضمان حماية أفضل. سيتم إرسال رابط لإعادة التعيين إلى بريدك الإلكتروني.
                </p>
              </div>
              
              <div className="space-y-4 max-w-md">
                {passwordMessage.text && (
                  <div className={`p-3 rounded-xl text-sm font-medium ${
                    passwordMessage.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <button
                  onClick={handlePasswordReset}
                  disabled={updatingPassword || resetSent}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 text-sm w-full sm:w-auto"
                >
                  {updatingPassword ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : resetSent ? (
                    <>
                      <Key size={16} />
                      تم إرسال الرابط
                    </>
                  ) : (
                    <>
                      <Key size={16} />
                      إرسال رابط إعادة التعيين
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
