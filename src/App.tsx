import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { LeadProvider, useLeads } from './context/LeadContext.js';
import { ToastProvider } from './components/common/Toast.js';
import { LandingPage } from './components/landing/LandingPage.js';
import { Sidebar, NavigationTab } from './components/layout/Sidebar.js';
import { TopBar } from './components/layout/TopBar.js';
import { FindLeadsPage } from './components/leads/FindLeadsPage.js';
import { MyLeadsPage } from './components/leads/MyLeadsPage.js';
import { LeadDetailPage } from './components/leads/LeadDetailPage.js';
import { SettingsPage } from './components/settings/SettingsPage.js';
import { AnalyticsPage } from './components/analytics/AnalyticsPage.js';
import { OutreachPage } from './components/outreach/OutreachPage.js';
import { HelpPage } from './components/help/HelpPage.js';
import { AddLeadModal } from './components/leads/AddLeadModal.js';
import { CsvImportModal } from './components/leads/CsvImportModal.js';
import { AuthModal } from './components/auth/AuthModal.js';
import type { Lead } from './types/index.js';

const MainApp: React.FC = () => {
  const { currentUser, isDemoUser, loginAsDemoUser, loading } = useAuth();
  const { selectedLead, setSelectedLead } = useLeads();

  const [currentTab, setCurrentTab] = useState<NavigationTab>('my-leads');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [outreachPreselectedLeadIds, setOutreachPreselectedLeadIds] = useState<string[]>([]);

  // Landing page if user is not signed in and not demo
  if (!loading && !currentUser && !isDemoUser) {
    return (
      <>
        <LandingPage
          onOpenAuth={(mode = 'login') => {
            setAuthModalMode(mode);
            setIsAuthModalOpen(true);
          }}
          onLaunchDemo={() => {
            loginAsDemoUser();
          }}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
      </>
    );
  }

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  const handleBackFromLeadDetail = () => {
    setSelectedLead(null);
  };

  const handleNavigateToOutreach = (leadIds: string[]) => {
    setSelectedLead(null);
    setOutreachPreselectedLeadIds(leadIds);
    setCurrentTab('outreach');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex font-sans antialiased selection:bg-white selection:text-black">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedLead(null);
          setCurrentTab(tab);
        }}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen min-w-0">
        <TopBar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigate={(tab) => {
            setSelectedLead(null);
            setCurrentTab(tab);
          }}
          onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
          onOpenCsvImportModal={() => setIsCsvModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {selectedLead ? (
            <LeadDetailPage
              lead={selectedLead}
              onBack={handleBackFromLeadDetail}
              onGenerateOutreach={(leadId) => handleNavigateToOutreach([leadId])}
            />
          ) : (
            <>
              {(currentTab === 'my-leads' || currentTab === 'dashboard') && (
                <MyLeadsPage
                  onSelectLead={handleSelectLead}
                  onOpenAddModal={() => setIsAddLeadModalOpen(true)}
                  onOpenCsvModal={() => setIsCsvModalOpen(true)}
                  globalSearchQuery={searchQuery}
                  setGlobalSearchQuery={setSearchQuery}
                  onNavigateToOutreach={handleNavigateToOutreach}
                />
              )}
              {currentTab === 'find-leads' && (
                <FindLeadsPage
                  onSelectLead={handleSelectLead}
                  onOpenCsvModal={() => setIsCsvModalOpen(true)}
                  globalSearchQuery={searchQuery}
                  setGlobalSearchQuery={setSearchQuery}
                />
              )}
              {currentTab === 'outreach' && (
                <OutreachPage 
                  preselectedLeadIds={outreachPreselectedLeadIds}
                  onSelectLead={handleSelectLead}
                  onNavigateTab={(tab) => {
                    setSelectedLead(null);
                    setCurrentTab(tab as any);
                  }}
                />
              )}
              {currentTab === 'analytics' && (
                <AnalyticsPage
                  onNavigate={(tab) => {
                    setSelectedLead(null);
                    setCurrentTab(tab);
                  }}
                />
              )}
              {currentTab === 'settings' && (
                <SettingsPage />
              )}
              {currentTab === 'help' && (
                <HelpPage />
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={() => {
          setSelectedLead(null);
          setCurrentTab('my-leads');
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <LeadProvider>
        <ToastProvider>
          <MainApp />
        </ToastProvider>
      </LeadProvider>
    </AuthProvider>
  );
}
