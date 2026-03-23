import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Key, Smartphone, ChevronRight, Loader2, Lock, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { db, doc, updateDoc } from '../lib/firebase';
import toast from 'react-hot-toast';

export const SecuritySettings: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [updatingOtp, setUpdatingOtp] = useState(false);
  
  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

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
      toast.error('حدث خطأ أثناء تحديث إعدادات الأمان');
    } finally {
      setUpdatingOtp(false);
    }
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }

    if (!user?.email || loading || cooldown > 0) return;

    const now = Date.now();
    if (now - lastRequestTime < 2000) return; // 2 seconds debounce
    setLastRequestTime(now);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
      });
      
      if (error) throw error;
      
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setPasswordStep(2);
      setAttempts(0);
      setCooldown(60);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 8) {
      toast.error('رمز التحقق يجب أن يكون 8 أرقام');
      return;
    }

    if (attempts >= 3) {
      toast.error('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.');
      return;
    }

    if (!user?.email) return;

    setLoading(true);
    try {
      // 1. Verify OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: 'email',
      });
      
      if (verifyError) {
        setAttempts(prev => prev + 1);
        throw verifyError;
      }
      
      if (!data.session) throw new Error('فشل في إنشاء الجلسة');
      
      // 2. Update Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast.success('تم تغيير كلمة المرور بنجاح');
      
      // Reset state
      setIsChangingPassword(false);
      setPasswordStep(1);
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
    } catch (error: any) {
      if (error.message?.includes('expired')) {
        toast.error('انتهت صلاحية الرمز');
      } else {
        toast.error(error.message || 'رمز التحقق غير صحيح');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelPasswordChange = () => {
    setIsChangingPassword(false);
    setPasswordStep(1);
    setNewPassword('');
    setConfirmPassword('');
    setOtp('');
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
                  قم بتغيير كلمة المرور الخاصة بحسابك بانتظام لضمان حماية أفضل.
                </p>
              </div>
              
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold transition-all active:scale-95 text-sm w-full sm:w-auto"
                >
                  <Key size={16} />
                  تغيير كلمة المرور
                </button>
              ) : (
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mt-4">
                  {passwordStep === 1 ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          كلمة المرور الجديدة
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          dir="ltr"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                          تأكيد كلمة المرور
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                          dir="ltr"
                          placeholder="••••••••"
                          minLength={6}
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={loading || !newPassword || !confirmPassword || cooldown > 0}
                          className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : cooldown > 0 ? (
                            `انتظر ${cooldown} ثانية`
                          ) : (
                            <>
                              إرسال رمز التحقق
                              <ArrowRight size={18} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          disabled={loading}
                          className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          إلغاء
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyAndUpdatePassword} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2 text-center">
                          أدخل رمز التحقق (8 أرقام)
                        </label>
                        <input
                          type="text"
                          required
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono"
                          dir="ltr"
                          placeholder="••••••••"
                          maxLength={8}
                        />
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          disabled={loading || otp.length !== 8}
                          className="flex-1 flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                          ) : (
                            <>
                              تأكيد وتغيير
                              <CheckCircle2 size={18} />
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={cancelPasswordChange}
                          disabled={loading}
                          className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          إلغاء
                        </button>
                      </div>
                      
                      <div className="text-center mt-2">
                        <button 
                          type="button" 
                          onClick={() => handleSendOtp()}
                          disabled={loading || cooldown > 0}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cooldown > 0 ? `إعادة الإرسال (${cooldown})` : 'إعادة إرسال الكود'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
