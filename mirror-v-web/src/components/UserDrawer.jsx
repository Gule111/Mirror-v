import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Settings, CreditCard, LogOut, ChevronRight } from 'lucide-react';

export default function UserDrawer({ isOpen, onClose, onLogout }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-[4px] z-[110]"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-full max-w-[380px] bg-white/70 backdrop-blur-[50px] saturate-[160%] shadow-2xl z-[120] border-l border-white/20 flex flex-col"
          >
            <div className="flex items-center justify-between p-8">
              <h2 className="text-xl font-bold text-apple-text tracking-tight">账户中心</h2>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-black/5 transition-colors"
              >
                <X className="w-5 h-5 text-apple-gray" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 space-y-8">
              {/* User Profile Info */}
              <div className="flex flex-col items-center py-6">
                <div className="w-20 h-20 rounded-full bg-apple-slate-blue flex items-center justify-center mb-4 shadow-xl">
                  <User className="w-10 h-10 text-white" strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-apple-text">Premium Member</h3>
                <p className="text-sm text-apple-gray">mirror_v_user@apple.com</p>
              </div>

              {/* Menu Groups */}
              <div className="space-y-2">
                <DrawerItem icon={<User className="w-5 h-5" />} label="个人信息" />
                <DrawerItem icon={<CreditCard className="w-5 h-5" />} label="订阅计划" />
                <DrawerItem icon={<Settings className="w-5 h-5" />} label="偏好设置" />
              </div>

              <div className="pt-8 border-t border-black/5">
                <button 
                  onClick={onLogout}
                  className="w-full flex items-center justify-between p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5" />
                    <span className="font-semibold text-sm">退出登录</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              </div>
            </div>

            <div className="p-8 text-center">
              <p className="text-[10px] text-apple-gray font-bold uppercase tracking-widest">
                Mirror-V Pro Max Edition
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerItem({ icon, label }) {
  return (
    <button className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-black/5 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="text-apple-slate-blue">{icon}</div>
        <span className="text-sm font-semibold text-apple-text">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-apple-gray opacity-30 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}
