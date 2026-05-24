require('dotenv').config();
const { classifyTicket, draftResponse } = require('./services/ai');

(async () => {
  console.log("=== Testing Groq AI Integration ===");
  console.log("GROQ_API_KEY present:", !!process.env.GROQ_API_KEY);
  console.log("GROQ_API_KEY first 10 chars:", process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + "..." : "MISSING");
  console.log("");

  // Test 1: Classification
  console.log("--- Test 1: Ticket Classification ---");
  try {
    const result = await classifyTicket("Where is my money?", "I sold 100 books but haven't received my quarterly payout yet.");
    console.log("Classification result:", result);
  } catch (err) {
    console.log("Classification error:", err.message);
  }

  console.log("");

  // Test 2: Draft Response
  console.log("--- Test 2: Draft Response ---");
  try {
    const mockTicket = {
      subject: "Royalty mismatch",
      description: "My royalties seem incorrect for last quarter",
      book: {
        title: "Test Book",
        status: "Published",
        royalty_paid: 5000,
        royalty_pending: 1200
      }
    };
    const draft = await draftResponse(mockTicket);
    console.log("Draft result:", draft ? draft.substring(0, 200) + "..." : "NULL (no draft returned)");
  } catch (err) {
    console.log("Draft error:", err.message);
  }
})();
