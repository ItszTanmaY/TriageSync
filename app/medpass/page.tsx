'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { BloodGroup } from '@/lib/types/database';

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

  const downloadWalletCardPng = () => {
    const canvas = cardCanvasRef.current;
    if (!canvas || !qrDataUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1000;
    canvas.height = 600;

    // Minimalist monochrome card
    ctx.fillStyle = '#050507';
    ctx.fillRect(0, 0, 1000, 600);

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 960, 560);

    // Top Header
    ctx.fillStyle = '#71717a';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('MEDPASS / CRITICAL MEDICAL IDENTITY', 60, 70);

    // Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '500 44px sans-serif';
    ctx.fillText(fullName, 60, 140);

    // Subtext
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '18px monospace';
    ctx.fillText(`DOB: ${dob}   SEX: ${sex.toUpperCase()}   DONOR: ${organDonor ? 'YES' : 'NO'}`, 60, 180);

    // Blood Group
    ctx.fillStyle = '#ffffff';
    ctx.font = '300 72px monospace';
    ctx.fillText(bloodGroup, 60, 275);
    ctx.fillStyle = '#71717a';
    ctx.font = '14px monospace';
    ctx.fillText('BLOOD GROUP', 60, 305);

    // Allergies & Conditions
    ctx.fillStyle = '#71717a';
    ctx.font = '14px monospace';
    ctx.fillText('ALLERGIES:', 60, 370);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(allergiesText || 'None reported', 60, 400);

    ctx.fillStyle = '#71717a';
    ctx.font = '14px monospace';
    ctx.fillText('EMERGENCY CONTACT:', 60, 460);
    ctx.fillStyle = '#ffffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`${contacts[0]?.name || ''} (${contacts[0]?.phone || ''})`, 60, 490);

    // QR Image
    const img = new window.Image();
    img.src = qrDataUrl;
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(680, 120, 260, 340);
      ctx.drawImage(img, 700, 140, 220, 220);

      ctx.fillStyle = '#09090b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SCAN IN EMERGENCY', 810, 390);
      ctx.fillText('ED25519 VERIFIED', 810, 415);
      ctx.textAlign = 'left';

      const link = document.createElement('a');
      link.download = `MedPass-${fullName.replace(/\s+/g, '_')}-Wallet.png`;
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
    <div className="space-y-12 py-2">
      <canvas ref={cardCanvasRef} className="hidden" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
        <div className="space-y-1">
          <div className="font-mono text-xs uppercase tracking-widest text-zinc-500">
            CITIZEN MEDICAL IDENTITY (MP-1..MP-10)
          </div>
          <h1 className="text-3xl font-normal text-white tracking-tight">
            MedPass Identity Card
          </h1>
          <p className="text-xs text-zinc-400">
            Cryptographic Ed25519 payload readable offline with tiered privacy controls.
          </p>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {(['en', 'hi', 'mr'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLang(l)}
              className={`touch-target px-4 py-1.5 rounded-lg border transition-all ${
                lang === l
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-zinc-950 text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="p-6 rounded-2xl tactile-panel space-y-6">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
              Medical Parameters
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-sans text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as BloodGroup)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg} className="bg-black text-white">
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-mono text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-sans text-sm text-white focus:outline-none focus:border-white/40 cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">
                  Known Allergies (Comma-separated)
                </label>
                <input
                  type="text"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-sans text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">
                  Chronic Conditions
                </label>
                <input
                  type="text"
                  value={conditionsText}
                  onChange={(e) => setConditionsText(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-sans text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-mono text-xs uppercase text-zinc-500 block">
                  Prescription Medications (Full Tier Only)
                </label>
                <input
                  type="text"
                  value={medicationsText}
                  onChange={(e) => setMedicationsText(e.target.value)}
                  className="touch-target w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl font-sans text-sm text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 bg-black/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={organDonor}
                  onChange={(e) => setOrganDonor(e.target.checked)}
                  className="w-4 h-4 rounded text-white focus:ring-0"
                />
                <span className="font-mono text-xs text-zinc-300">
                  Registered Organ Donor (National NOTTO Registry)
                </span>
              </label>
            </div>

            {/* Contacts */}
            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                  Emergency Contacts (1 to 3)
                </span>
                {contacts.length < 3 && (
                  <button
                    type="button"
                    onClick={addContact}
                    className="touch-target text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    + Add Contact
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {contacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-black border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3"
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
                      className="touch-target px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Relation"
                      value={contact.relation}
                      onChange={(e) => {
                        const updated = [...contacts];
                        updated[idx].relation = e.target.value;
                        setContacts(updated);
                      }}
                      className="touch-target px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Phone"
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...contacts];
                          updated[idx].phone = e.target.value;
                          setContacts(updated);
                        }}
                        className="touch-target flex-1 px-3 py-2 bg-zinc-950 border border-white/10 rounded-lg text-xs text-white"
                      />
                      {contacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeContact(idx)}
                          className="touch-target text-xs text-zinc-600 hover:text-[#FF2A44] px-2 font-mono"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/[0.08] flex justify-end">
              <button
                type="button"
                onClick={handleSaveMedPass}
                disabled={isSaving}
                className="touch-target px-6 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-mono text-xs uppercase tracking-wider font-semibold"
              >
                {isSaving ? 'Signing...' : 'Save & Re-sign Ed25519 Payload →'}
              </button>
            </div>
          </div>

          {/* Audit Trail */}
          <div className="p-6 rounded-2xl tactile-panel space-y-4">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
              Scan Audit Log (Visible to Patient)
            </div>

            <div className="space-y-2">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex items-center justify-between text-xs font-mono"
                >
                  <span className="text-zinc-300 capitalize">{scan.scanner_role} Scan</span>
                  <span className="text-zinc-500">{new Date(scan.scanned_at).toLocaleString()}</span>
                  <span className="text-zinc-400 uppercase text-[10px]">{scan.tier_accessed} Tier</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: QR Code & Exports */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl tactile-panel space-y-6 text-center">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-400 border-b border-white/[0.08] pb-3">
              Cryptographic QR Card
            </div>

            <div className="p-4 bg-white rounded-xl inline-block shadow-lg mx-auto">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt="MedPass QR"
                  width={200}
                  height={200}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-mono text-xs text-black">Generating...</span>
              )}
            </div>

            <div className="space-y-1 font-mono">
              <div className="text-white text-base font-normal">{fullName}</div>
              <div className="text-xs text-zinc-400">{bloodGroup} • ORGAN DONOR</div>
              <div className="text-[10px] text-zinc-600 truncate">{publicToken}</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={downloadWalletCardPng}
                className="touch-target w-full px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-mono text-xs uppercase tracking-wider"
              >
                Export Wallet Card (PNG)
              </button>

              <a
                href={publicScanUrl}
                target="_blank"
                rel="noreferrer"
                className="touch-target w-full px-4 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-300 font-mono text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <span>Test Bystander Scan Page →</span>
              </a>
            </div>

            <div className="pt-4 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={handleRotateToken}
                disabled={isRotating}
                className="touch-target w-full text-zinc-500 hover:text-[#FF2A44] font-mono text-xs uppercase tracking-wider"
              >
                {isRotating ? 'Rotating...' : 'Revoke & Rotate Current QR Token'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
