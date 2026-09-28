const { createClient } = require('@libsql/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const client = createClient({
  url,
  authToken: url.startsWith('file:') ? undefined : authToken,
});

async function setupDatabase() {
  console.log(`Connecting to database at: ${url.startsWith('libsql:') || url.startsWith('https:') ? url : 'local database (' + url + ')'}...`);
  try {
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema.sql...');
    await client.executeMultiple(schemaSql);
    console.log('Schema executed successfully!');

    // 1. Seed Departments
    console.log('Seeding departments...');
    const departments = [
      { name: 'School of Information Technology', code: 'SOIT', desc: 'IT, Computer Science, and Data Science programs' },
      { name: 'School of Multimedia and Digital Arts', code: 'SMDA', desc: 'Multimedia Arts and Digital Media' },
      { name: 'E.T. Yuchengco School of Business', code: 'ETYSB', desc: 'Business Administration and Accountancy' },
      { name: 'School of Health Sciences', code: 'SHS', desc: 'Biology, Medical Technology, and Health' },
      { name: 'School of Nursing', code: 'SON', desc: 'Nursing and Clinical Education' },
    ];

    const deptMap = {};
    for (const d of departments) {
      const res = await client.execute({
        sql: 'INSERT INTO departments (name, code, description) VALUES (?, ?, ?)',
        args: [d.name, d.code, d.desc],
      });
      deptMap[d.code] = Number(res.lastInsertRowid);
    }

    // 2. Seed Professors
    console.log('Seeding professors...');
    const professors = [
      { deptCode: 'SOIT', name: 'Prof. Alex Santos', email: 'asantos@mapua.edu.ph', spec: 'Software Engineering & AI' },
      { deptCode: 'SOIT', name: 'Dr. Maria Fernandez', email: 'mfernandez@mapua.edu.ph', spec: 'Database Systems & Analytics' },
      { deptCode: 'SOIT', name: 'Prof. Juan Dela Cruz', email: 'jdelacruz@mapua.edu.ph', spec: 'Web & Mobile Development' },
      { deptCode: 'SMDA', name: 'Prof. Clarissa Reyes', email: 'creyes@mapua.edu.ph', spec: 'UI/UX & Digital Animation' },
      { deptCode: 'SMDA', name: 'Prof. Mark Alonzo', email: 'malonzo@mapua.edu.ph', spec: '3D Graphics & Game Design' },
      { deptCode: 'ETYSB', name: 'Dr. Roberto Garcia', email: 'rgarcia@mapua.edu.ph', spec: 'Financial Management' },
      { deptCode: 'ETYSB', name: 'Prof. Ana Sy', email: 'asy@mapua.edu.ph', spec: 'Marketing & Entrepreneurship' },
      { deptCode: 'SHS', name: 'Dr. Joseph Mendoza', email: 'jmendoza@mapua.edu.ph', spec: 'Microbiology & Clinical Research' },
      { deptCode: 'SON', name: 'Prof. Elena Torres', email: 'etorres@mapua.edu.ph', spec: 'Patient Care & Community Health' },
    ];

    for (const p of professors) {
      await client.execute({
        sql: 'INSERT INTO professors (department_id, name, email, specialization) VALUES (?, ?, ?, ?)',
        args: [deptMap[p.deptCode], p.name, p.email, p.spec],
      });
    }

    // 3. Seed Service Offices
    console.log('Seeding service offices...');
    const serviceOffices = [
      { name: 'Admissions', prefix: 'A', desc: 'Student application, account verifications, and modality concerns', icon: 'UserCheck' },
      { name: 'Registrar', prefix: 'R', desc: 'Academic records, transcripts, diplomas, and document requests', icon: 'FileText' },
      { name: 'Treasury', prefix: 'T', desc: 'Tuition payment, cashier clearance, and financial receipts', icon: 'CreditCard' },
      { name: 'Accounting', prefix: 'ACC', desc: 'Student accounts assessment and financial ledgers', icon: 'Calculator' },
      { name: 'Student Affairs', prefix: 'SA', desc: 'Organizations, discipline, and student welfare', icon: 'GraduationCap' },
      { name: 'IT Helpdesk', prefix: 'IT', desc: 'MyMapúa portal support, MS Teams, and account resets', icon: 'Monitor' },
      { name: 'Guidance and Counseling', prefix: 'GC', desc: 'Career advisory and student wellness support', icon: 'HeartHandshake' },
      { name: 'Health Services', prefix: 'HS', desc: 'Medical clearance, clinic services, and health records', icon: 'Stethoscope' },
    ];

    const officeMap = {};
    for (const o of serviceOffices) {
      const res = await client.execute({
        sql: 'INSERT INTO service_offices (name, prefix, description, icon_name) VALUES (?, ?, ?, ?)',
        args: [o.name, o.prefix, o.desc, o.icon],
      });
      officeMap[o.name] = Number(res.lastInsertRowid);
    }

    // 4. Seed Services
    console.log('Seeding services...');
    const admApp = await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)',
      args: [officeMap['Admissions'], 'Application', 15],
    });

    const admConc = await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)',
      args: [officeMap['Admissions'], 'Academic Concerns', 15],
    });

    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Schedule Adjustment', Number(admConc.lastInsertRowid), 15],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Shift Modality', Number(admConc.lastInsertRowid), 15],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Blended', Number(admConc.lastInsertRowid), 15],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'UOx', Number(admConc.lastInsertRowid), 15],
    });

    const admAcct = await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)',
      args: [officeMap['Admissions'], 'Check Student Account', 10],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Grades', Number(admAcct.lastInsertRowid), 10],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Student Status', Number(admAcct.lastInsertRowid), 10],
    });
    await client.execute({
      sql: 'INSERT INTO services (service_office_id, name, parent_id, estimated_minutes) VALUES (?, ?, ?, ?)',
      args: [officeMap['Admissions'], 'Balance', Number(admAcct.lastInsertRowid), 10],
    });

    // Registrar Services
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Registrar'], 'Processing of Academic Documents', 20] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Registrar'], 'Processing of Pending Requirements', 15] });

    // Treasury Services
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Treasury'], 'Payment', 10] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Treasury'], 'Processing of Academic Documents', 15] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Treasury'], 'Processing of Pending Requirements', 15] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Treasury'], 'Recent Transactions / Transaction History', 10] });

    // Accounting Services
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Accounting'], 'Tuition Fee Assessment & Ledger Review', 15] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['Accounting'], 'Scholarship & Discount Verification', 15] });

    // IT Helpdesk Services
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['IT Helpdesk'], 'MyMapúa Portal Password Reset', 10] });
    await client.execute({ sql: 'INSERT INTO services (service_office_id, name, estimated_minutes) VALUES (?, ?, ?)', args: [officeMap['IT Helpdesk'], 'Office 365 & WiFi Assistance', 10] });

    // 5. Seed Users & Demo Accounts
    console.log('Seeding demo user accounts...');
    const studentPasswordHash = await bcrypt.hash('student123', 10);
    const deptPasswordHash = await bcrypt.hash('department123', 10);
    const servicePasswordHash = await bcrypt.hash('service123', 10);
    const treasuryPasswordHash = await bcrypt.hash('treasury123', 10);
    const registrarPasswordHash = await bcrypt.hash('registrar123', 10);
    const adminPasswordHash = await bcrypt.hash('admin123', 10);

    // Demo Student
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, student_number) VALUES (?, ?, ?, 'STUDENT', ?)`,
      args: ['Juan Student', 'studentdemo@mymail.mapua.edu.ph', studentPasswordHash, '2024109876'],
    });

    // Demo Department Staff (assigned to SOIT)
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, department_id) VALUES (?, ?, ?, 'DEPARTMENT_STAFF', ?)`,
      args: ['Dept Staff SOIT', 'departmental@mapua.edu.ph', deptPasswordHash, deptMap['SOIT']],
    });

    // Demo Service Staff (Admissions)
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, service_office_id) VALUES (?, ?, ?, 'SERVICE_STAFF', ?)`,
      args: ['Admissions Staff', 'service@mapua.edu.ph', servicePasswordHash, officeMap['Admissions']],
    });

    // Demo Service Staff (Treasury)
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, service_office_id) VALUES (?, ?, ?, 'SERVICE_STAFF', ?)`,
      args: ['Treasury Staff', 'treasury@mapua.edu.ph', treasuryPasswordHash, officeMap['Treasury']],
    });

    // Demo Service Staff (Registrar)
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role, service_office_id) VALUES (?, ?, ?, 'SERVICE_STAFF', ?)`,
      args: ['Registrar Staff', 'registrar@mapua.edu.ph', registrarPasswordHash, officeMap['Registrar']],
    });

    // Demo Admin
    await client.execute({
      sql: `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'ADMIN')`,
      args: ['System Administrator', 'admin@mapua.edu.ph', adminPasswordHash],
    });

    console.log('✅ Database setup and seeding complete!');
    console.log(`
Demo Accounts Created:
--------------------------------------------------
Student:            studentdemo@mymail.mapua.edu.ph  (Password: student123)
Department Staff:   departmental@mapua.edu.ph       (Password: department123)
Service Staff (Adm):service@mapua.edu.ph            (Password: service123)
Service Staff (Trs):treasury@mapua.edu.ph           (Password: treasury123)
Service Staff (Reg):registrar@mapua.edu.ph          (Password: registrar123)
--------------------------------------------------
    `);
  } catch (err) {
    console.error('Database setup failed:', err);
    process.exit(1);
  }
}

setupDatabase();

