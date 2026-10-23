import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Video,
  FileCheck,
  CheckCircle2,
  Download,
  Plus,
} from 'lucide-react';

interface LMSAndAcademicsProps {
  initialTab?: 'homework' | 'timetable' | 'exams' | 'live' | 'lms';
}

export const LMSAndAcademicsModule: React.FC<LMSAndAcademicsProps> = ({
  initialTab = 'homework',
}) => {
  const [activeTab, setActiveTab] = useState<'homework' | 'timetable' | 'exams' | 'live' | 'lms'>(
    initialTab
  );

  const [selectedClass, setSelectedClass] = useState('Class 10-A');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-[#00acc1]" />
            <span>Academics & Digital Learning Management System (LMS)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Daily Homework · Weekly Timetables · Live Hybrid Classrooms · CBSE Digital Courseware
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'homework' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home Work
          </button>
          <button
            onClick={() => setActiveTab('timetable')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'timetable' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Time Table
          </button>
          <button
            onClick={() => setActiveTab('exams')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'exams' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Exam Date Sheet
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'live' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Live Classes
          </button>
          <button
            onClick={() => setActiveTab('lms')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'lms' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            LMS Courses
          </button>
        </div>
      </div>

      {/* VIEW: HOME WORK */}
      {activeTab === 'homework' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700">Select Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
              >
                <option>Class 10-A</option>
                <option>Class 10-B</option>
                <option>Class 12-A</option>
                <option>Class 9-C</option>
              </select>
            </div>
            <button
              onClick={() => alert('New homework assignment modal triggered')}
              className="px-3 py-1.5 bg-[#e91e63] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Assign Homework</span>
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                subject: 'Mathematics (Standard)',
                teacher: 'Malini Swaminathan',
                assigned: '23 Oct 2026',
                due: '25 Oct 2026',
                title: 'Exercise 7.2 - Coordinate Geometry & Section Formula',
                instructions: 'Solve Questions 1 through 10 in your homework register with neat coordinate graphs.',
                submittedCount: '34 / 38',
              },
              {
                subject: 'Physics',
                teacher: 'Rajeshwari Prasad',
                assigned: '22 Oct 2026',
                due: '24 Oct 2026',
                title: 'Light - Reflection and Spherical Mirrors Ray Diagrams',
                instructions: 'Draw ray diagrams for concave mirror object positions: at infinity, beyond C, at C, between C and F.',
                submittedCount: '36 / 38',
              },
              {
                subject: 'English Language',
                teacher: 'Priyanka Sen',
                assigned: '21 Oct 2026',
                due: '24 Oct 2026',
                title: 'Analytical Paragraph Writing on Sustainable Living',
                instructions: 'Word count: 120-150 words. Focus on renewable energy adoption data provided in chapter.',
                submittedCount: '38 / 38 (All Done)',
              },
            ].map((hw, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{hw.subject}</span>
                    <span className="text-xs text-gray-500">· {hw.teacher}</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Submissions: {hw.submittedCount}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-gray-800">{hw.title}</h4>
                <p className="text-xs text-gray-600">{hw.instructions}</p>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-[11px] text-gray-400 font-mono">
                  <span>Assigned: {hw.assigned}</span>
                  <span className="text-rose-600 font-semibold">Due: {hw.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: TIME TABLE */}
      {activeTab === 'timetable' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">
              Weekly Master Timetable ({selectedClass})
            </h3>
            <span className="text-xs text-gray-500">8 Periods Daily · 40 Mins Each</span>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 text-gray-800 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2.5">Day</th>
                  <th className="px-3 py-2.5">P1 (08:30)</th>
                  <th className="px-3 py-2.5">P2 (09:15)</th>
                  <th className="px-3 py-2.5">P3 (10:00)</th>
                  <th className="px-3 py-2.5">Break</th>
                  <th className="px-3 py-2.5">P4 (11:00)</th>
                  <th className="px-3 py-2.5">P5 (11:45)</th>
                  <th className="px-3 py-2.5">P6 (12:30)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {[
                  { day: 'Monday', p1: 'Math', p2: 'Physics', p3: 'English', p4: 'Chemistry', p5: 'Social Sci', p6: 'Computer' },
                  { day: 'Tuesday', p1: 'English', p2: 'Math', p3: 'Biology', p4: 'Physics Lab', p5: 'Physics Lab', p6: 'Hindi' },
                  { day: 'Wednesday', p1: 'Social Sci', p2: 'Hindi', p3: 'Math', p4: 'Chemistry', p5: 'Sports / PE', p6: 'Sports / PE' },
                  { day: 'Thursday', p1: 'Math', p2: 'Physics', p3: 'Biology Lab', p4: 'Biology Lab', p5: 'English', p6: 'Social Sci' },
                  { day: 'Friday', p1: 'Computer', p2: 'Computer', p3: 'Math', p4: 'Social Sci', p5: 'Library', p6: 'Art / Music' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50/70">
                    <td className="px-3 py-3 font-bold text-gray-900 bg-gray-50/70">{row.day}</td>
                    <td className="px-3 py-3 text-blue-700">{row.p1}</td>
                    <td className="px-3 py-3 text-purple-700">{row.p2}</td>
                    <td className="px-3 py-3 text-emerald-700">{row.p3}</td>
                    <td className="px-3 py-3 text-gray-400 bg-gray-50 text-[10px] uppercase font-bold text-center">
                      Recess
                    </td>
                    <td className="px-3 py-3 text-amber-700">{row.p4}</td>
                    <td className="px-3 py-3 text-indigo-700">{row.p5}</td>
                    <td className="px-3 py-3 text-teal-700">{row.p6}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: EXAMS DATE SHEET */}
      {activeTab === 'exams' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">
            CBSE Term-1 Mid-Term Examination Date Sheet (November 2026)
          </h3>
          <div className="border border-gray-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Date & Day</th>
                  <th className="px-4 py-3">Timing</th>
                  <th className="px-4 py-3">Subject Code & Paper</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3 text-right">Hall Ticket Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { date: '10 Nov 2026 (Tuesday)', time: '09:00 AM - 12:00 PM', paper: '041 - Mathematics Standard / Basic', grade: 'Class 10', status: 'Ready to Print' },
                  { date: '12 Nov 2026 (Thursday)', time: '09:00 AM - 12:00 PM', paper: '086 - Science (Physics, Chem, Bio)', grade: 'Class 10', status: 'Ready to Print' },
                  { date: '16 Nov 2026 (Monday)', time: '09:00 AM - 12:00 PM', paper: '087 - Social Science', grade: 'Class 10', status: 'Ready to Print' },
                  { date: '18 Nov 2026 (Wednesday)', time: '09:00 AM - 12:00 PM', paper: '184 - English Language & Literature', grade: 'Class 10', status: 'Ready to Print' },
                ].map((ex, i) => (
                  <tr key={i} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3 font-bold text-gray-900">{ex.date}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{ex.time}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{ex.paper}</td>
                    <td className="px-4 py-3 text-gray-600">{ex.grade}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700">
                        {ex.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: LIVE CLASSES */}
      {activeTab === 'live' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Hybrid & Live Virtual Classrooms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-emerald-200 bg-emerald-50/30 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded">
                  Live Now
                </span>
                <span className="text-xs font-mono text-gray-500">Google Meet</span>
              </div>
              <h4 className="font-bold text-sm text-gray-900">
                Class 12 - Quantum Mechanics & Dual Nature of Matter
              </h4>
              <p className="text-xs text-gray-600">Instructor: Rajeshwari Prasad · 41 Students Joined</p>
              <button
                onClick={() => alert('Joining simulated live classroom session')}
                className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Join Classroom</span>
              </button>
            </div>

            <div className="p-4 border border-gray-200 bg-gray-50/50 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-gray-600 uppercase bg-gray-200 px-2 py-0.5 rounded">
                  Scheduled Today, 03:30 PM
                </span>
                <span className="text-xs font-mono text-gray-500">Zoom Classroom</span>
              </div>
              <h4 className="font-bold text-sm text-gray-900">
                Class 10 - Quadratic Equations Problem Solving Workshop
              </h4>
              <p className="text-xs text-gray-600">Instructor: Malini Swaminathan · Doubt Clearing</p>
              <button
                onClick={() => alert('Reminder set for live class')}
                className="mt-2 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg"
              >
                View Agenda & Materials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW: LMS COURSES */}
      {activeTab === 'lms' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">CBSE Digital Learning Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Class 10 Mathematics Mastercourse', units: '14 Chapters · 86 Video Lectures', progress: '78% Complete' },
              { title: 'Class 10 Science Interactive Lab', units: '16 Practical Simulations · 42 Worksheets', progress: '85% Complete' },
              { title: 'CBSE English Literature & Grammar', units: '24 Modules · Audio Comprehensions', progress: '92% Complete' },
            ].map((c, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-2">
                <h4 className="font-bold text-xs text-gray-900">{c.title}</h4>
                <p className="text-[11px] text-gray-500">{c.units}</p>
                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div className="bg-[#e91e63] h-full" style={{ width: c.progress }} />
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 font-mono pt-1">
                  <span>Syllabus Covered</span>
                  <span className="font-bold text-[#e91e63]">{c.progress}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
