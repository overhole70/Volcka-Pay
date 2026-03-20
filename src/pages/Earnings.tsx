import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, orderBy, getDocs } from '../lib/firebase';
import { Earning } from '../types';
import { format } from 'date-fns';
import { arMA as ar } from 'date-fns/locale';
import { Coins, TrendingUp } from 'lucide-react';

export const Earnings: React.FC = () => {
  const { profile } = useAuth();
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'earnings'),
          where('userId', '==', profile.uid)
        );
        
        const snap = await getDocs(q);
        const earnData = snap.docs.map(d => ({ id: d.id, ...d.data() } as Earning));
        
        // Sort in memory to avoid needing a composite index
        earnData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setEarnings(earnData);

        const total = earnData.reduce((acc, curr) => acc + curr.amount, 0);
        setTotalEarnings(total);

      } catch (error) {
        console.error("Error fetching earnings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [profile]);

  return (
    <div className="max-w-3xl mx-auto pt-8 md:pt-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">الأرباح</h1>
        <p className="text-gray-500 font-medium">سجل أرباحك من تطبيقات وشبكة فولكا</p>
      </div>

      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 text-white p-8 rounded-[2rem] shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10">
          <p className="text-indigo-200 font-medium mb-2 flex items-center gap-2">
            <TrendingUp size={20} />
            إجمالي الأرباح
          </p>
          <h2 className="text-5xl md:text-6xl font-black tracking-tight" dir="ltr">
            <span className="text-3xl text-indigo-300 mr-2">$</span>
            {totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Coins className="animate-spin mr-3" />
          جاري تحميل الأرباح...
        </div>
      ) : earnings.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-gray-500 font-medium text-lg">لا توجد أرباح مسجلة حالياً</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-2 pb-4">سجل الأرباح</h3>
          {earnings.map((earning) => (
            <div key={earning.id} className="flex items-center justify-between py-6 group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Coins size={28} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl mb-1">
                    {earning.source}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {format(new Date(earning.timestamp), 'dd MMMM yyyy, hh:mm a', { locale: ar })}
                  </p>
                </div>
              </div>
              <div className="text-2xl font-black text-amber-500" dir="ltr">
                +${earning.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
