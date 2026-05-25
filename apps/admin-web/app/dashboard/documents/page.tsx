'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth-storage';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, AlertTriangle, Plus, Download, Trash2, Upload, X, Eye, Clock, CheckCircle } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

// ─── V Color System ──────────────────────────────────────────────
const V = {
  bg: '#0B1020', surface: '#121A2F', card: '#18233D',
  border: 'rgba(255,255,255,0.08)', primary: '#4DA2FF', secondary: '#00D1FF',
  success: '#00C27A', warning: '#FFB547', danger: '#FF5A6F',
  text: '#F5F7FA', textSec: '#A8B3CF', textMuted: '#6E7A99',
};
const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: V.card, border: `1px solid ${V.border}`, borderRadius: '18px', ...extra,
});

// ─── Types ───────────────────────────────────────────────────────
type Doc = {
  id: string; name: string; type: string; entityType: string; entityId: string;
  fileUrl: string; fileSizeBytes: number; mimeType: string | null;
  uploadedAt: string; expiresAt: string | null; carId: string | null;
};

type DocType = 'REGISTRATION' | 'INSURANCE' | 'ROADWORTHY' | 'LICENCE' | 'CONTRACT' | 'OTHER';

const DOC_CATEGORIES: { type: DocType; label: string; icon: string; color: string }[] = [
  { type: 'REGISTRATION', label: 'Registration', icon: '🪪', color: '#4DA2FF' },
  { type: 'INSURANCE',    label: 'Insurance',    icon: '🛡️', color: '#00D1FF' },
  { type: 'ROADWORTHY',   label: 'Roadworthy',   icon: '✅', color: '#00C27A' },
  { type: 'LICENCE',      label: 'Licence',      icon: '📋', color: '#FFB547' },
  { type: 'CONTRACT',     label: 'Contract',     icon: '📄', color: '#A78BFA' },
  { type: 'OTHER',        label: 'Other',        icon: '📁', color: '#6E7A99' },
];

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Upload Modal ─────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocType>('OTHER');
  const [docName, setDocName] = useState('');
  const [entityType, setEntityType] = useState('car');
  const [entityId, setEntityId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name.replace(/\.[^.]+$/, '')); }
  }, [docName]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); if (!docName) setDocName(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleUpload = async () => {
    if (!file || !entityId.trim() || !docName.trim()) {
      toast.error('Please fill in all required fields and select a file.');
      return;
    }
    setUploading(true);
    try {
      const presign = await apiClient<{ url: string; fields: Record<string, string>; fileKey: string; fileUrl: string }>('/storage/presign', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId: entityId.trim(), filename: file.name, mimeType: file.type, maxSizeMb: 20 }),
      });

      if (presign.url !== 'https://stub.invalid') {
        const form = new FormData();
        Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v));
        form.append('file', file);
        const s3Res = await fetch(presign.url, { method: 'POST', body: form });
        if (!s3Res.ok && s3Res.status !== 204) throw new Error('S3 upload failed');
      }

      await apiClient('/documents', {
        method: 'POST',
        body: JSON.stringify({
          entityType, entityId: entityId.trim(), type: docType, name: docName.trim(),
          fileUrl: presign.fileUrl, fileSizeBytes: file.size, mimeType: file.type,
          ...(expiresAt ? { expiresAt } : {}),
        }),
      });

      toast.success('Document uploaded successfully!');
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents-expiring'] });
      onClose();
    } catch {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: V.surface, border: `1px solid ${V.border}`, borderRadius: '10px',
    padding: '10px 14px', color: V.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: '12px', color: V.textMuted, fontWeight: 600, marginBottom: '6px', display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        style={{ ...card(), width: '100%', maxWidth: '540px', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: V.textMuted, cursor: 'pointer' }}>
          <X size={20} />
        </button>
        <h2 style={{ color: V.text, fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Upload Document</h2>

        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? V.primary : file ? V.success : V.border}`,
            borderRadius: '14px', padding: '28px', textAlign: 'center', cursor: 'pointer',
            background: dragging ? 'rgba(77,162,255,0.06)' : file ? 'rgba(0,194,122,0.06)' : 'transparent',
            marginBottom: '20px', transition: 'all 0.2s',
          }}>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" style={{ display: 'none' }} onChange={handleFile} />
          {file ? (
            <div>
              <CheckCircle size={32} color={V.success} style={{ margin: '0 auto 8px' }} />
              <p style={{ color: V.success, fontWeight: 600, fontSize: '14px' }}>{file.name}</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '4px' }}>{fmtSize(file.size)}</p>
            </div>
          ) : (
            <div>
              <Upload size={32} color={V.textMuted} style={{ margin: '0 auto 8px' }} />
              <p style={{ color: V.textSec, fontSize: '14px', fontWeight: 500 }}>Drag & drop or click to upload</p>
              <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '4px' }}>PDF, JPG, PNG, DOC · Max 20 MB</p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Document Name *</label>
            <input style={inputStyle} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. Insurance 2025" />
          </div>
          <div>
            <label style={labelStyle}>Document Type *</label>
            <select style={inputStyle} value={docType} onChange={e => setDocType(e.target.value as DocType)}>
              {DOC_CATEGORIES.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Entity Type</label>
            <select style={inputStyle} value={entityType} onChange={e => setEntityType(e.target.value)}>
              <option value="car">Vehicle</option>
              <option value="customer">Customer</option>
              <option value="rental">Rental</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Entity ID *</label>
            <input style={inputStyle} value={entityId} onChange={e => setEntityId(e.target.value)} placeholder="Vehicle / Customer ID" />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Expiry Date (optional)</label>
            <input type="date" style={inputStyle} value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading}
          style={{
            marginTop: '24px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer',
            background: uploading ? V.border : `linear-gradient(135deg, ${V.primary}, ${V.secondary})`,
            color: '#fff', fontSize: '15px', fontWeight: 700, opacity: uploading ? 0.7 : 1,
          }}>
          {uploading ? 'Uploading…' : 'Upload Document'}
        </button>
      </motion.div>
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────
function DocCard({ doc, onDelete }: { doc: Doc; onDelete: (id: string) => void }) {
  const days = daysUntil(doc.expiresAt);
  const isExpired = days !== null && days <= 0;
  const isWarning = days !== null && days > 0 && days <= 30;
  const cat = DOC_CATEGORIES.find(c => c.type === doc.type) ?? DOC_CATEGORIES[5];

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      style={{ ...card(), padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${cat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
          {cat.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: V.text, fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</p>
          <p style={{ color: V.textMuted, fontSize: '12px', marginTop: '2px' }}>{doc.entityType}/{doc.entityId.slice(0, 8)}…</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: `${cat.color}22`, color: cat.color }}>{cat.label}</span>
        {doc.fileSizeBytes > 0 && <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: V.textMuted }}>{fmtSize(doc.fileSizeBytes)}</span>}
        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '11px', background: 'rgba(255,255,255,0.05)', color: V.textMuted }}>{new Date(doc.uploadedAt).toLocaleDateString('en-AU')}</span>
      </div>

      {doc.expiresAt && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: isExpired ? 'rgba(255,90,111,0.12)' : isWarning ? 'rgba(255,181,71,0.12)' : 'rgba(0,194,122,0.10)' }}>
          {isExpired ? <AlertTriangle size={13} color={V.danger} /> : isWarning ? <Clock size={13} color={V.warning} /> : <CheckCircle size={13} color={V.success} />}
          <span style={{ fontSize: '12px', fontWeight: 600, color: isExpired ? V.danger : isWarning ? V.warning : V.success }}>
            {isExpired ? 'Expired' : isWarning ? `Expires in ${days} days` : `Expires ${new Date(doc.expiresAt).toLocaleDateString('en-AU')}`}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '9px', background: 'rgba(77,162,255,0.1)', border: `1px solid rgba(77,162,255,0.2)`, color: V.primary, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          <Eye size={13} /> View
        </a>
        <a href={doc.fileUrl} download style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '9px', background: 'rgba(0,194,122,0.1)', border: `1px solid rgba(0,194,122,0.2)`, color: V.success, fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
          <Download size={13} /> Download
        </a>
        <button onClick={() => onDelete(doc.id)} style={{ padding: '8px 12px', borderRadius: '9px', background: 'rgba(255,90,111,0.08)', border: `1px solid rgba(255,90,111,0.15)`, color: V.danger, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function DocumentsPage() {
  const session = getStoredSession();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<DocType | 'ALL'>('ALL');
  const [showUpload, setShowUpload] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => apiClient<Doc[]>('/documents'),
    enabled: !!session?.accessToken,
  });

  const { data: expiring = [] } = useQuery({
    queryKey: ['documents-expiring'],
    queryFn: () => apiClient<Doc[]>('/documents/expiring?days=30'),
    enabled: !!session?.accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient(`/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Document deleted');
      qc.invalidateQueries({ queryKey: ['documents'] });
      qc.invalidateQueries({ queryKey: ['documents-expiring'] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const filtered = activeTab === 'ALL' ? docs : docs.filter(d => d.type === activeTab);
  const countByType = (type: DocType) => docs.filter(d => d.type === type).length;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: V.bg, color: V.text }}>
      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #4DA2FF22, #00D1FF22)', border: `1px solid rgba(77,162,255,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color={V.primary} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, background: `linear-gradient(135deg, ${V.text}, ${V.textSec})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Documents
            </h1>
          </div>
          <p style={{ color: V.textMuted, fontSize: '14px' }}>
            Registrations, insurance, roadworthy certificates &amp; contracts
          </p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', borderRadius: '12px', background: `linear-gradient(135deg, ${V.primary}, ${V.secondary})`, border: 'none', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={16} /> Upload Document
        </button>
      </motion.div>

      {/* Expiry Alert */}
      <AnimatePresence>
        {expiring.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ ...card(), padding: '16px 20px', marginBottom: '24px', border: `1px solid rgba(255,181,71,0.3)`, background: 'rgba(255,181,71,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <AlertTriangle size={18} color={V.warning} />
              <span style={{ color: V.warning, fontWeight: 700, fontSize: '15px' }}>{expiring.length} document{expiring.length > 1 ? 's' : ''} expiring within 30 days</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {expiring.slice(0, 5).map(d => {
                const days = daysUntil(d.expiresAt);
                return (
                  <span key={d.id} style={{ padding: '4px 12px', borderRadius: '8px', background: 'rgba(255,181,71,0.12)', color: V.warning, fontSize: '12px', fontWeight: 600 }}>
                    {d.name} · {days !== null && days <= 0 ? 'Expired' : `${days}d`}
                  </span>
                );
              })}
              {expiring.length > 5 && <span style={{ color: V.textMuted, fontSize: '12px', padding: '4px 0' }}>+{expiring.length - 5} more</span>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row — folder-style category cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {DOC_CATEGORIES.map((cat, i) => (
          <motion.div key={cat.type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ ...card(), padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', border: activeTab === cat.type ? `1px solid ${cat.color}44` : `1px solid ${V.border}`, background: activeTab === cat.type ? `${cat.color}10` : V.card }}
            onClick={() => setActiveTab(prev => prev === cat.type ? 'ALL' : cat.type)}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{cat.icon}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: cat.color }}>{countByType(cat.type)}</div>
            <div style={{ fontSize: '11px', color: V.textMuted, marginTop: '2px' }}>{cat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {(['ALL', ...DOC_CATEGORIES.map(c => c.type)] as const).map(t => {
          const active = activeTab === t;
          const cat = DOC_CATEGORIES.find(c => c.type === t);
          return (
            <button key={t} onClick={() => setActiveTab(t as DocType | 'ALL')}
              style={{ padding: '8px 16px', borderRadius: '10px', border: `1px solid ${active ? (cat?.color ?? V.primary) + '44' : V.border}`, background: active ? (cat?.color ?? V.primary) + '18' : 'transparent', color: active ? (cat?.color ?? V.primary) : V.textSec, fontSize: '13px', fontWeight: active ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t === 'ALL' ? `All (${docs.length})` : `${cat?.icon} ${cat?.label} (${countByType(t as DocType)})`}
            </button>
          );
        })}
      </div>

      {/* Document Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: V.textMuted }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            style={{ width: '32px', height: '32px', border: `3px solid ${V.border}`, borderTopColor: V.primary, borderRadius: '50%', margin: '0 auto 16px' }} />
          <p>Loading documents…</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ textAlign: 'center', padding: '80px 40px', ...card() }}>
          <FileText size={48} color={V.textMuted} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <p style={{ color: V.textSec, fontSize: '16px', fontWeight: 600 }}>No documents found</p>
          <p style={{ color: V.textMuted, fontSize: '14px', marginTop: '6px' }}>Upload your first document to get started.</p>
          <button onClick={() => setShowUpload(true)}
            style={{ marginTop: '20px', padding: '10px 24px', borderRadius: '10px', background: `linear-gradient(135deg, ${V.primary}, ${V.secondary})`, border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
            + Upload Document
          </button>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          <AnimatePresence>
            {filtered.map(doc => (
              <DocCard key={doc.id} doc={doc} onDelete={id => deleteMutation.mutate(id)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
