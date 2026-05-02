const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'https://eldercare-frontend.onrender.com',
    process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(null, true);
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
let nextId = 100;

const salt = bcrypt.genSaltSync(10);

// ============ CREATE ADMIN USER ============
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

// ============ CREATE FAMILY USERS ============
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

// ============ CREATE CAREGIVER USERS ============
users.push({
    _id: '4',
    name: 'Mike Caregiver',
    email: 'mike@caregiver.com',
    password: bcrypt.hashSync('password123', salt),
    role: 'caregiver',
    phone: '+1 555-0103',
    isActive: true,
    createdAt: new Date()
});

users.push({
    _id: '5',
    name: 'Sarah Johnson Caregiver',
    email: 'sarah@caregiver.com',
    password: bcrypt.hashSync('caregiver123', salt),
    role: 'caregiver',
    phone: '+1 555-0104',
    isActive: true,
    createdAt: new Date()
});

// ============ CREATE CAREGIVER PROFILES ============
// Caregiver profile for Mike
caregivers.push({
    _id: '101',
    userId: '4',
    name: 'Mike Caregiver',
    service: 'Medical Care',
    experience: 6,
    verified: true,
    description: 'Experienced medical caregiver specializing in post-hospital care and medication management.',
    phone: '+1 555-0103',
    email: 'mike@caregiver.com',
    hourlyRate: 30,
    rating: 4.7,
    totalReviews: 15,
    available: true,
    createdAt: new Date()
});

// Caregiver profile for Sarah Caregiver
caregivers.push({
    _id: '102',
    userId: '5',
    name: 'Sarah Johnson Caregiver',
    service: 'Companionship',
    experience: 5,
    verified: true,
    description: 'Compassionate companion caregiver who loves engaging seniors in activities.',
    phone: '+1 555-0104',
    email: 'sarah@caregiver.com',
    hourlyRate: 28,
    rating: 4.8,
    totalReviews: 12,
    available: true,
    createdAt: new Date()
});

// Additional caregivers (no user login, just for booking display)
caregivers.push({
    _id: '103',
    name: 'Emily Wilson',
    service: 'Companionship',
    experience: 5,
    verified: true,
    description: 'Experienced caregiver specializing in elderly companionship.',
    phone: '+1 555-0201',
    email: 'emily@caregiver.com',
    hourlyRate: 25,
    rating: 4.8,
    totalReviews: 24,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '104',
    name: 'David Chen',
    service: 'Medical Care',
    experience: 8,
    verified: true,
    description: 'Registered nurse with 8 years of experience.',
    phone: '+1 555-0202',
    email: 'david@caregiver.com',
    hourlyRate: 35,
    rating: 4.9,
    totalReviews: 31,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '105',
    name: 'Robert Taylor',
    service: 'Dementia Care',
    experience: 10,
    verified: true,
    description: 'Specialist in dementia and Alzheimer\'s care.',
    phone: '+1 555-0203',
    email: 'robert@caregiver.com',
    hourlyRate: 40,
    rating: 5.0,
    totalReviews: 52,
    available: true,
    createdAt: new Date()
});

caregivers.push({
    _id: '106',
    name: 'Maria Garcia',
    service: 'Personal Care',
    experience: 4,
    verified: false,
    description: 'Compassionate caregiver for personal care.',
    phone: '+1 555-0204',
    email: 'maria@caregiver.com',
    hourlyRate: 22,
    rating: 4.5,
    totalReviews: 12,
    available: true,
    createdAt: new Date()
});

// ============ BOOKINGS (Start Empty - No Sample Bookings) ============
// Real bookings will be created when users book caregivers
let bookings = [];

// ============ HELPER FUNCTION ============
function getCaregiverIdByUserId(userId) {
    const caregiver = caregivers.find(c => c.userId === userId);
    console.log(`[DEBUG] Looking for caregiver with userId: ${userId}, Found: ${caregiver?._id || 'NOT FOUND'}`);
    return caregiver ? caregiver._id : null;
}

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
        const newUserId = String(nextId);
        
        const newUser = {
            _id: newUserId,
            name,
            email,
            password: bcrypt.hashSync(password, salt),
            role: role || 'family',
            isActive: true,
            createdAt: new Date()
        };
        users.push(newUser);
        
        // AUTO-CREATE CAREGIVER PROFILE IF ROLE IS CAREGIVER
        if (role === 'caregiver') {
            const newCaregiverId = String(nextId + 1000);
            const newCaregiver = {
                _id: newCaregiverId,
                userId: newUserId,
                name: name,
                service: 'Companionship',
                experience: 1,
                verified: false,
                description: 'New caregiver profile. Please complete your profile.',
                phone: '',
                email: email,
                hourlyRate: 25,
                rating: 0,
                totalReviews: 0,
                available: true,
                createdAt: new Date()
            };
            caregivers.push(newCaregiver);
            console.log(`✅ Auto-created caregiver profile for: ${name} with ID: ${newCaregiverId}`);
        }
        
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
        console.error('Registration error:', error);
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
        console.error('Login error:', error);
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
        console.log(`✅ New booking created: ${newBooking.bookingId} for ${caregiver.name}`);
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

// ============ CAREGIVER PORTAL ROUTES ============

// Caregiver Dashboard Stats
app.get('/api/caregiver/stats', auth, (req, res) => {
    const user = users.find(u => u._id === req.user.id);
    console.log('[DEBUG] Caregiver Stats - User ID:', req.user.id, 'Role:', user?.role);
    
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiverId = getCaregiverIdByUserId(req.user.id);
    console.log('[DEBUG] Found Caregiver ID:', caregiverId);
    
    if (!caregiverId) {
        return res.json({ pending: 0, accepted: 0, inProgress: 0, completed: 0, earnings: 0 });
    }
    
    const caregiverBookings = bookings.filter(b => b.caregiverId === caregiverId);
    console.log(`[DEBUG] Found ${caregiverBookings.length} bookings for caregiver`);
    
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
    console.log('[DEBUG] Caregiver Requests - User ID:', req.user.id, 'Role:', user?.role);
    
    if (user.role !== 'caregiver') {
        return res.status(403).json({ message: 'Access denied. Caregiver only.' });
    }
    
    const caregiverId = getCaregiverIdByUserId(req.user.id);
    console.log('[DEBUG] Found Caregiver ID:', caregiverId);
    
    if (!caregiverId) {
        console.log('[DEBUG] No caregiver profile found');
        return res.json([]);
    }
    
    const caregiverBookings = bookings.filter(b => b.caregiverId === caregiverId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    console.log(`[DEBUG] Found ${caregiverBookings.length} bookings`);
    
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
    console.log(`✅ Booking ${req.params.id} accepted by caregiver ${user.name}`);
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

// Update service status
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
    
    console.log(`✅ Booking ${req.params.id} status updated to ${status}`);
    res.json({ message: `Service ${status.toLowerCase()}`, booking });
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
    
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    
    const caregiver = caregivers.find(c => c.userId === req.user.id);
    if (caregiver) {
        caregiver.service = req.body.service || caregiver.service;
        caregiver.experience = req.body.experience || caregiver.experience;
        caregiver.description = req.body.bio || caregiver.description;
        caregiver.hourlyRate = req.body.hourlyRate || caregiver.hourlyRate;
    }
    
    res.json({ message: 'Profile updated successfully' });
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Server is running',
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
    console.log('\n' + '='.repeat(55));
    console.log('🚀 ELDERCARE BACKEND RUNNING');
    console.log('='.repeat(55));
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔗 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   👑 Admin: admin@eldercare.com / Admin@123');
    console.log('   👤 Family: john@example.com / password123');
    console.log('   👤 Family: sarah@example.com / password123');
    console.log('   👩‍⚕️ Caregiver: mike@caregiver.com / password123');
    console.log('   👩‍⚕️ Caregiver: sarah@caregiver.com / caregiver123');
    console.log('\n📊 DATA STATUS:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Caregivers: ${caregivers.length}`);
    console.log(`   Bookings: ${bookings.length} (no sample bookings - users will create real ones)`);
    console.log('='.repeat(55) + '\n');
});