const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration - Allow frontend to connect
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://eldercare-frontend.onrender.com',
    process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(null, true); // Allow all for now
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ============ IN-MEMORY DATABASE ============
let users = [];
let caregivers = [];
let bookings = [];
let nextId = 10;

const salt = bcrypt.genSaltSync(10);

// Create admin user
users.push({
    _id: '1',
    name: 'Super Admin',
    email: 'admin@eldercare.com',
    password: bcrypt.hashSync('Admin@123', salt),
    role: 'admin',
    phone: '+1 555-0000',
    isActive: true,
    createdAt: new Date()
});

// Create regular users
users.push({
    _id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    password: bcrypt.hashSync('password123', salt),
    role: 'family',
    phone: '+1 555-0101',
    isActive: true,
    createdAt: new Date()
});

users.push({
    _id: '3',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    password: bcrypt.hashSync('password123', salt),
    role: 'family',
    phone: '+1 555-0102',
    isActive: true,
    createdAt: new Date()
});

// Create caregivers
caregivers.push({
    _id: '1',
    name: 'Emily Wilson',
    service: 'Companionship',
    experience: 5,
    verified: true,
    description: 'Experienced caregiver specializing in elderly companionship.',
    phone: '+1 555-0201',
    email: 'emily@caregiver.com',
    hourlyRate: 25,
    rating: 4.8,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '2',
    name: 'David Chen',
    service: 'Medical Care',
    experience: 8,
    verified: true,
    description: 'Registered nurse with 8 years of experience.',
    phone: '+1 555-0202',
    email: 'david@caregiver.com',
    hourlyRate: 35,
    rating: 4.9,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '3',
    name: 'Robert Taylor',
    service: 'Dementia Care',
    experience: 10,
    verified: true,
    description: 'Specialist in dementia and Alzheimer\'s care.',
    phone: '+1 555-0203',
    email: 'robert@caregiver.com',
    hourlyRate: 40,
    rating: 5.0,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '4',
    name: 'Maria Garcia',
    service: 'Personal Care',
    experience: 4,
    verified: false,
    description: 'Compassionate caregiver for personal care.',
    phone: '+1 555-0204',
    email: 'maria@caregiver.com',
    hourlyRate: 22,
    rating: 4.5,
    available: true,
    createdAt: new Date()
});

// Sample bookings
bookings.push({
    _id: '101',
    bookingId: 'BK000001',
    userId: '2',
    caregiverId: '1',
    caregiverName: 'Emily Wilson',
    date: new Date('2026-04-05'),
    timeSlot: 'Morning',
    duration: 3,
    totalAmount: 75,
    status: 'Accepted',
    notes: 'First time booking',
    createdAt: new Date('2026-04-01')
});

bookings.push({
    _id: '102',
    bookingId: 'BK000002',
    userId: '2',
    caregiverId: '3',
    caregiverName: 'Robert Taylor',
    date: new Date('2026-04-22'),
    timeSlot: 'Morning',
    duration: 2,
    totalAmount: 80,
    status: 'Cancelled',
    notes: 'Booking request for Robert Taylor',
    createdAt: new Date('2026-04-20')
});

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded;
        next();
    } catch(error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

const adminAuth = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// ============ AUTH ROUTES ============
app.post('/api/auth/register', (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        
        nextId++;
        const newUser = {
            _id: String(nextId),
            name,
            email,
            password: bcrypt.hashSync(password, salt),
            role: role || 'family',
            isActive: true,
            createdAt: new Date()
        };
        users.push(newUser);
        
        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, role: newUser.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        
        res.status(201).json({
            token,
            user: { _id: newUser._id, name, email, role: newUser.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

app.post('/api/auth/login', (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const isValid = bcrypt.compareSync(password, user.password);
        if (!isValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: { _id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/me', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

// ============ CAREGIVER ROUTES ============
app.get('/api/caregivers', (req, res) => {
    res.json(caregivers);
});

app.get('/api/caregivers/:id', (req, res) => {
    const caregiver = caregivers.find(c => c._id === req.params.id);
    if (!caregiver) {
        return res.status(404).json({ message: 'Caregiver not found' });
    }
    res.json(caregiver);
});

// ============ BOOKING ROUTES ============
app.post('/api/bookings', auth, (req, res) => {
    try {
        const { caregiverId, date, timeSlot, duration, notes } = req.body;
        
        const caregiver = caregivers.find(c => c._id === caregiverId);
        if (!caregiver) {
            return res.status(404).json({ message: 'Caregiver not found' });
        }
        
        nextId++;
        const totalAmount = (duration || 2) * (caregiver.hourlyRate || 25);
        
        const newBooking = {
            _id: String(nextId),
            bookingId: `BK${String(bookings.length + 1).padStart(6, '0')}`,
            userId: req.user.id,
            caregiverId,
            caregiverName: caregiver.name,
            date: date ? new Date(date) : new Date(),
            timeSlot: timeSlot || 'Morning',
            duration: duration || 2,
            totalAmount,
            status: 'Pending',
            notes: notes || '',
            createdAt: new Date()
        };
        
        bookings.push(newBooking);
        res.status(201).json(newBooking);
        
    } catch (error) {
        console.error('Booking error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/bookings', auth, (req, res) => {
    const userBookings = bookings.filter(b => b.userId === req.user.id);
    res.json(userBookings);
});

app.put('/api/bookings/:id/cancel', auth, (req, res) => {
    const booking = bookings.find(b => b._id === req.params.id && b.userId === req.user.id);
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }
    booking.status = 'Cancelled';
    res.json({ message: 'Booking cancelled successfully', booking });
});

// ============ PATIENT PROFILE ROUTES ============
app.get('/api/patients/:userId', auth, (req, res) => {
    const user = users.find(u => u._id === req.params.userId);
    if (!user) {
        return res.json({});
    }
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

app.post('/api/patients', auth, (req, res) => {
    const userIndex = users.findIndex(u => u._id === req.user.id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...req.body };
        const { password, ...userWithoutPassword } = users[userIndex];
        res.json(userWithoutPassword);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// ============ ADMIN ROUTES ============
app.get('/api/admin/stats', auth, adminAuth, (req, res) => {
    const totalRevenue = bookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    res.json({
        totalUsers: users.length,
        totalCaregivers: caregivers.length,
        totalBookings: bookings.length,
        totalRevenue: totalRevenue,
        pendingBookings: bookings.filter(b => b.status === 'Pending').length,
        completedBookings: bookings.filter(b => b.status === 'Completed').length,
        verifiedCaregivers: caregivers.filter(c => c.verified).length,
        avgRating: (caregivers.reduce((sum, c) => sum + (c.rating || 0), 0) / caregivers.length).toFixed(1)
    });
});

app.get('/api/admin/caregivers', auth, adminAuth, (req, res) => {
    res.json(caregivers);
});

app.post('/api/admin/caregivers', auth, adminAuth, (req, res) => {
    nextId++;
    const newCaregiver = {
        _id: String(nextId),
        ...req.body,
        verified: false,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date()
    };
    caregivers.push(newCaregiver);
    res.status(201).json(newCaregiver);
});

app.put('/api/admin/caregivers/:id', auth, adminAuth, (req, res) => {
    const index = caregivers.findIndex(c => c._id === req.params.id);
    if (index !== -1) {
        caregivers[index] = { ...caregivers[index], ...req.body };
        res.json(caregivers[index]);
    } else {
        res.status(404).json({ message: 'Caregiver not found' });
    }
});

app.delete('/api/admin/caregivers/:id', auth, adminAuth, (req, res) => {
    const index = caregivers.findIndex(c => c._id === req.params.id);
    if (index !== -1) {
        caregivers.splice(index, 1);
        res.json({ message: 'Caregiver deleted successfully' });
    } else {
        res.status(404).json({ message: 'Caregiver not found' });
    }
});

app.put('/api/admin/caregivers/:id/verify', auth, adminAuth, (req, res) => {
    const caregiver = caregivers.find(c => c._id === req.params.id);
    if (caregiver) {
        caregiver.verified = true;
        res.json(caregiver);
    } else {
        res.status(404).json({ message: 'Caregiver not found' });
    }
});

app.get('/api/admin/users', auth, adminAuth, (req, res) => {
    const safeUsers = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
    });
    res.json(safeUsers);
});

app.put('/api/admin/users/:id', auth, adminAuth, (req, res) => {
    const index = users.findIndex(u => u._id === req.params.id);
    if (index !== -1) {
        users[index] = { ...users[index], ...req.body };
        const { password, ...safeUser } = users[index];
        res.json(safeUser);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.delete('/api/admin/users/:id', auth, adminAuth, (req, res) => {
    const index = users.findIndex(u => u._id === req.params.id);
    if (index !== -1) {
        users.splice(index, 1);
        res.json({ message: 'User deleted successfully' });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

app.get('/api/admin/bookings', auth, adminAuth, (req, res) => {
    res.json(bookings);
});

app.put('/api/admin/bookings/:id', auth, adminAuth, (req, res) => {
    const booking = bookings.find(b => b._id === req.params.id);
    if (booking) {
        booking.status = req.body.status;
        res.json(booking);
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
});

app.delete('/api/admin/bookings/:id', auth, adminAuth, (req, res) => {
    const index = bookings.findIndex(b => b._id === req.params.id);
    if (index !== -1) {
        bookings.splice(index, 1);
        res.json({ message: 'Booking deleted successfully' });
    } else {
        res.status(404).json({ message: 'Booking not found' });
    }
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running (in-memory mode)',
        timestamp: new Date(),
        stats: {
            users: users.length,
            caregivers: caregivers.length,
            bookings: bookings.length
        }
    });
});

// ============ START SERVER ============
const PORT = process.env.PORT || 5001;
// ============ CAREGIVER PORTAL ROUTES ============

// Get caregiver information from user ID
function getCaregiverIdByUserId(userId) {
    const caregiver = caregivers.find(c => c.userId === userId);
    return caregiver ? caregiver._id : null;
}

// Caregiver Dashboard Stats
app.get('/api/caregiver/stats', auth, (req, res) => {
    // Check if user is a caregiver
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiverId = getCaregiverIdByUserId(req.user.id);
    if (!caregiverId) {
        return res.json({ pending: 0, accepted: 0, completed: 0, earnings: 0 });
    }
    
    const caregiverBookings = bookings.filter(b => b.caregiverId === caregiverId);
    
    const stats = {
        pending: caregiverBookings.filter(b => b.status === 'Pending').length,
        accepted: caregiverBookings.filter(b => b.status === 'Accepted').length,
        inProgress: caregiverBookings.filter(b => b.status === 'In Progress').length,
        completed: caregiverBookings.filter(b => b.status === 'Completed').length,
        earnings: caregiverBookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };
    res.json(stats);
});

// Get all caregiver requests
app.get('/api/caregiver/requests', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiverId = getCaregiverIdByUserId(req.user.id);
    if (!caregiverId) {
        return res.json([]);
    }
    
    const caregiverBookings = bookings.filter(b => b.caregiverId === caregiverId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add patient info to each booking
    const bookingsWithPatient = caregiverBookings.map(booking => {
        const patient = users.find(u => u._id === booking.userId);
        return {
            ...booking,
            patientName: patient?.name || 'Patient',
            patientPhone: patient?.phone || '',
            patientAddress: patient?.address || 'Address not provided'
        };
    });
    
    res.json(bookingsWithPatient);
});

// Accept a service request
app.put('/api/caregiver/requests/:id/accept', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const booking = bookings.find(b => b._id === req.params.id);
    if (!booking) {
        return res.status(404).json({ message: 'Request not found' });
    }
    
    booking.status = 'Accepted';
    res.json({ message: 'Request accepted successfully', booking });
});

// Reject a service request
app.put('/api/caregiver/requests/:id/reject', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const booking = bookings.find(b => b._id === req.params.id);
    if (!booking) {
        return res.status(404).json({ message: 'Request not found' });
    }
    
    booking.status = 'Cancelled';
    res.json({ message: 'Request rejected', booking });
});

// Update service status (Start/Complete)
app.put('/api/caregiver/requests/:id/status', auth, (req, res) => {
    const { status, notes } = req.body;
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const booking = bookings.find(b => b._id === req.params.id);
    if (!booking) {
        return res.status(404).json({ message: 'Request not found' });
    }
    
    booking.status = status;
    if (notes) {
        booking.careNotes = notes;
    }
    if (status === 'Completed') {
        booking.completedAt = new Date();
    }
    
    res.json({ message: `Service ${status.toLowerCase()}`, booking });
});

// Add care notes
app.post('/api/caregiver/care-notes', auth, (req, res) => {
    const { bookingId, notes } = req.body;
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const booking = bookings.find(b => b._id === bookingId);
    if (!booking) {
        return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (!booking.careNotes) {
        booking.careNotes = [];
    }
    booking.careNotes.push({
        note: notes,
        date: new Date(),
        caregiverName: user.name
    });
    
    res.json({ message: 'Care note added successfully' });
});

// Get caregiver earnings
app.get('/api/caregiver/earnings', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiverId = getCaregiverIdByUserId(req.user.id);
    if (!caregiverId) {
        return res.json({ total: 0, thisMonth: 0, completedCount: 0, history: [] });
    }
    
    const completedBookings = bookings.filter(b => 
        b.caregiverId === caregiverId && b.status === 'Completed'
    );
    
    const now = new Date();
    const thisMonth = completedBookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate.getMonth() === now.getMonth() && 
               bookingDate.getFullYear() === now.getFullYear();
    });
    
    res.json({
        total: completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        thisMonth: thisMonth.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
        completedCount: completedBookings.length,
        history: completedBookings.map(b => ({
            id: b._id,
            serviceType: b.caregiverName,
            date: b.date,
            amount: b.totalAmount,
            patientName: users.find(u => u._id === b.userId)?.name || 'Patient'
        }))
    });
});

// Get caregiver profile
app.get('/api/caregiver/profile', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiver = caregivers.find(c => c.userId === req.user.id);
    res.json({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        service: caregiver?.service || '',
        experience: caregiver?.experience || 0,
        bio: caregiver?.description || '',
        hourlyRate: caregiver?.hourlyRate || 25,
        verified: caregiver?.verified || false
    });
});

// Update caregiver profile
app.put('/api/caregiver/profile', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    // Update user info
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    // Update caregiver info
    const caregiver = caregivers.find(c => c.userId === req.user.id);
    if (caregiver) {
        caregiver.service = req.body.service || caregiver.service;
        caregiver.experience = req.body.experience || caregiver.experience;
        caregiver.description = req.body.bio || caregiver.description;
        caregiver.hourlyRate = req.body.hourlyRate || caregiver.hourlyRate;
    }
    
    res.json({ message: 'Profile updated successfully' });
});
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(55));
    console.log('🚀 ELDERCARE BACKEND RUNNING');
    console.log('='.repeat(55));
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   👑 Admin: admin@eldercare.com / Admin@123');
    console.log('   👤 User: john@example.com / password123');
    console.log('\n📊 DATA STATUS:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Caregivers: ${caregivers.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('='.repeat(55) + '\n');
});