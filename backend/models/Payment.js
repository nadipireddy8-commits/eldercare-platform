const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        unique: true
    },
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'USD'
    },
    method: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'],
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
        default: 'Pending'
    },
    transactionId: String,
    paymentDate: {
        type: Date,
        default: Date.now
    },
    receipt: String
});

PaymentSchema.pre('save', async function(next) {
    if (!this.paymentId) {
        const count = await mongoose.model('Payment').countDocuments();
        this.paymentId = `PAY${String(count + 1).padStart(8, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Payment', PaymentSchema);