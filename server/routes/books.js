const express = require('express');
const Book = require('../models/Book');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    let query = {};
    
    // Role-based access control: authors see only their books
    if (req.user.role === 'author') {
      query.author = req.user.id;
    }

    const books = await Book.find(query).populate('author', 'name email');
    res.json(books);
  } catch (error) {
    console.error('Fetch books error:', error);
    res.status(500).json({ error: 'Failed to retrieve books.' });
  }
});

// Update a book's status (for manuscripts dashboard) or details
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('author', 'name email');
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    res.json(book);
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Failed to update book.' });
  }
});

// Process a royalty payout for a book
router.post('/:id/payout', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }

    if (book.royalty_pending <= 0) {
      return res.status(400).json({ error: 'No pending royalties to pay.' });
    }

    book.royalty_paid = (book.royalty_paid || 0) + book.royalty_pending;
    book.royalty_pending = 0;
    book.last_royalty_payout_date = new Date();
    await book.save();

    const updatedBook = await Book.findById(book._id).populate('author', 'name email');
    res.json(updatedBook);
  } catch (error) {
    console.error('Payout book error:', error);
    res.status(500).json({ error: 'Failed to process payout.' });
  }
});

module.exports = router;
