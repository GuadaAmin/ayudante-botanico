import React from 'react';
import { Bot, Home, LayoutGrid, BookOpen } from 'lucide-react';

export type TabType = 'asesor' | 'dashboard' | 'plantadas' | 'catalogo';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  alertCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, alertCount = 0 }) => {
  const tabs = [
    {
      id: 'asesor' as TabType,
      label: 'Chatbot SED',
      icon: Bot,
      badge: alertCount > 0 ? alertCount : undefined
    },
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'plantadas' as TabType,
      label: 'Plantadas',
      icon: LayoutGrid,
    },
    {
      id: 'catalogo' as TabType,
      label: 'Catálogo',
      icon: BookOpen,
    },
  ];

  return (
    <div
      id="bottom-navigation-wrapper"
      className="fixed bottom-0 inset-x-0 z-50 flex justify-center pointer-events-none"
    >
      <nav
        id="bottom-navigation-bar"
        className="w-full max-w-5xl pointer-events-auto bg-white/95 backdrop-blur-md border-t sm:border-x sm:border-t border-[#d2decb] sm:rounded-t-3xl px-4 py-2 shadow-[0_-6px_25px_rgba(34,51,29,0.12)] transition-all"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 sm:px-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#2c4424] text-white shadow-xs font-semibold scale-102'
                    : 'text-[#60765c] hover:text-[#21341a] hover:bg-[#ecf3e7] font-medium'
                }`}
              >
                <div className="relative">
                  <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.9]'}`} />
                  {tab.badge && (
                    <span className={`absolute -top-1 -right-2 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-xs ${isActive ? 'bg-[#ef4444]' : 'bg-[#dc2626]'}`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-1 ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
