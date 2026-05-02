const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Caregiver = require('./models/Caregiver');
const Booking = require('./models/Booking');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/elderlycare';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

const seedDatabase = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Caregiver.deleteMany({});
        await Booking.deleteMany({});
        
        console.log('🗑️  Cleared existing data');
        
        const salt = await bcrypt.genSalt(10);
        
        // Create users
        const users = await User.insertMany([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: await bcrypt.hash('password123', salt),
                role: 'family',
                phone: '+1 555-0101'
            },
            {
                name: 'Sarah Johnson',
                email: 'sarah@example.com',
                password: await bcrypt.hash('password123', salt),
                role: 'family',
                phone: '+1 555-0102'
            },
            {
                name: 'Mike Caregiver',
                email: 'mike@caregiver.com',
                password: await bcrypt.hash('password123', salt),
                role: 'caregiver',
                phone: '+1 555-0103'
            }
        ]);
        
        console.log(`✅ Created ${users.length} users`);
        
        // Get caregiver user ID
        const caregiverUser = users.find(u => u.role === 'caregiver');
        
        // Create caregivers
        const caregivers = await Caregiver.insertMany([
            {
                userId: caregiverUser._id,
                name: 'Emily Wilson',
                service: 'Companionship',
                experience: 5,
                verified: true,
                description: 'Experienced caregiver specializing in elderly companionship, conversation, and daily living assistance. Certified in first aid and CPR.',
                phone: '+1 555-0201',
                email: 'emily@caregiver.com',
                rating: 4.8,
                totalReviews: 12,
                available: true
            },
            {
                userId: caregiverUser._id,
                name: 'David Chen',
                service: 'Medical Care',
                experience: 8,
                verified: true,
                description: 'Registered nurse with 8 years of experience in geriatric care, medication management, and post-operative care.',
                phone: '+1 555-0202',
                email: 'david@caregiver.com',
                rating: 4.9,
                totalReviews: 24,
                available: true
            },
            {
                userId: caregiverUser._id,
                name: 'Maria Garcia',
                service: 'Personal Care',
                experience: 4,
                verified: false,
                description: 'Compassionate caregiver trained in personal care, bathing assistance, and mobility support.',
                phone: '+1 555-0203',
                email: 'maria@caregiver.com',
                rating: 4.5,
                totalReviews: 8,
                available: true
            },
            {
                userId: caregiverUser._id,
                name: 'Robert Taylor',
                service: 'Dementia Care',
                experience: 10,
                verified: true,
                description: 'Specialist in dementia and Alzheimer\'s care with 10+ years experience. Certified dementia practitioner.',
                phone: '+1 555-0204',
                email: 'robert@caregiver.com',
                rating: 5.0,
                totalReviews: 32,
                available: true
            }
        ]);
        
        console.log(`✅ Created ${caregivers.length} caregivers`);
        
        // Create sample bookings for John Doe
        const johnUser = users.find(u => u.email === 'john@example.com');
        
        if (johnUser) {
            await Booking.insertMany([
                {
                    userId: johnUser._id,
                    caregiverId: caregivers[0]._id,
                    caregiverName: caregivers[0].name,
                    date: new Date('2024-04-05'),
                    timeSlot: 'Morning',
                    duration: 3,
                    status: 'Accepted',
                    notes: 'First time booking'
                },
                {
                    userId: johnUser._id,
                    caregiverId: caregivers[1]._id,
                    caregiverName: caregivers[1].name,
                    date: new Date('2024-04-10'),
                    timeSlot: 'Afternoon',
                    duration: 2,
                    status: 'Pending',
                    notes: 'Need medical assistance'
                }
            ]);
            console.log('✅ Created sample bookings');
        }
        
        console.log('\n📋 ========== DEMO ACCOUNTS ==========');
        console.log('Family User:');
        console.log('   Email: john@example.com');
        console.log('   Password: password123');
        console.log('\nCaregiver User:');
        console.log('   Email: mike@caregiver.com');
        console.log('   Password: password123');
        console.log('\n📝 Caregivers available:');
        caregivers.forEach(c => {
            console.log(`   - ${c.name} (${c.service}) - ${c.verified ? '✓ Verified' : 'Pending verification'}`);
        });
        console.log('=====================================\n');
        
        console.log('✅ Database seeded successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};
// Add caregiver user
users.push({
    _id: '5',
    name: 'Sarah Johnson',
    email: 'sarah@caregiver.com',
    password: bcrypt.hashSync('caregiver123', salt),
    role: 'caregiver',
    phone: '+1 555-0301',
    isActive: true,
    createdAt: new Date()
});

seedDatabase();