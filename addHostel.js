// const mongoose = require("mongoose")
// const schema = mongoose.Schema



// const hostelSchema = new schema({
//     hostelName: String,
//     price: String,
//     sharing: String,
//     address: String,
//     description: String,  // New field
//     facilities: String ,   // New field
//     ratings: number
// })



// const hostelUser = mongoose.model("hostelUser", hostelSchema);
// module.exports = hostelUser;



const mongoose = require("mongoose");
const schema = mongoose.Schema;

// const hostelSchema = new schema({
//     hostelName: { type: String, required: true },
//     price: { type: Number, required: true },
//     sharing: { type: [String], enum: ['Single', 'Double', 'Triple'], required: true },
//     address: { type: String, required: true },
//     description: { type: String },
//     facilities: {
//         type: [String],
//         enum: [
//           'WiFi',
//           'Mess',
//           'Geyser',
//           'Water Purifier',
//           'Washing Machine',
//           'Air Conditioner'
//         ]
//       },
      
    // ratings: { type: Number, min: 0, max: 5 }
// });
const hostelSchema = new schema({
    hostelName: { type: String, required: true },
    price: { type: Number, required: true },
    sharing: [{
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Other']
    }],
    address: { type: String, required: true },
    description: { type: String },
    facilities: [{
      type: String,
      enum: [
        'WiFi',
        'Mess',
        'Geyser',
        'Water Purifier',
        'Washing Machine',
        'Air Conditioner'
      ]
    }], 
    contact: {type: String , validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v);}}},
    category: {
      type: String,
      enum: ['Boys Hostel', 'Girls Hostel', 'Apartment', 'PG'],
      required: true
    },
    latitude: { type: Number },
    longitude: { type: Number },
    status: { type: String, default: 'pending', enum: ['pending', 'approved'] },
    ratings: Number,  // Average rating
    reviews: [{ type: schema.Types.ObjectId, ref: 'Review' }]  // Array of review IDs
  });
  

const hostelUser = mongoose.model("hostelUser", hostelSchema);
module.exports = hostelUser;
