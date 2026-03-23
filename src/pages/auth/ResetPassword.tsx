import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Key, Loader2, ArrowRight, Mail, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export const ResetPassword = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || loading || cooldown > 0) return;

    const now = Date.now();
    if (now - lastRequestTime < 2000) return; // 2 seconds debounce
    setLastRequestTime(now);

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
      });
      
      if (error) throw error;
      
      toast.success('تم إرسال الرمز إلى بريدك الإلكتروني');
      setStep(2);
      setAttempts(0);
      setCooldown(60);
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء إرسال الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 8) {
      toast.error('رمز التحقق يجب أن يكون 8 أرقام');
      return;
    }

    if (attempts >= 3) {
      toast.error('تم تجاوز الحد الأقصى للمحاولات. يرجى طلب رمز جديد.');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otp,
        type: 'email',
      });
      
      if (error) {
        setAttempts(prev => prev + 1);
        throw error;
      }
      
      if (!data.session) throw new Error('فشل في إنشاء الجلسة');
      
      toast.success('تم التحقق بنجاح');
      setStep(3);
    } catch (error: any) {
      toast.error(error.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('كلمات المرور غير متطابقة');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) throw error;
      
      toast.success('تم تغيير كلمة المرور بنجاح');
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4" dir="rtl">
      <div className="w-[90%] max-w-[400px] h-auto p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100 transition-all duration-300">
        
        {/* Header */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-200">
            {step === 1 && <Mail size={32} />}
            {step === 2 && <Key size={32} />}
            {step === 3 && <Lock size={32} />}
          </div>
        </div>
        
        <h2 className="text-center text-2xl font-black text-gray-900 mb-2">
          {step === 1 && 'نسيت كلمة المرور؟'}
          {step === 2 && 'أدخل رمز التحقق'}
          {step === 3 && 'كلمة مرور جديدة'}
        </h2>
        
        <p className="text-center text-gray-500 text-sm mb-8">
          {step === 1 && 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً لإعادة تعيين كلمة المرور.'}
          {step === 2 && `أدخل الرمز المكون من 8 أرقام المرسل إلى ${email}`}
          {step === 3 && 'قم بإنشاء كلمة مرور جديدة وقوية لحسابك.'}
        </p>

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendOtp}>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                dir="ltr"
                placeholder="name@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email || cooldown > 0}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : cooldown > 0 ? (
                `يمكنك إعادة الإرسال بعد ${cooldown} ثانية`
              ) : (
                <>
                  إرسال الكود
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            
            <div className="text-center mt-4">
              <Link to="/login" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}

        {/* Step 2: OTP Input */}
        {step === 2 && (
          <form className="space-y-6" onSubmit={handleVerifyOtp}>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 text-center">
                رمز التحقق
              </label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-center text-2xl tracking-[0.5em] font-mono"
                dir="ltr"
                placeholder="••••••••"
                maxLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 8}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  تحقق
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
            
            <div className="flex justify-between items-center mt-4 px-2">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="text-sm font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <ArrowRight size={16} />
                تغيير البريد
              </button>
              <button 
                type="button" 
                onClick={handleSendOtp}
                disabled={loading || cooldown > 0}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cooldown > 0 ? `إعادة الإرسال (${cooldown})` : 'إعادة إرسال الكود'}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password Input */}
        {step === 3 && (
          <form className="space-y-6" onSubmit={handleResetPassword}>
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
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
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                dir="ltr"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  تأكيد وتغيير
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
