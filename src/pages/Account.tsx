import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Copy, User, Shield, Settings, HelpCircle, MonitorPlay, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Account: React.FC = () => {
  const { profile, signOut } = useAuth();

  const handleCopyId = () => {
    if (profile?.volckaId) {
      navigator.clipboard.writeText(profile.volckaId);
      alert('تم نسخ المعرف بنجاح');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-6 md:pt-12 pb-24">
      <div className="mb-10 text-center">
        <div className="w-24 h-24 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-200">
          <User size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{profile?.fullName || profile?.email}</h1>
        <p className="text-gray-500 font-medium mt-1">عضو فولكا</p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">معرف فولكا الخاص بك</p>
              <p className="font-mono text-lg font-bold text-gray-900">{profile?.volckaId}</p>
            </div>
          </div>
          <button 
            onClick={handleCopyId}
            className="p-3 bg-gray-50 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Copy size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="divide-y divide-gray-50">
          <Link to="/transactions" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Clock size={20} />
              </div>
              <span className="font-bold text-gray-900">سجل العمليات</span>
            </div>
          </Link>
          <Link to="/ads" className="flex items-center justify-between p-5 hover:bg-gray-50 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <MonitorPlay size={20} />
              </div>
              <span className="font-bold text-gray-900">الإعلانات</span>
            </div>
          </Link>
          <Link to="/settings" className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                <Settings size={20} />
              </div>
              <span className="font-bold text-gray-900">الإعدادات</span>
            </div>
          </Link>
          <Link to="/settings/support" className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                <HelpCircle size={20} />
              </div>
              <span className="font-bold text-gray-900">المساعدة والدعم</span>
            </div>
          </Link>
        </div>
      </div>

      <button
        onClick={async () => {
          await signOut();
          window.location.href = '/login';
        }}
        className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-3xl font-bold hover:bg-red-100 transition-all active:scale-95"
      >
        <LogOut size={20} />
        تسجيل الخروج
      </button>
    </div>
  );
};
