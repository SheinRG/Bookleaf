const { OpenAI } = require('openai');

/**
 * Dynamically resolves the AI Client and Model configurations
 * based on the environment variables provided.
 * Prefers OpenAI (gpt-4o-mini) and falls back to Groq (Llama 3).
 */
function getAIConfig() {
  const openaiKey = process.env.OPENAI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (openaiKey && openaiKey !== 'dummy_key_to_prevent_crash') {
    return {
      client: new OpenAI({ apiKey: openaiKey }),
      provider: 'openai',
      models: {
        classifier: 'gpt-4o-mini',
        drafter: 'gpt-4o-mini'
      }
    };
  } else if (groqKey && groqKey !== 'dummy_key_to_prevent_crash') {
    return {
      client: new OpenAI({
        apiKey: groqKey,
        baseURL: 'https://api.groq.com/openai/v1'
      }),
      provider: 'groq',
      models: {
        classifier: 'llama-3.1-8b-instant',
        drafter: 'llama-3.3-70b-versatile'
      }
    };
  }

  // Graceful degradation fallback
  return {
    client: null,
    provider: 'none',
    models: {
      classifier: null,
      drafter: null
    }
  };
}

const KNOWLEDGE_BASE = `
BOOKLEAF PUBLISHING - COMPLETE KNOWLEDGE BASE & POLICIES

1. Company Overview
- Self-publishing company operating in India and the US.
- Packages: Standard Free (no upfront cost) and Bestseller Breakthrough (premium paid package with marketing & distribution add-ons).
- Services: cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
- Printing Facilities: In-house printing facility and warehouse are located in Delhi. Partners include Repro India and Epitome Books.

2. Royalty Policy
- Splits: 80/20 royalty split (80% of net profit goes to author, 20% to BookLeaf).
- Net Profit Formula: Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Cycles: Calculated quarterly and paid within 45 days of the quarter ending.
- Threshold: Minimum payout threshold is ₹1,000. If accumulated royalties are below this, they roll over to the next quarter.
- Payment Method: Bank transfer to the account linked in the author's dashboard.
- Dashboards: Authors can view a detailed line-by-line royalty breakdown showing sales figures per platform.

3. ISBN Policy
- Assignment: Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf registered under BookLeaf's publisher imprint.
- Imprint: If an author wants an ISBN under their own imprint, they need to obtain it independently.
- ISBN Errors: If duplicate ISBN or wrong book linking is reported, treat as High-Priority and escalate to the production team immediately.

4. Printing & Quality
- Facilities: Delhi in-house printing facility. Overflow or specific format requirements go to Repro India or Epitome Books.
- Turnaround: Standard turnaround is 5-7 business days from order confirmation.
- Quality Defect Escalation: Free reprint arranged for misprints, binding defects, or color inconsistencies. Authors must share photos of the defective copy for verification.

5. Distribution & Availability
- Listings: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store.
- Turnaround: New listings typically go live within 7-10 business days after publication is complete.
- Unavailable Platforms: Stock sync issue. BookLeaf team can trigger a re-sync with the distribution team within 24-48 hours.

6. Production Stages
- Sequence: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Updates: Authors are updated via email. Delays happen at Cover Design (waiting author approval) and Proofreading (revision rounds).
`;

const TONE_AND_STYLE_GUIDELINES = `
COMMUNICATION TONE & STYLE GUIDELINES
- Always empathetic and professional. Authors are partners, not just customers.
- Acknowledge the author's concern, frustration, or anxiety before offering solutions.
- Be highly specific: include actual numbers, dates, and book statuses whenever possible instead of vague reassurances.
- Own mistakes directly. If BookLeaf is at fault (delayed royalties, ISBN error, quality issue), apologize clearly. No corporate deflection.
- Escalation Timelines: If an issue requires investigation, give a clear timeline (e.g., "Our team will look into this and get back to you within 48 hours") rather than open-ended promises.
- Next Steps: Always end with a clear next step for the author and/or the BookLeaf team.
`;

const FEW_SHOT_EXAMPLES = `
SAMPLE QUERY & RESPONSE TEMPLATES FOR TONE MATCHING:

Example 1: Royalty Cycle Query
- Author Query: "I published my book 4 months ago and still haven't received any royalty. What's going on?"
- Draft Response: "Dear Author, I completely understand your concern regarding your royalty payments, and I apologize for any anxiety this delay has caused. BookLeaf operates on a quarterly royalty cycle, and payouts are disbursed within 45 days of the quarter ending. Let me verify if your bank account is correctly linked in your dashboard. Our records show the next payout is scheduled for [Provide specific date]. If your payment is overdue, I am escalating this to our finance department, and we will update you within 48 hours. Rest assured we will resolve this quickly."

Example 2: Royalty Profit Transparency
- Author Query: "My royalty amount seems too low. I sold 200 copies but only received ₹3,000."
- Draft Response: "Dear Author, thank you for reaching out. I understand that receiving a lower royalty than expected can be concerning, and I'm happy to provide complete transparency on how this was calculated. BookLeaf follows an 80/20 split on net profits. Net profit is calculated as the Book's MRP minus printing costs, platform commission (Amazon/Flipkart), and shipping charges. In your case, for the 200 copies sold: [Insert line-by-line numbers if available]. I would be glad to share a detailed line-by-line spreadsheet breakdown of your sales. Please let us know if you'd like us to email this file to you."

Example 3: ISBN Discrepancy (High Priority)
- Author Query: "My book is showing a different ISBN on Amazon than what's on the physical copy."
- Draft Response: "Dear Author, thank you for bringing this to our attention. I sincerely apologize for this mismatch, as we treat ISBN linking errors with the highest priority. A mismatch between Amazon and your physical copy is a serious data issue. I have escalated this directly to our production team for immediate investigation. We will trigger a database correction and coordinate with Amazon's catalogue team. I will personally follow up with you with an update or resolution within the next 48 hours. Thank you for your patience."

Example 4: Terrible Printing Quality
- Author Query: "I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned."
- Draft Response: "Dear Author, I am incredibly sorry to hear that your author copies arrived in this condition. We take pride in our production quality, and this is certainly not the experience we want you to have. Since this is a printing quality defect, BookLeaf will arrange a free reprint of your copies immediately. To help us verify the issue with our Delhi printing team, could you please reply with a few photos showing the blurry images and misaligned pages? Once received, we will trigger the reprint and have them shipped to you within 5-7 business days."

Example 5: Amazon Availability Issue
- Author Query: "My book is published but it's showing as 'Currently Unavailable' on Amazon."
- Draft Response: "Dear Author, congratulations on your book's publication! I apologize for the concern regarding its availability on Amazon. This status usually indicates a stock sync issue between our warehouse and Amazon's systems. I am triggering a manual stock re-sync with our distribution team right away. This sync typically resolves the 'Currently Unavailable' status within 24-48 hours. I will monitor the listing and update you as soon as the purchase button is live."
`;

/**
 * Automatically classifies a ticket into a Category and Priority.
 */
async function classifyTicket(subject, description) {
  try {
    const config = getAIConfig();
    if (config.provider === 'none') {
      console.warn('AI provider configuration missing. Skipping auto-classification.');
      return null;
    }

    const prompt = `Classify the following support ticket into exactly one Category and assign a Priority score.

Categories:
- "Royalty & Payments" (for royalty splits, quarterly payments, bank transfer, or payout cycles)
- "ISBN & Metadata Issues" (for ISBN mismatch, registry imprint, book details edit)
- "Printing & Quality" (for blurry copy, misaligned pages, damaged copy, reprint requests)
- "Distribution & Availability" (for unavailable listings on Amazon/Flipkart/BookLeaf, stock sync errors)
- "Book Status & Production Updates" (for editing delays, cover approval, typesetting timeline)
- "General Inquiry" (for updates to author bio, general portal questions)

Priorities:
- "Critical" (Severe issues like wrong ISBN on Amazon, wrong royalties paid, complete publishing blocks)
- "High" (High impact like delayed payments, poor printing quality, wrong book description)
- "Medium" (Standard queries about status updates, platform availability, royalty schedules)
- "Low" (Minor items like editing author bio details, general information queries)

Ticket Subject: ${subject}
Ticket Description: ${description}

Output strictly as a JSON object, with no formatting wrappers, in this format:
{"category": "Category Name", "priority": "Priority Name"}`;

    const response = await config.client.chat.completions.create({
      model: config.models.classifier,
      messages: [
        { role: 'system', content: 'You are a highly accurate ticketing classification system. Output ONLY valid, parseable JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content.trim());
  } catch (error) {
    console.error('AI Classification failed:', error.message);
    return null; // Graceful degradation fallback
  }
}

/**
 * Drafts an empathetic, highly professional, policy-compliant response to an author,
 * taking into account the active message history and book context.
 */
async function draftResponse(ticket) {
  try {
    const config = getAIConfig();
    if (config.provider === 'none') {
      console.warn('AI provider configuration missing. Skipping draft generation.');
      return null;
    }

    // Filter out internal notes to maintain operational security
    const secureHistory = (ticket.messages || [])
      .filter(msg => !msg.isInternal)
      .slice(-6); // Limit to last 6 messages for cost-efficiency

    let historyText = '';
    if (secureHistory.length > 0) {
      historyText = secureHistory.map(msg => {
        const senderName = msg.sender?.name || 'User';
        const senderRole = msg.sender?.role === 'admin' ? 'Support' : 'Author';
        return `[${senderRole}] ${senderName}: "${msg.message}"`;
      }).join('\n');
    } else {
      historyText = `[Author] Query: "${ticket.description}"`;
    }

    const systemPrompt = `You are a professional, empathetic author support agent at BookLeaf Publishing. 
Your goal is to draft a helpful response to the author. 

Here is the BookLeaf Policy Knowledge Base:
${KNOWLEDGE_BASE}

Here are the Tone and Style guidelines you MUST follow:
${TONE_AND_STYLE_GUIDELINES}

Use these examples to calibrate your tone and content structure:
${FEW_SHOT_EXAMPLES}

Draft your response based strictly on the policies and tone guidelines. Be transparent, helpful, and specific.`;

    const userPrompt = `Draft a response for:
Ticket Subject: "${ticket.subject}"
Book Context: ${ticket.book ? `Title="${ticket.book.title}", ISBN="${ticket.book.isbn || 'N/A'}", Status="${ticket.book.status}", Royalties Paid=₹${ticket.book.royalty_paid || 0}, Royalties Pending=₹${ticket.book.royalty_pending || 0}` : 'General Inquiry (No associated book)'}

Active Message Thread (in chronological order):
${historyText}

Draft the reply to the LATEST message in the thread. Provide only the drafted email response text. Do not include subject lines or formal placeholder headers.`;

    const response = await config.client.chat.completions.create({
      model: config.models.drafter,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('AI Draft generation failed:', error.message);
    return null; // Graceful degradation fallback
  }
}

module.exports = { classifyTicket, draftResponse };
