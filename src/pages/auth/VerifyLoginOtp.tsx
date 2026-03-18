import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const VerifyLoginOtp: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const sentRef = useRef(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    if (!user || !profile) {
      navigate('/login');
      return;
    }

    const storageKey = `otpVerified_${user.id}`;
    if (!profile.requiresOtpOnLogin || localStorage.getItem(storageKey) === 'true') {
      navigate('/home');
      return;
    }

    if (!sentRef.current && !otpSent) {
      sentRef.current = true;
      sendOtpEmail();
      setOtpSent(true);
    }
  }, [user, profile, navigate, otpSent]);

  const sendOtpEmail = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email }),
      });
    } catch (err) {
      console.error('Error sending OTP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index: number, value: string) => {
    // Handle paste of multiple characters
    if (value.length > 1) {
      const pastedData = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = pastedData[i];
        }
      }
      
      setOtp(newOtp);
      
      // Focus the next empty input or the last filled one
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    // Handle single character input
    const newValue = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = newValue;
    setOtp(newOtp);

    // Move to next input if a digit was entered
    if (newValue !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6 - index).split('');
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      const nextIndex = Math.min(index + pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('يرجى إدخال رمز التحقق كاملاً');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-otp-only', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, code: otpCode }),
      });
      
      const data = await res.json();
      
      if (!res.ok || data.error) {
        throw new Error(data.error || 'رمز التحقق غير صحيح');
      }

      // Mark as verified in local storage tied to user ID
      const storageKey = `otpVerified_${user.id}`;
      localStorage.setItem(storageKey, 'true');
      navigate('/home');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحقق');
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    await signOut();
    navigate('/login');
  };

  if (!user || !profile) return null;

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative z-10">
      <button 
        onClick={handleCancel}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm"
      >
        <ArrowRight size={18} className="ml-1.5" />
        العودة لتسجيل الدخول
      </button>

      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShieldCheck size={40} />
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">التحقق بخطوتين</h2>
        <p className="text-sm text-gray-500 mt-2 font-medium leading-relaxed">
          لقد قمنا بإرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني<br/>
          <span className="text-gray-900 font-bold" dir="ltr">{user.email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50/80 border border-red-100 text-red-600 p-4 rounded-2xl text-sm mb-8 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-center gap-2" dir="ltr">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200 bg-gray-50/50 outline-none"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white py-4 rounded-2xl font-bold text-base shadow-sm active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
        </button>
      </form>
    </div>
  );
};
