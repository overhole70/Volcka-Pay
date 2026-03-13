import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { db, doc, setDoc } from '../../lib/firebase';
import { generateUniqueVolckaId } from '../../lib/utils';
import { User, Mail, Lock } from 'lucide-react';

export const Register: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Register user with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // 2. Generate unique 10-digit ID
        const volckaId = await generateUniqueVolckaId();

        // 3. Create user profile in Firestore
        await setDoc(doc(db, 'users', data.user.id), {
          uid: data.user.id,
          volckaId,
          email: data.user.email,
          fullName,
          balance: 0,
          createdAt: new Date().toISOString(),
        });

        // 4. Redirect to confirmation screen
        navigate('/confirm-email', { state: { email, password } });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التسجيل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">إنشاء حساب جديد</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">الاسم الكامل</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <User size={20} />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full pr-12 pl-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
              placeholder="الاسم الكامل"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">البريد الإلكتروني</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Mail size={20} />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pr-12 pl-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
              placeholder="name@example.com"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">كلمة المرور</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pr-12 pl-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">تأكيد كلمة المرور</label>
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
              <Lock size={20} />
            </div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full pr-12 pl-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none text-lg"
              placeholder="••••••••"
              dir="ltr"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-8"
        >
          {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
        </button>
      </form>

      <div className="mt-10 text-center text-gray-500 font-medium">
        لديك حساب بالفعل؟{' '}
        <Link to="/login" className="text-gray-900 font-bold hover:underline">
          تسجيل الدخول
        </Link>
      </div>
    </div>
  );
};
