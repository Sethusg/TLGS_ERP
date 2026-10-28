import React, { useState } from 'react';
import {
  X,
  UserPlus,
  BookOpen,
  Briefcase,
  Shield,
  Phone,
  Mail,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Plus,
  Trash2,
} from 'lucide-react';
import { Staff, StaffRole } from '../../types';

interface OnboardStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStaff: (newStaff: Omit<Staff, 'id'>) => void;
}

export const OnboardStaffModal: React.FC<OnboardStaffModalProps> = ({
  isOpen,
  onClose,
  onAddStaff,
}) => {
  if (!isOpen) return null;

  // Form State
  const [name, setName] = useState('');
  const [empId, setEmpId] = useState(`TLA-EMP-${Math.floor(130 + Math.random() * 80)}`);
  const [role, setRole] = useState<StaffRole>('Teacher');
  const [designation, setDesignation] = useState('TGT Mathematics');
  const [department, setDepartment] = useState('Mathematics');
  const [subject, setSubject] = useState('Mathematics');
  const [qualification, setQualification] = useState('M.Sc., B.Ed.');
  const [specialization, setSpecialization] = useState('Algebra & Trigonometry');
  const [experienceYears, setExperienceYears] = useState(5);
  const [employmentType, setEmploymentType] = useState<Staff['employmentType']>('Full-Time Permanent');
  const [joiningDate, setJoiningDate] = useState('2026-10-23');
  const [phone, setPhone] = useState('+91 98450 ');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [dob, setDob] = useState('1992-06-15');
  const [address, setAddress] = useState('Bengaluru, Karnataka');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Classes tags
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['Class 9-A', 'Class 10-B']);
  const [gradeChoice, setGradeChoice] = useState('Class 10');
  const [sectionChoice, setSectionChoice] = useState('A');

  const handleAddClass = () => {
    const clsName = `${gradeChoice}-${sectionChoice}`;
    if (!selectedClasses.includes(clsName)) {
      setSelectedClasses([...selectedClasses, clsName]);
    }
  };

  const handleRemoveClass = (cls: string) => {
    setSelectedClasses(selectedClasses.filter((c) => c !== cls));
  };

  // Responsibilities
  const [responsibilities, setResponsibilities] = useState<string[]>([
    'Class Teacher of 9-A',
    'Mathematics Club Faculty Lead',
  ]);
  const [newRespInput, setNewRespInput] = useState('');

  const handleAddResp = () => {
    if (newRespInput.trim() && !responsibilities.includes(newRespInput.trim())) {
      setResponsibilities([...responsibilities, newRespInput.trim()]);
      setNewRespInput('');
    }
  };

  const handleRemoveResp = (idx: number) => {
    setResponsibilities(responsibilities.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !empId || !phone) return;

    const generatedEmail = email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@leadersacademy.edu.in`;

    onAddStaff({
      empId,
      name,
      role,
      designation,
      department,
      subject: role === 'Teacher' ? subject : undefined,
      assignedClasses: selectedClasses,
      responsibilities: responsibilities.length > 0 ? responsibilities : ['Staff Member'],
      qualification,
      specialization,
      experienceYears,
      employmentType,
      joiningDate,
      phone,
      email: generatedEmail,
      gender,
      dob,
      address,
      emergencyContact: emergencyName
        ? {
            name: emergencyName,
            relation: emergencyRelation,
            phone: emergencyPhone || phone,
          }
        : undefined,
      status: 'Active',
      leaveBalance: 15,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <UserPlus className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Onboard New Faculty & Staff</h3>
              <p className="text-xs text-emerald-200">
                Register employee credentials, academic allocation, and responsibilities
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Section 1: Basic Identity & Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              <span>1. Personal & Identity Coordinates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Meenakshi Sundaram"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Employee ID *</label>
                <input
                  type="text"
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 font-mono border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="auto-generated if blank"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-gray-700 block mb-1">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Role, Designation & Department */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <Shield className="w-4 h-4 text-emerald-700" />
              <span>2. Role, Department & Employment Cadre</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Role Classification *</label>
                <select
                  value={role}
                  onChange={(e) => {
                    const r = e.target.value as StaffRole;
                    setRole(r);
                    if (r === 'Teacher') setDesignation('TGT Teacher');
                    else if (r === 'Administrator') setDesignation('Administrative Officer');
                    else if (r === 'Support Staff') setDesignation('Executive Assistant');
                    else if (r === 'Lab Assistant') setDesignation('Senior Lab Assistant');
                    else if (r === 'Transport Staff') setDesignation('Fleet Coordinator');
                    else if (r === 'Sports Coach') setDesignation('PE Instructor & Athletics Coach');
                  }}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none font-medium"
                >
                  <option value="Teacher">Teacher / Faculty</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Support Staff">Support Staff</option>
                  <option value="Lab Assistant">Lab Assistant</option>
                  <option value="Transport Staff">Transport Staff</option>
                  <option value="Sports Coach">Sports Coach</option>
                  <option value="Counselor">Counselor / Wellness</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Languages">Languages (English/Hindi/Sanskrit)</option>
                  <option value="Social Science">Social Science</option>
                  <option value="Computer Science">Computer Science & AI</option>
                  <option value="Administration">Administration</option>
                  <option value="Library">Library</option>
                  <option value="Physical Education">Physical Education</option>
                  <option value="Transport">Transport</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Designation Title *</label>
                <input
                  type="text"
                  required
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                >
                  <option value="Full-Time Permanent">Full-Time Permanent</option>
                  <option value="Probationary">Probationary (1 Year)</option>
                  <option value="Contractual">Contractual</option>
                  <option value="Visiting Faculty">Visiting Faculty</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Date of Joining</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Experience (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Qualifications & Assigned Subjects */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              <span>3. Academic Credentials, Subjects & Classes</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Highest Qualification</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g. M.Sc. Mathematics, B.Ed."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Area of Specialization</label>
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Applied Statistics & Analytics"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {role === 'Teacher' && (
              <div className="space-y-2">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Primary Subject Taught</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Assigned Classes & Sections</label>
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {selectedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-xs flex items-center gap-1"
                      >
                        {cls}
                        <button
                          type="button"
                          onClick={() => handleRemoveClass(cls)}
                          className="hover:text-rose-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 items-center">
                    <select
                      value={gradeChoice}
                      onChange={(e) => setGradeChoice(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white text-xs font-semibold"
                    >
                      {['Nursery', 'LKG', 'UKG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <select
                      value={sectionChoice}
                      onChange={(e) => setSectionChoice(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-300 rounded-lg focus:outline-none bg-white text-xs font-semibold"
                    >
                      {['A', 'B', 'C', 'D', 'E'].map(s => (
                        <option key={s} value={s}>Sec {s}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddClass}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
                    >
                      + Add Class
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Institutional Responsibilities */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>4. Assigned Responsibilities & Portfolio Roles</span>
            </h4>

            <div className="space-y-2">
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
                      title="Remove responsibility"
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
                  placeholder="e.g. Examination Committee Member, Eco Club Lead..."
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
                  + Add Responsibility
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Emergency Contact */}
          <div className="space-y-3">
            <h4 className="font-bold text-gray-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5 pb-1 border-b border-gray-200">
              <Phone className="w-4 h-4 text-emerald-700" />
              <span>5. Emergency Contact Coordinates</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Anand Sundaram"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Relationship</label>
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="e.g. Spouse / Parent"
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none"
                />
              </div>
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Emergency Phone</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 ..."
                  className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Onboarding & Generate Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
