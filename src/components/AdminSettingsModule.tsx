import React, { useState } from 'react';
import {
  Shield,
  Settings as SettingsIcon,
  Key,
  Users,
  Database,
  CheckCircle2,
  Lock,
  Building,
  Globe,
} from 'lucide-react';

interface AdminSettingsProps {
  initialTab?: 'roles' | 'settings' | 'audit' | 'backup';
}

export const AdminSettingsModule: React.FC<AdminSettingsProps> = ({
  initialTab = 'roles',
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'settings' | 'audit' | 'backup'>(initialTab);

  // Institution settings state
  const [schoolName, setSchoolName] = useState("The Learner's Academy CBSE");
  const [affiliationNo, setAffiliationNo] = useState('1930812');
  const [schoolCode, setSchoolCode] = useState('45091');
  const [academicYear, setAcademicYear] = useState('2026 - 2027');
  const [principalEmail, setPrincipalEmail] = useState('sethu.hw@gmail.com');
  const [saveToast, setSaveToast] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-slate-800" />
            <span>Admin Administration & System Settings</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Role-Based Access Control · CBSE Affiliation Parameters · Audit Security Trail
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('roles')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'roles' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User Roles & RBAC
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'settings' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Institute Profile
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'audit' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'backup' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Backup & Sync
          </button>
        </div>
      </div>

      {/* VIEW: USER ROLES & RBAC */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Configured Role Permissions Matrix</h3>
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Role Profile</th>
                  <th className="px-4 py-3">Assigned Users</th>
                  <th className="px-4 py-3">Modules Permitted</th>
                  <th className="px-4 py-3">Privilege Level</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { role: 'Super Admin', users: 'Dr. Sethu Ramanathan (admin_sethu)', modules: 'All Modules (Full Read/Write)', level: 'Level 5 (Unrestricted)' },
                  { role: 'Vice Principal / Academic Incharge', users: 'Malini Swaminathan', modules: 'Students, Staffs, Markchart, LMS, Academics, TC', level: 'Level 4 (Academic Admin)' },
                  { role: 'Chief Accountant', users: 'Sridhar K.', modules: 'Fee Management, Student Records, Store Billing', level: 'Level 3 (Financial Admin)' },
                  { role: 'Teaching Faculty (PGT/TGT/PRT)', users: '84 Faculty Members', modules: 'Attendance, Markchart, LMS Homework, Parent Notes', level: 'Level 2 (Instructor)' },
                  { role: 'Transport & Fleet Incharge', users: 'Ramesh Babu', modules: 'Transport Routes, Bus GPS Locations, Commuter Manifest', level: 'Level 2 (Fleet Admin)' },
                ].map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-bold text-gray-900">{r.role}</td>
                    <td className="px-4 py-3 text-gray-700">{r.users}</td>
                    <td className="px-4 py-3 text-gray-600">{r.modules}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700">
                        {r.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => alert(`Editing permissions for ${r.role}`)}
                        className="text-xs text-indigo-600 hover:underline font-semibold"
                      >
                        Edit Policy
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: INSTITUTE SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Institution & Board Affiliation Config</h3>
            <p className="text-xs text-gray-500">Official data printed on report cards, fee receipts, and TCs</p>
          </div>

          {saveToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>School parameters updated and synchronized successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Institution Full Name *
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  CBSE Affiliation Number *
                </label>
                <input
                  type="text"
                  required
                  value={affiliationNo}
                  onChange={(e) => setAffiliationNo(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  School Code *
                </label>
                <input
                  type="text"
                  required
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Current Academic Session
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  required
                  value={principalEmail}
                  onChange={(e) => setPrincipalEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg shadow-2xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Security & Operational Audit Trail</h3>
          <div className="space-y-2 text-xs">
            {[
              { event: 'User Login: admin_sethu (Dr. Sethu Ramanathan)', time: '23 Oct 2026, 08:15 AM', ip: '103.21.144.12', status: 'Authorized Session' },
              { event: 'Fee Receipt REC-2026-4891 issued for Aarav Sharma (₹46,000)', time: '22 Oct 2026, 04:12 PM', ip: '103.21.144.18', status: 'Payment Logged' },
              { event: 'CBSE Transfer Certificate TLA/TC/2026/043 printed', time: '21 Oct 2026, 11:30 AM', ip: '103.21.144.12', status: 'Certificate Emitted' },
              { event: 'Staff Leave Request lev-004 approved by Principal', time: '18 Oct 2026, 02:45 PM', ip: '103.21.144.12', status: 'Leave Workflow' },
            ].map((a, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-900">{a.event}</span>
                  <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {a.time} · Host: {a.ip}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: BACKUP & SYNC */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Database Backup & Disaster Recovery</h3>
          <p className="text-xs text-gray-500">
            Automated daily snapshot taken at 02:00 AM IST. Encrypted with AES-256.
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-900">Latest Full Backup (23 Oct 2026 02:00 IST)</span>
              <p className="text-[11px] text-gray-500 font-mono">Size: 428 MB · Integrity Check: PASSED</p>
            </div>
            <button
              onClick={() => alert('Initiating secure encrypted database archive download.')}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
            >
              Download Archive
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
