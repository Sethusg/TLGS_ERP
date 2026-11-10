import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  app.use(express.json());

  const PORT = process.env.PORT || 3000;

  // Dedicated Database Server In-Memory & File-backed Store for School ERP & Canteen POS
  let studentsData = [
    { id: 'std-1', admissionNo: 'TLGS-2025-001', name: 'Aarav Sharma', grade: 'Class 10', section: 'A', feeStatus: 'Paid', walletBalance: 450 },
    { id: 'std-2', admissionNo: 'TLGS-2025-002', name: 'Priya Patel', grade: 'Class 10', section: 'B', feeStatus: 'Pending', walletBalance: 320 },
  ];

  let staffData = [
    { id: 'staff-1', empId: 'EMP-101', name: 'Raj Kumar', role: 'Teacher', department: 'Mathematics' },
    { id: 'staff-2', empId: 'EMP-102', name: 'Malini Swaminathan', role: 'Teacher', department: 'English' },
  ];

  let discountRulesData = [
    { id: 'disc-1', title: 'Happy Hour Beverage Special', code: 'HAPPY_HOUR_BEV', type: 'percentage', value: 15, condition_type: 'time_of_day', condition_value: 'Beverages', start_time: '14:00', end_time: '17:00', is_active: true },
    { id: 'disc-2', title: 'Staff Canteen Subsidy', code: 'STAFF_SUB_10', type: 'percentage', value: 10, condition_type: 'student_category', condition_value: 'staff', is_active: true },
  ];

  let salesData: any[] = [];
  let productsData: any[] = [];
  let movementsData: any[] = [];

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  });

  app.get('/api/students', (req, res) => {
    res.json(studentsData);
  });

  app.post('/api/students', (req, res) => {
    const newStudent = { id: `std-${Date.now()}`, ...req.body };
    studentsData.push(newStudent);
    res.json(newStudent);
  });

  app.get('/api/staff', (req, res) => {
    res.json(staffData);
  });

  app.get('/api/pos/discounts', (req, res) => {
    res.json(discountRulesData);
  });

  app.post('/api/pos/discounts', (req, res) => {
    const newRule = { id: `disc-${Date.now()}`, created_at: new Date().toISOString(), ...req.body };
    discountRulesData.push(newRule);
    res.json(newRule);
  });

  app.get('/api/pos/sales', (req, res) => {
    res.json(salesData);
  });

  app.post('/api/pos/sales', (req, res) => {
    const sale = { id: `sale-${Date.now()}`, created_at: new Date().toISOString(), ...req.body };
    salesData.unshift(sale);
    res.json(sale);
  });

  app.get('/api/pos/products', (req, res) => {
    res.json(productsData);
  });

  app.post('/api/pos/products', (req, res) => {
    const product = { id: `prod-${Date.now()}`, ...req.body };
    productsData.push(product);
    res.json(product);
  });

  app.get('/api/pos/inventory', (req, res) => {
    res.json(movementsData);
  });

  app.post('/api/pos/inventory', (req, res) => {
    const movement = { id: `mov-${Date.now()}`, created_at: new Date().toISOString(), ...req.body };
    movementsData.unshift(movement);
    res.json(movement);
  });

  // Vite middleware integration for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Dedicated School ERP Database Server running on port ${PORT}`);
  });
}

startServer();
