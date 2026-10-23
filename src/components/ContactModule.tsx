import React, { useState } from 'react';
import {
  Mail,
  Send,
  MessageSquare,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Phone,
  FileText,
} from 'lucide-react';

interface ContactModuleProps {
  subItem?: string;
}

export const ContactModule: React.FC<ContactModuleProps> = ({
  subItem = 'contact-messaging',
}) => {
  const [activeTab, setActiveTab] = useState<'messaging' | 'parents-notes' | 'quick-sms'>(() => {
    if (subItem === 'contact-parents-notes') return 'parents-notes';
    return 'messaging';
  });

  // Quick SMS State
  const [smsAudience, setSmsAudience] = useState('All Parents (1,069 Recipients)');
  const [smsTemplate, setSmsTemplate] = useState('Custom');
  const [smsContent, setSmsContent] = useState(
    'Dear Parents, please be informed that Mid-Term examinations for Classes 9 to 12 will commence from 10 November 2026. Hall tickets available on EduNiv portal. - Principal, TLAC'
  );
  const [smsSentNotice, setSmsSentNotice] = useState(false);

  // Messages log
  const [messages, setMessages] = useState([
    {
      id: 'msg-1',
      sender: 'Dr. Sethu Ramanathan (Principal)',
      recipient: 'All Faculty & Staff',
      time: 'Today, 08:30 AM',
      text: 'Good morning colleagues. Please ensure syllabus completion reports for Term-1 are submitted to the exam cell by Friday 4 PM.',
    },
    {
      id: 'msg-2',
      sender: 'Malini Swaminathan (Vice Principal)',
      recipient: 'Science Department',
      time: 'Yesterday, 03:15 PM',
      text: 'Robotics Fair displays setup completed in the Senior Science wing. Students from Grades 8-10 will visit between 10 AM to 1 PM.',
    },
    {
      id: 'msg-3',
      sender: 'Ramesh Babu (Transport Manager)',
      recipient: 'Administrative Office',
      time: 'Yesterday, 07:45 AM',
      text: 'Route 3 and Route 4 buses successfully completed morning trip. All CCTV feeds active.',
    },
  ]);

  const [newMessageText, setNewMessageText] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText) return;
    setMessages([
      {
        id: `msg-${Date.now()}`,
        sender: 'Dr. Sethu Ramanathan (Admin)',
        recipient: 'Staff & Department Channel',
        time: 'Just now',
        text: newMessageText,
      },
      ...messages,
    ]);
    setNewMessageText('');
  };

  const handleSendSMS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsContent) return;
    setSmsSentNotice(true);
    setTimeout(() => setSmsSentNotice(false), 5000);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Tabs */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#e91e63]" />
            <span>Communications, Messaging & Parent Notification Center</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Bulk SMS Gateway · Parent Observation Logs · Internal Staff Messaging
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('messaging')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'messaging' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Staff Messaging
          </button>
          <button
            onClick={() => setActiveTab('parents-notes')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'parents-notes' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Parents Notes
          </button>
          <button
            onClick={() => setActiveTab('quick-sms')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'quick-sms' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Quick SMS Broadcast</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </button>
        </div>
      </div>

      {/* VIEW: STAFF MESSAGING */}
      {activeTab === 'messaging' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-5">
          <form onSubmit={handleSendMessage} className="space-y-2">
            <label className="text-xs font-bold text-gray-800 block">
              Broadcast Message to Faculty & Department Leads
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type internal announcement or notice to staff..."
                className="flex-1 px-3.5 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#e91e63] hover:bg-[#d81b60] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Message</span>
              </button>
            </div>
          </form>

          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Department Communications Stream
            </h4>
            {messages.map((m) => (
              <div key={m.id} className="p-4 bg-gray-50/70 rounded-xl border border-gray-200/80 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900">{m.sender}</span>
                  <span className="text-gray-400 font-mono text-[11px]">{m.time}</span>
                </div>
                <div className="text-[11px] font-medium text-indigo-700">To: {m.recipient}</div>
                <p className="text-xs text-gray-700 mt-1">{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: QUICK SMS BROADCAST */}
      {activeTab === 'quick-sms' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 max-w-2xl mx-auto space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">SMS & WhatsApp Parent Gateway</h3>
            <p className="text-xs text-gray-500">
              Integrated with DLT-registered CBSE school templates (Transactional SMS)
            </p>
          </div>

          {smsSentNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>SMS blast queued successfully! 1,069 recipient delivery tickets initiated.</span>
            </div>
          )}

          <form onSubmit={handleSendSMS} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Recipient Audience *
              </label>
              <select
                value={smsAudience}
                onChange={(e) => setSmsAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none"
              >
                <option>All Parents (1,069 Recipients)</option>
                <option>Class 10 & 12 Board Batches (228 Parents)</option>
                <option>Primary Section Parents (Classes 1 - 5)</option>
                <option>Transport Bus Pass Holders (782 Parents)</option>
                <option>Fee Dues Defaulters List</option>
                <option>All Teaching & Support Staff (120 Numbers)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Select SMS Template (DLT Approved)
              </label>
              <select
                value={smsTemplate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSmsTemplate(val);
                  if (val === 'Exam') {
                    setSmsContent(
                      'Dear Parents, Mid-Term assessments start from 10 Nov 2026. Hall tickets available on EduNiv portal. Ensure clear fee dues. - Principal, TLAC'
                    );
                  } else if (val === 'Emergency') {
                    setSmsContent(
                      'Dear Parents, due to local advisory, school buses will depart 30 minutes early today. Live GPS available on EduNiv app. - TLAC Admin'
                    );
                  } else if (val === 'Fee') {
                    setSmsContent(
                      'Dear Parents, this is a gentle reminder to clear Term-1 fee dues for your ward by 30 October to avoid late fine. - Accounts, TLAC'
                    );
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
              >
                <option value="Custom">Custom Message</option>
                <option value="Exam">Exam Announcement & Hall Ticket</option>
                <option value="Emergency">Emergency Weather / Transport Advisory</option>
                <option value="Fee">Fee Payment Reminder</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">Message Content *</label>
                <span className="text-[11px] font-mono text-gray-400">
                  {smsContent.length} chars (
                  {Math.ceil(smsContent.length / 160)} SMS Credits)
                </span>
              </div>
              <textarea
                rows={4}
                required
                value={smsContent}
                onChange={(e) => setSmsContent(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-[#e91e63] focus:outline-none font-mono"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-500">
                Gateway Provider: <strong>BSNL / Airtel Enterprise SMS Gateway</strong>
              </span>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-[#e91e63] hover:bg-[#d81b60] rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast SMS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* VIEW: PARENTS NOTES */}
      {activeTab === 'parents-notes' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Teacher-to-Parent Communication Logs</h3>
          <div className="space-y-3">
            {[
              {
                student: 'Aarav Sharma (Class 10-A)',
                parent: 'Rajesh Sharma',
                teacher: 'Malini Swaminathan (Math PGT)',
                date: '21 Oct 2026',
                note: 'Aarav has shown remarkable progress in Coordinate Geometry. Recommended for CBSE Olympiad coaching.',
              },
              {
                student: 'Diya Patel (Class 9-C)',
                parent: 'Prakash Patel',
                teacher: 'Sunil Kumar V (Social Science)',
                date: '19 Oct 2026',
                note: 'Requested parent meeting regarding project file submission on National Movement history.',
              },
            ].map((p, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50/50 space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-900">{p.student}</span>
                  <span className="text-gray-400 font-mono text-[11px]">{p.date}</span>
                </div>
                <div className="text-[11px] text-gray-600">
                  Parent: <strong>{p.parent}</strong> · Written by: <strong>{p.teacher}</strong>
                </div>
                <p className="text-xs text-gray-700 mt-1 italic">&quot;{p.note}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
