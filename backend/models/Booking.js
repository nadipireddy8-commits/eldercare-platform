const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    bookingId: {
        type: String,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    caregiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Caregiver',
        required: true
    },
    caregiverName: String,
    patientName: String,
    patientAddress: String,
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        enum: ['Morning (8AM-12PM)', 'Afternoon (12PM-4PM)', 'Evening (4PM-8PM)', 'Night (8PM-8AM)'],
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1,
        max: 24
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'In Progress', 'Completed', 'Cancelled', 'Refunded'],
        default: 'Pending'
    },
    notes: {
        type: String,
        maxlength: 500
    },
    specialInstructions: String,
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Refunded'],
        default: 'Pending'
    },
    paymentId: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique booking ID before saving
BookingSchema.pre('save', async function(next) {
    if (!this.bookingId) {
        const count = await mongoose.model('Booking').countDocuments();
        this.bookingId = `BK${String(count + 1).padStart(6, '0')}`;
    }
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Booking', BookingSchema);