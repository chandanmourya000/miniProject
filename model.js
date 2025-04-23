const mongoose = require("mongoose")
const schema = mongoose.Schema

const studentuserSchema = new schema({
    username: { type: String, required: true },
    // email: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },// making admin
    password: { type: String, required: true },
    //complete your profile
    gender: {
        type: String,
        enum: ["Male", "Female", "Other"],
      },
      email: {
        type: String,
        required: true,
        unique: true,
        match: /^[a-zA-Z0-9._%+-]+@ug\.cusat\.ac\.in$/,
      },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: Date,
    resetToken: String,
    resetTokenExpiry: Date,
  contactNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // only 10 digit numbers
      },
      message: props => `${props.value} is not a valid 10-digit number!`
    },
  },
  wantsRoommateMatching: {
    type: Boolean,
    default: false
  },  
      preferences: {
        wakeUpTime: String,
        sleepTime: String,
        smoking: Boolean,
        drinking: Boolean,
        cleanliness: String,
        lifestyle: String,
        diet: String,
        personality: String
      }
    
})

const studentUser = mongoose.model("studentUser", studentuserSchema);

module.exports = studentUser;