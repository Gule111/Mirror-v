import { Layers, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header({ isLoggedIn, onLoginClick, onAvatarClick }) {
  return (
    <div className="fixed top-6 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="pointer-events-auto flex items-center justify-between gap-12 px-6 py-2.5 apple-glass-heavy rounded-full border-white/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-apple-text flex items-center justify-center">
            <Layers className="w-4 h-4 text-white" strokeWidth={1.5} />
          </div>
          <span className="text-lg font-medium text-apple-text tracking-tight h-5 leading-5 flex items-center">
            Mirror-V
          </span>
        </div>
        
        <div className="h-4 w-[1px] bg-black/10 mx-2" />

        <div className="flex items-center">
          {isLoggedIn ? (
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onAvatarClick}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-apple-bg border border-black/5 flex items-center justify-center shadow-sm overflow-hidden">
                <User className="w-4 h-4 text-apple-gray" strokeWidth={1.5} />
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#000' }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={onLoginClick}
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-apple-text text-white shadow-sm"
            >
              登录
            </motion.button>
          )}
        </div>
      </motion.header>
    </div>
  );
}
