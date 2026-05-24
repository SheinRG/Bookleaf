const mongoose = require('mongoose');
const Ticket = require('./server/models/Ticket');
require('dotenv').config({ path: './server/.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf';

async function dump() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to DB');
  
  const tickets = await Ticket.find().populate('messages.sender');
  for (const t of tickets) {
    console.log(`Ticket: ${t.subject} (ID: ${t._id})`);
    console.log(`Author: ${t.author}`);
    console.log('Messages:');
    t.messages.forEach((m, idx) => {
      console.log(`  [${idx}] Sender: ${m.sender ? m.sender._id || m.sender : 'null'} (${m.sender ? m.sender.name || 'no-name' : 'null'}) - Message: "${m.message}"`);
    });
  }
  
  await mongoose.disconnect();
}

dump();
