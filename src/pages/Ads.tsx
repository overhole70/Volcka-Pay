import React, { useEffect, useState } from 'react';
import { db, collection, query, where, getDocs } from '../lib/firebase';
import { Ad } from '../types';
import { MonitorPlay, ExternalLink } from 'lucide-react';

export const Ads: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const q = query(collection(db, 'ads'), where('active', '==', true));
        const snap = await getDocs(q);
        const activeAds = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad));
        setAds(activeAds);
      } catch (error) {
        console.error("Error fetching ads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAds();
  }, []);

  return (
    <div className="max-w-4xl mx-auto pt-8 md:pt-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">إعلانات فولكا</h1>
        <p className="text-gray-500 font-medium">اكتشف أحدث المنتجات والعروض من شبكة فولكا</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <MonitorPlay className="animate-spin mr-3" />
          جاري تحميل الإعلانات...
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-gray-500 font-medium text-lg">لا توجد إعلانات حالياً</p>
        </div>
      ) : (
        <div className="space-y-12">
          {ads.map((ad) => (
            <a 
              key={ad.id} 
              href={ad.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="aspect-[21/9] w-full overflow-hidden bg-gray-100 relative rounded-3xl mb-6">
                {ad.imageUrl ? (
                  <img 
                    src={ad.imageUrl} 
                    alt={ad.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <MonitorPlay size={48} />
                  </div>
                )}
                <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase">
                  إعلان
                </div>
              </div>
              <div className="flex items-center justify-between px-2">
                <h3 className="font-black text-2xl text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {ad.title}
                </h3>
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ExternalLink size={24} className="text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
