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
    <nav
      id="bottom-navigation-bar"
      className="sticky bottom-0 left-0 right-0 z-30 bg-[#f9faf7]/95 backdrop-blur-md border-t border-[#e2ebd9] px-4 py-2"
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
              className={`relative flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'bg-[#dce9d4] text-[#24351e] shadow-2xs font-semibold'
                  : 'text-[#6f8369] hover:text-[#2d4224] hover:bg-[#ebf2e6]'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.9]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#dc2626] text-white text-[9px] font-bold flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] mt-1 ${isActive ? 'font-semibold text-[#24351e]' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
