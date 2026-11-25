import React, { useState, useMemo } from 'react';
import {
  Database,
  Download,
  Search,
  Key,
  Link2,
  ShieldCheck,
  Code2,
  Table2,
  Copy,
  Check,
} from 'lucide-react';
import {
  MYSQL_SCHEMA_GROUPS,
  downloadMysqlSchemaSQL,
  generateMysqlSchemaDDL,
} from '../data/mysqlSchemaCatalog';

export const DatabaseArchitecturePanel: React.FC = () => {
  const [selectedGroupNum, setSelectedGroupNum] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDdlPreview, setShowDdlPreview] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const totalTables = useMemo(
    () => MYSQL_SCHEMA_GROUPS.reduce((acc, g) => acc + g.tables.length, 0),
    []
  );

  const totalColumns = useMemo(
    () =>
      MYSQL_SCHEMA_GROUPS.reduce(
        (acc, g) =>
          acc + g.tables.reduce((tAcc, t) => tAcc + t.columns.length, 0),
        0
      ),
    []
  );

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return MYSQL_SCHEMA_GROUPS;
    return MYSQL_SCHEMA_GROUPS.filter(
      (g) =>
        g.groupName.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.tables.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.columns.some((c) => c.name.toLowerCase().includes(q))
        )
    );
  }, [searchQuery]);

  const activeGroup =
    filteredGroups.find((g) => g.groupNumber === selectedGroupNum) ||
    filteredGroups[0] ||
    MYSQL_SCHEMA_GROUPS[0];

  const handleCopySql = () => {
    navigator.clipboard?.writeText(generateMysqlSchemaDDL());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Architecture Header Banner */}
      <div className="bg-[#0B1F3A] text-white rounded-xl p-5 border border-[#D4AF37]/35 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
            <Database className="w-3.5 h-3.5" />
            <span>Normalized MySQL 8.0+ Architecture · Django REST Backend Blueprint</span>
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            Multi-School Relational Database Schema ({MYSQL_SCHEMA_GROUPS.length} Groups · {totalTables} Tables)
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl">
            Every business table enforces <code className="text-[#D4AF37]">school_id</code> &amp;{' '}
            <code className="text-[#D4AF37]">campus_id</code> tenant isolation,{' '}
            <code className="text-[#D4AF37]">BIGINT UNSIGNED</code> primary keys,{' '}
            <code className="text-[#D4AF37]">DECIMAL(12,2)</code> financials, soft-delete audit columns, and{' '}
            <code className="text-[#D4AF37]">uq_student_school_year_admission</code> duplicate admission prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowDdlPreview((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{showDdlPreview ? 'Table Explorer View' : 'Preview MySQL DDL'}</span>
          </button>
          <button
            type="button"
            onClick={handleCopySql}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-colors cursor-pointer"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied SQL</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={downloadMysqlSchemaSQL}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-[#D4AF37] hover:bg-[#c59d2a] text-[#0B1F3A] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SQL</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Database Groups
          </p>
          <p className="text-xl font-bold text-[#0B1F3A] tabular-nums mt-0.5">
            {MYSQL_SCHEMA_GROUPS.length}
          </p>
          <p className="text-[11px] text-slate-500">All core ERP domains covered</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Normalized Tables
          </p>
          <p className="text-xl font-bold text-[#0B1F3A] tabular-nums mt-0.5">
            {totalTables}
          </p>
          <p className="text-[11px] text-slate-500">{totalColumns} typed columns</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tenant Isolation
          </p>
          <p className="text-sm font-bold text-emerald-700 mt-1">
            school_id + campus_id
          </p>
          <p className="text-[11px] text-slate-500">Strict FK &amp; composite indexes</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Data Integrity
          </p>
          <p className="text-sm font-bold text-[#9A7418] mt-1">
            InnoDB · Soft Delete
          </p>
          <p className="text-[11px] text-slate-500">BIGINT PK · DECIMAL(12,2)</p>
        </div>
      </div>

      {showDdlPreview ? (
        <div className="bg-[#0B1F3A] rounded-xl border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-[#071528] border-b border-white/10 flex items-center justify-between text-xs text-slate-300">
            <span className="font-mono font-semibold text-[#D4AF37]">
              multi_school_erp_mysql8_schema.sql
            </span>
            <span className="text-[11px] text-slate-400">MySQL 8.0+ · utf8mb4_unicode_ci</span>
          </div>
          <pre className="p-4 text-[11.5px] font-mono text-slate-200 overflow-auto max-h-[560px] leading-relaxed">
            {generateMysqlSchemaDDL()}
          </pre>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: 22 Database Groups Selector */}
          <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-200/80 space-y-2.5 bg-[#F8FAFC]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A]">
                22 Foundational Database Groups
              </h3>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search group, table, or column..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#0B1F3A]"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {filteredGroups.map((group) => {
                const isSelected = activeGroup.groupNumber === group.groupNumber;
                return (
                  <button
                    key={group.groupNumber}
                    type="button"
                    onClick={() => setSelectedGroupNum(group.groupNumber)}
                    className={`w-full text-left px-4 py-3 transition-colors flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#0B1F3A] text-white'
                        : 'hover:bg-[#F8FAFC] text-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            isSelected
                              ? 'bg-[#D4AF37] text-[#0B1F3A]'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String(group.groupNumber).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-semibold truncate">
                          {group.groupName}
                        </span>
                      </div>
                      <p
                        className={`text-[10.5px] mt-1 line-clamp-1 ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {group.tables.map((t) => t.name).join(', ')}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold shrink-0 ${
                        isSelected ? 'text-[#D4AF37]' : 'text-slate-400'
                      }`}
                    >
                      {group.tables.length}T
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Table Definitions, Constraints, Indexes & Relationships */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A7418]">
                    Group {activeGroup.groupNumber} of 22
                  </span>
                  <h3 className="text-base font-bold text-[#0B1F3A]">
                    {activeGroup.groupName}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">{activeGroup.summary}</p>
                </div>
              </div>
            </div>

            {activeGroup.tables.map((table) => (
              <div
                key={table.name}
                className="bg-white border border-slate-200/80 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-3 bg-[#F8FAFC] border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Table2 className="w-4 h-4 text-[#0B1F3A]" />
                    <code className="text-xs font-mono font-bold text-[#0B1F3A]">
                      {table.name}
                    </code>
                    <span className="text-[11px] text-slate-500">— {table.description}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#0B1F3A]/8 text-[#0B1F3A] text-[10.5px] font-mono font-semibold">
                    <ShieldCheck className="w-3 h-3 text-[#9A7418]" />
                    {table.tenantScoped}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[10.5px] uppercase tracking-wider text-slate-500">
                        <th className="px-3.5 py-2 font-semibold">Column</th>
                        <th className="px-3.5 py-2 font-semibold">MySQL Type</th>
                        <th className="px-3.5 py-2 font-semibold">Key / Reference</th>
                        <th className="px-3.5 py-2 font-semibold">Null</th>
                        <th className="px-3.5 py-2 font-semibold">Default / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {table.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50/60">
                          <td className="px-3.5 py-2 font-mono font-semibold text-[#0B1F3A] whitespace-nowrap">
                            {col.name}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                            {col.dataType}
                          </td>
                          <td className="px-3.5 py-2 text-[11px] whitespace-nowrap">
                            {col.isPrimaryKey && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D4AF37]/20 text-[#8A6712] font-bold mr-1">
                                <Key className="w-3 h-3" /> PK
                              </span>
                            )}
                            {col.foreignKey && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[10.5px]">
                                <Link2 className="w-3 h-3" /> FK → {col.foreignKey}
                              </span>
                            )}
                            {col.unique && !col.isPrimaryKey && (
                              <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold">
                                UNIQUE
                              </span>
                            )}
                            {!col.isPrimaryKey && !col.foreignKey && !col.unique && (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 font-mono text-[11px] whitespace-nowrap">
                            {col.nullable ? (
                              <span className="text-slate-400">NULL</span>
                            ) : (
                              <span className="font-semibold text-slate-700">NOT NULL</span>
                            )}
                          </td>
                          <td className="px-3.5 py-2 text-[11px] text-slate-600">
                            {col.defaultValue && (
                              <code className="font-mono text-slate-800 mr-1.5">
                                {col.defaultValue}
                              </code>
                            )}
                            {col.notes && <span className="text-slate-500">{col.notes}</span>}
                            {!col.defaultValue && !col.notes && (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Constraints, Indexes, Relationships Footer */}
                <div className="px-4 py-3 bg-[#F8FAFC] border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div>
                    <p className="font-bold text-[#0B1F3A] uppercase tracking-wider text-[10px] mb-1">
                      Unique Constraints
                    </p>
                    {table.uniqueConstraints.length > 0 ? (
                      <ul className="space-y-0.5 font-mono text-slate-600">
                        {table.uniqueConstraints.map((u) => (
                          <li key={u} className="break-all">
                            • {u}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-slate-400">None beyond Primary Key</span>
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-[#0B1F3A] uppercase tracking-wider text-[10px] mb-1">
                      Indexes
                    </p>
                    <ul className="space-y-0.5 font-mono text-slate-600">
                      {table.indexes.map((idx) => (
                        <li key={idx} className="break-all">
                          • {idx}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-[#0B1F3A] uppercase tracking-wider text-[10px] mb-1">
                      Relationships
                    </p>
                    <ul className="space-y-0.5 text-slate-700">
                      {table.relationships.map((rel) => (
                        <li key={rel}>• {rel}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
