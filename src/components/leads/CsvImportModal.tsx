import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useLeads } from '../../context/LeadContext.js';
import { useToast } from '../common/Toast.js';
import type { Lead } from '../../types/index.js';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { batchImportLeads } = useLeads();
  const { showToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Column Mapping
  const [columnMap, setColumnMap] = useState<Record<string, string>>({
    companyName: '',
    website: '',
    email: '',
    phone: '',
    industry: '',
    location: '',
  });

  if (!isOpen) return null;

  const parseCsv = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('CSV must contain at least a header row and one record.');
    }

    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headerRow = parseLine(lines[0]);
    const cleanHeaders = headerRow.map(h => h.replace(/["']/g, '').trim());

    const records: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const record: Record<string, string> = {};
      cleanHeaders.forEach((header, idx) => {
        record[header] = (values[idx] || '').replace(/^["']|["']$/g, '').trim();
      });
      records.push(record);
    }

    return { headers: cleanHeaders, records };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        setCsvRawText(text);
        const { headers: hdrs, records } = parseCsv(text);
        setHeaders(hdrs);
        setParsedRows(records);

        const autoMap: Record<string, string> = {
          companyName: hdrs.find(h => /company|name|business|organization/i.test(h)) || '',
          website: hdrs.find(h => /website|domain|url|site/i.test(h)) || '',
          email: hdrs.find(h => /email|contact_email|mail/i.test(h)) || '',
          phone: hdrs.find(h => /phone|mobile|tel|contact_number/i.test(h)) || '',
          industry: hdrs.find(h => /industry|sector|category|vertical/i.test(h)) || '',
          location: hdrs.find(h => /location|city|country|address/i.test(h)) || '',
        };
        setColumnMap(autoMap);
        setStep(2);
      } catch (err: any) {
        showToast(err?.message || 'Invalid CSV format', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleCsv = () => {
    const sample = `company_name,website,email,phone,industry,location\n` +
      `"Crescent Dental Care","https://crescentdental.pk","info@crescentdental.pk","+92 21 3537 1100","Dental Clinics","Karachi"\n` +
      `"Kensington Associates","https://kensingtonlaw.co.uk","partners@kensingtonlaw.co.uk","+44 20 7937 4422","Law Firms","London"\n` +
      `"IronPeak Fitness NYC","https://ironpeakfitness.com","membership@ironpeaknyc.com","+1 212 555 4912","Gyms","New York"\n` +
      `"NexaLogic Solutions","https://nexalogic.io","inquiries@nexalogic.io","+92 21 3499 8812","Software Companies","Karachi"\n` +
      `"Cedar Bistro","https://cedarbistropk.com","bookings@cedarbistropk.com","+92 51 282 3344","Restaurants","Islamabad"`;

    setFileName('sample_b2b_leads.csv');
    setCsvRawText(sample);
    const { headers: hdrs, records } = parseCsv(sample);
    setHeaders(hdrs);
    setParsedRows(records);
    setColumnMap({
      companyName: 'company_name',
      website: 'website',
      email: 'email',
      phone: 'phone',
      industry: 'industry',
      location: 'location',
    });
    setStep(2);
  };

  const handleValidateColumns = () => {
    const errors: string[] = [];
    if (!columnMap.companyName) {
      errors.push('Company Name column mapping is required.');
    }
    setImportErrors(errors);
    if (errors.length === 0) {
      setStep(3);
    }
  };

  const handleExecuteImport = async () => {
    setIsImporting(true);
    try {
      const leadsToCreate: Partial<Lead>[] = parsedRows.map(row => {
        return {
          companyName: row[columnMap.companyName] || 'Unnamed Company',
          website: columnMap.website ? row[columnMap.website] || '' : '',
          email: columnMap.email ? row[columnMap.email] || '' : '',
          phone: columnMap.phone ? row[columnMap.phone] || '' : '',
          industry: columnMap.industry ? row[columnMap.industry] || 'General Business' : 'General Business',
          location: columnMap.location ? row[columnMap.location] || 'Metro' : 'Metro',
          source: 'csv',
        };
      });

      const count = await batchImportLeads(leadsToCreate);
      setImportedCount(count);
      setStep(4);
      showToast(`Successfully imported ${count} leads into CRM database`, 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast('Import failed: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setCsvRawText('');
    setParsedRows([]);
    setHeaders([]);
    setFileName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl rounded-xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 shadow-2xl backdrop-blur-md max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white text-black font-bold shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-black" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white tracking-tight font-heading truncate">
                Import Leads from CSV
              </h2>
              <span className="text-[11px] text-neutral-400 block truncate">
                Step {step} of 4 · Structured Prospect Ingestion
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white p-1 rounded-md shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 my-3.5 text-center text-[10px] font-mono uppercase">
          {[
            { num: 1, title: 'Upload' },
            { num: 2, title: 'Preview' },
            { num: 3, title: 'Map Fields' },
            { num: 4, title: 'Complete' },
          ].map(s => (
            <div 
              key={s.num}
              className={`py-1 rounded-sm border ${
                step >= s.num 
                  ? 'border-white bg-neutral-900 text-white font-semibold' 
                  : 'border-neutral-800 bg-neutral-950 text-neutral-600'
              }`}
            >
              {s.num}. {s.title}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 my-2">
            <label className="border-2 border-dashed border-neutral-800 hover:border-neutral-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-neutral-900/40 hover:bg-neutral-900/80 transition-all text-center">
              <Upload className="h-8 w-8 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold text-white">
                Select or Drop CSV File
              </span>
              <span className="text-[11px] text-neutral-500 mt-1 max-w-sm">
                Expected columns: company_name, website, email, phone, industry, location
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-xs">
              <div className="text-neutral-400 text-[11px]">
                Want to test with formatted dummy leads?
              </div>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="px-3 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium border border-neutral-700"
              >
                Load Sample CSV
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Preview Records */}
        {step === 2 && (
          <div className="space-y-4 my-2 flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>
                File: <strong className="text-white">{fileName}</strong> ({parsedRows.length} rows parsed)
              </span>
              <button onClick={handleReset} className="text-neutral-500 hover:text-white underline text-[11px]">
                Choose different file
              </button>
            </div>

            <div className="overflow-auto border border-neutral-800 rounded-lg max-h-56">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-950 sticky top-0 border-b border-neutral-800 text-neutral-400">
                  <tr>
                    {headers.map(h => (
                      <th key={h} className="p-2 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800 bg-neutral-900/40">
                  {parsedRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.map(h => (
                        <td key={h} className="p-2 text-neutral-300 truncate max-w-[140px]">
                          {row[h] || <span className="text-neutral-600">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[11px] text-neutral-500 italic">
              Showing preview of first 5 records. Missing fields will remain blank per data integrity rules.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-neutral-750 text-neutral-400 hover:text-white text-xs"
              >
                Back
              </button>
              <button
                onClick={handleValidateColumns}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold"
              >
                <span>Validate & Map Columns</span>
                <ArrowRight className="h-3.5 w-3.5 text-black" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Map Columns & Validate */}
        {step === 3 && (
          <div className="space-y-4 my-2 flex-1 overflow-y-auto">
            <div className="text-xs text-neutral-400">
              Verify which CSV headers correspond to LeadForge CRM schema fields:
            </div>

            {importErrors.length > 0 && (
              <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{importErrors.join(', ')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {[
                { field: 'companyName', label: 'Company Name *', required: true },
                { field: 'industry', label: 'Industry', required: false },
                { field: 'location', label: 'Location (City/Country)', required: false },
                { field: 'website', label: 'Website URL', required: false },
                { field: 'email', label: 'Contact Email', required: false },
                { field: 'phone', label: 'Phone Number', required: false },
              ].map(item => (
                <div key={item.field} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <label className="block text-[11px] font-medium text-white mb-1">
                    {item.label}
                  </label>
                  <select
                    value={columnMap[item.field] || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, [item.field]: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white"
                  >
                    <option value="">-- Do Not Import / Leave Blank --</option>
                    {headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
              <button
                onClick={() => setStep(2)}
                className="px-3 py-1.5 rounded-lg border border-neutral-750 text-neutral-400 hover:text-white text-xs"
              >
                Back
              </button>
              <button
                onClick={handleExecuteImport}
                disabled={isImporting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-black" />
                    <span>Importing into Firestore...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Import ({parsedRows.length} Leads)</span>
                    <Check className="h-3.5 w-3.5 text-black" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && (
          <div className="py-6 text-center space-y-4 animate-in fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black font-bold mx-auto shadow-md">
              <CheckCircle2 className="h-6 w-6 text-black" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Import Successfully Completed!
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                {importedCount} leads are now saved in your CRM database with baseline opportunity scoring ready.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-colors"
              >
                Close & View Leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
