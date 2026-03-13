import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Send, ArrowDownLeft, ArrowUpRight, Copy, CheckCircle2, Clock, List, Wallet } from 'lucide-react';
import { db, collection, query, where, orderBy, limit, getDocs } from '../lib/firebase';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'transactions'),
          where('senderId', '==', profile.volckaId)
        );
        
        const q2 = query(
          collection(db, 'transactions'),
          where('receiverId', '==', profile.volckaId)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q), getDocs(q2)]);
        
        const allTx = [
          ...snap1.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)),
          ...snap2.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
        ];

        // Sort combined and take top 5
        allTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setRecentTransactions(allTx.slice(0, 5));
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentTransactions();
  }, [profile]);

  const handleCopy = () => {
    if (profile?.volckaId) {
      navigator.clipboard.writeText(profile.volckaId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 md:pt-6 pb-20">
      {/* Premium Balance Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 mb-6 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>
        
        <div className="relative z-10">
          <p className="text-indigo-100 font-medium mb-1 text-sm">الرصيد المتاح</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6" dir="ltr">
            <span className="text-xl md:text-2xl text-indigo-200 mr-1">$</span>
            {profile?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </h2>
          
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div>
              <p className="text-xs text-indigo-200 mb-1">معرف الحساب</p>
              <p className="font-mono font-bold tracking-wider text-lg">{profile?.volckaId}</p>
            </div>
            <button 
              onClick={handleCopy}
              className="p-2.5 bg-white/20 hover:bg-white/30 rounded-xl transition-colors flex items-center justify-center"
            >
              {copied ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Copy size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-4 gap-2 md:gap-4 mb-8">
        <Link 
          to="/transfer" 
          className="flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-gray-100 group-hover:bg-indigo-50 transition-colors">
            <ArrowUpRight size={24} className="md:w-7 md:h-7" />
          </div>
          <span className="font-bold text-xs md:text-sm text-gray-700">إرسال</span>
        </Link>
        <button 
          onClick={handleCopy}
          className="flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-gray-100 group-hover:bg-emerald-50 transition-colors">
            <ArrowDownLeft size={24} className="md:w-7 md:h-7" />
          </div>
          <span className="font-bold text-xs md:text-sm text-gray-700">استلام</span>
        </button>
        <Link 
          to="/transactions" 
          className="flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:bg-blue-50 transition-colors">
            <List size={24} className="md:w-7 md:h-7" />
          </div>
          <span className="font-bold text-xs md:text-sm text-gray-700">سجل المعاملات</span>
        </Link>
        <Link 
          to="/deposit" 
          className="flex flex-col items-center justify-center gap-2 group"
        >
          <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-full flex items-center justify-center text-purple-600 shadow-sm border border-gray-100 group-hover:bg-purple-50 transition-colors">
            <Wallet size={24} className="md:w-7 md:h-7" />
          </div>
          <span className="font-bold text-xs md:text-sm text-gray-700">إيداع</span>
        </Link>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">أحدث العمليات</h2>
          <Link to="/transactions" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-full transition-colors">
            عرض الكل
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500">جاري تحميل العمليات...</div>
        ) : recentTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Clock size={24} />
            </div>
            <p className="text-gray-900 font-bold mb-1">لا توجد عمليات</p>
            <p className="text-gray-500 text-sm">لم تقم بأي عمليات مالية حتى الآن</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {recentTransactions.map((tx) => {
                const isReceived = tx.receiverId === profile?.volckaId;
                return (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${isReceived ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-900'}`}>
                        {isReceived ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1 text-lg">
                          {isReceived ? 'استلام أموال' : 'إرسال أموال'}
                        </p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p><span className="font-bold text-gray-800">من:</span> <span className="font-mono">{tx.senderId}</span></p>
                          <p><span className="font-bold text-gray-800">إلى:</span> <span className="font-mono">{tx.receiverId}</span></p>
                          {tx.description && <p><span className="font-bold text-gray-800">التفاصيل:</span> {tx.description}</p>}
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-2">
                          {format(new Date(tx.timestamp), 'dd MMM yyyy, hh:mm a', { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right sm:text-left self-end sm:self-center">
                      <div className={`text-2xl font-black ${isReceived ? 'text-emerald-600' : 'text-gray-900'}`} dir="ltr">
                        {isReceived ? '+' : '-'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <p className="text-sm text-gray-500 font-bold mt-1">
                        {tx.status === 'completed' ? 'مكتمل' : tx.status === 'pending' ? 'قيد المعالجة' : 'فشل'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
