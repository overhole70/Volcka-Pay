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
      navigate('/');
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
      navigate('/');
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
    <div className="w-full">
      <button 
        onClick={handleCancel}
        className="flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium"
      >
        <ArrowRight size={20} className="ml-2" />
        العودة لتسجيل الدخول
      </button>

      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShieldCheck size={40} />
      </div>
      
      <h2 className="text-3xl font-black text-gray-900 mb-4 text-center">التحقق بخطوتين</h2>
      <p className="text-gray-600 font-medium mb-8 text-center leading-relaxed">
        لقد قمنا بإرسال رمز تحقق مكون من 6 أرقام إلى بريدك الإلكتروني<br/>
        <span className="text-gray-900 font-bold" dir="ltr">{user.email}</span>
      </p>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-8">
        <div className="flex justify-center gap-1.5" dir="ltr">
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
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || otp.join('').length !== 6}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
        </button>
      </form>
    </div>
  );
};
