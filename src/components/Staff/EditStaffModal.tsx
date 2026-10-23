import React, { useState, useEffect } from 'react';
import {
  X,
  Edit,
  Save,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Staff, StaffRole } from '../../types';

interface EditStaffModalProps {
  staff: Staff | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStaff: (updated: Staff) => void;
}

export const EditStaffModal: React.FC<EditStaffModalProps> = ({
  staff,
  isOpen,
  onClose,
  onUpdateStaff,
}) => {
  if (!isOpen || !staff) return null;

  const [name, setName] = useState(staff.name);
  const [role, setRole] = useState<StaffRole>(staff.role);
  const [designation, setDesignation] = useState(staff.designation);
  const [department, setDepartment] = useState(staff.department);
  const [subject, setSubject] = useState(staff.subject || '');
  const [qualification, setQualification] = useState(staff.qualification);
  const [phone, setPhone] = useState(staff.phone);
  const [email, setEmail] = useState(staff.email);
  const [address, setAddress] = useState(staff.address || '');
  const [leaveBalance, setLeaveBalance] = useState(staff.leaveBalance);

  // Responsibilities
  const [responsibilities, setResponsibilities] = useState<string[]>(staff.responsibilities || []);
  const [newRespInput, setNewRespInput] = useState('');

  // Classes
  const [assignedClasses, setAssignedClasses] = useState<string[]>(staff.assignedClasses || []);
  const [newClassInput, setNewClassInput] = useState('');

  const handleAddResp = () => {
    if (newRespInput.trim() && !responsibilities.includes(newRespInput.trim())) {
      setResponsibilities([...responsibilities, newRespInput.trim()]);
      setNewRespInput('');
    }
  };

  const handleRemoveResp = (idx: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const handleAddClass = () => {
    if (newClassInput.trim() && !assignedClasses.includes(newClassInput.trim())) {
      setAssignedClasses([...assignedClasses, newClassInput.trim()]);
      setNewClassInput('');
    }
  };

  const handleRemoveClass = (cls: string) => {
    setAssignedClasses(assignedClasses.filter((c) => c !== cls));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStaff({
      ...staff,
      name,
      role,
      designation,
      department,
      subject: role === 'Teacher' ? subject : undefined,
      qualification,
      phone,
      email,
      address,
      leaveBalance,
      responsibilities,
      assignedClasses,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Edit className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Edit Staff Profile</h3>
              <p className="text-xs text-gray-300">
                Update credentials, assigned subjects, and portfolios for {staff.empId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Staff Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Role Classification *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              >
                <option value="Teacher">Teacher / Faculty</option>
                <option value="Administrator">Administrator</option>
                <option value="Support Staff">Support Staff</option>
                <option value="Lab Assistant">Lab Assistant</option>
                <option value="Transport Staff">Transport Staff</option>
                <option value="Sports Coach">Sports Coach</option>
                <option value="Counselor">Counselor</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Designation Title *</label>
              <input
                type="text"
                required
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              >
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Languages">Languages</option>
                <option value="Social Science">Social Science</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Administration">Administration</option>
                <option value="Library">Library</option>
                <option value="Physical Education">Physical Education</option>
                <option value="Transport">Transport</option>
              </select>
            </div>
          </div>

          {role === 'Teacher' && (
            <div className="space-y-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Primary Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Assigned Classes</label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {assignedClasses.map((cls) => (
                    <span
                      key={cls}
                      className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-medium flex items-center gap-1"
                    >
                      {cls}
                      <button
                        type="button"
                        onClick={() => handleRemoveClass(cls)}
                        className="hover:text-rose-600 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClassInput}
                    onChange={(e) => setNewClassInput(e.target.value)}
                    placeholder="e.g. Class 10-C"
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddClass();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddClass}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-semibold rounded-lg"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Responsibilities */}
          <div className="space-y-2">
            <label className="font-semibold text-gray-700 block">Assigned Responsibilities</label>
            <div className="space-y-1.5">
              {responsibilities.map((resp, i) => (
                <div
                  key={i}
                  className="p-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between"
                >
                  <span className="font-medium text-gray-800">{resp}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveResp(i)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newRespInput}
                onChange={(e) => setNewRespInput(e.target.value)}
                placeholder="Add duty or portfolio..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none text-xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddResp();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddResp}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold rounded-lg"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold text-gray-700 block mb-1">Phone *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Leave Balance (Days)</label>
              <input
                type="number"
                min="0"
                max="50"
                value={leaveBalance}
                onChange={(e) => setLeaveBalance(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Save Profile Updates</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
