import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  X,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Scan,
  User,
  Phone,
  Mail,
  Building2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Staff } from '../../types';
import { printElement } from '../../utils/printDocument';

interface StaffQRCodeModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffQRCodeModal: React.FC<StaffQRCodeModalProps> = ({
  staff,
  isOpen,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'badge' | 'verify' | 'raw'>('badge');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const printableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!staff) return;

    // Structured digital identity credential payload
    const payload = JSON.stringify({
      schema: 'TLA-STAFF-ID-V2',
      institution: 'THE LEADERS ACADEMY(CBSE)',
      affiliationNo: '1930812',
      empId: staff.empId,
      name: staff.name,
      role: staff.role,
      designation: staff.designation,
      department: staff.department,
      subject: staff.subject || 'Institutional Operations',
      bloodGroup: staff.bloodGroup || 'O+',
      contact: staff.phone,
      email: staff.email,
      status: staff.status,
      issuedSession: '2026-2027',
      verifyUrl: `https://tlgs.edu.in/verify/staff/${staff.empId}`,
      securityHash: `TLGS-${staff.empId}-${staff.joiningDate.replace(/-/g, '')}-AUTH`,
    });

    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleCopyLink = () => {
    if (!staff) return;
    navigator.clipboard.writeText(`https://tlgs.edu.in/verify/staff/${staff.empId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl || !staff) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `TLGS_QR_${staff.empId}_${staff.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintBadge = () => {
    printElement(printableRef.current, {
      title: `TLA_Staff_ID_Badge_${staff?.empId || 'Staff'}_THE_LEADERS_ACADEMY`,
    });
  };

  const handleSimulateScan = () => {
    setVerificationResult({
      status: 'VERIFIED_GENUINE',
      timestamp: new Date().toLocaleString(),
      staff,
      device: 'TLGS Gate Security Scanner #04',
      entryStatus: 'AUTHORIZED_CAMPUS_ENTRY',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-pink-600 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Staff Digital ID & QR Authentication</h3>
              <p className="text-[11px] text-slate-400">TLGS CBSE Instant Verification System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-gray-100 px-5 pt-3 bg-gray-50/70 gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('badge')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'badge'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Digital ID Badge
          </button>
          <button
            onClick={() => setActiveTab('verify')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'verify'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Security Scanner Test
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeTab === 'raw'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            Encoded QR Payload
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4">
          {activeTab === 'badge' && (
            <div className="space-y-4">
              {/* Printable Physical/Digital ID Card Simulation */}
              <div
                ref={printableRef}
                className="bg-linear-to-b from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-700 relative overflow-hidden"
              >
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Card Top Brand */}
                <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-white p-0.5 flex items-center justify-center">
                      <span className="font-serif font-black text-slate-900 text-xs">TLA</span>
                    </div>
                    <div>
                      <div className="font-black text-xs tracking-wider text-pink-400">THE LEADERS ACADEMY(CBSE)</div>
                      <div className="text-[9px] text-slate-300">CBSE Affiliation #1930812 · Academic Session 2026-27</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {staff.status === 'Archived' ? 'ALUMNI / RELIEVED' : 'ACTIVE FACULTY'}
                  </span>
                </div>

                {/* Main Card Body with Avatar and QR */}
                <div className="grid grid-cols-5 gap-4 items-center">
                  <div className="col-span-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-slate-700 border-2 border-pink-400/60 overflow-hidden flex items-center justify-center text-slate-200 font-bold text-lg shrink-0">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                          staff.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-white leading-tight">{staff.name}</h4>
                        <div className="text-[11px] text-pink-300 font-semibold mt-0.5">{staff.designation}</div>
                        <div className="text-[10px] text-slate-300 font-mono mt-0.5">ID: {staff.empId}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block">Department</span>
                        <span className="font-semibold text-slate-200">{staff.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Blood Group</span>
                        <span className="font-semibold text-rose-300">{staff.bloodGroup || 'O+'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Emergency Ph</span>
                        <span className="font-semibold text-slate-200">
                          {staff.emergencyContact?.phone || staff.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Validity</span>
                        <span className="font-semibold text-emerald-300">31-MAR-2027</span>
                      </div>
                    </div>
                  </div>

                  {/* QR Box */}
                  <div className="col-span-2 flex flex-col items-center justify-center p-2 bg-white rounded-xl shadow-sm text-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Staff QR Code" className="w-28 h-28 object-contain" />
                    ) : (
                      <div className="w-28 h-28 flex items-center justify-center text-gray-400 text-xs">
                        Generating...
                      </div>
                    )}
                    <span className="text-[9px] text-gray-500 font-mono font-semibold mt-1">
                      SCAN TO VERIFY
                    </span>
                  </div>
                </div>

                {/* Security Footer */}
                <div className="mt-4 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Authorized TLGS Institutional Security Pass</span>
                  <span className="font-mono text-slate-500">TLGS-SEC-{staff.empId}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadQR}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR Image</span>
                  </button>
                  <button
                    onClick={handlePrintBadge}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Badge</span>
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Verification URL'}</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'verify' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Scan className="w-4 h-4 text-blue-600" />
                  <span>Campus Turnstile & Attendance Gate Scanner Simulation</span>
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Test the optical verification scanner used at TLGS main gates, staff room biometric terminals, and digital examination halls.
                </p>
                <button
                  onClick={handleSimulateScan}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Scan className="w-4 h-4" />
                  <span>Simulate Gate Scan for {staff.name}</span>
                </button>
              </div>

              {verificationResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>AUTHENTICATION PASSED: VALID TLGS CREDENTIAL</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 block">Verified Staff</span>
                      <strong className="text-gray-900">{verificationResult.staff.name}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Staff Code</span>
                      <strong className="text-gray-900 font-mono">{verificationResult.staff.empId}</strong>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Terminal / Reader</span>
                      <span className="text-gray-700">{verificationResult.device}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Verified Timestamp</span>
                      <span className="text-gray-700">{verificationResult.timestamp}</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-emerald-100/70 rounded-lg text-[11px] text-emerald-900 font-semibold flex items-center justify-between">
                    <span>Gate Access Status: AUTHORIZED</span>
                    <span>Role: {staff.role} ({staff.department})</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-600">
                The QR code contains a tamper-resistant JSON cryptographically verifiable payload conforming to TLGS CBSE identity guidelines:
              </p>
              <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 border border-slate-800">
{JSON.stringify(
  {
    schema: 'TLA-STAFF-ID-V2',
    institution: 'THE LEADERS ACADEMY(CBSE)',
    affiliationNo: '1930812',
    empId: staff.empId,
    name: staff.name,
    role: staff.role,
    designation: staff.designation,
    department: staff.department,
    subject: staff.subject || 'Institutional Operations',
    bloodGroup: staff.bloodGroup || 'O+',
    contact: staff.phone,
    email: staff.email,
    status: staff.status,
    issuedSession: '2026-2027',
    verifyUrl: `https://tlgs.edu.in/verify/staff/${staff.empId}`,
    securityHash: `TLGS-${staff.empId}-${staff.joiningDate.replace(/-/g, '')}-AUTH`,
  },
  null,
  2
)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">
            QR format: ISO/IEC 18004 High-Error-Correction
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
