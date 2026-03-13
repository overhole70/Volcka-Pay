import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, Shield, Bell, Key, Globe, HelpCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const settingsGroups = [
    {
      title: 'الحساب',
      items: [
        { icon: Shield, label: 'الأمان والخصوصية', onClick: () => {} },
        { icon: Key, label: 'تغيير كلمة المرور', onClick: () => {} },
      ]
    },
    {
      title: 'التفضيلات',
      items: [
        { icon: Bell, label: 'الإشعارات', onClick: () => {} },
        { icon: Globe, label: 'اللغة', onClick: () => {} },
      ]
    },
    {
      title: 'الدعم',
      items: [
        { icon: HelpCircle, label: 'مركز المساعدة', onClick: () => {} },
      ]
    }
  ];

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
        {settingsGroups.map((group, index) => (
          <div key={index}>
            <h3 className="text-sm font-bold text-gray-400 mb-3 px-4">{group.title}</h3>
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-gray-50">
                {group.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={item.onClick}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-600">
                        <item.icon size={20} />
                      </div>
                      <span className="font-bold text-gray-900">{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-right group"
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
