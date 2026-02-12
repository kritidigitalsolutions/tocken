import { useState } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { Users, UserCheck, PlusCircle } from "lucide-react";
import LeadRequests from "./LeadRequests";
import LeadAssignment from "./LeadAssignment";
import AssignedLeads from "./AssignedLeads";

const Leads = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const { isDark } = useTheme();

  const tabs = [
    {
      id: 'requests',
      label: 'Lead Requests',
      icon: Users,
      count: null, // Will be updated by child component
      description: 'Manage user lead requests and approvals'
    },
    {
      id: 'assignment',
      label: 'Assign Leads',
      icon: PlusCircle,
      count: null,
      description: 'Assign buyer/renter contacts to users'
    },
    {
      id: 'assigned',
      label: 'Assigned Leads',
      icon: UserCheck,
      count: null,
      description: 'View all assigned leads overview'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'requests':
        return <LeadRequests />;
      case 'assignment':
        return <LeadAssignment />;
      case 'assigned':
        return <AssignedLeads />;
      default:
        return <LeadRequests />;
    }
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Lead Management System</h1>
        <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
          Manage user lead requests, assign buyer/renter contacts, and track all lead activities
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
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
                {tab.count !== null && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : isDark
                        ? 'bg-slate-600 text-slate-300'
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
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

export default Leads;
