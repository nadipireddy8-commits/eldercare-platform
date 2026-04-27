const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async () => {
    console.log('Testing MongoDB connection...');
    console.log('URI:', process.env.MONGO_URI?.substring(0, 50) + '...');
    
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connected Successfully!');
        console.log('Database:', mongoose.connection.name);
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
    }
};

testConnection();