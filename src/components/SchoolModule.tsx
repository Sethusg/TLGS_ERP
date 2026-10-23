import React, { useState } from 'react';
import {
  Building2,
  Calendar as CalendarIcon,
  BookOpen,
  FileText,
  Plus,
  Download,
  Search,
  BookMarked,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { Circular, LibraryBook } from '../types';

interface SchoolModuleProps {
  circulars: Circular[];
  libraryBooks: LibraryBook[];
  subItem?: string;
  onAddCircular: (circ: Omit<Circular, 'id'>) => void;
  onIssueBook: (bookId: string) => void;
}

export const SchoolModule: React.FC<SchoolModuleProps> = ({
  circulars,
  libraryBooks,
  subItem = 'school-calendar',
  onAddCircular,
  onIssueBook,
}) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'circulars' | 'library' | 'news'>(() => {
    if (subItem === 'school-circulars') return 'circulars';
    if (subItem === 'school-library') return 'library';
    if (subItem === 'school-news' || subItem === 'school-events') return 'news';
    return 'calendar';
  });

  // Circular publisher form
  const [showAddCircular, setShowAddCircular] = useState(false);
  const [circTitle, setCircTitle] = useState('');
  const [circCategory, setCircCategory] = useState<Circular['category']>('Academic');
  const [circAudience, setCircAudience] = useState<Circular['targetAudience']>('All Parents');
  const [circSummary, setCircSummary] = useState('');

  const [bookSearch, setBookSearch] = useState('');

  const handlePublishCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circTitle || !circSummary) return;

    onAddCircular({
      referenceNo: `TLA/CIR/2026-27/0${Math.floor(90 + Math.random() * 90)}`,
      title: circTitle,
      date: '2026-10-23',
      targetAudience: circAudience,
      category: circCategory,
      summary: circSummary,
      attachmentName: `${circTitle.replace(/\s+/g, '_').slice(0, 20)}.pdf`,
    });

    setCircTitle('');
    setCircSummary('');
    setShowAddCircular(false);
  };

  const filteredBooks = libraryBooks.filter(
    (b) =>
      b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.author.toLowerCase().includes(bookSearch.toLowerCase()) ||
      b.category.toLowerCase().includes(bookSearch.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-600" />
            <span>School Institutional Hub & Resources</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Official Notices · Academic Calendar · Central Library Catalog · Campus Events
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'calendar' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Academic Calendar
          </button>
          <button
            onClick={() => setActiveTab('circulars')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'circulars' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Circulars & Notices</span>
            <span className="w-4 h-4 rounded-full bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center">
              {circulars.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'library' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Library Catalog
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'news' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            News & Events
          </button>
        </div>
      </div>

      {/* VIEW: ACADEMIC CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Academic Year Schedule 2026 - 2027</h3>
              <p className="text-xs text-gray-500">Scheduled examinations, events, and board milestones</p>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md">
              Current Term: Term 1 (Autumn)
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                date: '23 OCT 2026 (TODAY)',
                title: 'Inter-House Science Exhibition & Robotics Fair',
                desc: 'Senior student project presentations in Physics & Computer Labs.',
                badge: 'Happening Today',
                color: 'border-pink-200 bg-pink-50/40 text-pink-700',
              },
              {
                date: '10 NOV 2026',
                title: 'CBSE Term-1 Mid-Term Assessments Begin',
                desc: 'Theory papers for Classes 9 to 12. Hall tickets mandatory.',
                badge: 'Exam Milestone',
                color: 'border-blue-200 bg-blue-50/40 text-blue-700',
              },
              {
                date: '27-28 NOV 2026',
                title: 'Annual Inter-School Cultural Fest "SPECTRUM 2026"',
                desc: 'Hosting 42 schools across Karnataka in arts, debate, and music.',
                badge: 'Major Campus Event',
                color: 'border-amber-200 bg-amber-50/40 text-amber-700',
              },
              {
                date: '24 DEC 2026 - 02 JAN 2027',
                title: 'Winter Vacation & Term Break',
                desc: 'Campus reopens on 03 January 2027 for Term-2 classes.',
                badge: 'Vacation',
                color: 'border-emerald-200 bg-emerald-50/40 text-emerald-700',
              },
              {
                date: '15 JAN 2027',
                title: 'CBSE Class 10 & 12 Board Practical Examinations',
                desc: 'External examiners appointed by CBSE regional office.',
                badge: 'Statutory Board Exam',
                color: 'border-purple-200 bg-purple-50/40 text-purple-700',
              },
              {
                date: '26 JAN 2027',
                title: '78th Republic Day Parade & Flag Hoisting',
                desc: 'NCC cadets & school brass band guard of honor at 08:00 AM.',
                badge: 'National Holiday',
                color: 'border-orange-200 bg-orange-50/40 text-orange-700',
              },
            ].map((ev, idx) => (
              <div key={idx} className={`p-4 border rounded-xl ${ev.color} space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold">{ev.date}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white shadow-2xs">
                    {ev.badge}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">{ev.title}</h4>
                <p className="text-xs text-gray-600">{ev.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CIRCULARS */}
      {activeTab === 'circulars' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Official Circulars & Notices</h3>
              <p className="text-xs text-gray-500">Broadcast official school communications</p>
            </div>
            <button
              onClick={() => setShowAddCircular(true)}
              className="px-3.5 py-2 bg-[#e91e63] hover:bg-[#d81b60] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish New Circular</span>
            </button>
          </div>

          <div className="space-y-3">
            {circulars.map((circ) => (
              <div
                key={circ.id}
                className="p-4 border border-gray-200 rounded-xl hover:border-gray-300 transition-colors bg-white flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-500">{circ.referenceNo}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {circ.category}
                    </span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      Audience: {circ.targetAudience}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">{circ.title}</h4>
                  <p className="text-xs text-gray-600 max-w-3xl">{circ.summary}</p>
                  <span className="text-[11px] text-gray-400 font-mono block">Published: {circ.date}</span>
                </div>

                {circ.attachmentName && (
                  <button
                    onClick={() => alert(`Simulated download of ${circ.attachmentName}`)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-pink-600" />
                    <span>{circ.attachmentName}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Circular Modal */}
          {showAddCircular && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200">
                <h3 className="text-base font-bold text-gray-900">Publish New Official Circular</h3>
                <form onSubmit={handlePublishCircular} className="mt-4 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Circular Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={circTitle}
                      onChange={(e) => setCircTitle(e.target.value)}
                      placeholder="e.g. Science Fair Registration Deadline"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:border-[#e91e63] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                      <select
                        value={circCategory}
                        onChange={(e) => setCircCategory(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none"
                      >
                        <option value="Academic">Academic</option>
                        <option value="Exam">Exam Schedule</option>
                        <option value="Holiday">Holiday Notice</option>
                        <option value="Event">Event / Fest</option>
                        <option value="Administrative">Administrative</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Audience</label>
                      <select
                        value={circAudience}
                        onChange={(e) => setCircAudience(e.target.value as any)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none"
                      >
                        <option value="All Parents">All Parents</option>
                        <option value="Class 10 & 12">Class 10 & 12 Only</option>
                        <option value="Staff">Faculty & Staff</option>
                        <option value="All Students">All Students</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Notice Body / Summary *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={circSummary}
                      onChange={(e) => setCircSummary(e.target.value)}
                      placeholder="Write the detailed circular announcement..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-md focus:border-[#e91e63] focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowAddCircular(false)}
                      className="px-3.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-md"
                    >
                      Publish Circular
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: LIBRARY CATALOG */}
      {activeTab === 'library' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={bookSearch}
                onChange={(e) => setBookSearch(e.target.value)}
                placeholder="Search by title, author, category..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="text-xs text-gray-500">
              Central Library: <strong>14,800+ Volumes</strong>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">ISBN / Barcode</th>
                  <th className="px-4 py-3">Book Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Shelf Location</th>
                  <th className="px-4 py-3 text-center">Availability</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBooks.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono text-gray-600">{b.isbn}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">{b.title}</td>
                    <td className="px-4 py-3 text-gray-700">{b.author}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium text-[10px]">
                        {b.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{b.locationRack}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-gray-900 tabular-nums">{b.availableCopies}</span>
                      <span className="text-gray-400"> / {b.totalCopies}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onIssueBook(b.id)}
                        disabled={b.availableCopies <= 0}
                        className={`px-2.5 py-1 text-xs font-semibold rounded ${
                          b.availableCopies > 0
                            ? 'text-indigo-600 hover:bg-indigo-50'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Issue Book ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: NEWS & EVENTS */}
      {activeTab === 'news' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Campus News & Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-pink-600 uppercase">Sports Excellence</span>
              <h4 className="font-bold text-sm text-gray-900">
                Learner&apos;s Academy U-16 Football Squad Wins District Championship
              </h4>
              <p className="text-xs text-gray-600">
                Our squad scored 3-1 against Greenwood High in the final match held at Kanteerava Stadium.
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl space-y-2">
              <span className="text-[10px] font-bold text-indigo-600 uppercase">STEM Innovation</span>
              <h4 className="font-bold text-sm text-gray-900">
                Atal Tinkering Lab Robotics Team Qualifies for National AI Olympiad
              </h4>
              <p className="text-xs text-gray-600">
                Grade 10 students presented an automated agricultural soil moisture probe and won 1st prize.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
