import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react';

export const ConfirmEmail: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const navigate = useNavigate();

  const stateEmail = location.state?.email;
  const statePassword = location.state?.password;
  const emailToUse = user?.email || stateEmail;

  useEffect(() => {
    // If user is already confirmed, redirect to home
    if (user?.email_confirmed_at) {
      navigate('/home');
    }
  }, [user, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleCheckConfirmation = async () => {
    setLoading(true);
    setError('');
    try {
      if (user) {
        // Refresh the session to get the latest user data
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) throw error;
        
        if (data.session?.user?.email_confirmed_at) {
          navigate('/home');
        } else {
          setError('لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من صندوق الوارد الخاص بك.');
        }
      } else if (stateEmail && statePassword) {
        // Attempt to sign in to check if email is confirmed
        const { data, error } = await supabase.auth.signInWithPassword({
          email: stateEmail,
          password: statePassword,
        });

        if (error) {
          if (error.message.includes('Email not confirmed')) {
            setError('لم يتم تأكيد البريد الإلكتروني بعد. يرجى التحقق من صندوق الوارد الخاص بك.');
          } else {
            setError(error.message);
          }
        } else if (data.session) {
          // Email is confirmed and user is logged in
          navigate('/home');
        }
      } else {
        setError('يرجى تسجيل الدخول للتحقق من حالة التأكيد.');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحقق');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (resendCooldown > 0 || !emailToUse) return;
    
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailToUse,
      });
      
      if (error) throw error;
      
      setResendCooldown(60);
      setError('تم إرسال رسالة التأكيد مرة أخرى بنجاح.');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (user) {
      await supabase.auth.signOut();
    }
    navigate('/login');
  };

  if (!emailToUse) {
    return (
      <div className="w-full text-center">
        <p className="text-gray-600 mb-4 font-medium">لا يوجد بريد إلكتروني للتحقق منه.</p>
        <button onClick={() => navigate('/login')} className="text-gray-900 font-bold hover:underline">العودة لتسجيل الدخول</button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative z-10 text-center">
      <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">تأكيد البريد الإلكتروني</h2>
      <p className="text-gray-500 font-medium mb-8 leading-relaxed text-sm">
        تم إرسال رسالة تأكيد إلى بريدك الإلكتروني.<br/>يرجى فتح بريدك الإلكتروني وتأكيد الحساب.
      </p>

      {error && (
        <div className={`p-4 rounded-2xl text-sm mb-8 font-medium ${error.includes('بنجاح') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleCheckConfirmation}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-base shadow-sm active:scale-[0.98] hover:bg-gray-800 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          <CheckCircle2 size={20} />
          {loading ? 'جاري التحقق...' : 'لقد أكدت البريد الإلكتروني'}
        </button>

        <button
          onClick={handleResendConfirmation}
          disabled={resendCooldown > 0 || loading}
          className="w-full bg-white text-gray-900 border-2 border-gray-100 py-4 rounded-2xl font-bold text-base hover:bg-gray-50 transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2"
        >
          <RefreshCw size={20} className={resendCooldown > 0 ? 'opacity-50' : ''} />
          {resendCooldown > 0 ? `إعادة الإرسال (${resendCooldown}ث)` : 'إعادة إرسال رسالة التأكيد'}
        </button>

        <button
          onClick={handleLogout}
          className="w-full text-gray-500 py-4 rounded-2xl font-bold text-base hover:text-gray-900 transition-colors flex items-center justify-center gap-2 mt-4"
        >
          <LogOut size={20} />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
};
