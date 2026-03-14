import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HelpCircle, Send, CheckCircle2 } from 'lucide-react';
import { db, collection, addDoc, serverTimestamp } from '../lib/firebase';

export const Support: React.FC = () => {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !profile) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'support_tickets'), {
        userId: profile.uid,
        volckaId: profile.volckaId,
        userEmail: profile.email,
        userName: profile.fullName || 'مستخدم',
        title,
        description,
        status: 'open',
        timestamp: serverTimestamp(),
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      alert('حدث خطأ أثناء إرسال الشكوى. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pt-2 md:pt-6 pb-20">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
          <HelpCircle size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">المساعدة والدعم</h1>
          <p className="text-gray-500 text-sm font-medium">نحن هنا لمساعدتك</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">تم إرسال الشكوى بنجاح</h2>
            <p className="text-gray-500 mb-6">سيتم مراجعة طلبك والرد عليك في أقرب وقت ممكن.</p>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
            >
              إرسال شكوى أخرى
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">عنوان الشكوى</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                placeholder="أدخل عنواناً مختصراً للمشكلة"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">وصف المشكلة</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all min-h-[150px] resize-y"
                placeholder="يرجى وصف المشكلة بالتفصيل..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !title || !description}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white rounded-2xl py-4 font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={20} />
                  <span>إرسال الشكوى</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
