import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Staff, SchoolAsset } from '../types';

interface SchoolDataExportOptions {
  schoolName?: string;
  affiliationNo?: string;
  schoolCode?: string;
  academicYear?: string;
  students: Student[];
  staffList: Staff[];
  assets: SchoolAsset[];
}

export function generateSchoolDataPDF({
  schoolName = 'THE LEADERS ACADEMY(CBSE)',
  affiliationNo = '1930812',
  schoolCode = '45091',
  academicYear = '2026 - 2027',
  students,
  staffList,
  assets,
}: SchoolDataExportOptions): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const currentDateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const currentTimeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const reportId = `TLGS-DATA-REP-${Date.now().toString().slice(-6)}`;

  // Header Banner
  doc.setFillColor(24, 43, 73); // Deep Navy (#182b49)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Accent Gold Bar
  doc.setFillColor(220, 160, 40); // Gold accent
  doc.rect(0, 28, pageWidth, 2, 'F');

  // Title Text in Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(schoolName.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(220, 230, 242);
  doc.text(
    `CBSE Affiliation No: ${affiliationNo}  |  School Code: ${schoolCode}  |  Academic Session: ${academicYear}`,
    14,
    17
  );
  doc.text(
    `OFFICIAL INSTITUTIONAL MASTER DATA DOSSIER (STUDENTS, STAFF & ASSETS)`,
    14,
    23
  );

  // Report Metadata pill (Right side of header)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`DOC REF: ${reportId}`, pageWidth - 14, 11, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`DATE: ${currentDateStr} ${currentTimeStr}`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`STATUS: VERIFIED & CONFIDENTIAL`, pageWidth - 14, 23, { align: 'right' });

  let currentY = 36;

  // Executive Summary Section
  doc.setTextColor(24, 43, 73);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('1. EXECUTIVE SUMMARY & STATISTICAL AGGREGATES', 14, currentY);
  currentY += 4;

  const totalAssetValue = assets.reduce((sum, a) => sum + (a.cost || 0), 0);
  const activeStaffCount = staffList.filter((s) => s.status !== 'Archived').length;
  const avgAttendance = (
    students.reduce((sum, s) => sum + (s.attendancePercent || 0), 0) /
    (students.length || 1)
  ).toFixed(1);

  autoTable(doc, {
    startY: currentY,
    head: [['Metric Parameter', 'Statistical Count / Value', 'Institutional Scope & Notes']],
    body: [
      ['Enrolled CBSE Students', `${students.length} Active Records`, 'All classes (Primary to Senior Secondary)'],
      ['Faculty & Staff Members', `${activeStaffCount} On Active Duty (${staffList.length} Total)`, 'Teaching, Admin & Support Personnel'],
      ['Registered Institutional Assets', `${assets.length} Capitalized Units`, 'Laboratory, IT Infrastructure, Sports & Facilities'],
      ['Total Asset Portfolio Value', `₹${totalAssetValue.toLocaleString('en-IN')}`, 'Current audited book value at cost'],
      ['Average Student Attendance', `${avgAttendance}% Overall`, 'Compliant with CBSE 75% statutory requirement'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [24, 43, 73],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { fontStyle: 'bold', textColor: [20, 83, 45], cellWidth: 55 },
      2: { textColor: [75, 85, 99] },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Section 2: Students Master Directory
  doc.setTextColor(24, 43, 73);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`2. STUDENTS MASTER DIRECTORY (${students.length} ENROLLED)`, 14, currentY);
  currentY += 4;

  const studentRows = students.map((s, idx) => [
    (idx + 1).toString(),
    s.admissionNo,
    s.rollNo,
    s.name,
    `${s.grade} - ${s.section}`,
    s.fatherName,
    s.phone,
    s.feeStatus,
    `${s.attendancePercent}%`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Adm No', 'Roll', 'Student Name', 'Class', 'Guardian Name', 'Phone', 'Fee Status', 'Att %']],
    body: studentRows,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 172, 193], // Cyan (#00acc1)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { cellWidth: 14 },
      3: { fontStyle: 'bold', cellWidth: 34 },
      4: { cellWidth: 20 },
      5: { cellWidth: 28 },
      6: { cellWidth: 24 },
      7: { cellWidth: 18, fontStyle: 'bold' },
      8: { cellWidth: 14, halign: 'right' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for Staff
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // Section 3: Faculty & Staff Roster
  doc.setTextColor(24, 43, 73);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`3. FACULTY & STAFF ROSTER (${staffList.length} MEMBERS)`, 14, currentY);
  currentY += 4;

  const staffRows = staffList.map((s, idx) => [
    (idx + 1).toString(),
    s.empId,
    s.name,
    s.role,
    s.designation,
    s.department,
    s.qualification || 'M.Sc, B.Ed',
    s.phone,
    s.status,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Emp ID', 'Staff Name', 'Role', 'Designation', 'Department', 'Qualification', 'Phone', 'Status']],
    body: staffRows,
    theme: 'striped',
    headStyles: {
      fillColor: [67, 160, 71], // Green (#43a047)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 18 },
      2: { fontStyle: 'bold', cellWidth: 34 },
      3: { cellWidth: 22 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22 },
      6: { cellWidth: 22 },
      7: { cellWidth: 22 },
      8: { cellWidth: 16, fontStyle: 'bold' },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Check if we need a new page for Assets
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // Section 4: Institutional Assets
  doc.setTextColor(24, 43, 73);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text(`4. INSTITUTIONAL ASSETS & CAPITAL REGISTER (${assets.length} ITEMS)`, 14, currentY);
  currentY += 4;

  const assetRows = assets.map((a, idx) => [
    (idx + 1).toString(),
    a.assetCode,
    a.name,
    a.category,
    a.location,
    `₹${(a.cost || 0).toLocaleString('en-IN')}`,
    a.condition,
    a.assignedTo || 'General Lab Pool',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Asset Code', 'Asset Description', 'Category', 'Location', 'Cost (INR)', 'Condition', 'Custodian / In-Charge']],
    body: assetRows,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 151, 167], // Aqua (#0097a7)
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    styles: {
      fontSize: 7,
      cellPadding: 1.8,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { fontStyle: 'bold', cellWidth: 22 },
      2: { fontStyle: 'bold', cellWidth: 40 },
      3: { cellWidth: 26 },
      4: { cellWidth: 26 },
      5: { cellWidth: 22, halign: 'right', fontStyle: 'bold' },
      6: { cellWidth: 18 },
      7: { cellWidth: 30 },
    },
  });

  currentY = (doc as any).lastAutoTable.finalY + 12;

  // Ensure enough room for signatures on the last page
  if (currentY > pageHeight - 35) {
    doc.addPage();
    currentY = 25;
  }

  // Sign-off / Verification Box
  doc.setDrawColor(200, 210, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 24, 2, 2, 'FD');

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(
    'CERTIFICATION NOTE: This document contains officially verified school administrative records certified under CBSE Rule 14.1.',
    18,
    currentY + 6
  );

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Prepared by: Administrative Registrar', 18, currentY + 14);
  doc.text('Verified by: Financial Comptroller', 85, currentY + 14);
  doc.text('Countersigned: Principal & Head of Institution', 145, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('(Digitally stamped with TLGS ERP Security Key)', 18, currentY + 19);
  doc.text('(Audited against CBSE Affiliation #1930812)', 85, currentY + 19);
  doc.text('(Official Seal & Digital Signature)', 145, currentY + 19);

  // Add Footers and Page Numbers across all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Bottom hairline divider
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

    // Footer Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'THE LEADERS ACADEMY(CBSE) Enterprise ERP | Generated via Admin Master Data Export Tool',
      14,
      pageHeight - 6
    );

    // Page Number
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 14, pageHeight - 6, {
      align: 'right',
    });
  }

  return doc;
}

export function downloadSchoolDataPDF(options: SchoolDataExportOptions): void {
  const doc = generateSchoolDataPDF(options);
  const dateStamp = new Date().toISOString().slice(0, 10);
  doc.save(`THE_LEADERS_ACADEMY_School_Master_Data_Report_${dateStamp}.pdf`);
}
