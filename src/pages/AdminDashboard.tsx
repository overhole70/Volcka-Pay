import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, getDocs, doc, updateDoc, getDoc, setDoc, addDoc, serverTimestamp } from '../lib/firebase';
import { UserProfile, DepositRequest, AppSettings } from '../types';
import { ShieldAlert, Users, Wallet, Settings, Ban, CheckCircle2, XCircle, Clock, HelpCircle, Send, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Navigate } from 'react-router-dom';

// Define admin email clearly
const ADMIN_EMAIL = 'volckastudio@gmail.com';

interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  timestamp: any;
}

export const AdminDashboard: React.FC = () => {
  const { profile, user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'deposits' | 'support' | 'settings'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ binanceId: '1171444753', adminEmail: ADMIN_EMAIL });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [notificationModal, setNotificationModal] = useState<{ isOpen: boolean, userId: string, userName: string, title: string, message: string }>({
    isOpen: false, userId: '', userName: '', title: '', message: ''
  });

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL || profile?.role === 'admin') {
      fetchData();
    }
  }, [user, profile]);

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

      // Fetch Support Tickets
      const ticketsSnap = await getDocs(collection(db, 'support_tickets'));
      const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
      tickets.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || new Date(a.timestamp).getTime() || 0;
        const timeB = b.timestamp?.toMillis?.() || new Date(b.timestamp).getTime() || 0;
        return timeB - timeA;
      });
      setSupportTickets(tickets);

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

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationModal.title || !notificationModal.message) return;

    setActionLoading('send-notification');
    try {
      await addDoc(collection(db, 'notifications'), {
        user_id: notificationModal.userId,
        title: notificationModal.title,
        message: notificationModal.message,
        type: 'admin',
        read: false,
        created_at: new Date().toISOString()
      });
      setNotificationModal({ isOpen: false, userId: '', userName: '', title: '', message: '' });
      alert('تم إرسال الإشعار بنجاح');
    } catch (error) {
      console.error("Error sending notification:", error);
      alert('حدث خطأ أثناء إرسال الإشعار');
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
      
      // Create notification for deposit status
      await addDoc(collection(db, 'notifications'), {
        user_id: userId,
        title: status === 'approved' ? 'تمت الموافقة على الإيداع' : 'تم رفض الإيداع',
        message: status === 'approved' 
          ? `تمت الموافقة على إيداع مبلغ ${amount} دولار وإضافته لرصيدك` 
          : `تم رفض طلب إيداع مبلغ ${amount} دولار`,
        type: 'deposit',
        read: false,
        created_at: new Date().toISOString()
      });

      setDepositRequests(depositRequests.map(req => req.id === requestId ? { ...req, status } : req));
    } catch (error) {
      console.error("Error updating deposit request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReplyTicket = async (ticketId: string, userId: string) => {
    const text = replyText[ticketId];
    if (!text) return;

    setActionLoading(`reply-${ticketId}`);
    try {
      // Create notification
      await addDoc(collection(db, 'notifications'), {
        user_id: userId,
        title: 'رد من الدعم',
        message: text,
        type: 'admin',
        read: false,
        created_at: new Date().toISOString(),
      });

      // Update ticket status
      await updateDoc(doc(db, 'support_tickets', ticketId), {
        status: 'closed'
      });

      setSupportTickets(supportTickets.map(t => t.id === ticketId ? { ...t, status: 'closed' } : t));
      setReplyText({ ...replyText, [ticketId]: '' });
      alert('تم إرسال الرد بنجاح');
    } catch (error) {
      console.error("Error replying to ticket:", error);
      alert('حدث خطأ أثناء إرسال الرد');
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">جاري التحميل...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.email !== ADMIN_EMAIL && profile?.role !== 'admin') {
    return <Navigate to="/home" replace />;
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
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors ${
            activeTab === 'support' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <HelpCircle size={20} />
          الدعم
          {supportTickets.filter(t => t.status === 'open').length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
              {supportTickets.filter(t => t.status === 'open').length}
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
        <div className="space-y-4">
          {activeTab === 'users' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map(u => (
                <div key={u.uid} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{u.fullName || 'غير محدد'}</h3>
                    <p className="text-gray-500 text-sm" dir="ltr">{u.email}</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-3 rounded-2xl">
                    <span className="text-gray-600 font-medium text-sm">الرصيد</span>
                    <span className="font-black text-emerald-600 text-lg" dir="ltr">${u.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  {u.role !== 'admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBanUser(u.uid, u.isBanned)}
                        disabled={actionLoading === `ban-${u.uid}`}
                        className={`flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                          u.isBanned 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        {actionLoading === `ban-${u.uid}` ? (
                          <Clock size={18} className="animate-spin" />
                        ) : (
                          <Ban size={18} />
                        )}
                        {u.isBanned ? 'إلغاء الحظر' : 'حظر'}
                      </button>
                      <button
                        onClick={() => setNotificationModal({ isOpen: true, userId: u.uid, userName: u.fullName || 'مستخدم', title: '', message: '' })}
                        className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                      >
                        <Bell size={18} />
                        إشعار
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Notification Modal */}
          {notificationModal.isOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  إرسال إشعار إلى {notificationModal.userName}
                </h3>
                <form onSubmit={handleSendNotification} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">عنوان الإشعار</label>
                    <input
                      type="text"
                      required
                      value={notificationModal.title}
                      onChange={(e) => setNotificationModal({ ...notificationModal, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">نص الإشعار</label>
                    <textarea
                      required
                      rows={4}
                      value={notificationModal.message}
                      onChange={(e) => setNotificationModal({ ...notificationModal, message: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setNotificationModal({ isOpen: false, userId: '', userName: '', title: '', message: '' })}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === 'send-notification'}
                      className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {actionLoading === 'send-notification' ? (
                        <Clock size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      إرسال
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'deposits' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {depositRequests.map(req => (
                <div key={req.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{req.userName || 'مستخدم'}</h3>
                      <p className="text-gray-500 text-sm">Binance: {req.binanceName}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-600' : 
                      req.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {req.status === 'approved' ? 'مقبول' : req.status === 'rejected' ? 'مرفوض' : 'قيد المعالجة'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-xs text-gray-500 mb-1">المبلغ</p>
                      <p className="font-black text-emerald-600" dir="ltr">${req.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-xs text-gray-500 mb-1">وقت التحويل</p>
                      <p className="font-bold text-gray-900 text-sm">{req.transferTime}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-2xl">
                    <p className="text-xs text-gray-500 mb-1">رقم الطلب (Order ID)</p>
                    <p className="font-mono text-sm text-gray-900" dir="ltr">{req.orderId}</p>
                  </div>

                  {req.status === 'pending' && (
                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => handleDepositAction(req.id, 'approved', req.userId, req.amount)}
                        disabled={actionLoading === `deposit-${req.id}`}
                        className="flex-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl font-bold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={18} />
                        موافقة
                      </button>
                      <button
                        onClick={() => handleDepositAction(req.id, 'rejected', req.userId, req.amount)}
                        disabled={actionLoading === `deposit-${req.id}`}
                        className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <XCircle size={18} />
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {depositRequests.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
                  لا توجد طلبات إيداع
                </div>
              )}
            </div>
          )}

          {activeTab === 'support' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportTickets.map(ticket => (
                <div key={ticket.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{ticket.title}</h3>
                      <p className="text-gray-500 text-sm">{ticket.userName} ({ticket.userEmail})</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      ticket.status === 'open' ? 'bg-orange-50 text-orange-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ticket.status === 'open' ? 'مفتوح' : 'مغلق'}
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-2xl text-gray-700 text-sm whitespace-pre-wrap">
                    {ticket.description}
                  </div>

                  {ticket.status === 'open' && (
                    <div className="mt-2 space-y-3">
                      <textarea
                        value={replyText[ticket.id] || ''}
                        onChange={(e) => setReplyText({ ...replyText, [ticket.id]: e.target.value })}
                        placeholder="اكتب ردك هنا..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px] resize-y"
                      />
                      <button
                        onClick={() => handleReplyTicket(ticket.id, ticket.userId)}
                        disabled={!replyText[ticket.id] || actionLoading === `reply-${ticket.id}`}
                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {actionLoading === `reply-${ticket.id}` ? (
                          <Clock size={18} className="animate-spin" />
                        ) : (
                          <Send size={18} />
                        )}
                        إرسال الرد
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {supportTickets.length === 0 && (
                <div className="col-span-full p-8 text-center text-gray-500 bg-white rounded-3xl border border-gray-100">
                  لا توجد شكاوى أو طلبات دعم
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 max-w-2xl">
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
                  className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full md:w-auto"
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
