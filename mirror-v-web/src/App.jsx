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

  // 使用函数提取报告数据逻辑，以便复用
  const fetchReportData = async (tid) => {
    try {
      const res = await taskApi.getTaskStatus(tid);
      if (res.data.status === 'SUCCESS') {
        let parsedAnalysis = null;
        if (res.data.analysis) {
          try {
            parsedAnalysis = typeof res.data.analysis === 'string' 
              ? JSON.parse(res.data.analysis) 
              : res.data.analysis;
          } catch (e) { console.error("Parse fail:", e); }
        }
        setReportData({
          frames: res.data.frames || [],
          transcript: res.data.transcript || "未获取到台词文本",
          analysis: parsedAnalysis
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Fetch report error:', err);
      return false;
    }
  };

  useEffect(() => {
    if (!taskId || currentStatus === 'FAILED') return;
    
    // 如果已经是 SUCCESS，尝试直接加载数据（用于点击重新打开）
    if (currentStatus === 'SUCCESS' && !reportData) {
      fetchReportData(taskId);
      return;
    }

    if (currentStatus === 'SUCCESS') return;

    const intervalId = setInterval(async () => {
      const isDone = await fetchReportData(taskId);
      if (isDone) {
        setCurrentStatus('SUCCESS');
        setTimeout(() => setIsSheetOpen(true), 1200);
        clearInterval(intervalId);
      } else {
        // 更新中间状态
        try {
          const res = await taskApi.getTaskStatus(taskId);
          if (res.data.status !== currentStatus) {
            setCurrentStatus(res.data.status);
          }
        } catch(e) {}
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [taskId, currentStatus, reportData]);

  return (
    <div className="relative flex flex-col min-h-screen selection:bg-apple-blue/10 overflow-x-hidden">
      {/* ... (Video Background remains unchanged) ... */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent z-[1]" />
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
        
        <PipelineMonitor 
          currentStatus={currentStatus} 
          onClick={currentStatus === 'SUCCESS' ? () => setIsSheetOpen(true) : null}
        />
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
