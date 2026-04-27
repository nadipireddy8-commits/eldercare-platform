const router = require('express').Router();
const Booking = require('../models/Booking');
const Caregiver = require('../models/Caregiver');
const auth = require('../middleware/auth');

// Create booking
router.post('/', auth, async (req, res) => {
    try {
        const { caregiverId, date, timeSlot, duration, notes } = req.body;
        
        console.log('=== CREATE BOOKING ===');
        console.log('User ID:', req.user.id);
        console.log('Caregiver ID:', caregiverId);
        
        // Get caregiver info
        const caregiver = await Caregiver.findById(caregiverId);
        if (!caregiver) {
            console.log('Caregiver not found');
            return res.status(404).json({ message: 'Caregiver not found' });
        }
        
        console.log('Caregiver found:', caregiver.name);
        
        const booking = new Booking({
            userId: req.user.id,
            caregiverId: caregiverId,
            caregiverName: caregiver.name,
            date: date || new Date(),
            timeSlot: timeSlot || 'Morning',
            duration: duration || 2,
            status: 'Pending',
            notes: notes || ''
        });
        
        await booking.save();
        console.log('Booking created successfully:', booking._id);
        console.log('Booking:', booking);
        
        res.status(201).json(booking);
    } catch (error) {
        console.error('Booking creation error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get all bookings for current user
router.get('/', auth, async (req, res) => {
    try {
        console.log('=== GET BOOKINGS ===');
        console.log('User ID:', req.user.id);
        console.log('User Role:', req.user.role);
        
        let bookings;
        
        if (req.user.role === 'admin') {
            bookings = await Booking.find().sort({ createdAt: -1 });
        } else {
            // Find bookings where userId matches the logged-in user
            bookings = await Booking.find({ 
                userId: req.user.id 
            }).sort({ createdAt: -1 });
        }
        
        console.log(`Found ${bookings.length} bookings`);
        
        // Log each booking for debugging
        bookings.forEach(booking => {
            console.log(`Booking ${booking._id}: User=${booking.userId}, Caregiver=${booking.caregiverName}, Status=${booking.status}`);
        });
        
        res.json(bookings);
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Get single booking
router.get('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Check access
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update booking status
router.put('/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Check authorization
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        booking.status = status;
        await booking.save();
        
        res.json(booking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete/Cancel booking
router.delete('/:id', auth, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        if (booking.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        await booking.deleteOne();
        
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;