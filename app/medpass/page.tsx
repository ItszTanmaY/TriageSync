'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  HeartPulse,
  QrCode,
  Download,
  RotateCw,
  Plus,
  Trash2,
  Lock,
  History,
  Smartphone,
  Globe,
  Share2,
  Eye,
} from 'lucide-react';
import { BloodGroup } from '@/lib/types/database';
import { I18N_MEDPASS } from '@/lib/medpass/service';

interface ContactInput {
  name: string;
  relation: string;
  phone: string;
  priority: number;
}

export default function MedPassPage() {
  const [lang, setLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [fullName, setFullName] = useState<string>('Asha Kulkarni');
  const [dob, setDob] = useState<string>('1988-06-14');
  const [sex, setSex] = useState<string>('Female');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('O-');
  const [allergiesText, setAllergiesText] = useState<string>('Penicillin, Sulfa drugs');
  const [conditionsText, setConditionsText] = useState<string>('Type 2 Diabetes, Mild Asthma');
  const [medicationsText, setMedicationsText] = useState<string>('Metformin 500mg, Albuterol inhaler PRN');
  const [organDonor, setOrganDonor] = useState<boolean>(true);
  const [contacts, setContacts] = useState<ContactInput[]>([
    { name: 'Dr. Ramesh Kulkarni', relation: 'Spouse', phone: '+91 98220 11223', priority: 1 },
    { name: 'Sunita Joshi', relation: 'Sister', phone: '+91 98220 33445', priority: 2 },
  ]);

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [publicToken, setPublicToken] = useState<string>('tok_asha_k_9901');
  const [publicScanUrl, setPublicScanUrl] = useState<string>('');
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [scanHistory, setScanHistory] = useState<
    { id: string; scanned_at: string; scanner_role: string; tier_accessed: string }[]
  >([]);

  const cardCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load existing MedPass data
  useEffect(() => {
    async function fetchMedPass() {
      try {
        const res = await fetch('/api/medpass');
        const json = await res.json();
        if (json.success && json.medpass) {
          setFullName(json.medpass.full_name);
          setDob(json.medpass.dob || '1988-06-14');
          setSex(json.medpass.sex || 'Female');
          setBloodGroup(json.medpass.blood_group || 'O-');
          setAllergiesText(json.medpass.allergies?.join(', ') || '');
          setConditionsText(json.medpass.conditions?.join(', ') || '');
          setMedicationsText(json.medpass.medications?.join(', ') || '');
          setOrganDonor(json.medpass.organ_donor);
          setContacts(json.contacts || []);
          setQrDataUrl(json.qrDataUrl || '');
          setPublicToken(json.medpass.public_token);
          setPublicScanUrl(json.publicScanUrl || '');
          setScanHistory(json.scanHistory || []);
        }
      } catch (e) {
        console.error('Failed to load MedPass', e);
      }
    }
    fetchMedPass();
  }, []);

  const t = I18N_MEDPASS[lang];

  // Save / Update MedPass
  const handleSaveMedPass = async () => {
    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName,
        dob: dob || null,
        sex: sex || null,
        blood_group: bloodGroup,
        allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
        conditions: conditionsText.split(',').map((s) => s.trim()).filter(Boolean),
        medications: medicationsText.split(',').map((s) => s.trim()).filter(Boolean),
        organ_donor: organDonor,
        language: lang,
        contacts,
      };

      const res = await fetch('/api/medpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setQrDataUrl(json.qrDataUrl);
        setPublicToken(json.publicToken);
        setPublicScanUrl(json.publicScanUrl);
        alert('MedPass updated and new cryptographic QR signed!');
      } else {
        alert('Validation error: ' + JSON.stringify(json.details || json.error));
      }
    } catch (e) {
      console.error(e);
      alert('Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Rotate / Revoke QR Token (MP-8)
  const handleRotateToken = async () => {
    if (!confirm('Rotating will revoke your old QR code immediately. Continue?')) return;
    setIsRotating(true);
    try {
      const res = await fetch('/api/medpass/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: publicToken }),
      });
      const json = await res.json();
      if (json.success) {
        setPublicToken(json.newToken);
        setQrDataUrl(json.newQrDataUrl);
        setPublicScanUrl(json.newScanUrl);
        alert(`New QR Token generated: ${json.newToken}. Old token revoked!`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsRotating(false);
    }
  };

  // Render high-res wallet card on canvas and download PNG (MP-2)
  const downloadWalletCardPng = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas || !qrDataUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 600;

    // Background gradient: Dark slate Onyx
    const bgGrad = ctx.createLinearGradient(0, 0, 1000, 600);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(1, '#0b1329');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1000, 600);

    // Border glow
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 980, 580);

    // Header strip
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(10, 10, 980, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(t.medicalId.toUpperCase(), 35, 43);

    // Name & Demographics
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px sans-serif';
    ctx.fillText(fullName, 40, 120);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText(`DOB: ${dob}  •  Sex: ${sex}  •  ${organDonor ? t.donorYes : t.donorNo}`, 40, 155);

    // Blood Group Accent Box
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(40, 185, 180, 85);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 185, 180, 85);

    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(t.bloodGroup, 55, 210);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText(bloodGroup, 55, 255);

    // Allergies & Conditions
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${t.allergies}:`, 40, 310);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(allergiesText || 'None reported', 40, 340);

    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${t.conditions}:`, 40, 385);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(conditionsText || 'None reported', 40, 415);

    // Emergency Contact
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`${t.emergencyContact}:`, 40, 465);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px sans-serif';
    ctx.fillText(`${contacts[0]?.name || ''} (${contacts[0]?.phone || ''})`, 40, 495);

    // Footer notice
    ctx.fillStyle = '#64748b';
    ctx.font = '14px sans-serif';
    ctx.fillText(t.prototypeNotice, 40, 560);

    // Load QR Image onto canvas
    const img = new window.Image();
    img.src = qrDataUrl;
    img.onload = () => {
      // White container for QR readability
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(680, 110, 280, 360);
      ctx.drawImage(img, 700, 130, 240, 240);

      ctx.fillStyle = '#030712';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t.scanForHelp, 820, 395);
      ctx.fillStyle = '#10b981';
      ctx.fillText('Ed25519 SIGNED PAYLOAD', 820, 420);
      ctx.textAlign = 'left';

      // Trigger download
      const link = document.createElement('a');
      link.download = `MedPass-${fullName.replace(/\s+/g, '_')}-Wallet.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  // Download Lock-screen wallpaper PNG
  const downloadLockscreenWallpaper = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas || !qrDataUrl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1920; // 9:16 portrait mobile aspect

    // Wallpaper dark gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#020617');
    bgGrad.addColorStop(0.5, '#090d16');
    bgGrad.addColorStop(1, '#050a18');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Emergency header bar
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(0, 200, 1080, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMERGENCY MEDICAL IDENTITY', 540, 260);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText(fullName, 540, 380);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`BLOOD GROUP: ${bloodGroup}`, 540, 440);

    ctx.fillStyle = '#fca5a5';
    ctx.font = '28px sans-serif';
    ctx.fillText(`ALLERGIES: ${allergiesText}`, 540, 500);

    ctx.fillStyle = '#a7f3d0';
    ctx.font = '28px sans-serif';
    ctx.fillText(`SOS CONTACT: ${contacts[0]?.name} (${contacts[0]?.phone})`, 540, 550);

    // QR Image in center
    const img = new window.Image();
    img.src = qrDataUrl;
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(290, 680, 500, 580);
      ctx.drawImage(img, 310, 700, 460, 460);

      ctx.fillStyle = '#030712';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('SCAN IN AN EMERGENCY', 540, 1210);

      ctx.fillStyle = '#64748b';
      ctx.font = '22px sans-serif';
      ctx.fillText(t.prototypeNotice, 540, 1800);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      link.download = `MedPass-Lockscreen-${fullName.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  };

  const addContact = () => {
    if (contacts.length >= 3) return;
    setContacts([
      ...contacts,
      { name: '', relation: '', phone: '', priority: contacts.length + 1 },
    ]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 py-2">
      <canvas ref={cardCanvasRef} className="hidden" />

      {/* Top Banner & Language Selector (MP-10) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl glass-panel border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Citizen Portal (MP-1..MP-10)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                OFFLINE CRYPTO SIGNED
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              MedPass Emergency Identity
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Compact offline verifiable QR, tiered privacy access, and lock-screen exports.
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-semibold">Language:</span>
          {(['en', 'hi', 'mr'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`touch-target px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                lang === l
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: MedPass Editor Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-lg font-black text-white tracking-wide">
                Patient Critical Medical Profile
              </h2>
              <span className="text-xs text-slate-400">Strict Zod Validated</span>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg} className="bg-slate-900 text-white">
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Allergies & Conditions */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-red-400 uppercase">
                  Allergies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs, Latex"
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-cyan-400 uppercase">
                  Chronic Medical Conditions
                </label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-purple-400 uppercase">
                  Current Medications (Full Tier Only)
                </label>
                <input
                  type="text"
                  value={medicationsText}
                  onChange={(e) => setMedicationsText(e.target.value)}
                  placeholder="e.g. Metformin 500mg, Amlodipine 5mg"
                  className="touch-target w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              {/* Organ Donor Checkbox */}
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organDonor}
                  onChange={(e) => setOrganDonor(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-400"
                />
                <span className="text-sm font-bold text-slate-200">
                  Registered Organ Donor (NOTTO / National Registry)
                </span>
              </label>
            </div>

            {/* Emergency Contacts (1 to 3) */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Emergency Contacts (1 to 3)
                  </h3>
                  <p className="text-xs text-slate-400">Receive instant SMS/WhatsApp alerts on QR scan</p>
                </div>
                {contacts.length < 3 && (
                  <button
                    type="button"
                    onClick={addContact}
                    className="touch-target px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-400 hover:bg-slate-800 border border-cyan-800/60 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
                  >
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={contact.name}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].name = e.target.value;
                        setContacts(updated);
                      }}
                      className="touch-target px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Relation (e.g. Spouse)"
                      value={contact.relation}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].relation = e.target.value;
                        setContacts(updated);
                      }}
                      className="touch-target px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="+91 Phone Number"
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].phone = e.target.value;
                          setContacts(updated);
                        }}
                        className="touch-target flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white"
                      />
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="touch-target p-2 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSaveMedPass}
                disabled={isSaving}
                className="touch-target px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
              >
                {isSaving ? 'Cryptographically Signing...' : 'Save & Re-sign MedPass QR'}
              </button>
            </div>
          </div>

          {/* Scan Audit Trail (MP-6) */}
          <div className="p-6 rounded-2xl glass-panel border-slate-800 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <History className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-black text-white tracking-wide">
                Scan Audit Log (Visible to Patient)
              </h2>
            </div>

            <div className="space-y-2">
              {scanHistory.length === 0 ? (
                <p className="text-xs text-slate-400">No scans logged yet.</p>
              ) : (
                scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white capitalize">
                          {scan.scanner_role} Scanner
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(scan.scanned_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                      {scan.tier_accessed} TIER
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: QR Code, Exports & Token Revocation */}
        <div className="space-y-6">
          {/* Card Preview & QR Code */}
          <div className="p-6 rounded-2xl glass-panel-glow border-cyan-500/40 space-y-6 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Emergency QR Badge</h3>
              </div>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                ACTIVE
              </span>
            </div>

            {/* QR Image */}
            <div className="relative mx-auto w-56 h-56 p-3 bg-white rounded-2xl shadow-2xl flex items-center justify-center">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="MedPass Cryptographic QR"
                  width={200}
                  height={200}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="text-xs text-slate-600 font-bold">Generating QR...</span>
              )}
            </div>

            <div className="space-y-1">
              <div className="font-black text-lg text-white">{fullName}</div>
              <div className="text-sm font-bold text-red-400">{bloodGroup} Negative • Organ Donor</div>
              <div className="text-xs text-slate-400">Token: {publicToken}</div>
            </div>

            {/* 1-Tap Downloads */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={downloadWalletCardPng}
                className="touch-target w-full px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export Digital Wallet Card (PNG)</span>
              </button>

              <button
                type="button"
                onClick={downloadLockscreenWallpaper}
                className="touch-target w-full px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>Export Lock-Screen Wallpaper</span>
              </button>

              <a
                href={publicScanUrl}
                target="_blank"
                rel="noreferrer"
                className="touch-target w-full px-4 py-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Test Bystander Scan Page</span>
              </a>
            </div>

            {/* Token Revocation / Rotation (MP-8) */}
            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={handleRotateToken}
                disabled={isRotating}
                className="touch-target w-full px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 text-red-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} />
                <span>Rotate / Invalidate Current QR Token</span>
              </button>
            </div>
          </div>

          {/* Privacy Tier Explainer */}
          <div className="p-5 rounded-2xl glass-panel border-slate-800 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>DPDP Tiered Disclosure Architecture</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              <strong>Critical Tier (Public):</strong> Blood group, allergies, conditions, and 1 emergency contact are readable by any scanner without login, even offline.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong>Full Tier (Protected):</strong> Medications, past procedures, and full contacts require authenticated responder credentials or contact-approved OTP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
