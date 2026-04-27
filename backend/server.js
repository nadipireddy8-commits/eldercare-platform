const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// ============ IN-MEMORY DATABASE ============
let users = [];
let caregivers = [];
let bookings = [];
let nextId = 1;

const salt = bcrypt.genSaltSync(10);

// Create admin
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
    description: 'Experienced caregiver specializing in elderly companionship, conversation, and daily living assistance. Certified in first aid and CPR.',
    phone: '+1 555-0201',
    email: 'emily@caregiver.com',
    hourlyRate: 25,
    rating: 4.8,
    totalReviews: 12,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '2',
    name: 'David Chen',
    service: 'Medical Care',
    experience: 8,
    verified: true,
    description: 'Registered nurse with 8 years of experience in geriatric care, medication management, and post-operative care.',
    phone: '+1 555-0202',
    email: 'david@caregiver.com',
    hourlyRate: 35,
    rating: 4.9,
    totalReviews: 24,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '3',
    name: 'Robert Taylor',
    service: 'Dementia Care',
    experience: 10,
    verified: true,
    description: 'Specialist in dementia and Alzheimer\'s care with 10+ years experience. Certified dementia practitioner.',
    phone: '+1 555-0203',
    email: 'robert@caregiver.com',
    hourlyRate: 40,
    rating: 5.0,
    totalReviews: 32,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '4',
    name: 'Maria Garcia',
    service: 'Personal Care',
    experience: 4,
    verified: false,
    description: 'Compassionate caregiver trained in personal care, bathing assistance, and mobility support.',
    phone: '+1 555-0204',
    email: 'maria@caregiver.com',
    hourlyRate: 22,
    rating: 4.5,
    totalReviews: 8,
    available: true,
    createdAt: new Date()
});

// Sample bookings
bookings.push({
    _id: '1',
    bookingId: 'BK000001',
    userId: '2',
    caregiverId: '1',
    caregiverName: 'Emily Wilson',
    date: new Date('2024-04-05'),
    timeSlot: 'Morning',
    duration: 3,
    totalAmount: 75,
    status: 'Accepted',
    notes: 'First time booking',
    createdAt: new Date('2024-04-01')
});

// ============ AUTH MIDDLEWARE ============
const auth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
        const decoded = jwt.verify(token, 'secret');
        req.user = decoded;
        next();
    } catch(e) {
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
    const { name, email, password, role } = req.body;
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = {
        _id: String(++nextId),
        name,
        email,
        password: bcrypt.hashSync(password, salt),
        role: role || 'family',
        isActive: true,
        createdAt: new Date()
    };
    users.push(newUser);
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, 'secret', { expiresIn: '7d' });
    res.json({
        token,
        user: { _id: newUser._id, name, email, role: newUser.role }
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, 'secret', { expiresIn: '7d' });
    res.json({
        token,
        user: { _id: user._id, name: user.name, email: user.email, role: user.role }
    });
});

app.get('/api/auth/me', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    res.json({ ...user, password: undefined });
});

// ============ CAREGIVER ROUTES ============
app.get('/api/caregivers', (req, res) => {
    res.json(caregivers);
});

app.get('/api/caregivers/:id', (req, res) => {
    const caregiver = caregivers.find(c => c._id === req.params.id);
    if (!caregiver) return res.status(404).json({ message: 'Not found' });
    res.json(caregiver);
});

// ============ BOOKING ROUTES ============
app.post('/api/bookings', auth, (req, res) => {
    const { caregiverId, date, timeSlot, duration, notes } = req.body;
    const caregiver = caregivers.find(c => c._id === caregiverId);
    if (!caregiver) return res.status(404).json({ message: 'Caregiver not found' });
    
    const booking = {
        _id: String(++nextId),
        bookingId: `BK${String(bookings.length + 1).padStart(6, '0')}`,
        userId: req.user.id,
        caregiverId,
        caregiverName: caregiver.name,
        date: date ? new Date(date) : new Date(),
        timeSlot: timeSlot || 'Morning',
        duration: duration || 2,
        totalAmount: (duration || 2) * (caregiver.hourlyRate || 25),
        status: 'Pending',
        notes: notes || '',
        createdAt: new Date()
    };
    bookings.push(booking);
    res.status(201).json(booking);
});

app.get('/api/bookings', auth, (req, res) => {
    const userBookings = bookings.filter(b => b.userId === req.user.id);
    res.json(userBookings);
});

app.put('/api/bookings/:id/cancel', auth, (req, res) => {
    const booking = bookings.find(b => b._id === req.params.id && b.userId === req.user.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'Cancelled';
    res.json({ message: 'Booking cancelled' });
});

// ============ PATIENT ROUTES ============
app.get('/api/patients/:userId', auth, (req, res) => {
    const user = users.find(u => u._id === req.params.userId);
    res.json(user || {});
});

app.post('/api/patients', auth, (req, res) => {
    const index = users.findIndex(u => u._id === req.user.id);
    if (index !== -1) {
        users[index] = { ...users[index], ...req.body };
        res.json(users[index]);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// ============ ADMIN ROUTES ============
app.get('/api/admin/stats', auth, adminAuth, (req, res) => {
    res.json({
        totalUsers: users.length,
        totalCaregivers: caregivers.length,
        totalBookings: bookings.length,
        totalRevenue: bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
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
    const newCaregiver = {
        _id: String(++nextId),
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
        res.status(404).json({ message: 'Not found' });
    }
});

app.delete('/api/admin/caregivers/:id', auth, adminAuth, (req, res) => {
    const index = caregivers.findIndex(c => c._id === req.params.id);
    if (index !== -1) {
        caregivers.splice(index, 1);
        res.json({ message: 'Caregiver deleted' });
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

app.put('/api/admin/caregivers/:id/verify', auth, adminAuth, (req, res) => {
    const caregiver = caregivers.find(c => c._id === req.params.id);
    if (caregiver) {
        caregiver.verified = true;
        res.json(caregiver);
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

app.get('/api/admin/users', auth, adminAuth, (req, res) => {
    const safeUsers = users.map(u => ({ ...u, password: undefined }));
    res.json(safeUsers);
});

app.put('/api/admin/users/:id', auth, adminAuth, (req, res) => {
    const index = users.findIndex(u => u._id === req.params.id);
    if (index !== -1) {
        users[index] = { ...users[index], ...req.body };
        const { password, ...safeUser } = users[index];
        res.json(safeUser);
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

app.delete('/api/admin/users/:id', auth, adminAuth, (req, res) => {
    const index = users.findIndex(u => u._id === req.params.id);
    if (index !== -1) {
        users.splice(index, 1);
        res.json({ message: 'User deleted' });
    } else {
        res.status(404).json({ message: 'Not found' });
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
        res.status(404).json({ message: 'Not found' });
    }
});

app.delete('/api/admin/bookings/:id', auth, adminAuth, (req, res) => {
    const index = bookings.findIndex(b => b._id === req.params.id);
    if (index !== -1) {
        bookings.splice(index, 1);
        res.json({ message: 'Booking deleted' });
    } else {
        res.status(404).json({ message: 'Not found' });
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
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SERVER STARTED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log(`📡 Server running on: http://localhost:${PORT}`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api`);
    console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   👑 Admin: admin@eldercare.com / Admin@123');
    console.log('   👤 User: john@example.com / password123');
    console.log('   👤 User: sarah@example.com / password123');
    console.log('\n📊 DATA STATUS:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Caregivers: ${caregivers.length}`);
    console.log(`   Bookings: ${bookings.length}`);
    console.log('\n💡 TIP: This is an in-memory server (no MongoDB needed)');
    console.log('='.repeat(50) + '\n');
});