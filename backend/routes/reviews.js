const router = require('express').Router();
const Review = require('../models/Review');
const Caregiver = require('../models/Caregiver');
const auth = require('../middleware/auth');

// Get reviews for a caregiver
router.get('/caregiver/:caregiverId', async (req, res) => {
    try {
        const reviews = await Review.find({ caregiverId: req.params.caregiverId })
            .populate('userId', 'name')
            .sort({ createdAt: -1 });
        
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create review
router.post('/', auth, async (req, res) => {
    try {
        const { caregiverId, rating, comment, bookingId } = req.body;
        
        const review = new Review({
            caregiverId,
            userId: req.user.id,
            rating,
            comment,
            bookingId
        });
        
        await review.save();
        
        // Update caregiver rating
        const reviews = await Review.find({ caregiverId });
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        
        await Caregiver.findByIdAndUpdate(caregiverId, {
            rating: avgRating,
            totalReviews: reviews.length
        });
        
        res.status(201).json(review);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update review
router.put('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const updated = await Review.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        
        if (!review) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        if (review.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        await review.deleteOne();
        res.json({ message: 'Review deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;