const router = require('express').Router();
const Caregiver = require('../models/Caregiver');
const auth = require('../middleware/auth');

// Get all caregivers
router.get('/', async (req, res) => {
    try {
        const caregivers = await Caregiver.find().sort({ rating: -1 });
        res.json(caregivers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single caregiver
router.get('/:id', async (req, res) => {
    try {
        const caregiver = await Caregiver.findById(req.params.id);
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver not found' });
        }
        res.json(caregiver);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create caregiver profile (only for caregivers)
router.post('/', auth, async (req, res) => {
    try {
        // Check if user is a caregiver
        if (req.user.role !== 'caregiver') {
            return res.status(403).json({ message: 'Only caregivers can create profiles' });
        }
        
        const caregiver = new Caregiver({
            ...req.body,
            userId: req.user.id
        });
        
        await caregiver.save();
        res.status(201).json(caregiver);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update caregiver profile
router.put('/:id', auth, async (req, res) => {
    try {
        const caregiver = await Caregiver.findById(req.params.id);
        
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver not found' });
        }
        
        // Check ownership
        if (caregiver.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const updated = await Caregiver.findByIdAndUpdate(
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

// Delete caregiver profile
router.delete('/:id', auth, async (req, res) => {
    try {
        const caregiver = await Caregiver.findById(req.params.id);
        
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver not found' });
        }
        
        if (caregiver.userId.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        await caregiver.deleteOne();
        res.json({ message: 'Caregiver profile deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;