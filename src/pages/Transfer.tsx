import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, getDocs, runTransaction, doc, addDoc } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Send, Wallet, ArrowRightLeft, User, ArrowRight } from 'lucide-react';
import { OTPModal } from '../components/OTPModal';

export const Transfer: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'binance' | 'id' | null>(null);
  const [receiverId, setReceiverId] = useState('');
  const [binanceId, setBinanceId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const navigate = useNavigate();

  const handleInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!profile) return;

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError('الرجاء إدخال مبلغ صحيح');
      setLoading(false);
      return;
    }

    if (transferAmount > profile.balance) {
      setError('الرصيد غير كافٍ');
      setLoading(false);
      return;
    }

    if (selectedMethod === 'id') {
      if (receiverId === profile.volckaId) {
        setError('لا يمكنك التحويل لنفسك');
        setLoading(false);
        return;
      }

      try {
        // Find receiver
        const q = query(collection(db, 'users'), where('volckaId', '==', receiverId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('رقم الحساب غير موجود');
          setLoading(false);
          return;
        }
      } catch (err: any) {
        setError(err.message || 'حدث خطأ أثناء التحقق من الحساب');
        setLoading(false);
        return;
      }
    } else {
      if (!binanceId) {
        setError('الرجاء إدخال معرف Binance');
        setLoading(false);
        return;
      }
    }

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

    // OTP verified, proceed with action
    if (selectedMethod === 'id') {
      await executeTransfer();
    } else {
      await executeWithdrawal();
    }
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

  const executeTransfer = async () => {
    setLoading(true);
    try {
      if (!profile) return;
      const transferAmount = parseFloat(amount);

      const q = query(collection(db, 'users'), where('volckaId', '==', receiverId));
      const querySnapshot = await getDocs(q);
      const receiverDoc = querySnapshot.docs[0];
      const receiverData = receiverDoc.data();

      // Run Firestore Transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', profile.uid);
        const receiverRef = doc(db, 'users', receiverDoc.id);

        const senderSnap = await transaction.get(senderRef);
        if (!senderSnap.exists()) throw new Error('حساب المرسل غير موجود');

        const currentBalance = senderSnap.data().balance;
        if (currentBalance < transferAmount) throw new Error('الرصيد غير كافٍ');

        // Update balances
        transaction.update(senderRef, { balance: currentBalance - transferAmount });
        transaction.update(receiverRef, { balance: receiverData.balance + transferAmount });

        // Create transaction record
        const txRef = doc(collection(db, 'transactions'));
        transaction.set(txRef, {
          senderId: profile.volckaId,
          receiverId: receiverId,
          amount: transferAmount,
          timestamp: new Date().toISOString(),
          status: 'completed',
          type: 'transfer'
        });

        // Create notification for receiver
        const notifRef = doc(collection(db, 'notifications'));
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(now.getDate() + 3); // Default 3 days expiration

        transaction.set(notifRef, {
          user_id: receiverData.uid,
          title: 'استلام أموال',
          message: `تم استلام ${transferAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} دولار من حساب ${profile.volckaId}`,
          type: 'transfer',
          icon: 'ArrowRightLeft',
          read: false,
          created_at: now.toISOString(),
          expiresAt: expiresAt.toISOString()
        });
      });

      setSuccess('تم التحويل بنجاح');
      setAmount('');
      setReceiverId('');
      await refreshProfile();
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء التحويل');
    } finally {
      setLoading(false);
    }
  };

  const executeWithdrawal = async () => {
    setLoading(true);
    try {
      if (!profile) return;
      const withdrawalAmount = parseFloat(amount);

      await addDoc(collection(db, 'withdrawal_requests'), {
        userId: profile.uid,
        userVolckaId: profile.volckaId,
        userName: profile.fullName || profile.email,
        binanceId: binanceId,
        amount: withdrawalAmount,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      setSuccess('تم إرسال طلب السحب بنجاح');
      setAmount('');
      setBinanceId('');
      
      setTimeout(() => {
        navigate('/home');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تقديم طلب السحب');
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
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">إرسال أموال</h1>
        <p className="text-gray-500 font-medium">قم بتحويل الأموال أو سحبها إلى حسابك في Binance</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-8 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm mb-8 font-medium">
          {success}
        </div>
      )}

      {!selectedMethod ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button
            onClick={() => setSelectedMethod('binance')}
            className="flex items-center p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-right group"
          >
            <div className="w-14 h-14 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 ml-4 group-hover:scale-110 transition-transform shrink-0">
              <Wallet size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">السحب إلى Binance</h3>
              <p className="text-gray-500 text-sm font-medium">تحويل الأموال إلى حساب Binance</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('id')}
            className="flex items-center p-6 bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-right group"
          >
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 ml-4 group-hover:scale-110 transition-transform shrink-0">
              <User size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">السحب عبر ID</h3>
              <p className="text-gray-500 text-sm font-medium">إرسال الأموال إلى مستخدم داخل النظام (VolckaPay ID)</p>
            </div>
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={() => {
              setSelectedMethod(null);
              setError('');
              setSuccess('');
            }} 
            className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium"
          >
            <ArrowRight size={20} />
            رجوع للخيارات
          </button>
          
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedMethod === 'binance' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-600'}`}>
                {selectedMethod === 'binance' ? <Wallet size={28} /> : <User size={28} />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {selectedMethod === 'binance' ? 'السحب إلى Binance' : 'السحب عبر ID'}
                </h2>
                <p className="text-gray-500 text-sm font-medium">
                  {selectedMethod === 'binance' ? 'تحويل الأموال إلى حساب Binance' : 'إرسال الأموال إلى مستخدم داخل النظام (VolckaPay ID)'}
                </p>
              </div>
            </div>

            <form onSubmit={handleInitiate} className="space-y-8">
              {selectedMethod === 'id' ? (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">رقم حساب المستلم (10 أرقام)</label>
                  <input
                    type="text"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    pattern="\d{10}"
                    className="w-full text-3xl font-mono py-4 border-b-2 border-gray-200 focus:border-gray-900 transition-colors bg-transparent outline-none placeholder-gray-300"
                    placeholder="0000000000"
                    dir="ltr"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">معرف Binance (Binance ID)</label>
                  <input
                    type="text"
                    value={binanceId}
                    onChange={(e) => setBinanceId(e.target.value)}
                    required
                    className="w-full text-3xl font-mono py-4 border-b-2 border-gray-200 focus:border-gray-900 transition-colors bg-transparent outline-none placeholder-gray-300"
                    placeholder="123456789"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">المبلغ (USD)</label>
                <div className="relative">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-3xl text-gray-400 font-black">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full text-5xl font-black py-4 pl-12 border-b-2 border-gray-200 focus:border-gray-900 transition-colors bg-transparent outline-none placeholder-gray-200"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-3 font-medium">
                  الرصيد المتاح: ${profile?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || (selectedMethod === 'id' ? !receiverId : !binanceId) || !amount}
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-12"
              >
                {loading ? 'جاري المعالجة...' : (
                  <>
                    <Send size={24} />
                    إرسال
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

