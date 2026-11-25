import React, { useState, useEffect } from 'react';
import {
  Library,
  BookOpen,
  Users,
  AlertTriangle,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { LibraryBook } from '../types';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  EnterpriseFormModal,
  TableColumn,
} from './Common/EnterpriseUI';

interface LibraryManagementModuleProps {
  subItem?: string;
  libraryBooks: LibraryBook[];
  contextLabel: string;
  onIssueBook: (bookId: string) => void;
  onAddBook: (book: Omit<LibraryBook, 'id'>) => void;
}

const SAMPLE_CIRCULATION = [
  { id: 'cir-1', member: 'Aarav Subramanian (10-A)', book: 'Concepts of Physics Vol. 1', issueDate: '2026-10-12', dueDate: '2026-10-26', fine: 0, status: 'Issued' },
  { id: 'cir-2', member: 'Diya Krishnan (10-A)', book: 'Organic Chemistry Reference', issueDate: '2026-10-05', dueDate: '2026-10-19', fine: 40, status: 'Overdue' },
  { id: 'cir-3', member: 'Prof. Malini Sundaram', book: 'Higher Engineering Mathematics', issueDate: '2026-10-15', dueDate: '2026-11-15', fine: 0, status: 'Issued' },
  { id: 'cir-4', member: 'Rohan Iyer (9-B)', book: 'World History Compendium', issueDate: '2026-10-02', dueDate: '2026-10-16', fine: 70, status: 'Overdue' },
];

export const LibraryManagementModule: React.FC<LibraryManagementModuleProps> = ({
  subItem,
  libraryBooks,
  contextLabel,
  onIssueBook,
  onAddBook,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'lib-catalog');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState('Science');
  const [rack, setRack] = useState('Rack A-04');
  const [copies, setCopies] = useState('5');
  const [issuedToast, setIssuedToast] = useState<string | null>(null);

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const totalVolumes = libraryBooks.reduce((a, b) => a + b.totalCopies, 0);
  const availableVolumes = libraryBooks.reduce((a, b) => a + b.availableCopies, 0);
  const issuedVolumes = totalVolumes - availableVolumes;

  const handleIssue = (book: LibraryBook) => {
    if (book.availableCopies <= 0) return;
    onIssueBook(book.id);
    setIssuedToast(`Issued "${book.title}"`);
    setTimeout(() => setIssuedToast(null), 2000);
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    const total = Math.max(1, Number(copies) || 1);
    onAddBook({
      isbn: isbn.trim() || `978-81-${Math.floor(100000 + Math.random() * 899999)}`,
      title: title.trim(),
      author: author.trim(),
      category,
      totalCopies: total,
      availableCopies: total,
      locationRack: rack.trim() || 'Rack A-01',
    });
    setTitle('');
    setAuthor('');
    setIsbn('');
    setIsAddModalOpen(false);
  };

  const bookColumns: TableColumn<LibraryBook>[] = [
    { key: 'isbn', header: 'ISBN', render: (b) => <span className="font-mono text-slate-500">{b.isbn}</span> },
    {
      key: 'title',
      header: 'Book Title & Author',
      sortable: true,
      sortValue: (b) => b.title,
      render: (b) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{b.title}</p>
          <p className="text-[11px] text-slate-500">
            {b.author} · {b.category}
          </p>
        </div>
      ),
    },
    { key: 'rack', header: 'Shelf', render: (b) => <span className="font-mono text-slate-600">{b.locationRack}</span> },
    {
      key: 'avail',
      header: 'Availability',
      align: 'right',
      sortable: true,
      sortValue: (b) => b.availableCopies,
      render: (b) => (
        <span className={`font-mono font-semibold ${b.availableCopies > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
          {b.availableCopies} / {b.totalCopies}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Circulation',
      align: 'right',
      render: (b) => (
        <button
          type="button"
          disabled={b.availableCopies <= 0}
          onClick={() => handleIssue(b)}
          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white disabled:opacity-40 cursor-pointer"
        >
          Issue Copy
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${contextLabel} · Central Knowledge Resource`}
        title="Library Management"
        subtitle="Manage catalog titles, issue and return workflows, member circulation cards, and overdue fine tracking."
        tabs={[
          { id: 'lib-catalog', label: 'Book Catalog' },
          { id: 'lib-circulation', label: 'Issue & Return Desk' },
          { id: 'lib-members', label: 'Library Members' },
          { id: 'lib-fines', label: 'Overdue & Fines' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Add Book Title</span>
          </button>
        }
      />

      {issuedToast && (
        <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{issuedToast} — catalog availability updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Catalog Titles"
          value={libraryBooks.length}
          detail={`${totalVolumes} total physical volumes`}
          icon={Library}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Available on Shelf"
          value={availableVolumes}
          detail="Ready for student/staff issue"
          icon={BookOpen}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Currently Issued"
          value={issuedVolumes}
          detail="Active circulation loans"
          icon={Users}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Overdue Returns"
          value={SAMPLE_CIRCULATION.filter((c) => c.status === 'Overdue').length}
          detail="₹110 accrued sample fines"
          icon={AlertTriangle}
          tone="rose"
        />
      </div>

      {activeTab === 'lib-catalog' && (
        <EnterpriseDataTable
          title="Central Library Book Catalog"
          subtitle="Click Issue Copy to decrement shelf stock in real time."
          columns={bookColumns}
          data={libraryBooks}
          rowKey={(b) => b.id}
          searchPlaceholder="Search title, author, or ISBN..."
          searchFilter={(b, q) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q)
          }
        />
      )}

      {(activeTab === 'lib-circulation' || activeTab === 'lib-fines') && (
        <EnterpriseDataTable
          title={activeTab === 'lib-fines' ? 'Overdue Books & Accrued Fines' : 'Active Issue & Return Log'}
          subtitle="Track borrower due dates and fine settlements."
          columns={[
            { key: 'member', header: 'Borrower', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.member}</span> },
            { key: 'book', header: 'Book Title', render: (r) => <span className="text-slate-700">{r.book}</span> },
            { key: 'issue', header: 'Issued On', render: (r) => <span className="font-mono text-slate-600">{r.issueDate}</span> },
            { key: 'due', header: 'Due Date', render: (r) => <span className="font-mono text-slate-600">{r.dueDate}</span> },
            {
              key: 'fine',
              header: 'Fine',
              align: 'right',
              render: (r) => <span className="font-mono font-semibold text-rose-600">₹{r.fine}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              render: (r) => (
                <span className={r.status === 'Overdue' ? 'text-rose-600 font-semibold' : 'text-emerald-700 font-semibold'}>
                  {r.status}
                </span>
              ),
            },
          ]}
          data={
            activeTab === 'lib-fines'
              ? SAMPLE_CIRCULATION.filter((c) => c.status === 'Overdue')
              : SAMPLE_CIRCULATION
          }
          rowKey={(r) => r.id}
        />
      )}

      {activeTab === 'lib-members' && (
        <EnterpriseDataTable
          title="Registered Library Card Holders"
          subtitle="Active student and faculty borrowers synced with smart ID cards."
          columns={[
            { key: 'member', header: 'Member Name', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.member}</span> },
            { key: 'book', header: 'Latest Borrowed Title', render: (r) => <span className="text-slate-600">{r.book}</span> },
            { key: 'limit', header: 'Borrow Limit', align: 'right', render: () => <span className="font-mono">3 Books</span> },
            { key: 'status', header: 'Card Status', align: 'right', render: () => <span className="text-emerald-700 font-semibold">Active</span> },
          ]}
          data={SAMPLE_CIRCULATION}
          rowKey={(r) => r.id}
        />
      )}

      <EnterpriseFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Book to Catalog"
        subtitle="Register a book title into the central library inventory"
      >
        <form onSubmit={handleCreateBook} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Book Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Algorithms"
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Author *</label>
              <input
                type="text"
                required
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Rack</label>
              <input
                type="text"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Copies</label>
              <input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Save to Catalog
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
