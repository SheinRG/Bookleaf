require('dotenv').config();
const { classifyTicket } = require('./services/ai');

(async () => {
  console.log("Testing AI Classification with your API Key...");
  try {
    const result = await classifyTicket("Where is my money?", "I sold 100 books but haven't received my quarterly payout yet. Please help!");
    console.log("AI Output:", result);
    if (result && result.category && result.priority) {
      console.log("✅ AI Integration is fully working!");
    } else {
      console.log("❌ AI did not return the expected format.");
    }
  } catch (err) {
    console.log("❌ AI test failed:", err.message);
  }
})();
