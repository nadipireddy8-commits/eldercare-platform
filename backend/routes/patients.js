const router = require('express').Router();
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// Get patient profile
router.get('/:userId', auth, async (req, res) => {
    try {
        // Check access
        if (req.params.userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        const patient = await Patient.findOne({ userId: req.params.userId });
        
        if (!patient) {
            return res.json(null);
        }
        
        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create or update patient profile
router.post('/', auth, async (req, res) => {
    try {
        const { userId, ...profileData } = req.body;
        
        // Check access
        if (userId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized' });
        }
        
        let patient = await Patient.findOne({ userId });
        
        if (patient) {
            // Update existing
            patient = await Patient.findOneAndUpdate(
                { userId },
                { $set: profileData },
                { new: true }
            );
        } else {
            // Create new
            patient = new Patient({
                userId,
                ...profileData
            });
            await patient.save();
        }
        
        res.json(patient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;