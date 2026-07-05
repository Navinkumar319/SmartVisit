import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SystemService from '../services/system.service';

const MainLayout = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'Smart Visitor Management System',
    companyLogo: '',
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load settings on mount to display customized company name/logo in header
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await SystemService.getSettings();
        if (data) {
          setSettings({
            companyName: data.companyName || 'Smart Visitor Management System',
            companyLogo: data.companyLogo || '',
          });
        }
      } catch (error) {
        console.error('Error fetching global settings in layout:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="layout-container-modern">
      <div className="main-viewport-modern">
        <Header 
          companyName={settings.companyName} 
          companyLogo={settings.companyLogo} 
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
        />
        <main className="main-content-area-modern">
          {children}
        </main>

      </div>
    </div>
  );
};

export default MainLayout;
