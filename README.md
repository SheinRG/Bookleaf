# BookLeaf Author Support & Communication Portal

This is a production-grade full-stack web application designed for BookLeaf Publishing to manage author support queries efficiently using AI-assisted response generation, real-time message streams, and automated multi-agent workflows.

---

## Project Structure
- `/client`: Next.js frontend (App Router) built with a **modular atomic component architecture** and Tailwind CSS.
- `/server`: Node.js, Express.js, & MongoDB (Mongoose) RESTful backend.

---

## Architecture Decisions

### 1. Monorepo Separation of Concerns
Keeps frontend and backend together for easier testing and assignment review, while strictly isolating database models, REST routers, and AI services on the backend, and atomic, type-safe components on the frontend.

### 2. High-Performance Modular UI (Component Directory)
Both dashboards (Author and Admin) have been refactored from massive monolithic pages into highly clean, reusable React components under `client/src/components`:
- **Author Portal Components:** `BooksTable`, `SubmitTicketForm`, `AuthorTicketList` (Accordion chat thread).
- **Admin Portal Components:** `AdminSidebar`, `TicketQueue` (search & multi-select capsules), `ChatWorkspace` (timeline & resizable composer), `ManuscriptsTable`, `RoyaltiesDashboard`.

### 3. Dynamic Dual AI Adapter Architecture (OpenAI / Groq)
The backend AI adapter (`server/services/ai.js`) automatically detects which environment variables are present and sets itself up dynamically:
- **OpenAI Mode:** Targets official endpoints using `gpt-4o-mini` if `OPENAI_API_KEY` is present.
- **Groq Mode:** Targets Groq's low-latency API endpoint using `llama-3.1-8b-instant` (classification) and `llama-3.3-70b-versatile` (draft response) if `GROQ_API_KEY` is present.
- **Graceful Fallback:** If neither is defined, the system degrades gracefully, bypassing auto-classification and generating simple fallback response draft templates so the portal remains 100% functional.

### 4. Intelligent Urgency & Age Queue Sorting
Unresolved tickets are automatically bubbled to the top and sorted by **Urgency Priority level** (`Critical` > `High` > `Medium` > `Low`), and then by **Oldest Created Date** (`createdAt: 1`). This ensures critical neglected author issues are never lost. Resolved/Closed tickets are pushed to the bottom of the list.

### 5. Multi-Agent Security & Assignments
Admins can dynamically assign tickets to **themselves or other administrators** from a live personnel dropdown, or clear assignments, reflecting changes across portals instantly.

---

## REST API Endpoint Reference

All endpoints expect `Content-Type: application/json`. Protected endpoints require standard JWT header: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication API (`/api/auth`)

| Method | Endpoint | Description | Protected | Request Body | Sample Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **POST** | `/login` | Authenticate user & return token | No | `{"email": "...", "password": "..."}` | `{"token": "...", "user": {"role": "admin", ...}}` |
| **GET** | `/admins` | Retrieve all active administrator users | **Yes** | *None* | `[{"_id": "...", "name": "Admin", "email": "..."}]` |

### Books & Performance API (`/api/books`)

| Method | Endpoint | Description | Protected | Request Body | Sample Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **GET** | `/` | Fetch all books associated with the user role | **Yes** | *None* | `[{"title": "Book 1", "isbn": "...", "mrp": 399}]` |
| **PATCH** | `/:id` | Update status (e.g. approve & publish manuscript) | **Yes (Admin)** | `{"status": "Published"}` | `{"_id": "...", "title": "Book 1", "status": "Published"}` |
| **POST** | `/:id/payout` | Disburse pending royalties (payout execution) | **Yes (Admin)** | *None* | `{"_id": "...", "royalty_pending": 0, "royalty_paid": 4000}` |

### Tickets & Support API (`/api/tickets`)

| Method | Endpoint | Description | Protected | Request Body | Sample Response |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **GET** | `/` | Fetch tickets filterable by query params | **Yes** | *Query: ?status=Open&priority=High* | `[{"subject": "...", "status": "Open", "priority": "High"}]` |
| **GET** | `/:id` | Fetch single ticket detailed conversation thread | **Yes** | *None* | `{"_id": "...", "messages": [{"message": "Hello", ...}]}` |
| **POST** | `/` | Submit a ticket (triggers AI auto-classification) | **Yes** | `{"subject": "...", "description": "...", "book_id": "..."}` | `{"_id": "...", "category": "Royalty & Payments", ...}` |
| **PATCH** | `/:id` | Post reply, change status, assign owner, etc. | **Yes** | `{"status": "Resolved", "assigned_admin": "unassigned"}` | `{"_id": "...", "status": "Resolved", "assigned_admin": null}` |
| **GET** | `/:id/draft` | Generate AI context-aware draft using message history | **Yes (Admin)** | *None* | `{"draft": "Dear Author, I understand your concern..."}` |

---

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `127.0.0.1:27017` (or provide Atlas URI in environment)

### Environment Configurations
Create a `.env` file inside the `/server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/bookleaf
JWT_SECRET=supersecretjwtkey

# Add either or both to trigger dynamic AI provider client adapter:
OPENAI_API_KEY=your_openai_api_key_here
GROQ_API_KEY=your_groq_api_key_here
```

### Quick Start
1. **Database Seed Setup:**
   ```bash
   cd server
   npm install
   node seed.js
   ```
2. **Launch Backend Server:**
   ```bash
   npm run dev
   ```
3. **Launch Frontend Next.js Client:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   Open `http://localhost:3000` to interact with the portal.

### Test Credentials
- **Admin Accounts:**
  - Email: `admin@bookleaf.com` | Password: `password123`
- **Author Accounts:**
  - Email: `priya.sharma@email.com` (or any author from `bookleaf_sample_data.json`) | Password: `password123`
