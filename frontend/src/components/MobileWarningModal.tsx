import { useState, useEffect } from 'react';

const MobileWarningModal = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check if screen width is less than 768px (typical tablet/mobile breakpoint)
      // or if it's a touch device with small screen
      const isMobileWidth = window.innerWidth < 1024; // Signage generator likely needs more space than typical tablet
      
      // Check if user has already ignored the warning in this session
      const ignored = sessionStorage.getItem('mobile_warning_ignored');
      
      if (isMobileWidth && !ignored) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleIgnore = () => {
    setIsVisible(false);
    sessionStorage.setItem('mobile_warning_ignored', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="mobile-warning-overlay">
      <div className="mobile-warning-content">
        <div className="mobile-warning-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3H21C21.5523 3 22 3.44772 22 4V16C22 16.5523 21.5523 17 21 17H3C2.44772 17 2 16.5523 2 16V4C2 3.44772 2.44772 3 3 3ZM3 5V15H21V5H3ZM2 19H22V21H2V19ZM10 17H14V19H10V17Z" fill="currentColor"/>
          </svg>
        </div>
        <h2>建议使用电脑访问</h2>
        <p>检测到您正在使用移动设备或小屏幕设备。为了获得最佳的编辑体验，建议您使用电脑浏览器访问本站。</p>
        <button className="mobile-warning-btn" onClick={handleIgnore}>
          我已知晓，继续使用
        </button>
      </div>
    </div>
  );
};

export default MobileWarningModal;
