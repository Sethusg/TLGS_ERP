import React, { useState, useEffect } from 'react';
import {
  BedDouble,
  Building2,
  Utensils,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import {
  ModulePageHeader,
  EnterpriseMetricCard,
  EnterpriseDataTable,
  EnterpriseFormModal,
  TableColumn,
} from './Common/EnterpriseUI';

interface HostelManagementModuleProps {
  subItem?: string;
  contextLabel: string;
}

interface RoomAllocation {
  id: string;
  block: string;
  roomNo: string;
  studentName: string;
  grade: string;
  warden: string;
  messPlan: 'Standard Veg' | 'High-Protein Athletics' | 'International';
  status: 'Occupied' | 'On Home Leave';
}

const INITIAL_ALLOCATIONS: RoomAllocation[] = [
  { id: 'hst-1', block: 'Chola Boys Block A', roomNo: 'A-204', studentName: 'Karthik Meyyappan', grade: 'Grade 11', warden: 'Mr. Senthil Kumar', messPlan: 'High-Protein Athletics', status: 'Occupied' },
  { id: 'hst-2', block: 'Chola Boys Block A', roomNo: 'A-208', studentName: 'Pranav Venkataraman', grade: 'Grade 12', warden: 'Mr. Senthil Kumar', messPlan: 'Standard Veg', status: 'Occupied' },
  { id: 'hst-3', block: 'Pallava Girls Block B', roomNo: 'B-112', studentName: 'Meenakshi Sundaram', grade: 'Grade 11', warden: 'Mrs. Lakshmi Devi', messPlan: 'Standard Veg', status: 'Occupied' },
  { id: 'hst-4', block: 'Pallava Girls Block B', roomNo: 'B-115', studentName: 'Ananya Balasubramanian', grade: 'Grade 10', warden: 'Mrs. Lakshmi Devi', messPlan: 'International', status: 'On Home Leave' },
  { id: 'hst-5', block: 'IB Senior Residence C', roomNo: 'C-301', studentName: 'Siddharth Nair', grade: 'IB DP-1', warden: 'Mr. David Raj', messPlan: 'International', status: 'Occupied' },
];

const HOSTEL_BLOCKS = [
  { id: 'blk-1', name: 'Chola Boys Block A', wing: 'Senior Boys', rooms: 40, capacity: 120, occupied: 108, warden: 'Mr. Senthil Kumar' },
  { id: 'blk-2', name: 'Pallava Girls Block B', wing: 'Senior Girls', rooms: 36, capacity: 108, occupied: 96, warden: 'Mrs. Lakshmi Devi' },
  { id: 'blk-3', name: 'IB Senior Residence C', wing: 'International Co-Ed Wings', rooms: 24, capacity: 48, occupied: 42, warden: 'Mr. David Raj' },
];

export const HostelManagementModule: React.FC<HostelManagementModuleProps> = ({
  subItem,
  contextLabel,
}) => {
  const [activeTab, setActiveTab] = useState<string>(subItem || 'hostel-blocks');
  const [allocations, setAllocations] = useState<RoomAllocation[]>(INITIAL_ALLOCATIONS);
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [grade, setGrade] = useState('Grade 11');
  const [block, setBlock] = useState('Chola Boys Block A');
  const [roomNo, setRoomNo] = useState('');
  const [messPlan, setMessPlan] = useState<RoomAllocation['messPlan']>('Standard Veg');

  useEffect(() => {
    if (subItem) setActiveTab(subItem);
  }, [subItem]);

  const totalBeds = HOSTEL_BLOCKS.reduce((a, b) => a + b.capacity, 0);
  const occupiedBeds = HOSTEL_BLOCKS.reduce((a, b) => a + b.occupied, 0);

  const handleAllocate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !roomNo.trim()) return;
    setAllocations((prev) => [
      {
        id: `hst-${Date.now()}`,
        block,
        roomNo: roomNo.trim().toUpperCase(),
        studentName: studentName.trim(),
        grade,
        warden: HOSTEL_BLOCKS.find((b) => b.name === block)?.warden || 'Duty Warden',
        messPlan,
        status: 'Occupied',
      },
      ...prev,
    ]);
    setStudentName('');
    setRoomNo('');
    setIsAllocateOpen(false);
    setActiveTab('hostel-rooms');
  };

  const allocationColumns: TableColumn<RoomAllocation>[] = [
    { key: 'room', header: 'Room', render: (r) => <span className="font-mono font-bold text-[#0B1F3A]">{r.roomNo}</span> },
    {
      key: 'student',
      header: 'Resident Student',
      sortable: true,
      sortValue: (r) => r.studentName,
      render: (r) => (
        <div>
          <p className="font-semibold text-[#0B1F3A]">{r.studentName}</p>
          <p className="text-[11px] text-slate-500">{r.grade}</p>
        </div>
      ),
    },
    { key: 'block', header: 'Hostel Block', render: (r) => <span className="text-slate-700">{r.block}</span> },
    { key: 'mess', header: 'Mess Plan', render: (r) => <span className="text-slate-600">{r.messPlan}</span> },
    {
      key: 'status',
      header: 'Status',
      align: 'right',
      render: (r) => (
        <span className={r.status === 'Occupied' ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
          {r.status}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <ModulePageHeader
        contextLabel={`${contextLabel} · Residential Operations (Sample Preview)`}
        title="Hostel Management"
        subtitle="Oversee residential blocks, student room allocations, dining mess plans, and warden gate pass approvals."
        tabs={[
          { id: 'hostel-blocks', label: 'Hostels & Blocks' },
          { id: 'hostel-rooms', label: 'Room Allocation' },
          { id: 'hostel-mess', label: 'Mess & Meal Plans' },
          { id: 'hostel-gatepass', label: 'Gate Pass & Visitors' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <button
            type="button"
            onClick={() => setIsAllocateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0B1F3A] hover:bg-[#132E54] text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Allocate Room</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <EnterpriseMetricCard
          label="Residential Blocks"
          value={HOSTEL_BLOCKS.length}
          detail="100 rooms across 3 wings"
          icon={Building2}
          tone="navy"
        />
        <EnterpriseMetricCard
          label="Bed Occupancy"
          value={`${Math.round((occupiedBeds / totalBeds) * 100)}%`}
          detail={`${occupiedBeds} / ${totalBeds} beds occupied`}
          icon={BedDouble}
          tone="gold"
        />
        <EnterpriseMetricCard
          label="Active Mess Subscribers"
          value={occupiedBeds}
          detail="3 nutritional meal plans"
          icon={Utensils}
          tone="emerald"
        />
        <EnterpriseMetricCard
          label="Active Gate Passes"
          value={3}
          detail="Weekend parent authorizations"
          icon={ShieldCheck}
          tone="amber"
        />
      </div>

      {activeTab === 'hostel-blocks' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {HOSTEL_BLOCKS.map((blk) => {
            const pct = Math.round((blk.occupied / blk.capacity) * 100);
            return (
              <div key={blk.id} className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9A7418]">
                    {blk.wing}
                  </p>
                  <h3 className="text-sm font-bold text-[#0B1F3A] mt-0.5">{blk.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Warden: {blk.warden}</p>
                </div>
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs tabular-nums">
                    <span className="text-slate-600">{blk.rooms} Rooms</span>
                    <span className="font-bold text-[#0B1F3A]">
                      {blk.occupied} / {blk.capacity} Beds ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0B1F3A] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(activeTab === 'hostel-blocks' || activeTab === 'hostel-rooms') && (
        <EnterpriseDataTable
          title="Student Room Allocation Register"
          subtitle="Search by student, block, or room number."
          columns={allocationColumns}
          data={allocations}
          rowKey={(r) => r.id}
          searchPlaceholder="Search student, room, or block..."
          searchFilter={(r, q) =>
            r.studentName.toLowerCase().includes(q) ||
            r.roomNo.toLowerCase().includes(q) ||
            r.block.toLowerCase().includes(q)
          }
        />
      )}

      {activeTab === 'hostel-mess' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Standard Veg Plan', meals: 'Breakfast, Lunch, Evening Snacks, Dinner', fee: '₹6,500 / mo', subscribers: 162 },
            { name: 'High-Protein Athletics Plan', meals: 'Includes Sports Nutrition & Recovery Shakes', fee: '₹8,200 / mo', subscribers: 46 },
            { name: 'International Continental Plan', meals: 'Indian + Continental Rotational Buffet', fee: '₹9,500 / mo', subscribers: 38 },
          ].map((plan) => (
            <div key={plan.name} className="bg-white border border-slate-200/80 rounded-xl p-5 space-y-2">
              <p className="text-xs font-mono font-bold text-[#9A7418]">{plan.fee}</p>
              <h3 className="text-sm font-bold text-[#0B1F3A]">{plan.name}</h3>
              <p className="text-xs text-slate-600">{plan.meals}</p>
              <p className="text-[11px] font-semibold text-slate-500 pt-2 border-t border-slate-100 tabular-nums">
                {plan.subscribers} active boarders subscribed
              </p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'hostel-gatepass' && (
        <EnterpriseDataTable
          title="Authorized Gate Passes & Visitor Register"
          subtitle="Verified by residential wardens and parent SMS OTP."
          columns={[
            { key: 'student', header: 'Resident Student', render: (r) => <span className="font-semibold text-[#0B1F3A]">{r.studentName}</span> },
            { key: 'block', header: 'Block / Room', render: (r) => <span>{r.block} · {r.roomNo}</span> },
            { key: 'warden', header: 'Approved By', render: (r) => <span className="text-slate-600">{r.warden}</span> },
            { key: 'status', header: 'Pass Status', align: 'right', render: (r) => <span className="font-semibold text-emerald-700">{r.status === 'On Home Leave' ? 'Out on Approved Pass' : 'In Residence'}</span> },
          ]}
          data={allocations}
          rowKey={(r) => r.id}
        />
      )}

      <EnterpriseFormModal
        isOpen={isAllocateOpen}
        onClose={() => setIsAllocateOpen(false)}
        title="Allocate Hostel Room"
        subtitle="Assign a residential room and dining plan to a boarder"
      >
        <form onSubmit={handleAllocate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Student Name *</label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Arjun Narayanan"
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Grade</label>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Hostel Block</label>
              <select
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg cursor-pointer"
              >
                {HOSTEL_BLOCKS.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Room No *</label>
              <input
                type="text"
                required
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. A-210"
                className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0B1F3A] mb-1">Mess Plan</label>
            <select
              value={messPlan}
              onChange={(e) => setMessPlan(e.target.value as RoomAllocation['messPlan'])}
              className="w-full px-3 py-2 text-xs bg-[#F8FAFC] border border-slate-300 rounded-lg cursor-pointer"
            >
              <option value="Standard Veg">Standard Veg</option>
              <option value="High-Protein Athletics">High-Protein Athletics</option>
              <option value="International">International</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAllocateOpen(false)}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#0B1F3A] hover:bg-[#132E54] text-white rounded-lg cursor-pointer"
            >
              Confirm Allocation
            </button>
          </div>
        </form>
      </EnterpriseFormModal>
    </div>
  );
};
