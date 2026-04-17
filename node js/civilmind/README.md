# CivilMind 🏗️

AI Assistant for Civil Engineers — Arabic & English support with Egyptian ECP and Saudi SBC codes.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- **Clerk keys** from [clerk.com](https://clerk.com)
- **n8n webhook URL** (already set to localhost)

### 3. Get Clerk API Keys
1. Go to [clerk.com](https://clerk.com) → Create account
2. Create new application → Name: "CivilMind"
3. Copy `Publishable Key` and `Secret Key`
4. Paste in `.env.local`

### 4. Run development server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

## Features
- 🌍 Arabic & English UI
- 🇸🇦 Saudi SBC codes
- 🇪🇬 Egyptian ECP codes  
- 💬 Chat with memory
- 🔐 Authentication (Clerk)
- 📱 Responsive design

## Stack
- Next.js 14 (App Router)
- Tailwind CSS
- Clerk (Auth)
- n8n (AI Backend)
- Dify (RAG)

## Disclaimer
This tool is for educational and assistance purposes only. All engineering decisions must be reviewed by a licensed engineer.
