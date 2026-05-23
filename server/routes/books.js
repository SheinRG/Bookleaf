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

module.exports = router;
