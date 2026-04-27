const router = require('express').Router();
const User = require('../models/User');
const Caregiver = require('../models/Caregiver');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const Payment = require('../models/Payment');
const Service = require('../models/Service');
const adminAuth = require('../middleware/adminAuth');
const bcrypt = require('bcryptjs');

// ============ DASHBOARD STATS ============
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalCaregivers = await Caregiver.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalRevenue = await Booking.aggregate([
            { $match: { paymentStatus: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const pendingBookings = await Booking.countDocuments({ status: 'Pending' });
        const completedBookings = await Booking.countDocuments({ status: 'Completed' });
        const verifiedCaregivers = await Caregiver.countDocuments({ verified: true });
        const avgRating = await Review.aggregate([
            { $group: { _id: null, avg: { $avg: '$rating' } } }
        ]);

        res.json({
            totalUsers,
            totalCaregivers,
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingBookings,
            completedBookings,
            verifiedCaregivers,
            avgRating: avgRating[0]?.avg || 0,
            monthlyData: await getMonthlyStats()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

async function getMonthlyStats() {
    const monthlyBookings = await Booking.aggregate([
        {
            $group: {
                _id: { $month: '$createdAt' },
                count: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { '_id': 1 } }
    ]);
    return monthlyBookings;
}

// ============ USER MANAGEMENT ============
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/users/:id', adminAuth, async (req, res) => {
    try {
        const { name, email, role, isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, role, isActive, updatedAt: Date.now() },
            { new: true }
        ).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ CAREGIVER MANAGEMENT ============
router.get('/caregivers', adminAuth, async (req, res) => {
    try {
        const caregivers = await Caregiver.find().populate('userId', 'name email').sort({ createdAt: -1 });
        res.json(caregivers);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/caregivers', adminAuth, async (req, res) => {
    try {
        const caregiver = new Caregiver(req.body);
        await caregiver.save();
        res.status(201).json(caregiver);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/caregivers/:id', adminAuth, async (req, res) => {
    try {
        const caregiver = await Caregiver.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: Date.now() },
            { new: true }
        );
        res.json(caregiver);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/caregivers/:id', adminAuth, async (req, res) => {
    try {
        await Caregiver.findByIdAndDelete(req.params.id);
        res.json({ message: 'Caregiver deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/caregivers/:id/verify', adminAuth, async (req, res) => {
    try {
        const caregiver = await Caregiver.findByIdAndUpdate(
            req.params.id,
            { verified: true, updatedAt: Date.now() },
            { new: true }
        );
        res.json(caregiver);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ BOOKING MANAGEMENT ============
router.get('/bookings', adminAuth, async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate('userId', 'name email')
            .populate('caregiverId', 'name')
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/bookings/:id', adminAuth, async (req, res) => {
    try {
        const { status, paymentStatus } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status, paymentStatus, updatedAt: Date.now() },
            { new: true }
        );
        res.json(booking);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/bookings/:id', adminAuth, async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ SERVICE MANAGEMENT ============
router.get('/services', adminAuth, async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/services', adminAuth, async (req, res) => {
    try {
        const service = new Service(req.body);
        await service.save();
        res.status(201).json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/services/:id', adminAuth, async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(service);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/services/:id', adminAuth, async (req, res) => {
    try {
        await Service.findByIdAndDelete(req.params.id);
        res.json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ============ REPORTS ============
router.get('/reports/bookings', adminAuth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const query = {};
        if (startDate && endDate) {
            query.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const bookings = await Booking.find(query)
            .populate('userId', 'name email')
            .populate('caregiverId', 'name');
        
        const totalAmount = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        
        res.json({
            bookings,
            totalBookings: bookings.length,
            totalAmount,
            averageAmount: bookings.length > 0 ? totalAmount / bookings.length : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;