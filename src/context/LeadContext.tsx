import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Lead, Campaign, OutreachMessage, LeadStatus } from '../types/index.js';
import { 
  INITIAL_DEMO_LEADS, 
  INITIAL_DEMO_CAMPAIGNS, 
  INITIAL_DEMO_OUTREACH 
} from '../services/demoData.js';
import { 
  getLeadsFromFirestore, 
  saveLeadToFirestore, 
  updateLeadInFirestore, 
  deleteLeadFromFirestore,
  batchSaveLeadsToFirestore,
  getCampaignsFromFirestore,
  saveCampaignToFirestore,
  updateCampaignInFirestore,
  deleteCampaignFromFirestore,
  getOutreachFromFirestore,
  saveOutreachToFirestore,
  updateOutreachInFirestore,
  deleteOutreachFromFirestore
} from '../services/firestoreService.js';
import { useAuth } from './AuthContext.js';

interface LeadContextType {
  leads: Lead[];
  discoveryLeads: Lead[];
  campaigns: Campaign[];
  outreach: OutreachMessage[];
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  isSyncing: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<Lead>;
  saveDiscoveryLeadToMyLeads: (lead: Lead) => Promise<void>;
  saveBatchDiscoveryLeadsToMyLeads: (leadsToSave: Lead[]) => Promise<number>;
  updateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  updateLeadDetails: (leadId: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (leadId: string) => Promise<void>;
  batchImportLeads: (newLeads: Partial<Lead>[]) => Promise<number>;
  createCampaign: (data: { name: string; industry: string; location: string; service: string; description: string }) => Promise<Campaign>;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => Promise<void>;
  deleteCampaign: (campaignId: string) => Promise<void>;
  saveOutreachMessage: (msg: Omit<OutreachMessage, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => Promise<OutreachMessage>;
  batchSaveOutreachMessages: (messages: Omit<OutreachMessage, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]) => Promise<OutreachMessage[]>;
  updateOutreachMessage: (id: string, updates: Partial<OutreachMessage>) => Promise<void>;
  deleteOutreachMessage: (id: string) => Promise<void>;
  clearAllOutreach: () => Promise<void>;
  resetToDemoData: () => void;
}

const LeadContext = createContext<LeadContextType | undefined>(undefined);

const STORAGE_KEY_LEADS = 'leadforge_leads_v1';
const STORAGE_KEY_CAMPAIGNS = 'leadforge_campaigns_v1';
const STORAGE_KEY_OUTREACH = 'leadforge_outreach_v1';

export const LeadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isDemoUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEADS);
      if (saved) {
        const parsed: Lead[] = JSON.parse(saved);
        return parsed.filter(l => !l.id.startsWith('demo-lead-') && l.source !== 'demo');
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [discoveryLeads] = useState<Lead[]>([]);

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
      if (saved) {
        const parsed: Campaign[] = JSON.parse(saved);
        return parsed.filter(c => !c.id.startsWith('camp-'));
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [outreach, setOutreach] = useState<OutreachMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTREACH);
      if (saved) {
        const parsed: OutreachMessage[] = JSON.parse(saved);
        // Exclude any fake or demo items
        return parsed.filter(o => 
          !o.id.startsWith('outreach-') && 
          !o.id.startsWith('demo-') &&
          o.companyName &&
          !o.companyName.toLowerCase().includes('demo') &&
          !o.companyName.toLowerCase().includes('sample')
        );
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync with Firestore whenever currentUser changes and is not demo
  useEffect(() => {
    if (!currentUser || isDemoUser) return;

    let isMounted = true;
    const fetchUserData = async () => {
      try {
        setIsSyncing(true);
        const [remoteLeads, remoteCampaigns, remoteOutreach] = await Promise.all([
          getLeadsFromFirestore(currentUser.uid),
          getCampaignsFromFirestore(currentUser.uid),
          getOutreachFromFirestore(currentUser.uid)
        ]);

        if (!isMounted) return;

        if (remoteLeads && remoteLeads.length > 0) {
          const cleanLeads = remoteLeads.filter(l => !l.id.startsWith('demo-lead-') && l.source !== 'demo');
          setLeads(cleanLeads);
          localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(cleanLeads));
        }

        if (remoteCampaigns && remoteCampaigns.length > 0) {
          setCampaigns(remoteCampaigns);
          localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(remoteCampaigns));
        }

        if (remoteOutreach && remoteOutreach.length > 0) {
          setOutreach(remoteOutreach);
          localStorage.setItem(STORAGE_KEY_OUTREACH, JSON.stringify(remoteOutreach));
        }
      } catch (err) {
        console.warn('Firestore sync failed, staying with local cached data:', err);
      } finally {
        if (isMounted) setIsSyncing(false);
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, isDemoUser]);

  // Keep localStorage updated
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OUTREACH, JSON.stringify(outreach));
  }, [outreach]);

  // Recalculate campaign lead stats
  const syncCampaignCounts = (updatedLeads: Lead[]) => {
    setCampaigns(prevCamps => 
      prevCamps.map(camp => {
        const campLeads = updatedLeads.filter(l => l.campaignId === camp.id);
        const contacted = campLeads.filter(l => ['Contacted', 'Replied', 'Interested', 'Converted'].includes(l.status)).length;
        const replied = campLeads.filter(l => ['Replied', 'Interested', 'Converted'].includes(l.status)).length;
        const interested = campLeads.filter(l => ['Interested', 'Converted'].includes(l.status)).length;
        const converted = campLeads.filter(l => l.status === 'Converted').length;

        return {
          ...camp,
          leadCount: campLeads.length,
          contactedCount: contacted,
          replyCount: replied,
          interestedCount: interested,
          convertedCount: converted
        };
      })
    );
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<Lead> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const newLead: Lead = {
      ...leadData,
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId,
      createdAt: now,
      updatedAt: now,
    };

    const nextLeads = [newLead, ...leads];
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (currentUser && !isDemoUser) {
      saveLeadToFirestore(newLead).catch(console.error);
    }
    return newLead;
  };

  const saveDiscoveryLeadToMyLeads = async (discoveryLead: Lead): Promise<void> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const alreadySaved = leads.find(l => l.companyName.toLowerCase() === discoveryLead.companyName.toLowerCase());
    if (alreadySaved) return;

    const importedLead: Lead = {
      ...discoveryLead,
      id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      source: discoveryLead.source || 'google-maps',
      createdAt: now,
      updatedAt: now
    };

    const nextLeads = [importedLead, ...leads];
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (currentUser && !isDemoUser) {
      saveLeadToFirestore(importedLead).catch(console.error);
    }
  };

  const saveBatchDiscoveryLeadsToMyLeads = async (discoveryLeads: Lead[]): Promise<number> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const existingNames = new Set(leads.map(l => l.companyName.toLowerCase()));

    const newLeads: Lead[] = [];
    for (const discLead of discoveryLeads) {
      if (!existingNames.has(discLead.companyName.toLowerCase())) {
        const imported: Lead = {
          ...discLead,
          id: `saved_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          ownerId,
          source: discLead.source || 'google-maps',
          createdAt: now,
          updatedAt: now,
        };
        newLeads.push(imported);
        existingNames.add(discLead.companyName.toLowerCase());
      }
    }

    if (newLeads.length === 0) return 0;

    const nextLeads = [...newLeads, ...leads];
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (currentUser && !isDemoUser) {
      newLeads.forEach(l => saveLeadToFirestore(l).catch(console.error));
    }
    return newLeads.length;
  };

  const updateLeadStatus = async (leadId: string, status: LeadStatus) => {
    const now = new Date().toISOString();
    const nextLeads = leads.map(l => l.id === leadId ? { ...l, status, updatedAt: now } : l);
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, status, updatedAt: now } : null);
    }

    if (currentUser && !isDemoUser) {
      updateLeadInFirestore(leadId, { status, updatedAt: now }).catch(console.error);
    }
  };

  const updateLeadDetails = async (leadId: string, updates: Partial<Lead>) => {
    const now = new Date().toISOString();
    const nextLeads = leads.map(l => l.id === leadId ? { ...l, ...updates, updatedAt: now } : l);
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (selectedLead?.id === leadId) {
      setSelectedLead(prev => prev ? { ...prev, ...updates, updatedAt: now } : null);
    }

    if (currentUser && !isDemoUser) {
      updateLeadInFirestore(leadId, { ...updates, updatedAt: now }).catch(console.error);
    }
  };

  const deleteLead = async (leadId: string) => {
    const nextLeads = leads.filter(l => l.id !== leadId);
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (selectedLead?.id === leadId) {
      setSelectedLead(null);
    }

    if (currentUser && !isDemoUser) {
      deleteLeadFromFirestore(leadId).catch(console.error);
    }
  };

  const batchImportLeads = async (newLeads: Partial<Lead>[]): Promise<number> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();

    const created: Lead[] = newLeads.map((item, idx) => {
      const score = item.leadScore || Math.floor(55 + Math.random() * 35);
      const scoreCategory = score >= 85 ? 'Hot' : score >= 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Low';
      return {
        id: `csv_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        ownerId,
        companyName: item.companyName || `Company #${idx + 1}`,
        industry: item.industry || 'B2B Services',
        location: item.location || 'Metropolitan Area',
        website: item.website || '',
        email: item.email || '',
        phone: item.phone || '',
        companySize: item.companySize || '11-50 employees',
        source: 'csv',
        leadScore: score,
        scoreCategory,
        status: 'New',
        campaignId: item.campaignId || undefined,
        createdAt: now,
        updatedAt: now
      };
    });

    const nextLeads = [...created, ...leads];
    setLeads(nextLeads);
    syncCampaignCounts(nextLeads);

    if (currentUser && !isDemoUser) {
      batchSaveLeadsToFirestore(created).catch(console.error);
    }

    return created.length;
  };

  const createCampaign = async (data: { name: string; industry: string; location: string; service: string; description: string }): Promise<Campaign> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const newCamp: Campaign = {
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      ...data,
      leadCount: 0,
      contactedCount: 0,
      replyCount: 0,
      interestedCount: 0,
      convertedCount: 0,
      createdAt: now,
      updatedAt: now
    };

    setCampaigns(prev => [newCamp, ...prev]);

    if (currentUser && !isDemoUser) {
      saveCampaignToFirestore(newCamp).catch(console.error);
    }

    return newCamp;
  };

  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>) => {
    const now = new Date().toISOString();
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, ...updates, updatedAt: now } : c));

    if (currentUser && !isDemoUser) {
      updateCampaignInFirestore(campaignId, { ...updates, updatedAt: now }).catch(console.error);
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    // Remove campaign association from leads
    setLeads(prev => prev.map(l => l.campaignId === campaignId ? { ...l, campaignId: undefined } : l));

    if (currentUser && !isDemoUser) {
      deleteCampaignFromFirestore(campaignId).catch(console.error);
    }
  };

  const saveOutreachMessage = async (msgData: Omit<OutreachMessage, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<OutreachMessage> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const newOutreach: OutreachMessage = {
      ...msgData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      createdAt: now,
      updatedAt: now
    };

    setOutreach(prev => [newOutreach, ...prev]);

    // Also update lead status to Contacted if it was New
    const targetLead = leads.find(l => l.id === msgData.leadId);
    if (targetLead && targetLead.status === 'New') {
      updateLeadStatus(targetLead.id, 'Contacted');
    }

    if (currentUser && !isDemoUser) {
      saveOutreachToFirestore(newOutreach).catch(console.error);
    }

    return newOutreach;
  };

  const updateOutreachMessage = async (id: string, updates: Partial<OutreachMessage>) => {
    const now = new Date().toISOString();
    setOutreach(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: now } : o));

    if (currentUser && !isDemoUser) {
      updateOutreachInFirestore(id, { ...updates, updatedAt: now }).catch(console.error);
    }
  };

  const batchSaveOutreachMessages = async (
    messagesData: Omit<OutreachMessage, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>[]
  ): Promise<OutreachMessage[]> => {
    const ownerId = currentUser?.uid || 'demo-user';
    const now = new Date().toISOString();
    const newMessages: OutreachMessage[] = messagesData.map((msgData, idx) => ({
      ...msgData,
      id: `msg_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      ownerId,
      createdAt: now,
      updatedAt: now
    }));

    setOutreach(prev => [...newMessages, ...prev]);

    // Update lead status to Contacted if New
    const targetLeadIds = new Set(messagesData.map(m => m.leadId));
    setLeads(prev => prev.map(lead => {
      if (targetLeadIds.has(lead.id) && lead.status === 'New') {
        return { ...lead, status: 'Contacted', updatedAt: now };
      }
      return lead;
    }));

    if (currentUser && !isDemoUser) {
      newMessages.forEach(msg => {
        saveOutreachToFirestore(msg).catch(console.error);
      });
    }

    return newMessages;
  };

  const clearAllOutreach = async () => {
    setOutreach([]);
    localStorage.removeItem(STORAGE_KEY_OUTREACH);
  };

  const deleteOutreachMessage = async (id: string) => {
    setOutreach(prev => prev.filter(o => o.id !== id));

    if (currentUser && !isDemoUser) {
      deleteOutreachFromFirestore(id).catch(console.error);
    }
  };

  const resetToDemoData = () => {
    setLeads(INITIAL_DEMO_LEADS);
    setCampaigns(INITIAL_DEMO_CAMPAIGNS);
    setOutreach(INITIAL_DEMO_OUTREACH);
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(INITIAL_DEMO_LEADS));
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(INITIAL_DEMO_CAMPAIGNS));
    localStorage.setItem(STORAGE_KEY_OUTREACH, JSON.stringify(INITIAL_DEMO_OUTREACH));
  };

  return (
    <LeadContext.Provider
      value={{
        leads,
        discoveryLeads,
        campaigns,
        outreach,
        selectedLead,
        setSelectedLead,
        isSyncing,
        addLead,
        saveDiscoveryLeadToMyLeads,
        saveBatchDiscoveryLeadsToMyLeads,
        updateLeadStatus,
        updateLeadDetails,
        deleteLead,
        batchImportLeads,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        saveOutreachMessage,
        batchSaveOutreachMessages,
        updateOutreachMessage,
        deleteOutreachMessage,
        clearAllOutreach,
        resetToDemoData
      }}
    >
      {children}
    </LeadContext.Provider>
  );
};

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeads must be used within a LeadProvider');
  }
  return context;
};
