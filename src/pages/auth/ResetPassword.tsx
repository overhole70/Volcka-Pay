import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Key, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      // Read the URL hash
      const hash = window.location.hash;
      
      if (!hash) {
        setErrorMsg('رابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
        return;
      }

      // Extract access_token and type
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get('type');
      const accessToken = hashParams.get('access_token');

      if (type !== 'recovery' || !accessToken) {
        setErrorMsg('رابط غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
      }
    } catch (err) {
      console.error("Error parsing hash:", err);
      setErrorMsg('حدث خطأ أثناء قراءة الرابط.');
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      toast.success('تم تغيير كلمة المرور بنجاح');
      window.location.hash = '';
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء تغيير كلمة المرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8" dir="rtl">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
            <Key size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900">
          إعادة تعيين كلمة المرور
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-100 sm:rounded-3xl sm:px-10 border border-gray-100">
          {errorMsg ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <AlertCircle className="w-16 h-16 text-red-500" />
              </div>
              <p className="text-gray-900 font-bold">{errorMsg}</p>
              <Link
                to="/login"
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleReset}>
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
                    تأكيد
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
