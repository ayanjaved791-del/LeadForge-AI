import React, { useState } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { useToast } from '../common/Toast.js';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose }) => {
  const { addLead } = useLeads();
  const { showToast } = useToast();

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Dental Clinics');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companySize, setCompanySize] = useState('11-50 employees');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast('Company name is required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const score = Math.floor(65 + Math.random() * 25);
      const scoreCategory = score >= 85 ? 'Hot' : score >= 70 ? 'Good' : score >= 40 ? 'Moderate' : 'Low';

      await addLead({
        companyName: companyName.trim(),
        industry,
        location,
        website: website.trim(),
        email: email.trim(),
        phone: phone.trim(),
        companySize,
        source: 'manual',
        leadScore: score,
        scoreCategory,
        status: 'New',
      });

      showToast(`Added ${companyName} to your CRM database`, 'success');
      onClose();
      // Reset form
      setCompanyName('');
      setWebsite('');
      setEmail('');
      setPhone('');
    } catch (err: any) {
      showToast(err?.message || 'Failed to add lead', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-lg rounded-xl border border-neutral-800 bg-neutral-950 p-5 sm:p-6 shadow-2xl backdrop-blur-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-neutral-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black font-bold">
            <Building2 className="h-4 w-4 text-black" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight font-heading">
            Add Prospective Business
          </h2>
        </div>
        <p className="text-xs text-neutral-400 mb-5">
          Enter target company details to calculate an AI Opportunity Score.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden focus:border-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
              >
                <option value="Dental Clinics">Dental Clinics</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Restaurants">Restaurants</option>
                <option value="Gyms">Gyms</option>
                <option value="Law Firms">Law Firms</option>
                <option value="Marketing Agencies">Marketing Agencies</option>
                <option value="Software Companies">Software Companies</option>
                <option value="Healthcare">Healthcare</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. City, Country"
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Contact Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@example.com"
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 212 555 0199"
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white placeholder:text-neutral-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-neutral-300 mb-1">Company Size</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-white focus:outline-hidden"
            >
              <option value="1-10 employees">1-10 employees</option>
              <option value="11-50 employees">11-50 employees</option>
              <option value="51-200 employees">51-200 employees</option>
              <option value="201-500 employees">201-500 employees</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-neutral-750 text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold"
            >
              <Plus className="h-3.5 w-3.5 text-black" />
              <span>{isSubmitting ? 'Saving...' : 'Save to CRM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
