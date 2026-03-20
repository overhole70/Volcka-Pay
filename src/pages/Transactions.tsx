import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, orderBy, getDocs } from '../lib/firebase';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { arMA as ar } from 'date-fns/locale';
import { ArrowDownLeft, ArrowUpRight, Clock } from 'lucide-react';

export const Transactions: React.FC = () => {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!profile) return;
      try {
        const q1 = query(
          collection(db, 'transactions'),
          where('senderId', '==', profile.volckaId)
        );
        
        const q2 = query(
          collection(db, 'transactions'),
          where('receiverId', '==', profile.volckaId)
        );

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
        
        const allTx = [
          ...snap1.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)),
          ...snap2.docs.map(d => ({ id: d.id, ...d.data() } as Transaction))
        ];

        allTx.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setTransactions(allTx);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [profile]);

  return (
    <div className="max-w-3xl mx-auto pt-8 md:pt-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">العمليات</h1>
        <p className="text-gray-500 font-medium">سجل جميع التحويلات والعمليات المالية</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Clock className="animate-spin mr-3" />
          جاري تحميل العمليات...
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-gray-500 font-medium text-lg">لا توجد عمليات سابقة</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {transactions.map((tx) => {
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
  );
};
