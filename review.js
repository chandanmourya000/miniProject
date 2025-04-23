const mongoose = require('mongoose');
const schema = mongoose.Schema;

const reviewSchema = new schema({
    hostel: { type: schema.Types.ObjectId, ref: 'Hostel' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'studentUser' },
    rating: Number,
    review: String,
    date: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
