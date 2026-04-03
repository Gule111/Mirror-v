import { motion } from 'framer-motion';
import { Check, Loader2, PlayCircle, Layers, Cpu, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'PENDING', label: '已排队', icon: PlayCircle },
  { id: 'EXTRACTING', label: '视觉抓取', icon: Layers },
  { id: 'ANALYZING', label: '视听分析', icon: Cpu },
  { id: 'SUCCESS', label: '分析完成', icon: Check }
];

export default function PipelineMonitor({ currentStatus }) {
  let activeIndex = 0;
  if (currentStatus === 'PROCESSING') activeIndex = 1; 
  if (currentStatus === 'ANALYZING') activeIndex = 2;  
  if (currentStatus === 'SUCCESS') activeIndex = 3;
  if (currentStatus === 'FAILED') activeIndex = -1;

  if (!currentStatus) return null; 

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 25 }}
      className="w-full max-w-2xl mx-auto mb-24 px-6 relative z-10"
    >
      <div className="apple-glass rounded-3xl p-6 relative flex flex-col gap-6 shadow-apple">
        <div className="flex items-center justify-between px-4">
          <span className="text-xs font-semibold text-apple-gray tracking-[0.15em]">
            处理进度
          </span>
          {currentStatus === 'FAILED' ? (
            <div className="flex items-center gap-1.5 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">系统错误</span>
            </div>
          ) : (
            <span className="text-xs font-medium text-apple-blue">
              {activeIndex === 3 ? '100% 完成' : `${Math.round((activeIndex / 3) * 100)}% 处理中`}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between px-2 relative h-16">
          {/* Connector Rail */}
          <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-[2px] bg-black/5 z-0 rounded-full" />
          
          {/* Progress fill */}
          <motion.div 
            className="absolute left-8 top-1/2 -translate-y-1/2 h-[2px] bg-apple-blue z-0 origin-left rounded-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: Math.max(0, activeIndex) / (STEPS.length - 1) }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 'calc(100% - 64px)' }}
          />

          {STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            const Icon = step.icon;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center group">
                <motion.div
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isPast || isActive ? '#fff' : '#f5f5f7',
                    borderColor: isPast || isActive ? '#0071E3' : '#e5e5ea',
                  }}
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors duration-500
                    ${isActive ? 'shadow-lg shadow-apple-blue/20' : ''} ${isPast ? 'bg-white' : ''}`}
                >
                  {isActive ? (
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                    >
                      <Icon strokeWidth={2} className="w-4 h-4 text-apple-blue" />
                    </motion.div>
                  ) : (
                    <Icon strokeWidth={1.5} className={`w-4 h-4 transition-colors ${isPast ? 'text-apple-blue' : 'text-apple-gray'}`} />
                  )}
                </motion.div>
                <div className="absolute -bottom-8 w-max">
                  <span className={`text-[10px] font-semibold transition-colors duration-300 ${isActive ? 'text-apple-text' : 'text-apple-gray'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
