const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const dir = path.join(__dirname);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash'
});

const KB_SUMMARY = `
BookLeaf Policies:
- Royalty: 80% to author, 20% to BookLeaf. Net profit = MRP - printing - commission - shipping.
- Payouts: Quarterly, paid within 45 days of quarter end. Min threshold ₹1,000.
- ISBN: BookLeaf assigns unique ISBN. Errors (duplicates, wrong book) are High priority & escalated to production.
- Printing: In-house. Turnaround 5-7 business days. Quality issues (misprints, blur) get free reprint.
- Distribution: Sync issues (shows unavailable) take 24-48 hours to fix.
- Tone: Empathetic, professional. Own mistakes. Provide specific timelines (e.g. 48 hours for escalation).
`;

async function classifyTicket(subject, description) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key missing. Skipping classification.');
      return null;
    }

    const prompt = `Classify the following ticket into exactly one Category and assign a Priority.
Categories: "Royalty & Payments", "ISBN & Metadata Issues", "Printing & Quality", "Distribution & Availability", "Book Status & Production Updates", "General Inquiry".
Priorities: "Critical", "High", "Medium", "Low".

Subject: ${subject}
Description: ${description}

Output strictly as JSON: {"category": "...", "priority": "..."}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are an expert ticket classifier.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('AI Classification failed:', error.message);
    return null; // Graceful degradation
  }
}

async function draftResponse(ticket) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key missing. Skipping draft generation.');
      return null;
    }

    const prompt = `Draft a professional, empathetic response from BookLeaf Support to an author based on their ticket.
Use the following knowledge base rules if relevant:
${KB_SUMMARY}

Ticket Subject: ${ticket.subject}
Ticket Description: ${ticket.description}
${ticket.book ? `Book Context: Title="${ticket.book.title}", Status="${ticket.book.status}", Royalties Paid=${ticket.book.royalty_paid}, Royalties Pending=${ticket.book.royalty_pending}` : ''}

Provide only the draft response text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: 'You are a helpful support agent.' }, { role: 'user', content: prompt }]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('AI Draft generation failed:', error.message);
    return null;
  }
}

module.exports = { classifyTicket, draftResponse };
