import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'users.json');
const STUDENTS_FILE = path.join(__dirname, 'students.json');

app.use(cors());
app.use(express.json());

// Serve all static frontend files with no-store headers so updates apply immediately
app.use(express.static(__dirname, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// ==========================================
// ROBUST DATABASE HELPER (JSON STORE)
// ==========================================
function readUsers() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading user database, resetting:', err);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('Error writing to database:', err);
  }
}

function readStudents() {
  if (!fs.existsSync(STUDENTS_FILE)) {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(STUDENTS_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading students database, resetting:', err);
    return [];
  }
}

function writeStudents(students) {
  try {
    fs.writeFileSync(STUDENTS_FILE, JSON.stringify(students, null, 2));
  } catch (err) {
    console.error('Error writing to students database:', err);
  }
}

// ==========================================
// EMAIL SENDING SERVICES (NODEMAILER)
// ==========================================
async function getMailTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
}

async function sendProStudentCodeEmail(studentEmail, studentName, accessCode) {
  try {
    console.log(`\n[PRO EMAIL] Enviando código VIP de aluno para: ${studentEmail}...`);
    const transporter = await getMailTransporter();

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Seu Código de Acesso PRO - Mentoria LOCADOR NÔMADE</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #080C14;
            color: #FFFFFF;
            margin: 0;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #0D1424;
            border: 1px solid rgba(0, 242, 254, 0.25);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
          }
          .email-header {
            background: linear-gradient(135deg, #00F2FE 0%, #4FACFE 50%, #34D399 100%);
            padding: 35px 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 24px;
            color: #042F1A;
            font-weight: 900;
            letter-spacing: 0.05em;
          }
          .email-header p {
            margin: 6px 0 0 0;
            font-size: 13px;
            color: #042F1A;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .email-body {
            padding: 35px 30px;
            line-height: 1.6;
          }
          .email-body h2 {
            font-size: 20px;
            color: #FFFFFF;
            margin-top: 0;
          }
          .email-body p {
            color: #94A3B8;
            font-size: 15px;
          }
          .code-box {
            background: rgba(0, 242, 254, 0.06);
            border: 2px dashed rgba(0, 242, 254, 0.4);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 28px 0;
          }
          .code-box .code-label {
            font-size: 12px;
            color: #00F2FE;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 700;
            margin-bottom: 8px;
            display: block;
          }
          .code-box .code-val {
            font-size: 38px;
            font-weight: 900;
            color: #FFFFFF;
            letter-spacing: 8px;
            font-family: monospace;
          }
          .btn-action {
            display: inline-block;
            background: linear-gradient(135deg, #00F2FE 0%, #34D399 100%);
            color: #042F1A !important;
            text-decoration: none;
            padding: 14px 34px;
            border-radius: 50px;
            font-weight: 800;
            font-size: 15px;
            margin-top: 15px;
            box-shadow: 0 6px 20px rgba(0, 242, 254, 0.25);
          }
          .email-footer {
            background: rgba(255,255,255,0.02);
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>MENTORIA LOCADOR NÔMADE</h1>
            <p>Módulo PRO &bull; Acesso Exclusivo Aluno VIP</p>
          </div>
          <div class="email-body">
            <h2>Olá, <span style="color: #00F2FE;">${studentName}</span>!</h2>
            <p>Seu acesso exclusivo ao <strong>Simulador PRO Multi-Veículos (24 Meses)</strong> foi liberado com sucesso!</p>
            <p>Utilize o código de segurança abaixo para autenticar sua sessão:</p>
            
            <div class="code-box">
              <span class="code-label">Sua Senha de Acesso PRO</span>
              <div class="code-val">${accessCode}</div>
            </div>

            <p>Neste módulo avançado você poderá simular:</p>
            <ul style="color: #94A3B8; font-size: 14px; padding-left: 20px;">
              <li><strong>DRE Locadora</strong> com projeção de 24 meses de fluxo de caixa;</li>
              <li><strong>Efeito Bola de Neve</strong> com reinvestimento automático de lucros na frota;</li>
              <li><strong>Alavancagem com Consórcio</strong> contemplado e alto retorno de ROI.</li>
            </ul>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://simulador.locadornomade.com/pro" class="btn-action">Acessar Simulador PRO</a>
            </div>
          </div>
          <div class="email-footer">
            &copy; 2026 Mentoria LOCADOR NÔMADE. Acesso restrito a alunos autorizados.<br>
            Não compartilhe este código com terceiros.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"LOCADOR NÔMADE PRO" <adm@locadornomade.com>',
      to: studentEmail,
      subject: `🔑 Seu Código de Acesso PRO: ${accessCode} - Mentoria LOCADOR NÔMADE`,
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[PRO EMAIL ENVIADO!] ID: ${info.messageId} para ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('[PRO EMAIL ERROR] Falha ao enviar:', error.message);
    return false;
  }
}
async function sendWelcomeEmail(userEmail, userName) {
  try {
    console.log(`\n[EMAIL SERVICE] Preparando envio de e-mail de boas-vindas para: ${userEmail}...`);
    
    let transporter;
    let isReal = false;

    // Check if real SMTP config exists in .env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      console.log(`[EMAIL SERVICE] Configuração SMTP real encontrada! Enviando de verdade...`);
      isReal = true;
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
      console.log(`[EMAIL SERVICE] Nenhuma credencial SMTP encontrada no .env. Utilizando Ethereal de testes...`);
      // Create an ephemeral test account on Ethereal.email for instant previewing in development
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Bem-vindo ao LOCADOR NÔMADE</title>
        <style>
          body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #080C14;
            color: #FFFFFF;
            margin: 0;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #0D1424;
            border: 1px solid rgba(52, 211, 153, 0.15);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .email-header {
            background: linear-gradient(135deg, #34D399 0%, #00F2FE 100%);
            padding: 30px 20px;
            text-align: center;
          }
          .email-header h1 {
            margin: 0;
            font-size: 24px;
            color: #042F1A;
            font-weight: 800;
            letter-spacing: 0.05em;
          }
          .email-header p {
            margin: 5px 0 0 0;
            font-size: 13px;
            color: #042F1A;
            font-weight: 600;
            opacity: 0.8;
            text-transform: uppercase;
          }
          .email-body {
            padding: 40px 30px;
            line-height: 1.6;
          }
          .email-body h2 {
            font-size: 20px;
            color: #FFFFFF;
            margin-top: 0;
          }
          .email-body p {
            color: #94A3B8;
            font-size: 15px;
          }
          .highlight {
            color: #34D399;
            font-weight: 700;
          }
          .btn-action {
            display: inline-block;
            background: #34D399;
            color: #042F1A !important;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 15px;
            margin-top: 24px;
            box-shadow: 0 4px 20px rgba(52, 211, 153, 0.2);
          }
          .email-footer {
            background: rgba(255,255,255,0.02);
            border-top: 1px solid rgba(255,255,255,0.05);
            padding: 24px;
            text-align: center;
            font-size: 12px;
            color: #64748B;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>LOCADOR NÔMADE</h1>
            <p>Sistemas Essenciais</p>
          </div>
          <div class="email-body">
            <h2>Olá, <span class="highlight">${userName}</span>!</h2>
            <p>Obrigado por criar sua conta no <strong>LOCADOR NÔMADE - SISTEMAS ESSENCIAIS</strong>.</p>
            <p>Seu acesso foi registrado com sucesso em nosso banco de dados. Agora você tem acesso ilimitado ao nosso <strong>Simulador Financeiro de Locação de Carros</strong>.</p>
            <p>Projete seu DRE completo, provisione IPVA, licenciamento e taxas de depreciação com os valores oficiais da tabela FIPE de forma automatizada!</p>
            
            <div style="text-align: center;">
              <a href="http://localhost:3000" class="btn-action">Fazer Nova Simulação</a>
            </div>
          </div>
          <div class="email-footer">
            &copy; 2026 LOCADOR NÔMADE - SISTEMAS ESSENCIAIS. Todos os direitos reservados.<br>
            Este é um e-mail de confirmação automática. Por favor, não responda.
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || '"LOCADOR NÔMADE" <noreply@locadornomade.com.br>',
      to: userEmail,
      subject: '🚗 Conta Criada com Sucesso - LOCADOR NÔMADE',
      html: emailHtml
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log(`\n======================================================`);
    console.log(`[EMAIL ENVIADO COM SUCESSO!]`);
    console.log(`ID da Mensagem: ${info.messageId}`);
    console.log(`E-mail enviado para: ${userEmail}`);
    // Ethereal provides a direct preview link
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`LINK DE PREVISÃO DO E-MAIL (CLIQUE PARA VER):`);
    console.log(`👉 ${previewUrl}`);
    console.log(`======================================================\n`);

    return previewUrl;

  } catch (error) {
    console.error('[EMAIL ERROR] Falha ao enviar e-mail de confirmação:', error.message);
    // Silent fail so registration is NOT broken for the user in offline environments
    return null;
  }
}

// ==========================================
// API: AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { nome, telefone, email, senha } = req.body;

    if (!nome || !telefone || !email || !senha) {
      return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios' });
    }

    const users = readUsers();
    
    // Check if email already exists
    const userExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado' });
    }

    const newUser = {
      nome,
      telefone,
      email,
      senha, // In production we would hash this, for simulation plain text matches local database.js
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    // Send styled welcome email in background/async
    const emailPreviewUrl = await sendWelcomeEmail(email, nome);

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      user: {
        nome: newUser.nome,
        telefone: newUser.telefone,
        email: newUser.email
      },
      emailPreviewUrl // Passed to let the frontend know or display a nice clickable link!
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/login
app.post('/api/login', (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ success: false, error: 'E-mail e senha são obrigatórios' });
    }

    const users = readUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);

    if (!user) {
      return res.status(401).json({ success: false, error: 'E-mail ou senha incorretos' });
    }

    res.json({
      success: true,
      message: 'Autenticação bem-sucedida!',
      user: {
        nome: user.nome,
        telefone: user.telefone,
        email: user.email
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// GET /pro (Módulo PRO Mentoria)
app.get('/pro', (req, res) => {
  res.sendFile(path.join(__dirname, 'pro.html'));
});

// ==========================================
// API: PRO MODULE AUTHENTICATION
// ==========================================

// POST /api/pro/request-code
app.post('/api/pro/request-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'O e-mail é obrigatório.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const students = readStudents();
    const student = students.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail);

    if (!student) {
      return res.status(403).json({
        success: false,
        authorized: false,
        error: 'E-mail não autorizado. Este módulo é 100% exclusivo para alunos da Mentoria Locador Nômade. Se você já é aluno, solicite sua liberação ao suporte.'
      });
    }

    // Generate 6-digit access code
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    student.accessCode = accessCode;
    student.codeGeneratedAt = new Date().toISOString();
    writeStudents(students);

    // Send code to student's real email
    const emailSent = await sendProStudentCodeEmail(student.email, student.name || 'Aluno', accessCode);

    res.json({
      success: true,
      authorized: true,
      emailSent,
      message: `Código de acesso enviado com sucesso para ${student.email}! Verifique sua caixa de entrada e spam.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/pro/verify-code
app.post('/api/pro/verify-code', (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, error: 'E-mail e código de acesso são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();
    const students = readStudents();
    const student = students.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail);

    if (!student) {
      return res.status(403).json({ success: false, error: 'E-mail não encontrado na lista de alunos da mentoria.' });
    }

    if (!student.accessCode || student.accessCode !== cleanCode) {
      return res.status(401).json({ success: false, error: 'Código de acesso incorreto ou expirado. Solicite um novo código.' });
    }

    // Update last access timestamp
    student.lastAccess = new Date().toISOString();
    writeStudents(students);

    res.json({
      success: true,
      message: 'Acesso VIP autorizado com sucesso!',
      student: {
        name: student.name,
        email: student.email,
        phone: student.phone
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// API: ADMIN MANAGEMENT
// ==========================================

// POST /api/admin/users (Free leads)
app.post('/api/admin/users', (req, res) => {
  try {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    const users = readUsers();
    const sanitizedUsers = users.map(({ senha, ...rest }) => rest);

    res.json({
      success: true,
      users: sanitizedUsers
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/students (List PRO students)
app.post('/api/admin/students', (req, res) => {
  try {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    const students = readStudents();
    res.json({
      success: true,
      students
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/students/add
app.post('/api/admin/students/add', async (req, res) => {
  try {
    const { password, name, email, phone } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Nome e e-mail são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const students = readStudents();

    if (students.some(s => s.email && s.email.trim().toLowerCase() === cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Este e-mail já está cadastrado na lista de alunos!' });
    }

    const initialCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newStudent = {
      id: 'std_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      phone: (phone || '').trim(),
      status: 'ativo',
      accessCode: initialCode,
      createdAt: new Date().toISOString(),
      lastAccess: null
    };

    students.push(newStudent);
    writeStudents(students);

    // Send initial welcome code
    await sendProStudentCodeEmail(newStudent.email, newStudent.name, initialCode);

    res.status(201).json({
      success: true,
      message: 'Aluno autorizado e cadastrado com sucesso! Código inicial enviado.',
      student: newStudent
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/students/remove
app.post('/api/admin/students/remove', (req, res) => {
  try {
    const { password, email } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    let students = readStudents();
    students = students.filter(s => s.email && s.email.trim().toLowerCase() !== cleanEmail);
    writeStudents(students);

    res.json({
      success: true,
      message: 'Aluno removido com sucesso!'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/admin/students/resend
app.post('/api/admin/students/resend', async (req, res) => {
  try {
    const { password, email } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const students = readStudents();
    const student = students.find(s => s.email && s.email.trim().toLowerCase() === cleanEmail);

    if (!student) {
      return res.status(404).json({ success: false, error: 'Aluno não encontrado.' });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    student.accessCode = newCode;
    student.codeGeneratedAt = new Date().toISOString();
    writeStudents(students);

    await sendProStudentCodeEmail(student.email, student.name, newCode);

    res.json({
      success: true,
      message: `Novo código (${newCode}) gerado e enviado para ${student.email}!`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend SPA index on any other path
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  LOCADOR NÔMADE - SISTEMAS ESSENCIAIS`);
  console.log(`  Servidor do Simulador Ativo!`);
  console.log(`  Acesse localmente em: http://localhost:${PORT}`);
  console.log(`  Banco de Dados Local: users.json (Ativo)`);
  console.log(`======================================================\n`);
});
