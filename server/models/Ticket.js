const mongoose = require('mongoose');

const TicketMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isInternal: { type: Boolean, default: false }
}, { timestamps: true });

const TicketSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  category: { type: String, enum: ['Royalty & Payments', 'ISBN & Metadata Issues', 'Printing & Quality', 'Distribution & Availability', 'Book Status & Production Updates', 'General Inquiry'], default: 'General Inquiry' },
  priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
  assigned_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ai_draft: { type: String },
  messages: [TicketMessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Ticket', TicketSchema);
