import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FileText, Image as ImageIcon, Download, Share2, Sparkles, 
  Quote, ListTree, Crosshair, AlertCircle, CheckCircle2, TrendingUp,
  Zap, MessageSquare, Layout, Scissors, Target
} from 'lucide-react';

// 辅助组件：渲染得分刻度
const ScoreGauge = ({ score }) => {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90">
        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-black/5" />
        <motion.circle
          cx="64" cy="64" r="58" stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray="364.4"
          initial={{ strokeDashoffset: 364.4 }}
          animate={{ strokeDashoffset: 364.4 - (364.4 * score) / 100 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tighter" style={{ color }}>{score}</span>
        <span className="text-[10px] font-bold text-apple-gray uppercase">Hook 分</span>
      </div>
    </div>
  );
};

export default function ReportSheet({ isOpen, onClose, reportData }) {
  // 安全解析嵌套的 AI 报告数据
  const analysis = (() => {
    if (!reportData?.analysis) return null;
    try {
      // 如果后端存的是 JSON 字符串，尝试解析两层（Dify -> result 内部）
      const firstPass = typeof reportData.analysis === 'string' ? JSON.parse(reportData.analysis) : reportData.analysis;
      return typeof firstPass === 'string' ? JSON.parse(firstPass) : firstPass;
    } catch (e) {
      console.warn("Analysis JSON parsing failed:", e);
      return null;
    }
  })();

  const handleDragEnd = (event, info) => {
    if (info.offset.y > 150 || info.velocity.y > 600) {
      onClose();
    }
  };

  const hookData = analysis?.hook_analysis || analysis?.visual_diagnostic || {};
  const score = hookData?.hook_score || 0;
  const scriptData = analysis?.copywriting_optimized || {};
  const structureData = analysis?.video_structure?.chapters || analysis?.video_structure || [];

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
                <button className="apple-glass-heavy px-4 py-2 rounded-full hover:scale-105 transition-all text-sm font-medium flex items-center gap-2">
                  <Scissors className="w-4 h-4" strokeWidth={2} />
                  导出脚本
                </button>
                <button className="apple-glass-heavy p-2.5 rounded-full hover:scale-105 transition-transform">
                  <Share2 className="w-5 h-5 text-apple-text" strokeWidth={1.5} />
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

            <div className="flex-1 overflow-y-auto px-6 md:px-12 pb-20 scrollbar-hide">
              <div className="max-w-6xl mx-auto pt-4 space-y-16">
                
                {/* 1. Header & Score Dashboard */}
                <section className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-black/5 pb-10">
                  <div className="space-y-4">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-apple-blue/5 text-apple-blue text-[11px] font-bold uppercase tracking-wider"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 多模态深度诊断已就绪
                    </motion.div>
                    <h2 className="text-5xl font-bold tracking-tight text-apple-text leading-[1.1]">
                      Mirror-V <br/>
                      <span className="text-apple-gray/40">爆点视频诊断报告</span>
                    </h2>
                  </div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="apple-glass p-6 rounded-[32px] flex items-center gap-6 shadow-apple border-white"
                  >
                    <ScoreGauge score={score} />
                    <div className="space-y-1">
                      <p className="text-lg font-bold text-apple-text">
                        {score >= 80 ? '极具潜力' : score >= 60 ? '表现尚可' : '急需优化'}
                      </p>
                      <p className="text-xs text-apple-gray leading-snug w-32">
                        基于视觉冲击力、文案钩子与节奏的综合预测。
                      </p>
                    </div>
                  </motion.div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column (8 units) */}
                  <div className="lg:col-span-8 space-y-16">
                    
                    {/* 2. Visual & Diagnostic Analysis */}
                    <div className="space-y-8">
                       <div className="flex items-center gap-3">
                          <Zap className="w-6 h-6 text-apple-blue" />
                          <h3 className="text-2xl font-bold text-apple-text tracking-tight">AI 智能诊断 (Actionable)</h3>
                       </div>

                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Warnings */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-apple-gray uppercase tracking-widest pl-1">风险警示 (Risk)</h4>
                            {(hookData?.visual_alerts || []).map((alert, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-3 p-4 bg-red-50/50 border border-red-100 rounded-2xl"
                              >
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <span className="text-[14px] text-red-900/80 font-medium leading-relaxed">{alert}</span>
                              </motion.div>
                            ))}
                            {(!hookData?.visual_alerts?.length) && <div className="p-4 rounded-2xl border border-dashed border-black/5 text-xs text-apple-gray italic">未检测到显著风险</div>}
                          </div>

                          {/* Suggestions */}
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold text-apple-gray uppercase tracking-widest pl-1">优化方案 (Improve)</h4>
                            {(hookData?.visual_recommendations || []).map((rec, i) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-start gap-3 p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl"
                              >
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-[14px] text-emerald-900/80 font-medium leading-relaxed">{rec}</span>
                              </motion.div>
                            ))}
                          </div>
                       </div>

                       {analysis?.hook_analysis?.visual_analysis && (
                        <div className="apple-glass p-6 rounded-3xl border-white shadow-sm italic text-apple-gray text-sm leading-relaxed">
                          " {analysis.hook_analysis.visual_analysis} "
                        </div>
                       )}
                    </div>

                    {/* 3. Golden 3s Visual Analysis (Frames) */}
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <Target className="w-6 h-6 text-apple-text" />
                            <h3 className="text-2xl font-bold text-apple-text tracking-tight">黄金 3s 视觉锁定</h3>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-apple-gray">
                           <TrendingUp className="w-3 h-3" />
                           模拟流失率预测
                         </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {reportData?.frames?.map((frame, i) => (
                          <motion.div 
                            key={i}
                            className="apple-glass rounded-[32px] overflow-hidden group border-white shadow-apple hover:shadow-apple-hover transition-all duration-500"
                          >
                            <div className="aspect-video bg-[#E8E8ED] relative overflow-hidden">
                              {frame.filePath && (
                                <img 
                                  src={frame.filePath.startsWith('http') ? frame.filePath : `http://localhost:8080/api/v1/assets?path=${encodeURIComponent(frame.filePath)}`} 
                                  alt="Frame" 
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                />
                              )}
                              
                              {/* AI Overlays: Heatmap dots / Visual center */}
                              {i < 3 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                   <motion.div 
                                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
                                      transition={{ duration: 2, repeat: Infinity }}
                                      className="w-20 h-20 bg-apple-blue/20 rounded-full blur-2xl"
                                   />
                                   <div className="w-2 h-2 bg-apple-blue rounded-full ring-4 ring-white/30" />
                                </div>
                              )}

                              <div className="absolute top-4 left-4 flex gap-2">
                                <div className="px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md text-white text-[10px] font-bold">
                                  {frame.timestampInVideo ? frame.timestampInVideo.toFixed(1) : frame.timestamp?.toFixed(1) || '0.0'}s
                                </div>
                                {i < 3 && (
                                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-bold">
                                    黄金时段
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="p-5 space-y-2">
                               <div className="flex items-center justify-between">
                                  <p className="text-[13px] font-bold text-apple-text tracking-tight">帧诊断 #{i+1}</p>
                                  <span className="text-[10px] font-bold text-apple-blue px-2 py-0.5 rounded-md bg-apple-blue/5">AI 分析完成</span>
                               </div>
                               <p className="text-xs text-apple-gray leading-relaxed">
                                 {i === 0 ? '捕获首帧关键画面：AI 将以此建立视觉锚点。' : 
                                  `分析第 ${frame.timestampInVideo?.toFixed(1) || frame.timestamp?.toFixed(1) || '0.0'}s 的画面视觉冲击力与声画对齐度。`}
                               </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                  </div> 

                  {/* Right Column (4 units) */}
                  <div className="lg:col-span-4 space-y-16">
                    
                    {/* 4. Script Comparison (Original vs Optimized) */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2.5">
                        <MessageSquare className="w-5 h-5 text-apple-gray" />
                        <h3 className="text-xl font-bold text-apple-text tracking-tight">AI 黄金脚本改写</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="apple-glass-heavy p-5 rounded-3xl border-transparent opacity-60">
                           <span className="text-[10px] font-bold text-apple-gray uppercase mb-2 block">原始脚本片段</span>
                           <p className="text-[13px] text-apple-gray italic leading-relaxed">
                             {scriptData?.original_hook || reportData?.transcript?.slice(0, 50) + "..." || '正在获取原始语料...'}
                           </p>
                        </div>
                        
                        <motion.div 
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="apple-glass p-6 rounded-[32px] border-apple-blue/20 bg-apple-blue/[0.02] shadow-apple-hover relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                            <TrendingUp className="w-12 h-12 text-apple-blue" />
                          </div>
                          <span className="text-[10px] font-bold text-apple-blue uppercase mb-2 block tracking-widest">🏆 AI 爆款优化方案</span>
                          <p className="text-[15px] text-apple-text font-bold leading-relaxed mb-4">
                            {scriptData?.optimized_hook || (analysis ? '暂无改写建议' : '分析引擎处理中...')}
                          </p>
                          {scriptData?.fix_logic && (
                            <div className="p-3 bg-apple-blue/5 rounded-xl border border-apple-blue/10">
                               <div className="flex items-center gap-2 mb-1">
                                 <Zap className="w-3 h-3 text-apple-blue" />
                                 <span className="text-[10px] font-bold text-apple-blue uppercase">改动逻辑</span>
                               </div>
                               <p className="text-[11px] text-apple-gray/80 italic leading-snug">
                                 {scriptData?.fix_logic}
                               </p>
                            </div>
                          )}
                        </motion.div>
                      </div>
                    </div>

                    {/* 5. Story structure Timeline */}
                    <div className="space-y-6">
                      <div className="flex items-center gap-2.5">
                        <Layout className="w-5 h-5 text-apple-gray" />
                        <h3 className="text-xl font-bold text-apple-text tracking-tight">内容架构拆解</h3>
                      </div>

                      <div className="relative pl-6 space-y-8">
                         <div className="absolute left-2 top-2 bottom-2 w-[1px] bg-black/10" />
                         {(structureData || []).map((chapter, i) => (
                           <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.15 }}
                            className="relative"
                           >
                             <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-apple-blue ring-4 ring-[#FBFBFD]" />
                             <h4 className="text-[14px] font-bold text-apple-text mb-1">{chapter.point}</h4>
                             <p className="text-[12px] text-apple-gray leading-relaxed pr-2">
                               {chapter.content}
                             </p>
                           </motion.div>
                         ))}
                         {(!structureData.length) && <div className="text-xs text-apple-gray italic">正在整理全视频架构...</div>}
                      </div>
                    </div>

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
