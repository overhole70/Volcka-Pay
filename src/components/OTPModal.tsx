import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';

interface OTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (code: string) => Promise<void>;
  email: string;
  onResend: () => Promise<void>;
}

export const OTPModal: React.FC<OTPModalProps> = ({ isOpen, onClose, onVerify, email, onResend }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes in seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError('يرجى إدخال رمز مكون من 6 أرقام');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onVerify(code);
    } catch (err: any) {
      setError(err.message || 'فشل التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await onResend();
      setTimer(300);
    } catch (err: any) {
      setError('فشل إعادة إرسال الرمز');
    } finally {
      setResending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">تأكيد العملية</h3>
                  <p className="text-xs text-gray-500">أدخل الرمز المرسل إلى بريدك</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">تم إرسال رمز التحقق إلى:</p>
                <p className="text-sm font-bold text-gray-900">{email}</p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-3xl tracking-[1em] font-black py-4 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl transition-all outline-none"
                  autoFocus
                />
                {error && <p className="text-xs text-red-500 text-center font-medium">{error}</p>}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : 'تحقق وتأكيد'}
                </button>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">تنتهي صلاحية الرمز خلال:</span>
                  <span className="font-bold text-indigo-600">{formatTime(timer)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || timer > 240} // Allow resend after 1 minute
                  className="text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {resending ? 'جاري الإرسال...' : 'إعادة إرسال الرمز'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
