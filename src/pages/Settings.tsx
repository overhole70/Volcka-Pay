import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Shield, HelpCircle, LogOut, ShieldAlert, ChevronLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 md:pt-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">الإعدادات</h1>
          <p className="text-gray-500 text-sm font-medium">إدارة حسابك وتفضيلات التطبيق</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-50 flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-sm shrink-0">
            {profile?.fullName?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'V'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{profile?.fullName || 'مستخدم VolckaPay'}</h2>
            <p className="text-gray-500 text-sm" dir="ltr">{profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {profile?.role === 'admin' && (
          <div>
            <h3 className="text-sm font-bold text-gray-400 mb-3 px-4">الإدارة</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <Link
                to="/admin"
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all active:scale-[0.98] text-right"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <ShieldAlert size={20} />
                  </div>
                  <span className="font-bold text-gray-900">لوحة التحكم</span>
                </div>
                <ChevronLeft size={20} className="text-gray-400" />
              </Link>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3 px-4">إعدادات الحساب</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Link
              to="/settings/security"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all active:scale-[0.98] text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <Shield size={20} />
                </div>
                <span className="font-bold text-gray-900">الأمان</span>
              </div>
              <ChevronLeft size={20} className="text-gray-400" />
            </Link>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-400 mb-3 px-4">الدعم</h3>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Link
              to="/settings/support"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all active:scale-[0.98] text-right"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                  <HelpCircle size={20} />
                </div>
                <span className="font-bold text-gray-900">المساعدة والدعم</span>
              </div>
              <ChevronLeft size={20} className="text-gray-400" />
            </Link>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-all active:scale-[0.98] text-right group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 group-hover:bg-red-100 transition-colors">
                  <LogOut size={20} />
                </div>
                <span className="font-bold text-red-600">تسجيل الخروج</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
