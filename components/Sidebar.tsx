import React from 'react';
import { LayoutDashboard, UploadCloud, PieChart, BookOpen, Settings, LogOut } from 'lucide-react';
import { Page } from '../types';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage }) => {
  const menuItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: Page.UPLOAD, label: 'Upload', icon: UploadCloud },
    { id: Page.ANALYTICS, label: 'Analytics', icon: PieChart },
    { id: Page.JOURNAL, label: 'Tax Reports', icon: BookOpen },
    { id: Page.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-20 md:w-64 border-r border-border h-screen flex flex-col bg-background flex-shrink-0 sticky top-0">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3V21H21" stroke="#Eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 9L14 14L10 10L7 13" stroke="#Eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="hidden md:block">
          <h1 className="font-bold text-textMain leading-tight">TradeLedger AI</h1>
          <p className="text-[10px] text-primary uppercase tracking-wider font-medium">Premium Analytics</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-textMuted hover:text-textMain hover:bg-surfaceHighlight'}
              `}
            >
              <Icon size={20} className={isActive ? 'text-primary' : 'text-textMuted group-hover:text-textMain'} />
              <span className={`hidden md:block font-medium ${isActive ? 'text-primary' : ''}`}>
                {item.label}
              </span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary hidden md:block"></div>}
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="bg-surfaceHighlight rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-border transition-colors">
          <img src="https://picsum.photos/100/100" alt="User" className="w-10 h-10 rounded-full border border-border" />
          <div className="hidden md:block overflow-hidden">
            <h4 className="text-sm font-semibold text-textMain truncate">Arjun Mehta</h4>
            <p className="text-xs text-textMuted truncate">arjun@example.com</p>
          </div>
          <LogOut size={16} className="text-textMuted ml-auto hidden md:block hover:text-red-400" />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;