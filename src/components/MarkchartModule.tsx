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
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { ExamRecord, Student } from '../types';
import { printElement } from '../utils/printDocument';

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
  const [activeTab, setActiveTab] = useState<'exams' | 'rankings' | 'reportcard' | 'analytics' | 'subjects'>(() => {
    if (subItem === 'markchart-reports') return 'reportcard';
    if (subItem === 'markchart-analytics') return 'analytics';
    if (subItem === 'markchart-subjects') return 'subjects';
    if (subItem === 'markchart-rankings') return 'rankings';
    return 'exams';
  });

  const [selectedExamRecord, setSelectedExamRecord] = useState<ExamRecord>(exams[0]);
  const [selectedGrade, setSelectedGrade] = useState('Class 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [search, setSearch] = useState('');

  // Filter only finalized exam records for rankings
  const finalizedExams = exams.filter((e) => e.isFinalized === true);

  // Filter by selected grade and section
  const classFilteredExams = finalizedExams.filter(
    (e) => e.grade === selectedGrade && e.section === selectedSection
  );

  // Sort by cumulative / total marks descending to calculate ranks
  const rankedStudents = [...classFilteredExams].sort((a, b) => b.totalMarks - a.totalMarks);

  const classAveragePercentage =
    rankedStudents.length > 0
      ? (rankedStudents.reduce((acc, curr) => acc + curr.percentage, 0) / rankedStudents.length).toFixed(1)
      : '0.0';

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
            CBSE Continuous & Comprehensive Evaluation (CCE) · Scholastic & Exam Rankings Dashboard
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100/90 rounded-lg text-xs font-medium border border-gray-200/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'exams' ? 'bg-[#3949ab] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exams & Marks
          </button>
          <button
            onClick={() => setActiveTab('rankings')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'rankings' ? 'bg-[#3949ab] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Exam Rankings</span>
          </button>
          <button
            onClick={() => setActiveTab('reportcard')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'reportcard' ? 'bg-[#3949ab] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            CBSE Report Card
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'analytics' ? 'bg-[#3949ab] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Class Analytics
          </button>
          <button
            onClick={() => setActiveTab('subjects')}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
              activeTab === 'subjects' ? 'bg-[#3949ab] text-white shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Subjects & Weightages
          </button>
        </div>
      </div>

      {/* VIEW: EXAMS & MARKS OVERVIEW */}
      {activeTab === 'exams' && (
        <>
          {/* Multicolor Assessment KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Class 10 Evaluated</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">42 Students</div>
                <span className="text-[10px] text-indigo-600 font-semibold">Mid-Term Term-1</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e8eaf6] flex items-center justify-center text-[#3949ab] shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Class Average</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">82.4%</div>
                <span className="text-[10px] text-emerald-600 font-semibold">+3.8% vs PT-1</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e8f5e9] flex items-center justify-center text-[#43a047] shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-cyan-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-700">Distinction (A1/A2)</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">68.5%</div>
                <span className="text-[10px] text-cyan-600 font-semibold">28 Students with ≥80%</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e0f7fa] flex items-center justify-center text-[#00acc1] shrink-0">
                <Percent className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Top Aggregate</span>
                <div className="text-2xl font-black text-gray-900 mt-0.5 tabular-nums">98.4%</div>
                <span className="text-[10px] text-amber-600 font-semibold">Ananya Krishnan (Rank 1)</span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#fff8e1] flex items-center justify-center text-[#f57f17] shrink-0">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

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
                    <th className="px-4 py-3 text-center">Status</th>
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
                        {rec.isFinalized ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[10px]">
                            Finalized
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold text-[10px]">
                            Draft
                          </span>
                        )}
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
        </>
      )}

      {/* VIEW: EXAM RANKINGS DASHBOARD (Cumulative per class/section, finalized marks only) */}
      {activeTab === 'rankings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Exam Rankings & Leaderboard Dashboard</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Calculated dynamically per class and section. <strong>Strict filter: Only includes students with finalized marks.</strong>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Class:</span>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-medium"
                >
                  <option>Class 10</option>
                  <option>Class 12</option>
                  <option>Class 9</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-700">Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none font-medium"
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rankings Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-800 uppercase">Finalized Candidates</span>
                <div className="text-2xl font-black text-amber-900 mt-1">{rankedStudents.length} Students</div>
                <span className="text-[10px] text-amber-700">Unfinalized drafts excluded</span>
              </div>
              <ShieldCheck className="w-8 h-8 text-amber-600 opacity-80" />
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-800 uppercase">Class Average (%)</span>
                <div className="text-2xl font-black text-blue-900 mt-1">{classAveragePercentage}%</div>
                <span className="text-[10px] text-blue-700">Based on finalized aggregate</span>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600 opacity-80" />
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-800 uppercase">Class Rank 1</span>
                <div className="text-xl font-black text-emerald-900 mt-1 truncate max-w-[180px]">
                  {rankedStudents[0] ? rankedStudents[0].studentName : 'N/A'}
                </div>
                <span className="text-[10px] text-emerald-700 font-mono">
                  {rankedStudents[0] ? `${rankedStudents[0].percentage}%` : '-'}
                </span>
              </div>
              <Award className="w-8 h-8 text-emerald-600 opacity-80" />
            </div>
          </div>

          {/* Rankings Leaderboard Table */}
          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Calculated Rank</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Exam Term</th>
                  <th className="px-4 py-3 text-right">Cumulative Marks</th>
                  <th className="px-4 py-3 text-right">Percentage</th>
                  <th className="px-4 py-3 text-center">CBSE Grade</th>
                  <th className="px-4 py-3 text-center">Finalized Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rankedStudents.map((rec, index) => (
                  <tr key={rec.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`w-7 h-7 rounded-full font-black text-xs inline-flex items-center justify-center shadow-2xs ${
                          index === 0
                            ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                            : index === 1
                            ? 'bg-slate-200 text-slate-800'
                            : index === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        #{index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900 text-sm">{rec.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{rec.examName}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                      {rec.totalMarks} / {rec.maxTotal}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-700">
                      {rec.percentage}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold">
                        {rec.overallGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Finalized</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedExamRecord(rec);
                          setActiveTab('reportcard');
                        }}
                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                      >
                        View Marksheet ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rankedStudents.length === 0 && (
            <div className="bg-gray-50 rounded-2xl p-10 text-center border border-gray-200">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-gray-800">No Finalized Rankings Found</h4>
              <p className="text-xs text-gray-500 mt-1">
                There are no students with finalized marks for {selectedGrade} - Section {selectedSection}.
              </p>
            </div>
          )}
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
              type="button"
              onClick={() =>
                printElement('markchart-official-document', {
                  title: `CBSE_Report_Card_${selectedExamRecord?.studentName || 'Student'}_THE_LEADERS_ACADEMY`,
                })
              }
              className="px-4 py-2 bg-[#1976d2] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              title="Print official CBSE progress report card"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report Card</span>
            </button>
          </div>

          {/* Report Card Document Box */}
          <div id="markchart-official-document" className="border-2 border-gray-800 rounded-xl p-6 sm:p-8 max-w-3xl mx-auto bg-white shadow-md text-gray-900">
            {/* Header with School Crest */}
            <div className="text-center border-b-2 border-gray-800 pb-4">
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide uppercase text-gray-900">
                THE LEADERS ACADEMY (CBSE)
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
