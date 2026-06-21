import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SecondNavbar from '../components/SecondNavbar';
import SystemService from '../services/system.service';

const MainLayout = ({ children }) => {
  const [settings, setSettings] = useState({
    companyName: 'Smart Visitor Management System',
    companyLogo: '',
  });

  // Load settings on mount to display customized company name/logo in header
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await SystemService.getSettings();
        if (data) {
          setSettings({
            companyName: data.companyName,
            companyLogo: data.companyLogo,
          });
        }
      } catch (error) {
        console.error('Error fetching global settings in layout:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="layout-root">
      <Header companyName={settings.companyName} companyLogo={settings.companyLogo} />
      <SecondNavbar />
      <main className="main-content">
        <div className="content-card">
          {children}
        </div>
      </main>
      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} {settings.companyName}. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default MainLayout;
