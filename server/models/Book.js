const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  isbn: String,
  genre: String,
  publication_date: Date,
  status: String,
  mrp: Number,
  author_royalty_per_copy: Number,
  total_copies_sold: { type: Number, default: 0 },
  total_royalty_earned: { type: Number, default: 0 },
  royalty_paid: { type: Number, default: 0 },
  royalty_pending: { type: Number, default: 0 },
  last_royalty_payout_date: Date,
  print_partner: String,
  available_on: [String]
}, { timestamps: true });

module.exports = mongoose.model('Book', BookSchema);
