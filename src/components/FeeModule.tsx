import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Printer,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  FileDown,
  Calendar,
} from 'lucide-react';
import { FeeReceipt, Student } from '../types';

interface FeeModuleProps {
  receipts: FeeReceipt[];
  students: Student[];
  subItem?: string;
  onRecordPayment: (receipt: FeeReceipt) => void;
}

export const FeeModule: React.FC<FeeModuleProps> = ({
  receipts,
  students,
  subItem = 'fee-collection',
  onRecordPayment,
}) => {
  const [activeTab, setActiveTab] = useState<'collection' | 'history' | 'concessions' | 'defaulters'>(() => {
    if (subItem === 'fee-admin') return 'concessions';
    if (subItem === 'fee-report') return 'defaulters';
    return 'collection';
  });

  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[2]?.id || students[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<FeeReceipt['paymentMode']>('Online/UPI');
  const [concessionAmount, setConcessionAmount] = useState<number>(0);
  const [generatedReceipt, setGeneratedReceipt] = useState<FeeReceipt | null>(receipts[0] || null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Fee computation defaults
  const tuitionFee = 32000;
  const transportFee = selectedStudent?.busRoute ? 8500 : 0;
  const labFee = 3500;
  const examFee = 2000;
  const grossTotal = tuitionFee + transportFee + labFee + examFee;
  const netPayable = Math.max(0, grossTotal - concessionAmount);

  const handleCollectFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newReceipt: FeeReceipt = {
      receiptNo: `REC-2026-${Math.floor(5000 + Math.random() * 5000)}`,
      date: '2026-10-23',
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      grade: selectedStudent.grade,
      section: selectedStudent.section,
      admissionNo: selectedStudent.admissionNo,
      tuitionFee,
      transportFee,
      labFee,
      examFee,
      concession: concessionAmount,
      totalPaid: netPayable,
      paymentMode,
      transactionId: `${paymentMode === 'Cash' ? 'CASH' : 'TXN'}-${Math.floor(100000 + Math.random() * 900000)}`,
      collectedBy: 'Accountant (Mr. Sridhar)',
    };

    onRecordPayment(newReceipt);
    setGeneratedReceipt(newReceipt);
  };

  const defaulters = students.filter((s) => s.feeStatus !== 'Paid');

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Title & Navigation */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-[#1976d2]" />
            <span>School Fee Administration & POS Collection</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time receipt generation · Integrated with CBSE fee structure · GST compliant
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'collection' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fee Collection Counter
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'history' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent Receipts
          </button>
          <button
            onClick={() => setActiveTab('defaulters')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
              activeTab === 'defaulters' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Dues & Defaulters</span>
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {defaulters.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('concessions')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'concessions' ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Fee Structure & Concession
          </button>
        </div>
      </div>

      {/* VIEW: FEE COLLECTION COUNTER */}
      {activeTab === 'collection' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Collection Form */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              <span>Collect Term Fee (2026-2027)</span>
            </h3>

            <form onSubmit={handleCollectFee} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Select Student *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#1976d2]"
                >
                  {students.map((std) => (
                    <option key={std.id} value={std.id}>
                      {std.name} ({std.admissionNo}) - {std.grade} Sec {std.section} - Status: {std.feeStatus}
                    </option>
                  ))}
                </select>
              </div>

              {/* Breakdown Table */}
              <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/60 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Tuition & Instructional Fee:</span>
                  <span className="font-mono font-medium">₹{tuitionFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Transport Route Fee ({selectedStudent?.busRoute || 'None'}):</span>
                  <span className="font-mono font-medium">₹{transportFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Science & Computer Lab Fee:</span>
                  <span className="font-mono font-medium">₹{labFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>CBSE Assessment & Examination Fee:</span>
                  <span className="font-mono font-medium">₹{examFee.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-800">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono">₹{grossTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Concession / Scholarship (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={concessionAmount}
                    onChange={(e) => setConcessionAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#1976d2] tabular-nums"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Payment Mode *
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-[#1976d2]"
                  >
                    <option value="Online/UPI">Online / UPI / NetBanking</option>
                    <option value="POS Card">POS Debit / Credit Card</option>
                    <option value="Cash">Cash at Counter</option>
                    <option value="Cheque">Demand Draft / Cheque</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900">Net Amount to Collect:</span>
                <span className="text-lg font-black text-indigo-900 font-mono">
                  ₹{netPayable.toLocaleString()}
                </span>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#1976d2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-2xs flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Process Payment & Issue Receipt</span>
              </button>
            </form>
          </div>

          {/* Receipt Preview on Right */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80">
            {generatedReceipt ? (
              <div className="border border-gray-300 rounded-xl p-5 bg-white space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <div>
                    <h4 className="text-sm font-black uppercase text-gray-900">
                      THE LEARNER&apos;S ACADEMY CBSE
                    </h4>
                    <p className="text-[10px] text-gray-500">Official Fee Payment Receipt</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Print</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Receipt Number</span>
                    <span className="font-mono font-bold text-gray-800">{generatedReceipt.receiptNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Date & Time</span>
                    <span className="font-mono text-gray-800">{generatedReceipt.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Student Name</span>
                    <span className="font-bold text-gray-900">{generatedReceipt.studentName}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Admission No</span>
                    <span className="font-mono text-gray-800">{generatedReceipt.admissionNo}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Class & Section</span>
                    <span className="text-gray-800">
                      {generatedReceipt.grade} - {generatedReceipt.section}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Payment Mode</span>
                    <span className="font-semibold text-emerald-700">{generatedReceipt.paymentMode}</span>
                  </div>
                </div>

                <div className="border-t border-b border-gray-200 py-2.5 space-y-1 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Tuition Fee</span>
                    <span className="font-mono">₹{generatedReceipt.tuitionFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Transport Fee</span>
                    <span className="font-mono">₹{generatedReceipt.transportFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Lab & Library</span>
                    <span className="font-mono">₹{generatedReceipt.labFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Exam Fee</span>
                    <span className="font-mono">₹{generatedReceipt.examFee.toLocaleString()}</span>
                  </div>
                  {generatedReceipt.concession > 0 && (
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Concession Applied</span>
                      <span className="font-mono">-₹{generatedReceipt.concession.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-1.5 flex justify-between font-black text-sm text-gray-900">
                    <span>Total Paid</span>
                    <span className="font-mono text-emerald-800">
                      ₹{generatedReceipt.totalPaid.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2">
                  <span>Collected by: {generatedReceipt.collectedBy}</span>
                  <span className="font-mono font-semibold text-emerald-600">PAID VERIFIED</span>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-gray-400">
                Select a student and process payment to preview receipt.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: RECENT RECEIPTS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900">Transaction & Receipt Ledger</h3>
            <span className="text-xs text-gray-500">Today&apos;s Collection: ₹1,38,000</span>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Adm No</th>
                  <th className="px-4 py-3">Payment Mode</th>
                  <th className="px-4 py-3 text-right">Amount Paid</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {receipts.map((r) => (
                  <tr key={r.receiptNo} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-mono font-bold text-gray-800">{r.receiptNo}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{r.date}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{r.studentName}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{r.admissionNo}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700">
                        {r.paymentMode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                      ₹{r.totalPaid.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setGeneratedReceipt(r);
                          setActiveTab('collection');
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:underline"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: DEFAULTERS LIST */}
      {activeTab === 'defaulters' && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Fee Defaulters & Outstanding Dues</h3>
              <p className="text-xs text-gray-500">Students with partial or pending term dues</p>
            </div>
            <button
              onClick={() => alert('Automated fee reminder SMS queued for delivery to parents.')}
              className="px-3 py-1.5 bg-[#e91e63] hover:bg-[#d81b60] text-white text-xs font-semibold rounded-lg shadow-2xs"
            >
              Send SMS Reminders
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold">
                <tr>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Father Name</th>
                  <th className="px-4 py-3">Parent Phone</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Pending Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {defaulters.map((std) => (
                  <tr key={std.id} className="hover:bg-rose-50/30">
                    <td className="px-4 py-3 font-bold text-gray-900">{std.name}</td>
                    <td className="px-4 py-3 text-gray-700">{std.grade} - {std.section}</td>
                    <td className="px-4 py-3 text-gray-700">{std.fatherName}</td>
                    <td className="px-4 py-3 font-mono text-gray-600">{std.phone}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700">
                        {std.feeStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                      ₹{std.dueAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedStudentId(std.id);
                          setActiveTab('collection');
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded"
                      >
                        Collect ➔
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: CONCESSIONS & STRUCTURE */}
      {activeTab === 'concessions' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/80 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Approved CBSE Concession Policies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <h4 className="font-bold text-xs text-gray-900">Sibling Concession</h4>
              <p className="text-xs text-gray-600 mt-1">
                15% tuition waiver for the second child and 25% for subsequent siblings enrolled concurrently.
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <h4 className="font-bold text-xs text-gray-900">Staff Ward Scholarship</h4>
              <p className="text-xs text-gray-600 mt-1">
                50% tuition waiver for permanent teachers and non-teaching personnel children.
              </p>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <h4 className="font-bold text-xs text-gray-900">Merit & Sports Excellence</h4>
              <p className="text-xs text-gray-600 mt-1">
                100% scholarship for state & national level sports medalists and NTSE/Olympiad rankers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
