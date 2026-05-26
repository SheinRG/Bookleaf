/**
 * reset-db.js — Wipes ALL data (users, books, tickets) and re-seeds from scratch.
 * 
 * Usage:
 *   node reset-db.js
 * 
 * It will use the MONGODB_URI from your .env file.
 * This means if your .env points to Atlas (production), it resets production.
 * If it points to localhost, it resets local.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const User = require('./models/User');
const Book = require('./models/Book');
const Ticket = require('./models/Ticket');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf';

async function resetDatabase() {
  try {
    console.log(`\n🔌 Connecting to: ${MONGODB_URI.substring(0, 40)}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Nuke everything
    const deletedUsers = await User.deleteMany({});
    const deletedBooks = await Book.deleteMany({});
    const deletedTickets = await Ticket.deleteMany({});
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} users, ${deletedBooks.deletedCount} books, ${deletedTickets.deletedCount} tickets.\n`);

    // 2. Re-seed clean data from the sample JSON
    const dataPath = path.join(__dirname, '..', 'bookleaf_sample_data (full stack).json');
    
    if (!fs.existsSync(dataPath)) {
      console.error('❌ Sample data file not found at:', dataPath);
      console.log('   Skipping author/book seed. Only creating admin account.\n');
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@bookleaf.com',
      password: 'password123',
      role: 'admin'
    });
    console.log('👤 Admin created → admin@bookleaf.com / password123');

    // Seed authors & books if data file exists
    if (fs.existsSync(dataPath)) {
      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(rawData);

      let authorCount = 0;
      let bookCount = 0;

      for (const authorData of data.authors) {
        const author = await User.create({
          name: authorData.name,
          email: authorData.email,
          password: 'password123',
          role: 'author',
          phone: authorData.phone,
          city: authorData.city,
          joined_date: authorData.joined_date ? new Date(authorData.joined_date) : undefined
        });
        authorCount++;

        if (authorData.books && authorData.books.length > 0) {
          for (const bookData of authorData.books) {
            await Book.create({
              author: author._id,
              title: bookData.title,
              isbn: bookData.isbn,
              genre: bookData.genre,
              publication_date: bookData.publication_date ? new Date(bookData.publication_date) : undefined,
              status: bookData.status,
              mrp: bookData.mrp,
              author_royalty_per_copy: bookData.author_royalty_per_copy,
              total_copies_sold: bookData.total_copies_sold,
              total_royalty_earned: bookData.total_royalty_earned,
              royalty_paid: bookData.royalty_paid,
              royalty_pending: bookData.royalty_pending,
              last_royalty_payout_date: bookData.last_royalty_payout_date ? new Date(bookData.last_royalty_payout_date) : undefined,
              print_partner: bookData.print_partner,
              available_on: bookData.available_on || []
            });
            bookCount++;
          }
        }
      }
      console.log(`📚 Seeded ${authorCount} authors and ${bookCount} books.`);
    }

    console.log('\n🎉 Database reset complete! No tickets exist — fresh start.\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset error:', error);
    process.exit(1);
  }
}

resetDatabase();
