import { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import PipelineMonitor from './components/PipelineMonitor';
import ReportSheet from './components/ReportSheet';
import LoginModal from './components/LoginModal';
import UserDrawer from './components/UserDrawer';
import { taskApi } from './api/client';

export default function App() {
  const [currentStatus, setCurrentStatus] = useState(null); // 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'
  const [taskId, setTaskId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  
  // UI & Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSubmit = async (file, options) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsUploading(true);
    setCurrentStatus(null);
    setTaskId(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', '00000000-0000-0000-0000-000000000000'); 
      
      const response = await taskApi.createTask(formData);
      
      const newTaskId = response.data.taskId;
      setTaskId(newTaskId);
      setCurrentStatus(response.data.status || 'PENDING');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('上传失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!taskId || currentStatus === 'SUCCESS' || currentStatus === 'FAILED') return;

    const intervalId = setInterval(async () => {
      try {
        const res = await taskApi.getTaskStatus(taskId);
        setCurrentStatus(res.data.status);
        
        if (res.data.status === 'SUCCESS') {
          setReportData({
            frames: [
              { timestamp: 1.0 }, { timestamp: 2.0 }, { timestamp: 3.5 }
            ],
            transcript: res.data.transcript || "这是 AI 生成的结构化内容示例。苹果风格注重排版和间距，这里将展示段落清晰、标点准确的分析结果。"
          });
          setTimeout(() => setIsSheetOpen(true), 1200); 
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [taskId, currentStatus]);

  return (
    <div className="relative flex flex-col min-h-screen selection:bg-apple-blue/10 overflow-x-hidden">
      {/* Dynamic Video Background Architecture */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Layer 1: Raw Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>
        
        {/* Layer 2: Premium Glassmorphism Overlays */}
        {/* Subtle top-down gradient for header readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent z-[1]" />
        
        {/* Main white tint - keeping the video visible but text protected */}
        <div className="absolute inset-0 bg-[#F5F5F7]/65 backdrop-blur-[2px] z-[2]" />
      </div>

      <Header 
        isLoggedIn={isLoggedIn} 
        onLoginClick={() => setShowLoginModal(true)} 
        onAvatarClick={() => setIsDrawerOpen(true)}
      />
      
      <main className="flex-1 flex flex-col items-center z-10">
        <HeroSection 
          onSubmit={handleSubmit} 
          isUploading={isUploading} 
          isLoggedIn={isLoggedIn}
          onRequireLogin={() => setShowLoginModal(true)}
        />
        
        <PipelineMonitor currentStatus={currentStatus} />
      </main>

      <footer className="w-full py-12 flex flex-col items-center gap-4 z-10">
        <div className="h-[1px] w-12 bg-black/10" />
        <p className="text-[11px] font-bold text-apple-gray uppercase tracking-[0.2em]">
          MIRROR-V 2026
        </p>
      </footer>

      <ReportSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)} 
        reportData={reportData}
      />
      
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setShowLoginModal(false);
        }}
      />

      <UserDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)}
        onLogout={() => {
          setIsLoggedIn(false);
          setIsDrawerOpen(false);
          setTaskId(null);
          setCurrentStatus(null);
        }}
      />
    </div>
  );
}
