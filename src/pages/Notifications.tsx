import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, collection, query, where, getDocs, doc, updateDoc } from '../lib/firebase';
import { Notification } from '../types';
import { format } from 'date-fns';
import { arMA as ar } from 'date-fns/locale';
import { Bell, CheckCircle2, AlertCircle, CheckCircle, Info, Gift, Star, MessageSquare, Zap, ShieldAlert, Key, ArrowRightLeft } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Bell,
  AlertCircle,
  CheckCircle,
  Info,
  Gift,
  Star,
  MessageSquare,
  Zap,
  ShieldAlert,
  Key,
  ArrowRightLeft
};

export const Notifications: React.FC = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!profile) return;
      try {
        const q = query(
          collection(db, 'notifications'),
          where('user_id', '==', profile.uid)
        );
        
        const snap = await getDocs(q);
        const now = new Date().getTime();
        
        const notifs = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Notification))
          .filter(n => {
            if (!n.expiresAt) return true; // If no expiration, keep it
            return new Date(n.expiresAt).getTime() > now;
          });
        
        // Sort in memory to avoid needing a composite index
        notifs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        setNotifications(notifs);

        // Mark all as read
        notifs.forEach(async (n) => {
          if (!n.read) {
            await updateDoc(doc(db, 'notifications', n.id), { read: true });
          }
        });

      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [profile]);

  return (
    <div className="max-w-3xl mx-auto pt-8 md:pt-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">الإشعارات</h1>
        <p className="text-gray-500 font-medium">أحدث التنبيهات والأحداث الخاصة بحسابك</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Bell className="animate-spin mr-3" />
          جاري تحميل الإشعارات...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
          <p className="text-gray-500 font-medium text-lg">لا توجد إشعارات حالياً</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-gray-100">
          {notifications.map((notif) => {
            const IconComponent = notif.icon && iconMap[notif.icon] ? iconMap[notif.icon] : Bell;
            return (
              <div key={notif.id} className={`py-6 transition-colors ${notif.read ? 'opacity-70' : 'opacity-100'}`}>
                <div className="flex items-start gap-5">
                  <div className={`mt-1 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${notif.read ? 'bg-gray-100 text-gray-500' : 'bg-indigo-50 text-indigo-600'}`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-xl mb-1 ${notif.read ? 'text-gray-900' : 'text-indigo-900'}`}>
                      {notif.title}
                    </h3>
                    <p className={`font-medium mb-3 ${notif.read ? 'text-gray-600' : 'text-indigo-800'}`}>
                      {notif.message}
                    </p>
                    <p className="text-sm text-gray-400 font-medium">
                      {format(new Date(notif.created_at), 'dd MMMM yyyy, hh:mm a', { locale: ar })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
