import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Image as ImageIcon, Download, Share2 } from 'lucide-react';

export default function ReportSheet({ isOpen, onClose, reportData }) {
  const handleDragEnd = (event, info) => {
    if (info.offset.y > 150 || info.velocity.y > 600) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 transition-opacity"
          />
          
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed bottom-0 left-0 right-0 h-[92vh] bg-[#FBFBFD] z-[60] flex flex-col pt-2 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] border-t border-white/50"
          >
            {/* Top Bar / Handle */}
            <div className="w-full flex items-center justify-between px-8 py-4 shrink-0">
              <div className="flex gap-2">
                <button className="apple-glass-heavy p-2.5 rounded-full hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5 text-apple-text" strokeWidth={1.5} />
                </button>
                <button className="apple-glass-heavy p-2.5 rounded-full hover:scale-105 transition-transform text-apple-blue">
                  <Download className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>
              
              <div className="flex flex-col items-center gap-2 cursor-grab active:cursor-grabbing group">
                <div className="w-12 h-1.5 bg-black/10 rounded-full group-hover:bg-black/20 transition-colors" />
                <span className="text-[10px] font-bold text-apple-gray tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">关闭</span>
              </div>

              <button 
                onClick={onClose}
                className="apple-glass-heavy p-2.5 rounded-full hover:scale-105 transition-transform"
              >
                <X className="w-5 h-5 text-apple-text" strokeWidth={1.5} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-12 space-y-12">
              <div className="max-w-5xl mx-auto space-y-12 pt-4">
                {/* Header */}
                <header className="space-y-4">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-blue/5 text-apple-blue text-[11px] font-bold uppercase tracking-wider"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
                    AI 洞察已生成
                  </motion.div>
                  <h2 className="text-5xl font-bold tracking-tight text-apple-text">视频结构化 <br/>分析报告</h2>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Frames (Visuals) */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between border-b border-black/5 pb-4">
                      <div className="flex items-center gap-2.5">
                        <ImageIcon className="w-5 h-5 text-apple-blue" strokeWidth={1.5} />
                        <h3 className="text-xl font-semibold text-apple-text">关键帧记录</h3>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                      {reportData?.frames?.map((frame, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="apple-glass rounded-3xl overflow-hidden group border-white shadow-apple hover:shadow-apple-hover transition-all duration-500"
                        >
                          <div className="aspect-video bg-[#E8E8ED] flex items-center justify-center relative">
                            <ImageIcon className="w-8 h-8 text-white/50" />
                            <div className="absolute top-4 left-4 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                              {frame.timestamp?.toFixed(1)}s
                            </div>
                          </div>
                          <div className="p-5">
                            <p className="text-sm font-medium text-apple-text leading-snug truncate">关键场景分析，时间点：{frame.timestamp}s</p>
                            <p className="text-xs text-apple-gray mt-1.5 line-clamp-2">已完成视觉属性与场景逻辑检测分析。</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Transcript (Audio) */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2.5 border-b border-black/5 pb-4">
                      <FileText className="w-5 h-5 text-apple-blue" strokeWidth={1.5} />
                      <h3 className="text-xl font-semibold text-apple-text">语音转录文本</h3>
                    </div>

                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="apple-glass rounded-[32px] p-8 border-white shadow-apple relative"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <FileText className="w-16 h-16" />
                      </div>
                      <div className="relative prose prose-slate prose-sm leading-relaxed text-apple-text text-[15px] font-normal italic">
                        "{reportData?.transcript || '未处理任何音频数据。'}"
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
