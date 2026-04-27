const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    name: String,
    age: Number,
    condition: String,
    address: String,
    phone: String,
    email: String,
    emergencyContact: String,
    medicalInfo: String,
    allergies: [String],
    medications: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

PatientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Patient', PatientSchema);