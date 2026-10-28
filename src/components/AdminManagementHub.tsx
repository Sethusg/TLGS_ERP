import React, { useState } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Layers,
  Key,
  UserPlus,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Lock,
  Unlock,
  Shield,
  Search,
  AlertTriangle,
  X,
  Clock,
  Check,
} from 'lucide-react';
import { SystemUser, SchoolClass, SchoolSubject, TimetableEntry } from '../types';

interface AdminManagementHubProps {
  users: SystemUser[];
  onAddUser: (user: Omit<SystemUser, 'id'>) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (id: string) => void;
  onToggleUserStatus: (id: string) => void;
  onResetPassword: (id: string) => void;

  classes: SchoolClass[];
  onAddClass: (cls: Omit<SchoolClass, 'id'>) => void;
  onUpdateClass: (cls: SchoolClass) => void;
  onDeleteClass: (id: string) => void;

  subjects: SchoolSubject[];
  onAddSubject: (sub: Omit<SchoolSubject, 'id'>) => void;
  onUpdateSubject: (sub: SchoolSubject) => void;
  onDeleteSubject: (id: string) => void;

  timetables: TimetableEntry[];
  onAddTimetable: (tt: Omit<TimetableEntry, 'id'>) => void;
  onUpdateTimetable: (tt: TimetableEntry) => void;
  onDeleteTimetable: (id: string) => void;
}

export const AdminManagementHub: React.FC<AdminManagementHubProps> = ({
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  onToggleUserStatus,
  onResetPassword,
  classes,
  onAddClass,
  onUpdateClass,
  onDeleteClass,
  subjects,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  timetables,
  onAddTimetable,
  onUpdateTimetable,
  onDeleteTimetable,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'classes' | 'subjects' | 'timetables'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SchoolSubject | null>(null);

  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<TimetableEntry | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // User form state
  const [userForm, setUserForm] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'Teacher' as SystemUser['role'],
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Class form state
  const [classForm, setClassForm] = useState({
    gradeName: '',
    curriculum: 'CBSE' as SchoolClass['curriculum'],
    sectionsStr: 'A, B, C',
    roomNo: '',
    classTeacher: '',
  });

  // Subject form state
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    type: 'Core' as SchoolSubject['type'],
    maxMarks: 100,
    gradeLevel: 'Class 10',
  });

  // Timetable form state
  const [timetableForm, setTimetableForm] = useState({
    grade: 'Class 10',
    section: 'A',
    day: 'Monday' as TimetableEntry['day'],
    periodNo: 1,
    timeSlot: '09:00 AM - 09:45 AM',
    subjectName: '',
    teacherName: '',
  });

  // Handlers for User
  const handleOpenUserModal = (u?: SystemUser) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        username: u.username,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'Teacher',
        status: 'Active',
      });
    }
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser({
        ...editingUser,
        ...userForm,
      });
      showToast(`User account "${userForm.username}" updated successfully.`);
    } else {
      onAddUser(userForm);
      showToast(`New user account "${userForm.username}" created successfully.`);
    }
    setIsUserModalOpen(false);
  };

  // Handlers for Class & Section
  const handleOpenClassModal = (c?: SchoolClass) => {
    if (c) {
      setEditingClass(c);
      setClassForm({
        gradeName: c.gradeName,
        curriculum: c.curriculum,
        sectionsStr: c.sections.join(', '),
        roomNo: c.roomNo,
        classTeacher: c.classTeacher || '',
      });
    } else {
      setEditingClass(null);
      setClassForm({
        gradeName: '',
        curriculum: 'CBSE',
        sectionsStr: 'A, B',
        roomNo: '',
        classTeacher: '',
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const sectionsArr = classForm.sectionsStr.split(',').map((s) => s.trim()).filter(Boolean);
    if (editingClass) {
      onUpdateClass({
        ...editingClass,
        gradeName: classForm.gradeName,
        curriculum: classForm.curriculum,
        sections: sectionsArr,
        roomNo: classForm.roomNo,
        classTeacher: classForm.classTeacher,
      });
      showToast(`Class "${classForm.gradeName}" updated.`);
    } else {
      onAddClass({
        gradeName: classForm.gradeName,
        curriculum: classForm.curriculum,
        sections: sectionsArr,
        roomNo: classForm.roomNo,
        classTeacher: classForm.classTeacher,
      });
      showToast(`Class & sections for "${classForm.gradeName}" created.`);
    }
    setIsClassModalOpen(false);
  };

  // Handlers for Subject
  const handleOpenSubjectModal = (s?: SchoolSubject) => {
    if (s) {
      setEditingSubject(s);
      setSubjectForm({
        code: s.code,
        name: s.name,
        type: s.type,
        maxMarks: s.maxMarks,
        gradeLevel: s.gradeLevel,
      });
    } else {
      setEditingSubject(null);
      setSubjectForm({
        code: '',
        name: '',
        type: 'Core',
        maxMarks: 100,
        gradeLevel: 'Class 10',
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSubject) {
      onUpdateSubject({
        ...editingSubject,
        ...subjectForm,
      });
      showToast(`Subject "${subjectForm.name}" updated.`);
    } else {
      onAddSubject(subjectForm);
      showToast(`Subject "${subjectForm.name}" created.`);
    }
    setIsSubjectModalOpen(false);
  };

  // Handlers for Timetable
  const handleOpenTimetableModal = (t?: TimetableEntry) => {
    if (t) {
      setEditingTimetable(t);
      setTimetableForm({
        grade: t.grade,
        section: t.section,
        day: t.day,
        periodNo: t.periodNo,
        timeSlot: t.timeSlot,
        subjectName: t.subjectName,
        teacherName: t.teacherName,
      });
    } else {
      setEditingTimetable(null);
      setTimetableForm({
        grade: 'Class 10',
        section: 'A',
        day: 'Monday',
        periodNo: 1,
        timeSlot: '09:00 AM - 09:45 AM',
        subjectName: subjects[0]?.name || 'Mathematics',
        teacherName: 'Malini Swaminathan',
      });
    }
    setIsTimetableModalOpen(true);
  };

  const handleSaveTimetable = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTimetable) {
      onUpdateTimetable({
        ...editingTimetable,
        ...timetableForm,
      });
      showToast('Timetable period updated successfully.');
    } else {
      onAddTimetable(timetableForm);
      showToast('Timetable period scheduled successfully.');
    }
    setIsTimetableModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#0B1F3A]" />
            <span>Admin Management Hub & Master Config</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage User Logins, Password Resets, Status Toggles, Classes & Sections, Subjects, and Timetables with Full CRUD
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {activeTab === 'users' && (
            <button
              onClick={() => handleOpenUserModal()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Create User Login</span>
            </button>
          )}
          {activeTab === 'classes' && (
            <button
              onClick={() => handleOpenClassModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Class & Sections</span>
            </button>
          )}
          {activeTab === 'subjects' && (
            <button
              onClick={() => handleOpenSubjectModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Create Subject</span>
            </button>
          )}
          {activeTab === 'timetables' && (
            <button
              onClick={() => handleOpenTimetableModal()}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Schedule Timetable Period</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-xs border border-gray-100">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts & Logins ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Classes & Sections ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'subjects'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Subjects Master ({subjects.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timetables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'timetables'
              ? 'bg-[#0B1F3A] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Timetable Builder ({timetables.length})</span>
        </button>
      </div>

      {/* SECTION 1: USER ACCOUNTS & LOGINS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">User Authentication & Login Control</h3>
              <p className="text-xs text-gray-500">Create users, reset passwords, toggle active/inactive status, and manage role permissions.</p>
            </div>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none w-48 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Username & Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Email & Phone</th>
                  <th className="px-4 py-3">Login Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions (Password / Status / Edit / Delete)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users
                  .filter(
                    (u) =>
                      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      u.role.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{u.username}</div>
                        <div className="text-[11px] text-gray-500">{u.fullName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded-full font-bold text-[10px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono">
                        <div>{u.email}</div>
                        <div className="text-[10px] text-gray-400">{u.phone}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            u.status === 'Active'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-[11px]">
                        {u.lastLogin || 'Never'}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            onResetPassword(u.id);
                            showToast(`Temporary password generated and sent to ${u.email}`);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-md font-semibold border border-amber-200 transition-colors cursor-pointer"
                          title="Reset User Password"
                        >
                          Reset Pwd
                        </button>
                        <button
                          onClick={() => {
                            onToggleUserStatus(u.id);
                            showToast(`User ${u.username} status toggled`);
                          }}
                          className={`px-2.5 py-1 rounded-md font-semibold border transition-colors cursor-pointer ${
                            u.status === 'Active'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                          title="Toggle Active / Inactive"
                        >
                          {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenUserModal(u)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                          title="Edit User Details"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete user account "${u.username}"?`)) {
                              onDeleteUser(u.id);
                              showToast(`User account "${u.username}" deleted.`);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors cursor-pointer"
                          title="Delete User"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: CLASSES & SECTIONS */}
      {activeTab === 'classes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Class & Section Master Configuration</h3>
              <p className="text-xs text-gray-500">Create academic classes, section divisions (A, B, C), room numbers, and class teachers.</p>
            </div>
            <button
              onClick={() => handleOpenClassModal()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Class</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Grade / Class Name</th>
                  <th className="px-4 py-3">Curriculum Board</th>
                  <th className="px-4 py-3">Sections</th>
                  <th className="px-4 py-3">Room Number</th>
                  <th className="px-4 py-3">Class Teacher Incharge</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900 text-sm">{cls.gradeName}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 rounded font-bold text-[10px]">
                        {cls.curriculum}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">
                      {cls.sections.map((sec) => (
                        <span key={sec} className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded mr-1 inline-block text-[11px]">
                          {sec}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{cls.roomNo}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{cls.classTeacher || 'Not Assigned'}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenClassModal(cls)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete class "${cls.gradeName}"?`)) {
                            onDeleteClass(cls.id);
                            showToast(`Class "${cls.gradeName}" deleted.`);
                          }
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 3: SUBJECTS MASTER */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Subject Curriculum Master</h3>
              <p className="text-xs text-gray-500">Define core, elective, and co-scholastic subjects with subject codes and maximum marks.</p>
            </div>
            <button
              onClick={() => handleOpenSubjectModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Subject</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Grade Level</th>
                  <th className="px-4 py-3">Max Marks</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{sub.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 text-sm">{sub.name}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px]">
                        {sub.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sub.gradeLevel}</td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">{sub.maxMarks}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenSubjectModal(sub)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete subject "${sub.name}"?`)) {
                            onDeleteSubject(sub.id);
                            showToast(`Subject "${sub.name}" deleted.`);
                          }
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: TIMETABLE BUILDER */}
      {activeTab === 'timetables' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Class & Section Timetable Builder</h3>
              <p className="text-xs text-gray-500">Configure daily periods, time slots, assigned subjects, and teachers.</p>
            </div>
            <button
              onClick={() => handleOpenTimetableModal()}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Period</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Grade & Section</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Period</th>
                  <th className="px-4 py-3">Time Slot</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Assigned Teacher</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {timetables.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {t.grade} - Sec {t.section}
                    </td>
                    <td className="px-4 py-3 font-semibold text-purple-700">{t.day}</td>
                    <td className="px-4 py-3 font-mono font-bold">Period {t.periodNo}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{t.timeSlot}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{t.subjectName}</td>
                    <td className="px-4 py-3 text-gray-700">{t.teacherName}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleOpenTimetableModal(t)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete timetable period ${t.periodNo} (${t.subjectName})?`)) {
                            onDeleteTimetable(t.id);
                            showToast('Timetable period removed.');
                          }
                        }}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}

      {/* 1. User Account Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingUser ? 'Edit User Account & Login' : 'Create New User Account'}
              </h3>
              <button onClick={() => setIsUserModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="e.g. jain_teacher"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={userForm.fullName}
                    onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="e.g. Prof. Arvind Jain"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="arvind.j@learner.edu.in"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    required
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="+91 98450 12345"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Security Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="Principal">Principal</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Transport Staff">Transport Staff</option>
                    <option value="Parent">Parent</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Login Status</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingUser ? 'Save Changes' : 'Create User Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Class & Section Modal */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingClass ? 'Edit Class & Sections' : 'Create New Class'}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">Grade Name</label>
                <input
                  type="text"
                  required
                  value={classForm.gradeName}
                  onChange={(e) => setClassForm({ ...classForm, gradeName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="e.g. Class 10 or Grade 8"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Curriculum Board</label>
                  <select
                    value={classForm.curriculum}
                    onChange={(e) => setClassForm({ ...classForm, curriculum: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="State Board">State Board</option>
                    <option value="Matriculation">Matriculation</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Room Number</label>
                  <input
                    type="text"
                    required
                    value={classForm.roomNo}
                    onChange={(e) => setClassForm({ ...classForm, roomNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                    placeholder="Block A - Room 104"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Sections (comma separated)</label>
                <input
                  type="text"
                  required
                  value={classForm.sectionsStr}
                  onChange={(e) => setClassForm({ ...classForm, sectionsStr: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="A, B, C"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Class Teacher Incharge</label>
                <input
                  type="text"
                  value={classForm.classTeacher}
                  onChange={(e) => setClassForm({ ...classForm, classTeacher: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="e.g. Ms. Priyanka Sen"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingClass ? 'Save Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingSubject ? 'Edit Subject' : 'Create New Subject'}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none uppercase font-mono"
                    placeholder="PHY101"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Grade Level</label>
                  <select
                    required
                    value={subjectForm.gradeLevel}
                    onChange={(e) => setSubjectForm({ ...subjectForm, gradeLevel: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.gradeName}>
                        {cls.gradeName} ({cls.curriculum})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Advanced Physics & Optics"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Subject Type</label>
                  <select
                    value={subjectForm.type}
                    onChange={(e) => setSubjectForm({ ...subjectForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                    <option value="Co-Scholastic">Co-Scholastic</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    required
                    value={subjectForm.maxMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingSubject ? 'Save Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Timetable Modal */}
      {isTimetableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingTimetable ? 'Edit Timetable Period' : 'Schedule Timetable Period'}
              </h3>
              <button onClick={() => setIsTimetableModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTimetable} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Grade / Class</label>
                  <select
                    required
                    value={timetableForm.grade}
                    onChange={(e) => {
                      const selectedGradeName = e.target.value;
                      const matchedClass = classes.find(c => c.gradeName === selectedGradeName);
                      const defaultSection = matchedClass && matchedClass.sections.length > 0 ? matchedClass.sections[0] : 'A';
                      setTimetableForm({ ...timetableForm, grade: selectedGradeName, section: defaultSection });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.gradeName}>
                        {cls.gradeName} ({cls.curriculum})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Section</label>
                  <select
                    required
                    value={timetableForm.section}
                    onChange={(e) => setTimetableForm({ ...timetableForm, section: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white font-semibold"
                  >
                    {(() => {
                      const matchedClass = classes.find(c => c.gradeName === timetableForm.grade);
                      const sections = matchedClass ? matchedClass.sections : ['A', 'B', 'C'];
                      return sections.map((sec) => (
                        <option key={sec} value={sec}>
                          Section {sec}
                        </option>
                      ));
                    })()}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Day of Week</label>
                  <select
                    value={timetableForm.day}
                    onChange={(e) => setTimetableForm({ ...timetableForm, day: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none bg-white"
                  >
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Period Number</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    required
                    value={timetableForm.periodNo}
                    onChange={(e) => setTimetableForm({ ...timetableForm, periodNo: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Time Slot</label>
                <input
                  type="text"
                  required
                  value={timetableForm.timeSlot}
                  onChange={(e) => setTimetableForm({ ...timetableForm, timeSlot: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none font-mono"
                  placeholder="09:00 AM - 09:45 AM"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={timetableForm.subjectName}
                  onChange={(e) => setTimetableForm({ ...timetableForm, subjectName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Mathematics Standard"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Assigned Teacher</label>
                <input
                  type="text"
                  required
                  value={timetableForm.teacherName}
                  onChange={(e) => setTimetableForm({ ...timetableForm, teacherName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none"
                  placeholder="Malini Swaminathan"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTimetableModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingTimetable ? 'Save Period' : 'Schedule Period'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
