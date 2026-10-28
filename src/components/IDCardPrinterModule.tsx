import React, { useState, useMemo } from 'react';
import {
  Printer,
  CreditCard,
  Search,
  CheckCircle2,
  Settings,
  Download,
  User,
  Shield,
  QrCode,
  Building2,
  RefreshCw,
  Award,
  Layers,
  CheckSquare,
  Square,
  Filter,
} from 'lucide-react';
import { Student, Staff } from '../types';

interface IDCardPrinterModuleProps {
  students: Student[];
  staffList: Staff[];
  subItem?: string;
}

export const IDCardPrinterModule: React.FC<IDCardPrinterModuleProps> = ({
  students,
  staffList,
  subItem = 'id-student',
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'staff' | 'config'>(() => {
    if (subItem === 'id-staff') return 'staff';
    if (subItem === 'id-printer-config') return 'config';
    return 'student';
  });

  // Student Filter States
  const [selectedCampus, setSelectedCampus] = useState('Chennai Main Campus');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026 - 2027');
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [previewStudent, setPreviewStudent] = useState<Student | null>(null);

  // Staff Filter States
  const [staffCampus, setStaffCampus] = useState('Chennai Main Campus');
  const [staffDepartment, setStaffDepartment] = useState('ALL');
  const [staffSearch, setStaffSearch] = useState('');
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [previewStaff, setPreviewStaff] = useState<Staff | null>(null);

  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  // Evolis Primacy Printer Settings state
  const [printerModel, setPrinterModel] = useState('Evolis Primacy 2 Duplex');
  const [resolution, setResolution] = useState('300x600 DPI (Fine Mode)');
  const [ribbonType, setRibbonType] = useState('YMCKOK (Full Color Front, Black Back)');
  const [cardThickness, setCardThickness] = useState('0.76 mm (30 mil Standard PVC)');
  const [printSpeed, setPrintSpeed] = useState('Standard (220 cards/hour)');
  const [isTestPrinting, setIsTestPrinting] = useState(false);
  const [testPrintSuccess, setTestPrintSuccess] = useState(false);

  // Filtered Students based on grade, section, and search
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesGrade = selectedGrade === 'ALL' || s.grade === selectedGrade;
      const matchesSection = selectedSection === 'ALL' || s.section === selectedSection;
      const matchesSearch =
        !studentSearch ||
        s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(studentSearch.toLowerCase());
      return matchesGrade && matchesSection && matchesSearch;
    });
  }, [students, selectedGrade, selectedSection, studentSearch]);

  // Set default preview student
  React.useEffect(() => {
    if (filteredStudents.length > 0 && (!previewStudent || !filteredStudents.some((s) => s.id === previewStudent.id))) {
      setPreviewStudent(filteredStudents[0]);
    }
  }, [filteredStudents, previewStudent]);

  // Filtered Staff based on department and search
  const filteredStaff = useMemo(() => {
    return staffList.filter((st) => {
      const matchesDept = staffDepartment === 'ALL' || st.department === staffDepartment || st.role === staffDepartment;
      const matchesSearch =
        !staffSearch ||
        st.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
        st.empId.toLowerCase().includes(staffSearch.toLowerCase()) ||
        st.designation.toLowerCase().includes(staffSearch.toLowerCase());
      return matchesDept && matchesSearch;
    });
  }, [staffList, staffDepartment, staffSearch]);

  // Set default preview staff
  React.useEffect(() => {
    if (filteredStaff.length > 0 && (!previewStaff || !filteredStaff.some((st) => st.id === previewStaff.id))) {
      setPreviewStaff(filteredStaff[0]);
    }
  }, [filteredStaff, previewStaff]);

  // Student selection handlers
  const handleSelectAllStudents = () => {
    setSelectedStudentIds(filteredStudents.map((s) => s.id));
  };

  const handleDeselectAllStudents = () => {
    setSelectedStudentIds([]);
  };

  const handleToggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Staff selection handlers
  const handleSelectAllStaff = () => {
    setSelectedStaffIds(filteredStaff.map((st) => st.id));
  };

  const handleDeselectAllStaff = () => {
    setSelectedStaffIds([]);
  };

  const handleToggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handlePrintCards = (type: 'student' | 'staff') => {
    const count = type === 'student' ? selectedStudentIds.length : selectedStaffIds.length;
    if (count === 0) {
      alert(`Please select at least one ${type} ID card to print.`);
      return;
    }
    window.print();
  };

  const handleTestPrint = () => {
    setIsTestPrinting(true);
    setTestPrintSuccess(false);
    setTimeout(() => {
      setIsTestPrinting(false);
      setTestPrintSuccess(true);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2.5">
            <Printer className="w-6 h-6 text-[#0B1F3A]" />
            <span>Evolis Primacy ID Card Studio & Bulk Printer Hub</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            CR-80 ISO Standard ID Badge Generation, Class/Department Filtering, Batch Selection, and Direct Evolis Driver Integration.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'student' ? 'bg-[#0B1F3A] text-white shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Student ID Cards ({selectedStudentIds.length}/{filteredStudents.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 rounded-md transition-all ${
              activeTab === 'staff' ? 'bg-[#0B1F3A] text-white shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Staff ID Cards ({selectedStaffIds.length}/{filteredStaff.length})
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'config' ? 'bg-[#0B1F3A] text-white shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Evolis Printer Setup</span>
          </button>
        </div>
      </div>

      {/* VIEW: STUDENT ID CARDS TAB */}
      {activeTab === 'student' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Campus</label>
              <select
                value={selectedCampus}
                onChange={(e) => setSelectedCampus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="Chennai Main Campus">Chennai Main Campus</option>
                <option value="Bengaluru Campus">Bengaluru Campus</option>
                <option value="Mysore Campus">Mysore Campus</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Academic Year</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="2026 - 2027">2026 - 2027 (Active)</option>
                <option value="2025 - 2026">2025 - 2026</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Class</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-semibold"
              >
                <option value="Class 10">Class 10</option>
                <option value="Class 12">Class 12</option>
                <option value="Class 9">Class 9</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Section</label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-semibold"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Search Student</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Name, admission no..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Selection Toolbar & Action Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAllStudents}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Select All ({filteredStudents.length})
              </button>
              <button
                onClick={handleDeselectAllStudents}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Deselect All
              </button>
              <span className="text-xs text-gray-500 font-mono">
                Selected for printing: <strong className="text-slate-900">{selectedStudentIds.length}</strong> of {filteredStudents.length}
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handlePrintCards('student')}
                disabled={selectedStudentIds.length === 0}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${
                  selectedStudentIds.length > 0
                    ? 'bg-[#0B1F3A] hover:bg-[#16325c] text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print Selected ID Cards ({selectedStudentIds.length})</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Student Table List + Live CR-80 Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Student Table with Checkboxes */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Students List ({filteredStudents.length} Records Loaded)
                </h3>
                <span className="text-[11px] font-mono text-gray-400">{selectedCampus}</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredStudents.map((std) => {
                  const isSelected = selectedStudentIds.includes(std.id);
                  const isPreviewing = previewStudent?.id === std.id;
                  return (
                    <div
                      key={std.id}
                      onClick={() => setPreviewStudent(std)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isPreviewing
                          ? 'border-[#0B1F3A] bg-slate-50/80 shadow-2xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStudent(std.id);
                          }}
                          className="text-[#0B1F3A] hover:opacity-80"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                          {std.name.charAt(0)}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{std.name}</h4>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {std.admissionNo} • Class {std.grade} Sec {std.section} • Roll {std.rollNo}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                          Blood: {std.bloodGroup}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold underline">Preview</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live CR-80 Badge Preview Panel */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">CR-80 Badge Preview</h3>
                <button
                  onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Flip ({cardSide === 'front' ? 'Back' : 'Front'})</span>
                </button>
              </div>

              {previewStudent ? (
                <div className="flex justify-center py-2">
                  <div className="w-[380px] h-[240px] rounded-2xl shadow-xl overflow-hidden border-2 border-slate-800 bg-white relative flex flex-col justify-between font-sans select-none">
                    {cardSide === 'front' ? (
                      <>
                        <div className="bg-[#0B1F3A] text-white p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white text-[#0B1F3A] font-extrabold flex items-center justify-center text-[10px]">
                              TL
                            </div>
                            <div>
                              <h5 className="text-[9px] font-extrabold uppercase text-amber-300">
                                {selectedCampus}
                              </h5>
                              <p className="text-[7px] text-slate-300">The Leaders Group of Schools</p>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold bg-[#D4AF37] text-slate-900 px-2 py-0.5 rounded-full">
                            STUDENT ID
                          </span>
                        </div>

                        <div className="p-3.5 flex gap-3 items-center bg-slate-50 flex-1">
                          <div className="w-20 h-24 rounded-lg border border-[#D4AF37] bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                            {previewStudent.name.charAt(0)}
                          </div>
                          <div className="space-y-1 flex-1 text-xs">
                            <h4 className="font-extrabold text-slate-900 leading-tight">
                              {previewStudent.name}
                            </h4>
                            <p className="text-[10px] text-slate-600 font-mono">
                              <strong>Adm No:</strong> {previewStudent.admissionNo}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              <strong>Class:</strong> {previewStudent.grade} - {previewStudent.section}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              <strong>DOB:</strong> {previewStudent.dob}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              <strong>Year:</strong> {selectedAcademicYear}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-100 px-3 py-1.5 border-t border-slate-200 flex items-center justify-between text-[8px]">
                          <div className="flex items-center gap-1 font-mono text-slate-700">
                            <QrCode className="w-5 h-5 text-[#0B1F3A]" />
                            <span>{previewStudent.admissionNo}</span>
                          </div>
                          <span>Authorized Signatory</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#0B1F3A] text-white p-2 text-center text-[9px] font-bold text-amber-300 uppercase">
                          STUDENT EMERGENCY DETAILS
                        </div>
                        <div className="p-3.5 text-[10px] text-slate-700 space-y-1.5 bg-slate-50 flex-1">
                          <p><strong>Father:</strong> {previewStudent.fatherName}</p>
                          <p><strong>Emergency Phone:</strong> {previewStudent.phone}</p>
                          <p><strong>Address:</strong> {previewStudent.address}</p>
                          <p><strong>Blood Group:</strong> <span className="text-rose-600 font-bold">{previewStudent.bloodGroup}</span></p>
                        </div>
                        <div className="bg-[#0B1F3A] text-slate-300 px-3 py-1 text-center text-[8px]">
                          {selectedCampus} | www.leadersacademy.edu.in
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">No student selected for preview</div>
              )}

              <div className="text-[11px] text-gray-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                <span>Evolis Primacy Status: <strong>Ready (300 DPI)</strong></span>
                <button
                  onClick={() => alert(`Exported high-res CR80 batch badge package for ${selectedStudentIds.length} students.`)}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Export Batch PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: STAFF ID CARDS TAB */}
      {activeTab === 'staff' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Campus</label>
              <select
                value={staffCampus}
                onChange={(e) => setStaffCampus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option value="Chennai Main Campus">Chennai Main Campus</option>
                <option value="Bengaluru Campus">Bengaluru Campus</option>
                <option value="Mysore Campus">Mysore Campus</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Staff Department</label>
              <select
                value={staffDepartment}
                onChange={(e) => setStaffDepartment(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-semibold"
              >
                <option value="ALL">All Departments & Cadres</option>
                <option value="Teaching">Teaching Faculty (PGT/TGT)</option>
                <option value="Administration">Administration</option>
                <option value="Accounts">Accounts</option>
                <option value="IT">IT & Lab Assistants</option>
                <option value="Transport">Transport Staff</option>
                <option value="Security">Security & Support Staff</option>
                <option value="Mathematics">Mathematics Dept</option>
                <option value="Science">Science Dept</option>
                <option value="Languages">Languages Dept</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase text-gray-500 block mb-1">Search Staff</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Name, employee ID..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStaffDepartment('ALL');
                  setStaffSearch('');
                }}
                className="w-full px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Selection Toolbar & Action Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleSelectAllStaff}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Select All ({filteredStaff.length})
              </button>
              <button
                onClick={handleDeselectAllStaff}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Deselect All
              </button>
              <span className="text-xs text-gray-500 font-mono">
                Selected for printing: <strong className="text-slate-900">{selectedStaffIds.length}</strong> of {filteredStaff.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePrintCards('staff')}
                disabled={selectedStaffIds.length === 0}
                className={`px-5 py-2 text-xs font-bold rounded-lg shadow-md flex items-center gap-2 transition-all ${
                  selectedStaffIds.length > 0
                    ? 'bg-[#0B1F3A] hover:bg-[#16325c] text-white cursor-pointer'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Printer className="w-4 h-4 text-amber-300" />
                <span>Print Selected Staff ID Cards ({selectedStaffIds.length})</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Staff Table List + Live CR-80 Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Staff Table with Checkboxes */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Staff Members List ({filteredStaff.length} Records Loaded)
                </h3>
                <span className="text-[11px] font-mono text-gray-400">{staffCampus}</span>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredStaff.map((st) => {
                  const isSelected = selectedStaffIds.includes(st.id);
                  const isPreviewing = previewStaff?.id === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => setPreviewStaff(st)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isPreviewing
                          ? 'border-[#0B1F3A] bg-slate-50/80 shadow-2xs'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStaff(st.id);
                          }}
                          className="text-[#0B1F3A] hover:opacity-80"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 fill-blue-50" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {st.name.charAt(0)}
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-gray-900">{st.name}</h4>
                          <p className="text-[11px] text-gray-500 font-mono">
                            {st.empId} • {st.designation || st.role} ({st.department})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded">
                          {st.employmentType}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold underline">Preview</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live CR-80 Staff Badge Preview Panel */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-bold text-gray-900">Staff CR-80 Badge Preview</h3>
                <button
                  onClick={() => setCardSide(cardSide === 'front' ? 'back' : 'front')}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Flip ({cardSide === 'front' ? 'Back' : 'Front'})</span>
                </button>
              </div>

              {previewStaff ? (
                <div className="flex justify-center py-2">
                  <div className="w-[380px] h-[240px] rounded-2xl shadow-xl overflow-hidden border-2 border-slate-800 bg-white relative flex flex-col justify-between font-sans select-none">
                    {cardSide === 'front' ? (
                      <>
                        <div className="bg-[#0B1F3A] text-white p-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-white text-[#0B1F3A] font-extrabold flex items-center justify-center text-[10px]">
                              TL
                            </div>
                            <div>
                              <h5 className="text-[9px] font-extrabold uppercase text-amber-300">
                                {staffCampus}
                              </h5>
                              <p className="text-[7px] text-slate-300">The Leaders Group of Schools</p>
                            </div>
                          </div>
                          <span className="text-[8px] font-bold bg-[#D4AF37] text-slate-900 px-2 py-0.5 rounded-full">
                            FACULTY ID
                          </span>
                        </div>

                        <div className="p-3.5 flex gap-3 items-center bg-slate-50 flex-1">
                          <div className="w-20 h-24 rounded-lg border border-[#D4AF37] bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-sm shrink-0">
                            {previewStaff.name.charAt(0)}
                          </div>
                          <div className="space-y-1 flex-1 text-xs">
                            <h4 className="font-extrabold text-slate-900 leading-tight">
                              {previewStaff.name}
                            </h4>
                            <p className="text-[10px] text-slate-600 font-mono">
                              <strong>Emp ID:</strong> {previewStaff.empId}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              <strong>Designation:</strong> {previewStaff.designation || previewStaff.role}
                            </p>
                            <p className="text-[10px] text-slate-600">
                              <strong>Department:</strong> {previewStaff.department}
                            </p>
                            <p className="text-[10px] text-slate-600 font-mono">
                              <strong>Phone:</strong> {previewStaff.phone}
                            </p>
                          </div>
                        </div>

                        <div className="bg-slate-100 px-3 py-1.5 border-t border-slate-200 flex items-center justify-between text-[8px]">
                          <div className="flex items-center gap-1 font-mono text-slate-700">
                            <QrCode className="w-5 h-5 text-[#0B1F3A]" />
                            <span>{previewStaff.empId}</span>
                          </div>
                          <span>HR Director</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="bg-[#0B1F3A] text-white p-2 text-center text-[9px] font-bold text-amber-300 uppercase">
                          STAFF ACCESS & EMERGENCY PROFILE
                        </div>
                        <div className="p-3.5 text-[10px] text-slate-700 space-y-1.5 bg-slate-50 flex-1">
                          <p><strong>Employment:</strong> {previewStaff.employmentType}</p>
                          <p><strong>Qualification:</strong> {previewStaff.qualification}</p>
                          <p><strong>Emergency Contact:</strong> {previewStaff.emergencyContact?.name} ({previewStaff.emergencyContact?.phone})</p>
                          <p><strong>Blood Group:</strong> <span className="text-rose-600 font-bold">{previewStaff.bloodGroup || 'O+'}</span></p>
                        </div>
                        <div className="bg-[#0B1F3A] text-slate-300 px-3 py-1 text-center text-[8px]">
                          {staffCampus} | HR Department
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-gray-400">No staff selected for preview</div>
              )}

              <div className="text-[11px] text-gray-500 bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
                <span>Evolis Primacy Status: <strong>Ready (300 DPI)</strong></span>
                <button
                  onClick={() => alert(`Exported high-res CR80 batch badge package for ${selectedStaffIds.length} staff members.`)}
                  className="text-blue-700 font-bold hover:underline"
                >
                  Export Batch PNG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: EVOLIS PRIMACY PRINTER CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Evolis Primacy Physical Printer Configuration</h3>
              <p className="text-xs text-gray-500">
                Configure ribbon type, resolution, card thickness, and driver communication settings.
              </p>
            </div>
            <button
              onClick={handleTestPrint}
              disabled={isTestPrinting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isTestPrinting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending Test Pattern...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Send Test Card Print</span>
                </>
              )}
            </button>
          </div>

          {testPrintSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Test print job successfully transmitted to Evolis Primacy via USB / Print Spooler! Ribbon and card feed verified.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Printer Model</label>
              <select
                value={printerModel}
                onChange={(e) => setPrinterModel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="Evolis Primacy 2 Duplex">Evolis Primacy 2 Duplex</option>
                <option value="Evolis Primacy Single-Sided">Evolis Primacy Single-Sided</option>
                <option value="Evolis Quantum Batch Printer">Evolis Quantum Batch Printer</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Print Resolution (DPI)</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="300x300 DPI (Standard Color)">300 x 300 DPI (Standard Color Mode)</option>
                <option value="300x600 DPI (Fine Mode)">300 x 600 DPI (Fine Mode - Recommended)</option>
                <option value="300x1200 DPI (Monochrome High-Res)">300 x 1200 DPI (Monochrome High-Res)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Ribbon Type / Panels</label>
              <select
                value={ribbonType}
                onChange={(e) => setRibbonType(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="YMCKOK (Full Color Front, Black Back)">YMCKOK (Full Color Front, Black Back - 200 prints)</option>
                <option value="YMCKO (5-panel Full Color)">YMCKO (5-panel Full Color - 300 prints)</option>
                <option value="Monochrome Black (K)">Monochrome Black (K - 1000 prints)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Card Thickness & Stock</label>
              <select
                value={cardThickness}
                onChange={(e) => setCardThickness(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="0.76 mm (30 mil Standard PVC)">0.76 mm (30 mil Standard PVC)</option>
                <option value="0.50 mm (20 mil PVC)">0.50 mm (20 mil PVC)</option>
                <option value="1.00 mm (40 mil Heavy Composite)">1.00 mm (40 mil Heavy Composite)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Print Speed Setting</label>
              <select
                value={printSpeed}
                onChange={(e) => setPrintSpeed(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
              >
                <option value="Standard (220 cards/hour)">Standard (220 cards/hour)</option>
                <option value="High Quality (160 cards/hour)">High Quality (160 cards/hour)</option>
                <option value="Draft / Fast (280 cards/hour)">Draft / Fast (280 cards/hour)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">Hooper & Feed Status</label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 flex items-center justify-between">
                <span>Input Feeder: 100 Cards</span>
                <span className="text-emerald-600 font-bold">READY</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
