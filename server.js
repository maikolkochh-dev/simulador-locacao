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

app.use(cors());
app.use(express.json());

// Serve all static frontend files
app.use(express.static(__dirname));

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

// ==========================================
// EMAIL SENDING SERVICE (NODEMAILER)
// ==========================================
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

// POST /api/admin/users
app.post('/api/admin/users', (req, res) => {
  try {
    const { password } = req.body;
    const adminPass = process.env.ADMIN_PASSWORD || 'LocadorAdmin2026!';
    
    if (password !== adminPass) {
      return res.status(401).json({ success: false, error: 'Senha de administrador incorreta' });
    }

    const users = readUsers();
    // Exclude password field for security
    const sanitizedUsers = users.map(({ senha, ...rest }) => rest);

    res.json({
      success: true,
      users: sanitizedUsers
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
