import React, { useState } from 'react';
import {
  Mail,
  Send,
  FileText,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  Edit,
  Search,
  Clock,
  Sparkles,
  Shield,
  Layers,
  MessageSquare,
  AlertCircle,
  X,
} from 'lucide-react';
import { SchoolClass, Student, Staff, CommunicationTemplate, CommunicationMessage } from '../types';

interface CommunicationsModuleProps {
  initialSubItem?: string;
  classes: SchoolClass[];
  students: Student[];
  staffList: Staff[];
}

const INITIAL_TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Monthly Fee Due Reminder',
    category: 'Fee Reminder',
    subject: 'Urgent: Pending School Fee Dues for Academic Term 2026',
    body: 'Dear Parent, This is a reminder that the tuition and transport fee dues for your ward are pending. Kindly clear the dues before the end of this month to avoid late penalties.',
  },
  {
    id: 'tpl-2',
    title: 'Mid-Term Exam Schedule Notice',
    category: 'Exam Notice',
    subject: 'CBSE Mid-Term Assessment Schedule & Guidelines 2026',
    body: 'Dear Students and Parents, The Mid-Term assessments commence from next month. Please check the portal for subject-wise datesheets and reporting times.',
  },
  {
    id: 'tpl-3',
    title: 'Parent-Teacher Meeting (PTM) Invitation',
    category: 'PTM Invite',
    subject: 'Invitation: Parent-Teacher Interaction & Progress Report Discussion',
    body: 'Dear Parents, You are cordially invited to attend the interactive PTM this Saturday between 09:00 AM and 01:00 PM to discuss student academic progress.',
  },
  {
    id: 'tpl-4',
    title: 'National Holiday Circular',
    category: 'General Circular',
    subject: 'Holiday Declaration: Observance of National Festival',
    body: 'Please note that the institution will remain closed on the upcoming Friday in observance of the national holiday. Regular classes resume on Monday.',
  },
];

const INITIAL_MESSAGES: CommunicationMessage[] = [
  {
    id: 'msg-1',
    timestamp: '24 Oct 2026, 10:30 AM',
    senderName: 'Dr. Sethu Ramanathan (Principal)',
    channel: 'Email',
    targetGroup: 'Class 10-A (Parents)',
    subject: 'CBSE Board Exam Preparation Guidelines',
    body: 'Dear parents, special remedial classes for Class 10 board students commence this Monday.',
    recipientCount: 42,
    status: 'Delivered',
  },
  {
    id: 'msg-2',
    timestamp: '23 Oct 2026, 02:15 PM',
    senderName: 'Accountant (Mr. Sridhar)',
    channel: 'SMS',
    targetGroup: 'All Pending Fee Defaulters',
    subject: 'Fee Dues Reminder',
    body: 'Kindly pay your quarterly school dues immediately.',
    recipientCount: 18,
    status: 'Delivered',
  },
  {
    id: 'msg-3',
    timestamp: '22 Oct 2026, 09:00 AM',
    senderName: 'HR Department',
    channel: 'Internal Notification',
    targetGroup: 'All Teachers',
    subject: 'Monthly Staff Meeting',
    body: 'Staff meeting scheduled in the conference hall at 03:30 PM today.',
    recipientCount: 55,
    status: 'Delivered',
  },
];

export const CommunicationsModule: React.FC<CommunicationsModuleProps> = ({
  initialSubItem = 'comm-broadcast',
  classes,
  students,
  staffList,
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'templates' | 'history'>(
    initialSubItem === 'comm-templates'
      ? 'templates'
      : initialSubItem === 'comm-history'
      ? 'history'
      : 'broadcast'
  );

  const [templates, setTemplates] = useState<CommunicationTemplate[]>(INITIAL_TEMPLATES);
  const [messages, setMessages] = useState<CommunicationMessage[]>(INITIAL_MESSAGES);
  const [toast, setToast] = useState<string | null>(null);

  // Composer Form State
  const [channel, setChannel] = useState<'Email' | 'SMS' | 'Internal Notification' | 'WhatsApp'>('Email');
  const [targetGroup, setTargetGroup] = useState('All Parents');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  // Template Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CommunicationTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    category: 'General Circular' as CommunicationTemplate['category'],
    subject: '',
    body: '',
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleApplyTemplate = (tpl: CommunicationTemplate) => {
    setSubject(tpl.subject);
    setBody(tpl.body);
    showToast(`Template "${tpl.title}" loaded into composer.`);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      alert('Please enter both subject and message body.');
      return;
    }

    let estimatedCount = 120;
    if (targetGroup.includes('Class')) estimatedCount = 40;
    else if (targetGroup.includes('Teachers')) estimatedCount = 55;
    else if (targetGroup.includes('Students')) estimatedCount = 450;

    const newMessage: CommunicationMessage = {
      id: `msg-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      senderName: 'Dr. Sethu Ramanathan (Administrator)',
      channel,
      targetGroup,
      subject,
      body,
      recipientCount: estimatedCount,
      status: 'Delivered',
    };

    setMessages((prev) => [newMessage, ...prev]);
    showToast(`Successfully broadcasted ${channel} to ${targetGroup} (${estimatedCount} recipients)!`);
    setSubject('');
    setBody('');
    setActiveTab('history');
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingTemplate.id ? { ...t, ...templateForm } : t))
      );
      showToast(`Template "${templateForm.title}" updated.`);
    } else {
      const newTpl: CommunicationTemplate = {
        id: `tpl-${Date.now()}`,
        ...templateForm,
      };
      setTemplates((prev) => [newTpl, ...prev]);
      showToast(`Template "${templateForm.title}" created.`);
    }
    setIsTemplateModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-indigo-600" />
            <span>Communications & Bulk Messaging Hub</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Send bulk emails, SMS, WhatsApp, and internal notifications to students, parents, or staff with template management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-3 py-1.5 rounded-xl text-xs font-bold">
            Total Broadcasts: {messages.length}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-xs border border-gray-100">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'broadcast' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Compose & Broadcast</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'templates' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Template Management ({templates.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'history' ? 'bg-indigo-600 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Sent History Log</span>
        </button>
      </div>

      {/* TAB 1: COMPOSE & BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Composer (2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              <span>New Bulk Broadcast Composer</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Communication Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white font-semibold"
                  >
                    <option value="Email">Email (Rich HTML Broadcast)</option>
                    <option value="SMS">SMS (Gateway API)</option>
                    <option value="Internal Notification">Internal App Notification</option>
                    <option value="WhatsApp">WhatsApp Business API</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Target Recipient Group</label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white font-semibold"
                  >
                    <optgroup label="General Groups">
                      <option value="All Parents">All Parents (Registered)</option>
                      <option value="All Students">All Students (Active)</option>
                      <option value="All Teachers">All Teachers & Faculty</option>
                      <option value="All Staff">All Institutional Staff</option>
                    </optgroup>
                    <optgroup label="Class & Section Groups">
                      {classes.map((c) =>
                        c.sections.map((s) => (
                          <option key={`${c.id}-${s}`} value={`Class ${c.gradeName}-${s} (Parents & Students)`}>
                            Class {c.gradeName} - Section {s}
                          </option>
                        ))
                      )}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Subject / Notification Title</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Important Notice Regarding Upcoming Annual Sports Meet"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700">Message Body Content</label>
                  <span className="text-[11px] text-gray-400">Supports Markdown & variables</span>
                </div>
                <textarea
                  rows={7}
                  required
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-gray-500 text-[11px]">
                  Estimated Recipients: <strong className="text-gray-900">~120 Users</strong>
                </span>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Broadcast Now</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Template Quick Picker */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Quick Template Selector</span>
            </h3>
            <p className="text-xs text-gray-500">Click any template below to load its content directly into the composer.</p>

            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleApplyTemplate(tpl)}
                  className="p-3.5 bg-gray-50 hover:bg-indigo-50/50 border border-gray-200 hover:border-indigo-200 rounded-xl transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900 text-xs">{tpl.title}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-2">{tpl.subject}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPLATE MANAGEMENT */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Institutional Message Templates</h3>
              <p className="text-xs text-gray-500">Create, edit, and organize reusable broadcast templates.</p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ title: '', category: 'General Circular', subject: '', body: '' });
                setIsTemplateModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="border border-gray-200 rounded-2xl p-5 space-y-3 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-800 text-[10px] font-bold rounded-full border border-indigo-200">
                      {t.category}
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm mt-1.5">{t.title}</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingTemplate(t);
                        setTemplateForm({ title: t.title, category: t.category, subject: t.subject, body: t.body });
                        setIsTemplateModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                      title="Edit Template"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete template "${t.title}"?`)) {
                          setTemplates((prev) => prev.filter((item) => item.id !== t.id));
                          showToast(`Template "${t.title}" deleted.`);
                        }
                      }}
                      className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-gray-800">Subject: {t.subject}</div>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px]">
                    {t.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SENT HISTORY LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Broadcast History & Delivery Log</h3>
              <p className="text-xs text-gray-500">Inspect past communications, recipient reach, and delivery status.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100/70 text-gray-700 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Channel & Sender</th>
                  <th className="px-4 py-3">Target Group</th>
                  <th className="px-4 py-3">Subject & Message Preview</th>
                  <th className="px-4 py-3 text-center">Recipients</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-500 whitespace-nowrap">{msg.timestamp}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 block">{msg.channel}</span>
                      <span className="text-[10px] text-gray-400">{msg.senderName}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-indigo-700">{msg.targetGroup}</td>
                    <td className="px-4 py-3 max-w-sm">
                      <div className="font-bold text-gray-900">{msg.subject}</div>
                      <div className="text-gray-500 text-[11px] truncate mt-0.5">{msg.body}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-gray-800">{msg.recipientCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-[10px]">
                        {msg.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">
                {editingTemplate ? 'Edit Communication Template' : 'Create New Template'}
              </h3>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Template Title</label>
                  <input
                    type="text"
                    required
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                    placeholder="e.g. Fee Reminder"
                  />
                </div>
                <div>
                  <label className="font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none bg-white font-semibold"
                  >
                    <option value="Fee Reminder">Fee Reminder</option>
                    <option value="Exam Notice">Exam Notice</option>
                    <option value="General Circular">General Circular</option>
                    <option value="PTM Invite">PTM Invite</option>
                    <option value="Emergency Alert">Emergency Alert</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Default Subject</label>
                <input
                  type="text"
                  required
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none"
                  placeholder="Subject line..."
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Template Body</label>
                <textarea
                  rows={5}
                  required
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none font-sans"
                  placeholder="Message body content..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm"
                >
                  {editingTemplate ? 'Save Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
