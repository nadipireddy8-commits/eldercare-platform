const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Caregiver = require('./models/Caregiver');
const Service = require('./models/Service');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const seedAdmin = async () => {
    try {
        // Create Admin User
        const salt = await bcrypt.genSalt(10);
        
        const adminExists = await User.findOne({ email: 'admin@eldercare.com' });
        if (!adminExists) {
            const admin = new User({
                name: 'Super Admin',
                email: 'admin@eldercare.com',
                password: await bcrypt.hash('Admin@123', salt),
                role: 'admin',
                phone: '+1 555-0000',
                isActive: true
            });
            await admin.save();
            console.log('✅ Admin user created: admin@eldercare.com / Admin@123');
        }
        
        // Create Services
        const services = [
            { name: 'Companionship', description: 'Friendly companionship and social engagement', duration: '2-4 hours', price: 35, isActive: true },
            { name: 'Medical Care', description: 'Professional medical care by registered nurses', duration: 'per hour', price: 50, isActive: true },
            { name: 'Personal Care', description: 'Assistance with bathing, dressing, grooming', duration: 'per hour', price: 30, isActive: true },
            { name: 'Dementia Care', description: 'Specialized care for dementia patients', duration: 'per hour', price: 45, isActive: true },
            { name: '24/7 Care', description: 'Round-the-clock care and monitoring', duration: '24 hours', price: 200, isActive: true }
        ];
        
        for (const service of services) {
            const existing = await Service.findOne({ name: service.name });
            if (!existing) {
                await Service.create(service);
                console.log(`✅ Service created: ${service.name}`);
            }
        }
        
        console.log('\n📋 ========== ADMIN ACCESS ==========');
        console.log('Admin Email: admin@eldercare.com');
        console.log('Admin Password: Admin@123');
        console.log('Admin Dashboard: http://localhost:30000/admin/admin-dashboard.html');
        console.log('=====================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();