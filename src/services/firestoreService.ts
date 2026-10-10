import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.js';
import type { Lead, Campaign, OutreachMessage, UserProfile } from '../types/index.js';

// --- LEADS ---
export async function getLeadsFromFirestore(userId: string): Promise<Lead[]> {
  const path = 'leads';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const leads: Lead[] = [];
    snapshot.forEach(docSnap => {
      leads.push({ id: docSnap.id, ...(docSnap.data() as Omit<Lead, 'id'>) });
    });
    return leads;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveLeadToFirestore(lead: Lead): Promise<void> {
  const path = `leads/${lead.id}`;
  try {
    await setDoc(doc(db, 'leads', lead.id), lead);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateLeadInFirestore(leadId: string, updates: Partial<Lead>): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'leads', leadId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteLeadFromFirestore(leadId: string): Promise<void> {
  const path = `leads/${leadId}`;
  try {
    await deleteDoc(doc(db, 'leads', leadId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function batchSaveLeadsToFirestore(leads: Lead[]): Promise<void> {
  const path = 'leads';
  try {
    const batch = writeBatch(db);
    leads.forEach(lead => {
      const docRef = doc(db, 'leads', lead.id);
      batch.set(docRef, lead);
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// --- CAMPAIGNS ---
export async function getCampaignsFromFirestore(userId: string): Promise<Campaign[]> {
  const path = 'campaigns';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const campaigns: Campaign[] = [];
    snapshot.forEach(docSnap => {
      campaigns.push({ id: docSnap.id, ...(docSnap.data() as Omit<Campaign, 'id'>) });
    });
    return campaigns;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveCampaignToFirestore(campaign: Campaign): Promise<void> {
  const path = `campaigns/${campaign.id}`;
  try {
    await setDoc(doc(db, 'campaigns', campaign.id), campaign);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCampaignInFirestore(campaignId: string, updates: Partial<Campaign>): Promise<void> {
  const path = `campaigns/${campaignId}`;
  try {
    await updateDoc(doc(db, 'campaigns', campaignId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCampaignFromFirestore(campaignId: string): Promise<void> {
  const path = `campaigns/${campaignId}`;
  try {
    await deleteDoc(doc(db, 'campaigns', campaignId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- OUTREACH ---
export async function getOutreachFromFirestore(userId: string): Promise<OutreachMessage[]> {
  const path = 'outreach';
  try {
    const q = query(collection(db, path), where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    const messages: OutreachMessage[] = [];
    snapshot.forEach(docSnap => {
      messages.push({ id: docSnap.id, ...(docSnap.data() as Omit<OutreachMessage, 'id'>) });
    });
    return messages;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function saveOutreachToFirestore(outreach: OutreachMessage): Promise<void> {
  const path = `outreach/${outreach.id}`;
  try {
    await setDoc(doc(db, 'outreach', outreach.id), outreach);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOutreachInFirestore(outreachId: string, updates: Partial<OutreachMessage>): Promise<void> {
  const path = `outreach/${outreachId}`;
  try {
    await updateDoc(doc(db, 'outreach', outreachId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOutreachFromFirestore(outreachId: string): Promise<void> {
  const path = `outreach/${outreachId}`;
  try {
    await deleteDoc(doc(db, 'outreach', outreachId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// --- USER PROFILES ---
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...(docSnap.data() as Omit<UserProfile, 'uid'>) };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserProfile(user: UserProfile): Promise<void> {
  const path = `users/${user.uid}`;
  try {
    await setDoc(doc(db, 'users', user.uid), user, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
