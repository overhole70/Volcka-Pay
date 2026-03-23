import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, addDoc, doc, getDoc } from '../lib/firebase';
import { Wallet, Copy, CheckCircle2, Clock, Upload } from 'lucide-react';
import { OTPModal } from '../components/OTPModal';

export const Deposit: React.FC = () => {
  const { profile } = useAuth();
  const [binanceId, setBinanceId] = useState('1171444753');
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showOTP, setShowOTP] = useState(false);

  const [formData, setFormData] = useState({
    binanceName: '',
    transferTime: '',
    orderId: ''
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, 'settings', 'app_settings'));
        if (settingsDoc.exists()) {
          const data = settingsDoc.data();
          if (data.binanceId) {
            setBinanceId(data.binanceId);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(binanceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDepositInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    setError('');

    try {
      // Generate and send OTP
      const res = await fetch(`/api/otp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل إرسال رمز التحقق');
      }

      setShowOTP(true);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (!profile) return;

    const res = await fetch(`/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email, code }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'رمز التحقق غير صحيح');
    }

    // OTP verified, proceed with deposit request
    await executeDeposit();
    setShowOTP(false);
  };

  const handleResendOTP = async () => {
    if (!profile) return;
    const res = await fetch(`/api/otp/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: profile.email }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'فشل إعادة إرسال الرمز');
    }
  };

  const executeDeposit = async () => {
    setLoading(true);
    try {
      if (!profile) return;
      await addDoc(collection(db, 'deposit_requests'), {
        userId: profile.uid,
        userVolckaId: profile.volckaId,
        userName: profile.fullName || profile.email,
        binanceName: formData.binanceName,
        transferTime: formData.transferTime,
        orderId: formData.orderId,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSuccess(true);
      setShowForm(false);
      setFormData({
        binanceName: '',
        transferTime: '',
        orderId: ''
      });
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-8 md:pt-12">
      <OTPModal
        isOpen={showOTP}
        onClose={() => setShowOTP(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={profile?.email || ''}
      />
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">إيداع الأموال</h1>
        <p className="text-gray-500 font-medium">قم بإيداع الأموال في حسابك عبر Binance</p>
      </div>

      {success ? (
        <div className="bg-emerald-50 rounded-3xl p-8 text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-4">تم إرسال طلب الإيداع بنجاح</h2>
          <p className="text-gray-600 font-medium mb-8">
            سنقوم بمراجعة طلبك وإضافة المبلغ إلى رصيدك في أقرب وقت ممكن.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors"
          >
            إيداع جديد
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-yellow-50 rounded-2xl flex items-center justify-center text-yellow-600">
                <Wallet size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">إيداع عبر Binance</h2>
                <p className="text-gray-500 text-sm font-medium">طريقة الإيداع المعتمدة</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <p className="text-gray-900 font-bold mb-4 text-center text-lg">
                قم بتحويل المبلغ الذي تريد إيداعه بعملة USDT إلى معرف Binance التالي:
              </p>
              <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 overflow-hidden">
                <span className="font-mono text-xl sm:text-3xl font-black tracking-wider text-gray-900 break-all">{binanceId}</span>
                <button
                  onClick={handleCopy}
                  className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-gray-700 flex items-center gap-2 shrink-0"
                >
                  {copied ? <CheckCircle2 size={20} className="text-emerald-600" /> : <Copy size={20} />}
                  <span className="font-bold text-sm hidden sm:inline">{copied ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Upload size={20} />
                إرسال
              </button>
            ) : (
              <form onSubmit={handleDepositInitiate} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">تفاصيل التحويل</h3>
                  
                  {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 font-medium text-center">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">اسمك في Binance</label>
                      <input
                        type="text"
                        value={formData.binanceName}
                        onChange={(e) => setFormData({...formData, binanceName: e.target.value})}
                        required
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none font-medium"
                        placeholder="الاسم كما يظهر في حسابك"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">وقت التحويل</label>
                      <input
                        type="text"
                        value={formData.transferTime}
                        onChange={(e) => setFormData({...formData, transferTime: e.target.value})}
                        required
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none font-medium"
                        placeholder="مثال: 14:30 بتوقيت مكة"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">معرف الطلب (Order ID)</label>
                      <input
                        type="text"
                        value={formData.orderId}
                        onChange={(e) => setFormData({...formData, orderId: e.target.value})}
                        required
                        className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:ring-0 focus:border-gray-900 transition-colors bg-white outline-none font-mono"
                        placeholder="رقم العملية من Binance"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-gray-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <Clock className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                      {loading ? 'جاري الإرسال...' : 'إرسال'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
