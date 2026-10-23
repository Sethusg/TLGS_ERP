import React, { useState } from 'react';
import {
  LineChart,
  Search,
  Printer,
  Award,
  BookOpen,
  Filter,
  CheckCircle2,
  TrendingUp,
  FileText,
  Percent,
} from 'lucide-react';
import { ExamRecord, Student } from '../types';

interface MarkchartModuleProps {
  exams: ExamRecord[];
  students: Student[];
  subItem?: string;
}

export const MarkchartModule: React.FC<MarkchartModuleProps> = ({
  exams,
  students,
  subItem = 'markchart-exams',
}) => {
  const [activeTab, setActiveTab] = useState<'exams' | 'reportcard' | 'analytics' | 'subjects'>(() => {
    if (subItem === 'markchart-reports') return 'reportcard';
    if (subItem === 'markchart-analytics') return 'analytics';
    if (subItem === 'markchart-subjects') return 'subjects';
    return 'exams';
  });

  const [selectedExamRecord, setSelectedExamRecord] = useState<ExamRecord>(exams[0]);
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [search, setSearch] = useState('');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <LineChart className="w-6 h-6 text-[#1976d2]" />
            <span>Academic Markchart & Assessment Portal</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            CBSE Continuous & Comprehensive Evaluation (CCE) · Scholastic & Co-Scholastic Records
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'exams' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exams & Marks
          </button>
          <button
            onClick={() => setActiveTab('reportcard')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'reportcard' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CBSE Report Card
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'analytics' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Class Analytics
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'subjects' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Subjects & Weightages
          </button>
        </div>
      </div>

      {/* VIEW: EXAMS & MARKS OVERVIEW */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-700">Filter Exam:</span>
              <select className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none">
                <option>Mid-Term Examination 2026</option>
                <option>Periodic Test 1 (PT-1)</option>
                <option>Periodic Test 2 (PT-2)</option>
                <option>CBSE Pre-Board Examination</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option>Class 10</option>
                <option>Class 12</option>
                <option>Class 9</option>
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option>A</option>
                <option>B</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class / Sec</th>
                  <th className="px-4 py-3 text-right">Total Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3 text-center">CBSE Grade</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {exams.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-black text-xs inline-flex items-center justify-center">
                        #{rec.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">{rec.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {rec.grade} - {rec.section}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                      {rec.totalMarks} / {rec.maxTotal}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {rec.percentage}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 font-black text-xs">
                        {rec.overallGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedExamRecord(rec);
                          setActiveTab('reportcard');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-[#1976d2] hover:bg-blue-50 rounded-md transition-colors"
                      >
                        View Marksheet ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CBSE REPORT CARD PREVIEW & PRINT */}
      {activeTab === 'reportcard' && selectedExamRecord && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Official CBSE Progress Report Card
              </h3>
              <p className="text-xs text-gray-500">
                Standard format compliant with Central Board of Secondary Education guidelines
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-[#1976d2] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report Card</span>
            </button>
          </div>

          {/* Report Card Document Box */}
          <div className="border-2 border-gray-800 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto bg-white shadow-md text-gray-900">
            {/* Header with School Crest */}
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide uppercase text-gray-900">
                THE LEARNER&apos;S ACADEMY CBSE
              </h1>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Affiliated to CBSE, New Delhi · Affiliation No. 1930812 · School Code: 45091
              </p>
              <p className="text-[11px] text-gray-500">
                Main Campus: 42, Academy Knowledge Park, Varthur Main Road, Bengaluru - 560087
              </p>
              <div className="mt-2 inline-block px-3 py-1 bg-gray-100 border border-gray-300 text-xs font-bold uppercase tracking-wider rounded-sm">
                PROGRESS REPORT CARD · ACADEMIC SESSION 2026 - 2027
              </div>
            </div>

            {/* Student Metadata Table */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 text-xs border-b border-gray-300">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Student Name</span>
                <span className="font-bold text-gray-900">{selectedExamRecord.studentName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Class & Section</span>
                <span className="font-bold text-gray-900">
                  {selectedExamRecord.grade} - {selectedExamRecord.section}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Exam Term</span>
                <span className="font-bold text-gray-900">{selectedExamRecord.examName}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Class Rank</span>
                <span className="font-bold text-gray-900">Rank #{selectedExamRecord.rank}</span>
              </div>
            </div>

            {/* Scholastic Assessment Marks Table */}
            <div className="mt-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-800 mb-2">
                Part 1: Scholastic Areas
              </h4>
              <table className="w-full text-left text-xs border border-gray-300">
                <thead className="bg-gray-100 text-gray-800 border-b border-gray-300 font-bold">
                  <tr>
                    <th className="px-3 py-2 border-r border-gray-300">Subject Code & Title</th>
                    <th className="px-3 py-2 border-r border-gray-300 text-center">Max Marks</th>
                    <th className="px-3 py-2 border-r border-gray-300 text-center">Marks Obtained</th>
                    <th className="px-3 py-2 text-center">CBSE Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedExamRecord.subjects.map((sub, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 border-r border-gray-300 font-medium">{sub.name}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">{sub.maxMarks}</td>
                      <td className="px-3 py-2 border-r border-gray-300 text-center font-mono font-bold">
                        {sub.marksObtained}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-blue-700">{sub.grade}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-3 py-2 border-r border-gray-300">GRAND TOTAL & PERCENTAGE</td>
                    <td className="px-3 py-2 border-r border-gray-300 text-center font-mono">
                      {selectedExamRecord.maxTotal}
                    </td>
                    <td className="px-3 py-2 border-r border-gray-300 text-center font-mono font-black text-emerald-800">
                      {selectedExamRecord.totalMarks} ({selectedExamRecord.percentage}%)
                    </td>
                    <td className="px-3 py-2 text-center font-black text-emerald-800">
                      {selectedExamRecord.overallGrade}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Co-Scholastic & Discipline */}
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="border border-gray-300 p-3 rounded-sm">
                <span className="font-bold block text-gray-800 mb-1">Part 2: Co-Scholastic Activities</span>
                <p className="text-gray-600">Work Education: <strong>A</strong></p>
                <p className="text-gray-600">Art Education: <strong>A</strong></p>
                <p className="text-gray-600">Health & Physical Education: <strong>A</strong></p>
              </div>
              <div className="border border-gray-300 p-3 rounded-sm">
                <span className="font-bold block text-gray-800 mb-1">Part 3: Discipline & Remarks</span>
                <p className="text-gray-600">Attendance: <strong>97.8%</strong></p>
                <p className="text-gray-600">General Conduct: <strong>Exemplary</strong></p>
                <p className="text-gray-600">Teacher: <em>Consistently demonstrates outstanding analytical acumen.</em></p>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-10 pt-6 border-t border-gray-400 grid grid-cols-3 text-center text-xs text-gray-700">
              <div>
                <div className="font-signature font-serif italic text-base">M. Swaminathan</div>
                <div className="border-t border-gray-300 mt-1 pt-1 font-semibold">Class Teacher</div>
              </div>
              <div>
                <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-full mx-auto flex items-center justify-center text-[9px] text-gray-400 font-mono">
                  [SCHOOL SEAL]
                </div>
              </div>
              <div>
                <div className="font-signature font-serif italic text-base">Dr. Sethu Ramanathan</div>
                <div className="border-t border-gray-300 mt-1 pt-1 font-semibold">Principal</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">CBSE Batch Performance Insights</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xs text-emerald-800 font-semibold">Overall Pass Percentage</span>
              <div className="text-3xl font-black text-emerald-900 mt-1">100%</div>
              <span className="text-[11px] text-emerald-700">Zero failures in continuous assessment</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-xs text-blue-800 font-semibold">Distinction (Above 85%)</span>
              <div className="text-3xl font-black text-blue-900 mt-1">78.4%</div>
              <span className="text-[11px] text-blue-700">Highest across Bengaluru region</span>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xs text-amber-800 font-semibold">Top Scoring Subject</span>
              <div className="text-3xl font-black text-amber-900 mt-1">Mathematics</div>
              <span className="text-[11px] text-amber-700">Class Average: 91.2 / 100</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SUBJECTS & WEIGHTAGES */}
      {activeTab === 'subjects' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Curriculum Subjects & CBSE Weightage Roster</h3>
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3">Theory Weightage</th>
                  <th className="px-4 py-3">Internal / Practical</th>
                  <th className="px-4 py-3">Pass Criterion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { code: '041', name: 'Mathematics (Standard / Basic)', theory: '80 Marks', practical: '20 Marks', pass: '33% in each component' },
                  { code: '086', name: 'Science (Physics, Chemistry, Biology)', theory: '80 Marks', practical: '20 Marks (Lab Practical)', pass: '33% in each component' },
                  { code: '087', name: 'Social Science (History, Civics, Geo, Eco)', theory: '80 Marks', practical: '20 Marks (Project Work)', pass: '33% in each component' },
                  { code: '184', name: 'English Language & Literature', theory: '80 Marks', practical: '20 Marks (ASL Speaking/Listening)', pass: '33% in each component' },
                  { code: '085', name: 'Hindi Course B', theory: '80 Marks', practical: '20 Marks (ASL)', pass: '33% in each component' },
                ].map((s, i) => (
                  <tr key={i} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-gray-700">{s.code}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">{s.theory}</td>
                    <td className="px-4 py-3 text-gray-600">{s.practical}</td>
                    <td className="px-4 py-3 text-emerald-700 font-medium">{s.pass}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
