# BookLeaf Author Support & Communication Portal

This is a full-stack web application designed for BookLeaf Publishing to manage author support queries efficiently using AI-assisted response generation.

## Project Structure
- `/client`: Next.js frontend (App Router) with Tailwind CSS.
- `/server`: Express.js & MongoDB backend.

## Architecture Decisions
- **Monorepo Structure**: Keeps frontend and backend together for easier testing and assignment review.
- **Frontend**: Next.js App Router for modern React development, leveraging Tailwind CSS for clean, rapid UI development. Uses simple polling (`setInterval`) for real-time ticket updates to avoid WebSocket overhead.
- **Backend**: Express.js providing RESTful API routes with JWT authentication and role-based access control.
- **Database**: MongoDB (via Mongoose) chosen for its flexible schema, making it easy to store tickets and their associated conversation arrays.

## AI Integration (OpenAI)
- **Auto-Classification**: On ticket creation, the backend calls OpenAI (`gpt-4o-mini`) to analyze the subject and description, returning a structured JSON output with the appropriate Category and Priority.
- **AI-Drafted Responses**: Admins can request an AI-generated draft response. The AI context is strictly limited to the `KB_SUMMARY` (a streamlined version of the knowledge base) and the specific ticket details, minimizing token costs.
- **Graceful Degradation**: Both AI endpoints are wrapped in `try/catch`. If the API key is missing or the OpenAI API fails, the ticket is still created (falling back to default categories) and admins can still manually respond.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `127.0.0.1:27017` (or provide an Atlas URI)
- An OpenAI API Key

### Backend Setup
1. Navigate to the `server` directory: `cd server`
2. Install dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and add your `OPENAI_API_KEY`.
4. Run the seed script: `node seed.js` (This populates the DB with the sample JSON and creates the admin user).
5. Start the server: `npm run dev` (Runs on port 5000).

### Frontend Setup
1. Navigate to the `client` directory: `cd client`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev` (Runs on port 3000).

### Test Credentials
- **Admin**: email: `admin@bookleaf.com`, password: `password123`
- **Author**: email: `priya.sharma@email.com` (or any email from the JSON), password: `password123`
