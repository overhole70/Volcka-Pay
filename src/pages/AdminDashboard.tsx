import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, doc, updateDoc, getDoc, setDoc } from '../lib/firebase';
import { UserProfile, DepositRequest, AppSettings } from '../types';
import { ShieldAlert, Users, Wallet, Settings, Ban, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'settings'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ binanceId: '1171444753', adminEmail: 'volckastudio@gmail.com' });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Users
      const usersSnap = await getDocs(collection(db, 'users'));
      setUsers(usersSnap.docs.map(d => ({ ...d.data() } as UserProfile)));

      // Fetch Deposit Requests
      const depositsSnap = await getDocs(collection(db, 'deposit_requests'));
      const deposits = depositsSnap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRequest));
      deposits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDepositRequests(deposits);

      // Fetch Settings
      const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as AppSettings);
      } else {
        // Initialize settings if not exists
        await setDoc(doc(db, 'settings', 'app_settings'), settings);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (uid: string, currentStatus: boolean | undefined) => {
    setActionLoading(`ban-${uid}`);
    try {
      await updateDoc(doc(db, 'users', uid), {
        isBanned: !currentStatus
      });
      setUsers(users.map(u => u.uid === uid ? { ...u, isBanned: !currentStatus } : u));
    } catch (error) {
      console.error("Error banning user:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('settings');
    try {
      await setDoc(doc(db, 'settings', 'app_settings'), settings);
      alert('تم حفظ الإعدادات بنجاح');
    } catch (error) {
      console.error("Error updating settings:", error);
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDepositAction = async (requestId: string, status: 'approved' | 'rejected', userId: string, amount: number) => {
    setActionLoading(`deposit-${requestId}`);
    try {
      await updateDoc(doc(db, 'deposit_requests', requestId), { status });
      
      if (status === 'approved') {
        // Update user balance
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const currentBalance = userDoc.data().balance || 0;
          await updateDoc(doc(db, 'users', userId), {
            balance: currentBalance + amount
          });
        }
      }
      
      setDepositRequests(depositRequests.map(req => req.id === requestId ? { ...req, status } : req));
    } catch (error) {
      console.error("Error updating deposit request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 mb-2">غير مصرح لك بالدخول</h2>
        <p className="text-gray-500">هذه الصفحة مخصصة للمسؤولين فقط.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pt-4 md:pt-8 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">لوحة التحكم</h1>
        <p className="text-gray-500 font-medium">إدارة المستخدمين والطلبات والإعدادات</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 hide-scrollbar">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
            activeTab === 'users' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users size={20} />
          المستخدمين
        </button>
        <button
          onClick={() => setActiveTab('deposits')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
            activeTab === 'deposits' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Wallet size={20} />
          طلبات الإيداع
          {depositRequests.filter(r => r.status === 'pending').length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
              {depositRequests.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
            activeTab === 'settings' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Settings size={20} />
          الإعدادات
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Clock className="animate-spin mr-3" />
          جاري التحميل...
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">الاسم الكامل</th>
                    <th className="p-4 font-bold text-gray-600">البريد الإلكتروني</th>
                    <th className="p-4 font-bold text-gray-600">الرصيد</th>
                    <th className="p-4 font-bold text-gray-600 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{u.fullName || 'غير محدد'}</td>
                      <td className="p-4 text-gray-500" dir="ltr">{u.email}</td>
                      <td className="p-4 font-black text-emerald-600" dir="ltr">${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-center">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleBanUser(u.uid, u.isBanned)}
                            disabled={actionLoading === `ban-${u.uid}`}
                            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 mx-auto transition-colors ${
                              u.isBanned 
                                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                          >
                            {actionLoading === `ban-${u.uid}` ? (
                              <Clock size={16} className="animate-spin" />
                            ) : (
                              <Ban size={16} />
                            )}
                            {u.isBanned ? 'إلغاء الحظر' : 'حظر'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-bold text-gray-600">المستخدم</th>
                    <th className="p-4 font-bold text-gray-600">اسم Binance</th>
                    <th className="p-4 font-bold text-gray-600">رقم الطلب</th>
                    <th className="p-4 font-bold text-gray-600">وقت التحويل</th>
                    <th className="p-4 font-bold text-gray-600">المبلغ</th>
                    <th className="p-4 font-bold text-gray-600 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {depositRequests.map(req => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{req.userName || 'مستخدم'}</td>
                      <td className="p-4 text-gray-600">{req.binanceName}</td>
                      <td className="p-4 font-mono text-sm text-gray-500" dir="ltr">{req.orderId}</td>
                      <td className="p-4 text-gray-600">{req.transferTime}</td>
                      <td className="p-4 font-black text-emerald-600" dir="ltr">${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="p-4 text-center">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleDepositAction(req.id, 'approved', req.userId, req.amount)}
                              disabled={actionLoading === `deposit-${req.id}`}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                              title="موافقة"
                            >
                              <CheckCircle2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDepositAction(req.id, 'rejected', req.userId, req.amount)}
                              disabled={actionLoading === `deposit-${req.id}`}
                              className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                              title="رفض"
                            >
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <span className={`font-bold text-sm ${req.status === 'approved' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {depositRequests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-500">لا توجد طلبات إيداع</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="p-6 md:p-8 max-w-2xl">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">معرف Binance للإيداع</label>
                  <input
                    type="text"
                    value={settings.binanceId}
                    onChange={(e) => setSettings({...settings, binanceId: e.target.value})}
                    required
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-gray-50 outline-none font-mono text-lg"
                    dir="ltr"
                  />
                  <p className="text-xs text-gray-500 mt-2">هذا المعرف سيظهر لجميع المستخدمين في صفحة الإيداع.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">البريد الإلكتروني للمسؤول</label>
                  <input
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => setSettings({...settings, adminEmail: e.target.value})}
                    required
                    className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-gray-50 outline-none text-lg"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  disabled={actionLoading === 'settings'}
                  className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === 'settings' ? <Clock className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  حفظ الإعدادات
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
