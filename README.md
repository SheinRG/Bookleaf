# BookLeaf — Author Support & Communication Portal

> ## 📌 Assignment Submission: Full-Stack Web Application
> **This project was built as part of a Full-Stack Developer assignment to demonstrate proficiency in building production-grade web applications using the MERN stack (MongoDB, Express.js, React/Next.js, Node.js) with AI-powered features, role-based access control, and a deployed cloud architecture.**

---

## ⚠️ Important Notes for Reviewers / First-Time Users

> ### 🕐 Cold Start Delay (~50 seconds)
> The backend is deployed on **Render's free tier**, which puts the server to sleep after periods of inactivity. **The very first request (e.g. login) may take up to 50 seconds** while the server wakes up. Subsequent requests will be instant. Please be patient on your first login attempt — the loading spinner will resolve once the server is ready.

> ### 🔑 Login Credentials
> | Role | Email | Password |
> |------|-------|----------|
> | **Admin** | `admin@bookleaf.com` | `password123` |
> | **Author** | `priya.sharma@email.com` | `password123` |
> | **Author** | `rohit.kapoor@email.com` | `password123` |
>
> All authors from the sample dataset use the same password: `password123`

> ### 🌐 Live Deployment
> - **Frontend (Vercel):** [https://bookleaf-mauve.vercel.app](https://bookleaf-mauve.vercel.app)
> - **Backend API (Render):** [https://bookleaf-r2wf.onrender.com](https://bookleaf-r2wf.onrender.com)

---

## 🎯 Project Objective

Build a **Publisher Admin Portal** that enables BookLeaf Publishing's support team to efficiently manage author communication through:
- AI-powered ticket classification and response drafting
- Real-time multi-agent ticket workflows
- Comprehensive book & royalty management
- A polished, premium admin & author interface

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Auto-Classification:** New tickets are automatically classified into categories (Royalty & Payments, ISBN & Metadata, Printing & Quality, etc.) using AI.
- **AI Draft Generation:** Admins can generate context-aware draft responses powered by LLMs (supports both OpenAI GPT and Groq LLaMA models with dynamic adapter selection).
- **Smart Fallback:** If no AI keys are configured, the system degrades gracefully with template-based responses — the portal remains fully functional.

### 💬 Real-Time Communication System
- **Threaded Chat Interface:** iMessage-style conversation bubbles with admin (right-aligned), author (left-aligned), and internal notes (amber-highlighted) messages.
- **Internal Notes:** Admins can leave private internal notes visible only to other admins.
- **Resizable Composer:** The reply input area can be dragged to resize for longer responses.

### 📊 Admin Dashboard
- **Ticket Queue:** Searchable, filterable by status and priority, with intelligent urgency-based sorting (Critical → High → Medium → Low, oldest first).
- **Manuscripts Table:** View and manage all submitted manuscripts with status updates (Draft → Under Review → Published).
- **Royalties Dashboard:** Track pending royalties and process payouts for individual books.
- **Multi-Agent Assignment:** Tickets can be assigned to specific administrators.

### 📝 Author Portal
- **Personal Dashboard:** Authors see only their own books, tickets, and royalty information.
- **Ticket Submission:** Submit support tickets linked to specific books with AI-powered auto-categorization.
- **Conversation View:** Accordion-style expandable ticket threads to track all communications.

### 🔐 Security & Access Control
- **JWT Authentication:** Secure token-based authentication with 24-hour expiry.
- **Role-Based Access:** Strict separation between admin and author capabilities at both API and UI levels.
- **Session Management:** Automatic logout detection when sessions are overwritten from another tab.

### 🎨 Premium UI/UX Design
- **Glassmorphism Design System:** Frosted glass effects, premium gradients, and a custom Material Design 3 color palette.
- **Micro-Animations:** Smooth Framer Motion transitions throughout — page changes, message bubbles, dropdown menus.
- **Custom Dark Sidebar:** Premium dark-themed navigation with active state indicators.
- **Responsive Layout:** Resizable split-pane layout with drag handles.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Server-side rendering, type-safe components |
| **Styling** | Tailwind CSS 4, Custom CSS Design System | Premium glassmorphism UI with MD3 color tokens |
| **Animations** | Framer Motion | Page transitions, message animations, micro-interactions |
| **Backend** | Node.js, Express.js 5 | RESTful API with middleware-based auth |
| **Database** | MongoDB (Mongoose 9) | Document-based storage with relational population |
| **AI** | OpenAI GPT / Groq LLaMA (Dynamic Adapter) | Ticket classification & draft generation |
| **Auth** | JSON Web Tokens (JWT) | Stateless authentication |
| **Hosting** | Vercel (Frontend) + Render (Backend) + MongoDB Atlas (DB) | Cloud deployment |

### Architecture Decisions
- **Monorepo Structure:** `/client` and `/server` kept together for easier review while maintaining strict separation of concerns.
- **Modular Components:** Both dashboards decomposed into focused, reusable components (`AdminSidebar`, `TicketQueue`, `ChatWorkspace`, `ManuscriptsTable`, `RoyaltiesDashboard`, `BooksTable`, `SubmitTicketForm`, `AuthorTicketList`).
- **Dual AI Provider:** The backend dynamically detects available API keys (`OPENAI_API_KEY` or `GROQ_API_KEY`) and configures the appropriate AI client at startup.
- **Intelligent Queue Sorting:** Unresolved tickets are bubbled to the top, sorted by urgency priority then by age.

---

## 📡 REST API Reference

All endpoints expect `Content-Type: application/json`. Protected endpoints require: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/login` | Authenticate & get JWT token | No |
| `GET` | `/admins` | List all admin users | Yes |

### Books & Royalties (`/api/books`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | Fetch books (scoped by role) | Yes |
| `PATCH` | `/:id` | Update book/manuscript status | Admin |
| `POST` | `/:id/payout` | Process royalty payout | Admin |

### Tickets & Support (`/api/tickets`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/` | List tickets (filterable: `?status=Open&priority=High`) | Yes |
| `GET` | `/:id` | Get single ticket with full message thread | Yes |
| `POST` | `/` | Submit new ticket (triggers AI classification) | Yes |
| `PATCH` | `/:id` | Reply, change status/priority, assign admin | Yes |
| `DELETE` | `/:id` | Delete ticket (role-based restrictions) | Yes |
| `GET` | `/:id/draft` | Generate AI draft response from message history | Admin |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js v18+
- MongoDB running locally on `127.0.0.1:27017` (or a MongoDB Atlas URI)

### 1. Clone & Install
```bash
git clone https://github.com/SheinRG/Bookleaf.git
cd Bookleaf
```

### 2. Configure Environment
Create a `.env` file inside `/server`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bookleaf
JWT_SECRET=supersecretjwtkey

# Add one or both for AI features:
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
```

### 3. Seed the Database
```bash
cd server
npm install
node seed.js
```

### 4. Start Backend
```bash
npm run dev
```

### 5. Start Frontend
```bash
cd ../client
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 🔄 Reset Database (Wipe Test Data)
If you need a fresh start (removes all tickets, re-seeds users & books):
```bash
cd server
node reset-db.js
```

---

## 📂 Project Structure
```
bookleaf/
├── client/                     # Next.js Frontend
│   ├── src/
│   │   ├── app/                # Pages (login, admin, author)
│   │   ├── components/
│   │   │   ├── admin/          # AdminSidebar, TicketQueue, ChatWorkspace,
│   │   │   │                   # ManuscriptsTable, RoyaltiesDashboard
│   │   │   └── author/         # BooksTable, SubmitTicketForm, AuthorTicketList
│   │   └── lib/                # API helpers, auth utilities
│   └── public/                 # Static assets
│
├── server/                     # Express.js Backend
│   ├── models/                 # Mongoose schemas (User, Book, Ticket)
│   ├── routes/                 # REST endpoints (auth, books, tickets)
│   ├── services/               # AI adapter (OpenAI/Groq dual provider)
│   ├── middleware/              # JWT auth middleware
│   ├── seed.js                 # Initial database seeder
│   ├── reset-db.js             # Database reset utility
│   └── server.js               # Express app entry point
│
└── bookleaf_sample_data.json   # Sample author & book dataset
```

---

*Built with ❤️ by Raghav*
