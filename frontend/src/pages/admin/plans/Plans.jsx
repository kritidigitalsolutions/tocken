import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Settings, Users } from "lucide-react";
import PlanManagement from "./PlanManagement";
import UserSubscriptions from "./UserSubscriptions";

const Plans = () => {
  const [activeTab, setActiveTab] = useState('management');
  const { isDark } = useTheme();

  const tabs = [
    {
      id: 'management',
      label: 'Plan Management',
      icon: Settings,
      description: 'Create, edit and manage subscription plans'
    },
    {
      id: 'subscriptions',
      label: 'User Subscriptions', 
      icon: Users,
      description: 'View and manage user plan subscriptions'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'management':
        return <PlanManagement />;
      case 'subscriptions':
        return <UserSubscriptions />;
      default:
        return <PlanManagement />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Plans & Subscriptions
        </h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Manage subscription plans and user subscriptions
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`rounded-lg p-6 border mb-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? isDark 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                      : 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        
        {/* Tab Description */}
        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Plans;