import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ShieldCheck, X } from 'lucide-react';

export default function LoginModal({ isOpen, onLoginSuccess, onClose }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    // Simulate Apple-style linear loader duration
    setTimeout(() => {
      setIsLoggingIn(false);
      onLoginSuccess();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/40 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="apple-glass-heavy rounded-[32px] w-full max-w-sm p-10 relative z-10 flex flex-col items-center shadow-2xl border-white"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 transition-colors"
            >
              <X className="w-5 h-5 text-apple-gray" strokeWidth={1.5} />
            </button>
            <div className="w-16 h-16 rounded-3xl bg-apple-text flex items-center justify-center mb-8 shadow-lg">
              <User className="w-8 h-8 text-white" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-bold text-apple-text mb-2 tracking-tight text-center">登录 <br/>Mirror-V</h2>
            <p className="text-sm text-apple-gray mb-10 text-center font-normal">请使用您的账号继续</p>
            
            <form onSubmit={handleLogin} className="w-full space-y-4">
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="账号 / 邮箱" 
                  className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3.5 outline-none focus:border-apple-blue focus:bg-white transition-all text-apple-text placeholder-apple-gray text-sm"
                  disabled={isLoggingIn}
                />
                <input 
                  type="password" 
                  placeholder="密码" 
                  className="w-full bg-black/[0.03] border border-black/5 rounded-xl px-4 py-3.5 outline-none focus:border-apple-blue focus:bg-white transition-all text-apple-text placeholder-apple-gray text-sm"
                  disabled={isLoggingIn}
                />
              </div>
              
              <div className="flex justify-center pt-2">
                <button type="button" className="text-xs font-medium text-apple-blue hover:underline">忘记账号或密码？</button>
              </div>
              
              <div className="pt-8 min-h-[64px] flex flex-col items-center gap-4">
                {isLoggingIn ? (
                  <div className="w-full space-y-3">
                    <div className="w-full h-[3px] bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-apple-blue"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <p className="text-[10px] font-bold text-apple-gray tracking-widest text-center">验证中...</p>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02, backgroundColor: '#007AFF' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    type="submit"
                    className="w-full bg-apple-blue text-white py-3.5 rounded-xl font-semibold text-sm tracking-tight shadow-lg shadow-apple-blue/20 transition-colors"
                  >
                    登录
                  </motion.button>
                )}
              </div>
            </form>

            <div className="mt-12 flex items-center gap-2 text-apple-gray">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[11px] font-medium tracking-tight">隐私与安全保障</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
