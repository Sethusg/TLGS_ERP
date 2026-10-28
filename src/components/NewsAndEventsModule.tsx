import React, { useState } from 'react';
import { Newspaper, Plus, Edit, Trash2, Search, Calendar, Bell, Sparkles } from 'lucide-react';
import { NewsItem } from '../types';

interface NewsAndEventsModuleProps {
  newsItems: NewsItem[];
  onAddNews: (item: Omit<NewsItem, 'id'>) => void;
  onUpdateNews: (item: NewsItem) => void;
  onDeleteNews: (id: string) => void;
}

export const NewsAndEventsModule: React.FC<NewsAndEventsModuleProps> = ({
  newsItems,
  onAddNews,
  onUpdateNews,
  onDeleteNews,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Academic Achievement');
  const [summary, setSummary] = useState('');
  const [dateStr, setDateStr] = useState('24 Oct 2026');

  const categories = ['All', 'Sports Excellence', 'STEM Innovation', 'Academic Achievement', 'Cultural Fest', 'Principal Desk'];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setTitle('');
    setCategory('Academic Achievement');
    setSummary('');
    setDateStr(new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }));
    setShowModal(true);
  };

  const handleOpenEdit = (item: NewsItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setCategory(item.category);
    setSummary(item.summary);
    setDateStr(item.date);
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    if (editingItem) {
      onUpdateNews({
        ...editingItem,
        title,
        category,
        summary,
        date: dateStr,
      });
    } else {
      onAddNews({
        title,
        category,
        summary,
        date: dateStr,
      });
    }
    setShowModal(false);
  };

  const filteredNews = newsItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <Newspaper className="w-6 h-6 text-indigo-600" />
            <span>Campus News & Events Management</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Create, edit, and broadcast official school announcements, achievements, and events.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Announcement</span>
        </button>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search news headline, summary..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* News Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNews.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  {item.category}
                </span>
                <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </div>

              <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h3>

              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                {item.summary}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[10px] font-medium text-gray-400">ID: {item.id}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  title="Edit Article"
                >
                  <Edit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this news article?')) {
                      onDeleteNews(item.id);
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-rose-600 bg-gray-50 hover:bg-rose-50 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  title="Delete Article"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
          <Bell className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">No announcements found</h3>
          <p className="text-xs text-gray-500 mt-1">Try searching with different keywords or category filter.</p>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-gray-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>{editingItem ? 'Edit News & Announcement' : 'Publish New Announcement'}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Annual Science Exhibition Winners Announced"
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none"
                  >
                    <option value="Sports Excellence">Sports Excellence</option>
                    <option value="STEM Innovation">STEM Innovation</option>
                    <option value="Academic Achievement">Academic Achievement</option>
                    <option value="Cultural Fest">Cultural Fest</option>
                    <option value="Principal Desk">Principal Desk</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Display Date</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    placeholder="e.g. 24 Oct 2026"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Summary / Detailed Content *</label>
                <textarea
                  rows={4}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Write the announcement description..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:border-indigo-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
