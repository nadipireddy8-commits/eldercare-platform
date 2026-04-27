const mongoose = require('mongoose');

const CaregiverSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    service: {
        type: String,
        enum: ['Companionship', 'Medical Care', 'Personal Care', 'Dementia Care', 'Physical Therapy', '24/7 Care', 'Respite Care'],
        required: true
    },
    experience: {
        type: Number,
        required: true,
        min: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    description: {
        type: String,
        maxlength: 1000
    },
    phone: String,
    email: String,
    address: String,
    hourlyRate: {
        type: Number,
        default: 25
    },
    languages: [String],
    certifications: [String],
    availability: {
        monday: { start: String, end: String, available: Boolean },
        tuesday: { start: String, end: String, available: Boolean },
        wednesday: { start: String, end: String, available: Boolean },
        thursday: { start: String, end: String, available: Boolean },
        friday: { start: String, end: String, available: Boolean },
        saturday: { start: String, end: String, available: Boolean },
        sunday: { start: String, end: String, available: Boolean }
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    totalBookings: {
        type: Number,
        default: 0
    },
    available: {
        type: Boolean,
        default: true
    },
    profileImage: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

CaregiverSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Caregiver', CaregiverSchema);