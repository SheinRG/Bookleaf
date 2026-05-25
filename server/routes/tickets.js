const express = require('express');
const Ticket = require('../models/Ticket');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { classifyTicket, draftResponse } = require('../services/ai');

const router = express.Router();

// Get tickets with filtering
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, priority, category } = req.query;
    let query = {};

    // Role-based access control
    if (req.user.role === 'author') {
      query.author = req.user.id;
    }
    console.log(`[API] GET /tickets called by ${req.user.id} (${req.user.role}). Query:`, query);

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    const tickets = await Ticket.find(query)
      .populate('author', 'name email')
      .populate('book', 'title isbn')
      .populate('assigned_admin', 'name email')
      .populate('messages.sender', 'name email role');

    // Intelligent Sorting:
    // 1. Unresolved first (Open/In Progress) vs Resolved/Closed
    // 2. Unresolved sorted by priority weight (Critical > High > Medium > Low)
    // 3. Unresolved of same priority sorted by age (oldest first, i.e., createdAt ascending)
    // 4. Resolved/Closed tickets sorted newest first (createdAt descending)
    const priorityWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    tickets.sort((a, b) => {
      const aUnresolved = (a.status === 'Open' || a.status === 'In Progress') ? 1 : 0;
      const bUnresolved = (b.status === 'Open' || b.status === 'In Progress') ? 1 : 0;
      
      if (aUnresolved !== bUnresolved) {
        return bUnresolved - aUnresolved; // Unresolved first
      }
      
      if (aUnresolved === 1) {
        const aWeight = priorityWeight[a.priority] || 0;
        const bWeight = priorityWeight[b.priority] || 0;
        if (aWeight !== bWeight) {
          return bWeight - aWeight; // High priority weight first
        }
        return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
      }
    });

    res.json(tickets);
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ error: 'Failed to retrieve tickets.' });
  }
});

// Delete a ticket
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    console.log(`[API] DELETE /tickets/${req.params.id} called by ${req.user.id} (${req.user.role})`);
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role-based access control
    if (req.user.role === 'author') {
      // Authors can only delete their own tickets
      if (ticket.author.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You can only delete your own tickets.' });
      }
      // Authors can only delete Closed or Resolved tickets
      if (ticket.status !== 'Closed' && ticket.status !== 'Resolved') {
        return res.status(400).json({ error: 'Only closed or resolved tickets can be deleted.' });
      }
    }

    await Ticket.findByIdAndDelete(req.params.id);
    console.log(`[API] Ticket ${req.params.id} deleted successfully.`);
    res.json({ message: 'Ticket deleted successfully.' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ error: 'Failed to delete ticket.' });
  }
});

// Get single ticket by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('author', 'name email')
      .populate('book', 'title isbn')
      .populate('assigned_admin', 'name email')
      .populate('messages.sender', 'name email role');

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role-based access check
    if (req.user.role === 'author' && ticket.author._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Fetch ticket error:', error);
    res.status(500).json({ error: 'Failed to retrieve ticket.' });
  }
});

// Create a new ticket
router.post('/', verifyToken, async (req, res) => {
  try {
    const { subject, description, book_id } = req.body;

    if (!subject || !description) {
      return res.status(400).json({ error: 'Subject and description are required.' });
    }

    const newTicket = new Ticket({
      author: req.user.id,
      book: book_id || undefined,
      subject,
      description,
      // Default category and priority; AI integration (Phase 3) will override these
      category: 'General Inquiry',
      priority: 'Medium',
      messages: [{
        sender: req.user.id,
        message: description,
        isInternal: false
      }]
    });

    // AI classification will be injected here before saving
    const aiClassification = await classifyTicket(subject, description);
    if (aiClassification) {
      if (aiClassification.category) newTicket.category = aiClassification.category;
      if (aiClassification.priority) newTicket.priority = aiClassification.priority;
    }

    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ error: 'Failed to create ticket.' });
  }
});

// Update ticket (status, internal notes, assign admin)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const { status, category, priority, assigned_admin, new_message, is_internal } = req.body;
    
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    // Role checks
    if (req.user.role === 'author') {
      if (ticket.author.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
      // Authors can only add non-internal messages
      if (new_message) {
        ticket.messages.push({
          sender: req.user.id,
          message: new_message,
          isInternal: false
        });
      }
      // Authors cannot update status, category, priority, etc.
    } else if (req.user.role === 'admin') {
      // Admins can update everything
      if (status) ticket.status = status;
      if (category) ticket.category = category;
      if (priority) ticket.priority = priority;
      if (assigned_admin) {
        if (assigned_admin === 'unassigned' || assigned_admin === 'null') {
          ticket.assigned_admin = undefined;
        } else {
          ticket.assigned_admin = assigned_admin;
        }
      }
      
      if (new_message) {
        ticket.messages.push({
          sender: req.user.id,
          message: new_message,
          isInternal: is_internal || false
        });
      }
    }

    await ticket.save();
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('author', 'name email')
      .populate('book', 'title isbn')
      .populate('assigned_admin', 'name email')
      .populate('messages.sender', 'name email role');
    res.json(populatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ error: 'Failed to update ticket.' });
  }
});

// Draft response
router.get('/:id/draft', verifyToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('book')
      .populate('messages.sender', 'name email role');
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    console.log('[DEBUG] GET /:id/draft called by user:', req.user);
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Only admins can draft responses.' });
    }

    console.log(`[AI Draft] Generating draft for ticket: ${ticket._id} (subject: "${ticket.subject}")`);
    const draft = await draftResponse(ticket);
    
    if (!draft) {
      console.error('[AI Draft] draftResponse returned null — check GROQ_API_KEY or API errors above.');
      return res.status(500).json({ error: 'AI draft generation returned empty. Check your GROQ_API_KEY.' });
    }

    console.log(`[AI Draft] Success — draft length: ${draft.length} chars`);
    res.json({ draft });
  } catch (error) {
    console.error('Draft response error:', error);
    res.status(500).json({ error: 'Failed to generate draft.' });
  }
});



module.exports = router;
