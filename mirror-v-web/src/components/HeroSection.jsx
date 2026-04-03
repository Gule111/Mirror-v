import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Video, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HeroSection({ onSubmit, isUploading, isLoggedIn, onRequireLogin }) {
  const [file, setFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [extractFrames, setExtractFrames] = useState(true);
  const [whisperAsr, setWhisperAsr] = useState(true);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleClickTrigger = () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    fileInputRef.current?.click();
  };

  const submitHandler = () => {
    if (!isLoggedIn) {
      onRequireLogin();
      return;
    }
    if (!file) return;
    onSubmit(file, { extractFrames, whisperAsr });
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 70, damping: 22 }}
      className="w-full max-w-4xl mx-auto px-6 pt-32 pb-12 flex flex-col items-center gap-12 relative z-10"
    >
      <div className="text-center space-y-4 max-w-2xl">
        <motion.h2 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-apple-text"
        >
          解析，<br/>
          <span className="text-apple-blue inline-block mt-2">每一帧的爆点。</span>
        </motion.h2>
        <p className="text-xl text-apple-gray font-normal leading-relaxed">
          Mirror-V 以专业级精度，<br className="hidden md:inline"/> 
          从您的视频内容中提取结构化洞察。
        </p>
      </div>

      <div className="w-full max-w-2xl space-y-8">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className={`w-full aspect-[16/9] rounded-[32px] transition-all flex flex-col items-center justify-center p-8 cursor-pointer relative group overflow-hidden
            ${isDragActive ? 'apple-glass-heavy border-apple-blue/30' : 'apple-glass border-white/40 hover:border-white/60 shadow-apple'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClickTrigger}
        >
          <input 
            ref={fileInputRef}
            type="file" 
            accept="video/mp4,video/x-m4v,video/*" 
            className="hidden" 
            onChange={handleChange}
          />
          
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div 
                key="file-selected"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-apple-green/10 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8 text-apple-green" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-xl font-semibold text-apple-text">{file.name}</p>
                  <p className="text-sm text-apple-gray mt-1">准备就绪</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="drop-prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6"
              >
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="w-20 h-20 rounded-full bg-white/80 flex items-center justify-center shadow-sm group-hover:bg-white transition-colors border border-white/50"
                >
                  <UploadCloud strokeWidth={1} className="w-10 h-10 text-apple-gray" />
                </motion.div>
                <div className="text-center">
                  <p className="text-lg font-medium text-apple-text">将 MP4 视频拖拽至此</p>
                  <p className="text-sm text-apple-gray font-normal mt-1">或点击浏览文件</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex flex-wrap gap-4 justify-center">
          <ToggleItem 
            active={extractFrames} 
            onChange={setExtractFrames} 
            icon={<Video className="w-4 h-4" />} 
            label="视觉抽帧" 
          />
          <ToggleItem 
            active={whisperAsr} 
            onChange={setWhisperAsr} 
            icon={<Sparkles className="w-4 h-4" />} 
            label="语音转录" 
          />
        </div>

        <div className="pt-4 w-full flex flex-col items-center">

          <motion.button
            whileHover={{ scale: 1.01, backgroundColor: '#007AFF' }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={submitHandler}
            disabled={isUploading}
            className="w-full max-w-sm mx-auto py-5 rounded-[20px] text-white font-semibold text-[19px] tracking-tight flex justify-center items-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed bg-apple-blue shadow-xl shadow-apple-blue/25 transition-all"
          >
            {isUploading ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold uppercase tracking-widest opacity-80">分析中...</span>
              </div>
            ) : (
              <span>{!file && isLoggedIn ? "选择视频开始" : "开始分析"}</span>
            )}
          </motion.button>

          {/* Apple-style Linear Progress Overlay inside Card (Simulated for UX) */}
          <AnimatePresence>
            {isUploading && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="pt-2 text-center"
              >
                <div className="w-full h-1 bg-black/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    className="h-full bg-apple-blue" 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ToggleItem({ active, onChange, icon, label }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onChange(!active)}
      className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-300
        ${active ? 'bg-white border-white shadow-apple' : 'bg-transparent border-transparent text-apple-gray hover:bg-white/50'}`}
    >
      <div className={`transition-colors ${active ? 'text-apple-blue' : 'text-apple-gray'}`}>
        {icon}
      </div>
      <span className={`text-[13px] tracking-tight ${active ? 'text-apple-text font-bold' : 'text-apple-gray font-medium'}`}>{label}</span>
      <div className={`ml-2 w-7 h-4 rounded-full p-[2px] transition-colors duration-400 ${active ? 'bg-apple-blue' : 'bg-black/10'}`}>
        <motion.div 
          className="w-3.5 h-3.5 bg-white rounded-full shadow-sm"
          animate={{ x: active ? 14 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
}
