const mongoose = require('mongoose');
const studentUser = require("./model");
const hostelUser = require("./addHostel");
const Review = require("./review");
const vlogdata = require("./vlogdata");
const express = require("express");
const bcrypt = require('bcryptjs');
const path = require('path');
const session = require('express-session');
const getProsConsFromReviews = require('./getProsConsFromReviews');
require('dotenv').config(); // Load variables from .env

const app = express();

const http = require('http').createServer(app); // 👈 NEW
const { Server } = require('socket.io');        // 👈 NEW
const io = new Server(http);                    // 👈 NEW

const port = process.env.PORT || 8080;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'your-secret-key', // Change this to a secure secret
  resave: false,
  saveUninitialized: true,
}));
app.use((req, res, next) => {
  if (req.session.user) {
    req.user = req.session.user;
  }
  next();
});
// MongoDB Connection
async function main() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/test');
    console.log('✅ Successfully connected to the database!');
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err);
  }
}
main();

// Routes
app.get("/", (req, res) => {
  res.render("index", { user: req.session.user || null });
});

app.get("/signup", (req, res) => {
  res.render("signup");
});
// Signup Route with Password Hashing
// app.post("/signup", async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const user = new studentUser({ username, email, password: hashedPassword });
//     await user.save();
//     console.log("✅ User signed up successfully!");

//     res.redirect("/login");
//   } catch (err) {
//     console.error("❌ Signup Error:", err);
//     res.status(500).send("Error signing up, please try again.");
//   }
// });


//  here working for mail system 
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check for existing user
    const existingUser = await studentUser.findOne({ email });
    if (existingUser) {
      return res.status(400).send("❌ Email already in use");
    }

    // Validate CUSAT email
    if (!email.endsWith("@ug.cusat.ac.in")) {
      return res.status(400).send("❌ Only @ug.cusat.ac.in emails allowed");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    // 🔐 Expires in 24 hours (you can change the time)
    const verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
    const user = new studentUser({
      username,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    await user.save();

    // ✅ Email sending setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        // user: "my @gmail.com",         // Replace with your Gmail
        // pass: "my pass",            // Use App Password, not normal pass
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // const verificationLink =`http://localhost:${port}/verify-email/${verificationToken}`;
    // const verificationLink = `http://localhost:${port}/verify-email/${verificationToken}`;
    const verificationLink = `${process.env.BASE_URL}/verify-email/${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "CUSAT Email Verification",
      html: `
        <p>Hello ${username},</p>
        <p>Thanks for signing up! Please click the link below to verify your email:</p>
        <a href="${verificationLink}">Verify Email</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("❌ Error sending email:", error);
        return res.status(500).send("Error sending verification email.");
      }
      console.log("✅ Verification email sent:", info.response);
    });

    res.send("✅ Signup successful! Please check your email to verify your account.");

  } catch (err) {
    console.error("❌ Signup Error:", err);
    res.status(500).send("Error signing up, please try again.");
  }
});

// verification 
// Email verification route
app.get("/verify-email/:token", async (req, res) => {
  try {
    const token = req.params.token;

    const user = await studentUser.findOne({
      verificationToken: req.params.token,
      verificationTokenExpires: { $gt: Date.now() }, // ✅ Not expired
    });
    

    if (!user) {
      return res.status(400).send("❌ Invalid or expired verification token.");
    }

    // Mark as verified
    user.isVerified = true;
     // Clear token and expires after verification
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined
    await user.save();

    console.log("✅ Email verified successfully!");

    // 🔁 Redirect to login page
    res.redirect("/login");
  } catch (err) {
    console.error("❌ Email verification error:", err);
    res.status(500).send("Error verifying email. Please try again.");
  }
});

// app.get("/login", (req, res) => {
//   res.render("login", { user: req.session.user || null });
// });

app.get("/login", (req, res) => {
  // ✅ Check if the user is already logged in
  if (req.session.user) {
    // Check if user has role set
    const userRole = req.session.user.role;

    // If the role is available, handle redirection
    if (userRole === 'admin') {
      return res.redirect("/admindashboard");  // Redirect to admin dashboard
    } else if (userRole === 'user') {
      return res.redirect("/userdashboard");  // Redirect to user dashboard
    }
  }

  // If not logged in or role is missing, render the login page
  res.render("login", { user: req.session.user || null });
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (req.session.user) {
      return res.redirect("/userdashboard");
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@ug\.cusat\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return res.status(400).send("❌ Only @ug.cusat.ac.in emails are allowed.");
    }

    // ✅ First, fetch the user
    const user = await studentUser.findOne({ email });
    if (!user) {
      return res.status(400).send("❌ User not found");
    }

    // ✅ THEN check if the user is verified
    if (!user.isVerified) {
      // return res.status(403).send("❌ Please verify your email before logging in.");

    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("❌ Invalid credentials");
    }

    req.session.user = user;
    console.log("✅ User logged in successfully!");

    if (user.role === 'admin') {
      return res.redirect("/admindashboard");
    } else {
      return res.redirect("/userdashboard");
    }

  } catch (err) {
    console.error("❌ Login Error:", err);
    res.status(500).send("Error logging in, please try again.");
  }
});


// Logout Route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("❌ Error logging out, please try again.");
    }
    res.redirect("/");
  });
});
// resend link ---------------------------------------------------------------

app.post("/resend-verification", async (req, res) => {
  const { email } = req.body;

  const user = await studentUser.findOne({ email });

  if (!user) {
    return res.status(400).send("❌ Email not found.");
  }

  if (user.isVerified) {
    return res.status(400).send("✅ Email is already verified.");
  }
   // Check if token expired
   const now = Date.now();
   if (!user.verificationToken || user.verificationTokenExpires < now) {
     // ⏳ Token expired — generate new token and expiry
     user.verificationToken = crypto.randomBytes(32).toString("hex");
     user.verificationTokenExpires = new Date(now + 24 * 60 * 60 * 1000); // 24 hours
     await user.save();
   }
  const verificationLink = `${process.env.BASE_URL}/verify-email/${user.verificationToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Resend CUSAT Email Verification",
    html: `
      <p>Hello ${user.username},</p>
      <p>Please click the link below to verify your email:</p>
      <a href="${verificationLink}">Verify Email</a>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Error resending email:", error);
      return res.status(500).send("Error resending verification email.");
    }
    console.log("✅ Verification email resent:", info.response);
    res.send("✅ Verification email resent. Check your inbox!");
  });
});


// GET: Show forgot password form
app.get("/forgot-password", (req, res) => {
  res.render("forgot-password"); // Make sure you create this view
});

// POST: Handle form submission
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await studentUser.findOne({ email });

    if (!user) {
      return res.status(400).send("❌ User with that email doesn't exist.");
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const resetLink = `${process.env.BASE_URL}/reset-password/${token}`;


    // Send email (nodemailer)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "🔑 Password Reset",
      html: `<p>Click the link to reset your password:</p><a href="${resetLink}">${resetLink}</a>`,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent!");

    res.send("✅ Password reset link sent to your email.");
  } catch (err) {
    console.error("❌ Forgot Password Error:", err);
    res.status(500).send("Something went wrong. Please try again.");
  }
});

//
// GET: Show reset password form when user clicks the link
app.get("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const user = await studentUser.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // token should not be expired
    });

    if (!user) {
      return res.status(400).send("❌ Invalid or expired token.");
    }

    res.render("reset-password", { token }); // You will pass token to the form
  } catch (err) {
    console.error("❌ Error loading reset form:", err);
    res.status(500).send("Something went wrong.");
  }
});
// POST: Handle new password submission
app.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await studentUser.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send("❌ Invalid or expired token.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    console.log("✅ Password reset successfully!");
    res.redirect("/login");
  } catch (err) {
    console.error("❌ Error resetting password:", err);
    res.status(500).send("Something went wrong. Please try again.");
  }
});


//profile
// GET route to render the profile page
app.get('/profile', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/login');
  } // If not logged in, redirect to login page

  // Get user data to check if profile is complete
  const user = await studentUser.findById(req.session.user._id);

  // If the profile is already complete, redirect to the user dashboard
  if (user.gender && user.contactNumber) {
    return res.redirect('/userdashboard');
  }

  // Otherwise, render the profile page where the user can fill in the remaining details
  res.render('profile', { user: req.session.user || null }); // Assuming profile.ejs is in the views folder
});

app.post('/profile', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/login');
  }
  const {
    contactNumber,
    gender,
    wakeUpTime,
    sleepTime,
    smoking,
    drinking,
    cleanliness,
    lifestyle,
    diet,
    personality
  } = req.body;

  if (!/^\d{10}$/.test(contactNumber)) {
    return res.status(400).send("Invalid contact number. Must be 10 digits.");
  }
  const updatedUser = await studentUser.findByIdAndUpdate(req.session.user._id, {
      contactNumber,
      gender,
      wantsRoommateMatching: wantsRoommateMatching === 'true',
      preferences: {
      wakeUpTime,
      sleepTime,
      smoking: smoking === 'true',
      drinking: drinking === 'true',
      cleanliness,
      lifestyle,
      diet,
      personality
    }
  }, { new: true });

  // 🔁 Update session with updated user info
  req.session.user = updatedUser;

  res.redirect('/userdashboard');

});
app.get('/myprofile', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/login');
  }

  try {
    const user = await studentUser.findById(req.session.user._id);
    if (!user) return res.status(404).send("User not found");

    res.render('myprofile', { user, currentUser: req.session.user || null }); // pass both user data and session user
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).send("Error loading profile");
  }
});
// edit profile 
app.post('/myprofile', async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect('/login');
  }

  const {
    contactNumber,
    gender,
    wantsRoommateMatching,
    wakeUpTime,
    sleepTime,
    smoking,
    drinking,
    cleanliness,
    lifestyle,
    diet,
    personality
  } = req.body;

  if (!/^\d{10}$/.test(contactNumber)) {
    return res.status(400).send("Invalid contact number. Must be 10 digits.");
  }

  try {
    const updatedUser = await studentUser.findByIdAndUpdate(
      req.session.user._id,
      {
        contactNumber,
        gender,
        wantsRoommateMatching: wantsRoommateMatching === 'true',
        preferences: {
          wakeUpTime,
          sleepTime,
          smoking: smoking === 'true',
          drinking: drinking === 'true',
          cleanliness,
          lifestyle,
          diet,
          personality
        }
      },
      { new: true }
    );

    req.session.user = updatedUser; // Update session

    res.redirect('/myprofile'); // Go back to the profile page after editing
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).send("Something went wrong while updating your profile.");
  }
});


// matchroommates
app.get("/matchroommates", async (req, res) => {
  if (!req.session.user || !req.session.user._id) {
    return res.redirect("/login");
  }

  const currentUser = await studentUser.findById(req.session.user._id);
  if (!currentUser.preferences) {
    return res.redirect("/profile"); // in case user didn't complete profile
  }

  const allUsers = await studentUser.find({
    _id: { $ne: currentUser._id },
    gender: currentUser.gender,
    wantsRoommateMatching: true,
    preferences: { $exists: true }
  });

  const matchedUsers = allUsers.map(user => {
    let score = 0;
    const p1 = currentUser.preferences;
    const p2 = user.preferences;

    if (p1.wakeUpTime === p2.wakeUpTime) score++;
    if (p1.sleepTime === p2.sleepTime) score++;
    if (p1.smoking === p2.smoking) score++;
    if (p1.drinking === p2.drinking) score++;
    if (p1.cleanliness === p2.cleanliness) score++;
    if (p1.lifestyle === p2.lifestyle) score++;
    if (p1.diet === p2.diet) score++;
    if (p1.personality === p2.personality) score++;

    return { user, score };
  });

  matchedUsers.sort((a, b) => b.score - a.score);

  // Update user's lastMatchedAt
  await studentUser.findByIdAndUpdate(currentUser._id, { lastMatchedAt: new Date() });

  res.render("matchroommates", { matches: matchedUsers, user: req.session.user || null });
});


//.............................................................................
//  /hostel/:id
//  Show full details of a single hostel
//  Show its reviews sorted by latest/highest
//  Used when clicking "View More" on a hos

app.get("/hostel/:id", async (req, res) => {
  try {
    const hostel = await hostelUser.findOne({ _id: req.params.id, status: 'approved' });

    if (!hostel) {
      return res.status(404).send("Hostel not found or not approved yet");
    }

    let sort = req.query.sort || 'latest'; // Default to 'latest' if no sorting option is selected

    // Sort the reviews based on the selected option
    let reviews;
    if (sort === 'highest') {
      reviews = await Review.find({ hostel: hostel._id })
        .populate('user', 'username') // Populate user information
        .sort({ rating: -1 }); // Sort by highest rating first
    } else {
      reviews = await Review.find({ hostel: hostel._id })
        .populate('user', 'username') // Populate user information
        .sort({ createdAt: -1 }); // Sort by latest first
    }

    // Calculate average rating if there are reviews
    const averageRating = 
      Array.isArray(reviews) && reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;
      const { pros, cons } = getProsConsFromReviews(reviews);
    res.render("hosteldetails", { 
      hostel, 
      reviews, 
      sort, 
      averageRating, 
      pros, 
      cons,
      user: req.session.user || null 
    }); // Pass 'user' to the view
  } catch (error) {
    console.error("Error fetching hostel details:", error);
    res.status(500).send("Error fetching hostel details");
  }
});




// 🔹 Boys Hostel
app.get("/boyshostel", async (req, res) => {
  await renderCategoryPage("Boys Hostel", "boyshostel", req, res);
});

// 🔹 Girls Hostel
app.get("/girlshostel", async (req, res) => {
  await renderCategoryPage("Girls Hostel", "girlshostel", req, res);
});

// 🔹 Apartment
app.get("/apartment", async (req, res) => {
  await renderCategoryPage("Apartment", "apartment", req, res);
});

// 🔹 PG
app.get("/pg", async (req, res) => {
  await renderCategoryPage("PG", "pg", req, res);
});
async function renderCategoryPage(category, template, req, res) {
  try {
    const sort = req.query.sort || 'highest';
    const allHostels = await hostelUser.find({ status: 'approved', category });

    const hostelsWithRatings = await Promise.all(allHostels.map(async (hostel) => {
      const reviews = await Review.find({ hostel: hostel._id });
      const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : null;
      return { ...hostel.toObject(), averageRating };
    }));

    const sortedHostels = hostelsWithRatings.sort((a, b) => {
      if (sort === 'highest') {
        return b.averageRating - a.averageRating;
      } else {
        return a.averageRating - b.averageRating;
      }
    });

    res.render(template, { 
      allHostel: sortedHostels, 
      sort,
      user: req.session.user || null 
    });
  } catch (error) {
    console.error(`Error fetching ${category} hostels:`, error);
    res.status(500).send(`Error fetching ${category} hostels`);
  }
}

// adding hostel data
app.get("/addHostel", async (req,res)=>{
  res.render("addHostel", { user: req.session.user || null })
})

/// add hostel
app.post("/addHostel", async (req, res) => {
  try {
    const user = req.user; // Assuming you're using sessions or Passport for login

    const newHostel = new hostelUser({
      hostelName: req.body.hostelName,
      price: req.body.price,
      sharing: req.body.sharing,
      address: req.body.address,
      description: req.body.description || "",
      facilities: req.body.facilities || "",
      ratings: req.body.ratings,
      status: user.role === "admin" ? "approved" : "pending", // ✅ Logic based on role
      contact: req.body.contact,
      category: req.body.category,
      latitude: req.body.latitude,
      longitude: req.body.longitude,
    });

    await newHostel.save();

    // ✅ Redirect based on role
    if (user.role === "admin") {
      res.redirect("/admindashboard");
    } else {
      res.redirect("/userdashboard");
    }

  } catch (error) {
    console.error("Error adding hostel:", error);
    res.status(500).send("Internal Server Error");
  }
});



// admindashboard to approve
app.get("/admindashboard", async (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    try {
      // ✅ Fetch all pending hostels from DB
      const pendingHostels = await hostelUser.find({ status: "pending" });

      // ✅ Pass to EJS
      // res.render("admindashboard", { pendingHostels });
      const allHostels = await hostelUser.find(); // ✅ Get all hostels
      res.render("admindashboard", { allHostels ,pendingHostels });


    } catch (err) {
      console.error("❌ Error fetching hostels:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(403).send('❌ Access denied! You are not an admin.');
  }
});
// making a route for approval for hostel
app.post("/admin/approve/:id", async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== "admin") {
      return res.status(403).send("❌ Access denied");
    }

    const hostelId = req.params.id;

    // Update hostel status to "approved"
    const updatedHostel = await hostelUser.findByIdAndUpdate(
      hostelId,
      { status: "approved" },
      { new: true }
    );

    if (!updatedHostel) {
      return res.status(404).send("❌ Hostel not found");
    }

    console.log(`✅ Hostel "${updatedHostel.hostelName}" approved!`);
    res.redirect("/admindashboard");
  } catch (error) {
    console.error("❌ Error approving hostel:", error);
    res.status(500).send("Internal server error");
  }
});




// review submittion
app.post('/submit-review/:id', async (req, res) => {
  if (!req.user) {
    return res.status(401).send('You must be logged in to submit a review.');
  }

  console.log("✅ Received POST request for /submit-review/:id");
  console.log("Hostel ID: ", req.params.id);
  console.log("User ID: ", req.user ? req.user._id : "No user");

  const hostelId = req.params.id;
  const { rating, review } = req.body;
  const userId = req.user._id;

  try {
    // Step 1: Check if the user already submitted a review
    const existingReview = await Review.findOne({ hostel: hostelId, user: userId });

    if (existingReview) {
      return res.status(400).send('You have already submitted a review for this hostel.');
    }

    // Step 2: Save new review
    const newReview = new Review({
      hostel: hostelId,
      user: userId,
      rating,
      review
    });

    const savedReview = await newReview.save();

    // Step 3: Push review into hostel reviews
    await hostelUser.findByIdAndUpdate(
      hostelId,
      { $push: { reviews: savedReview._id } },
      { new: true }
    );

    res.redirect(`/hostel/${hostelId}`);

  } catch (err) {
    console.error("❌ Error during review submission:", err);
    res.status(500).send('Server error while submitting review.');
  }
});
//
// Routes for userdashbord 
app.get('/userdashboard', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const unseenVlogs = await vlogdata.find({
    seenBy: { $ne: req.session.user._id }
  }).sort({ timestamp: -1 });

  res.render('userdashboard', {
    username: req.session.user.username,
    unseenVlogs  // pass to show notification badge etc.
  });
});

app.post('/mark-vlogs-seen', async (req, res) => {
  const userId = req.session.user._id;

  await vlogdata.updateMany(
    { seenBy: { $ne: userId } },
    { $push: { seenBy: userId } }
  );

  res.sendStatus(200);
});


app.get('/vlog', async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const vlogs = await vlogdata.find().sort({ timestamp: -1 });
  res.render('vlog', {
    vlogs,
    username: req.session.user.username,
    user: req.session.user || null
  });
});

// Socket.io logic // vlog updates
io.on('connection', (socket) => {
  console.log('📡 A user connected via Socket.io');

  // Handle new vlog upload
  socket.on('new-vlog-uploaded', async (data) => {
    try {
      console.log('🆕 New vlog received:', data);

      // Create a new vlog document with the data
      const newVlog = new vlogdata({
        title: data.title,
        author: data.author,
      });

      // Save the new vlog to the database
      await newVlog.save();
      console.log('✅ New vlog saved to MongoDB:', newVlog);

      // Broadcast the new vlog to all connected clients
      io.emit('broadcast-new-vlog', newVlog);
    } catch (error) {
      console.error('❌ Error saving vlog to MongoDB:', error);
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('❌ A user disconnected');
  });
});

// disapprove the hostel
app.post('/admin/disapprove/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("❌ Access denied");
  }
  const hostelId = req.params.id;

  try {
    // Delete the hostel from the database
    await hostelUser.findByIdAndDelete(hostelId);

    // Redirect to the admin dashboard
    res.redirect('/admindashboard');
  } catch (err) {
    console.error("❌ Error disapproving hostel:", err);
    res.status(500).send("Internal server error");
  }
});


/// editing the hostell

app.get('/admin/edit/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("❌ Access denied");
  }

  try {
    const hostel = await hostelUser.findById(req.params.id);
    if (!hostel) {
      return res.status(404).send("Hostel not found");
    }
    res.render('editHostel', { hostel }); // 👈 This passes data to your EJS file
  } catch (error) {
    console.error("❌ Error fetching hostel for editing:", error);
    res.status(500).send("Internal Server Error");
  }
});
// deleting the hostel only approved
app.post('/admin/delete/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("❌ Access denied");
  }
  const hostelId = req.params.id;

  try {
    // Delete the hostel from the database
    await hostelUser.findByIdAndDelete(hostelId);

    // Redirect to the admin dashboard
    res.redirect('/admindashboard');
  } catch (err) {
    console.error("❌ Error deleting hostel:", err);
    res.status(500).send("Internal server error");
  }
});


app.post('/admin/edit/:id', async (req, res) => {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("❌ Access denied");
  }

  const updatedData = {
    hostelName: req.body.hostelName,
    price: req.body.price,
    category: req.body.category,
    contact: req.body.contact,
    sharing: req.body.sharing || [],
    address: req.body.address,
    description: req.body.description,
    facilities: req.body.facilities || []
  };

  try {
    const updatedHostel = await hostelUser.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedHostel) {
      return res.status(404).send("❌ Hostel not found");
    }

    console.log(`✅ Hostel "${updatedHostel.hostelName}" updated successfully!`);
    res.redirect('/admindashboard');
  } catch (error) {
    console.error("❌ Error updating hostel:", error);
    res.status(500).send("Internal Server Error");
  }
});


// // Start server
// app.listen(port, () => {
//   console.log(`🚀 Server is running on http://localhost:${port}`);
// });
 //
 http.listen(port, () => {
  console.log(`🚀 Server running with Socket.io at http://localhost:${port}`);
});


//manage users


// Admin view all users
app.get("/manageusers", async (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    try {
      const users = await studentUser.find({ role: "user" }); // Only normal users
      res.render("manageusers", { users });
    } catch (err) {
      console.error("❌ Error fetching users:", err);
      res.status(500).send("Internal server error");
    }
  } else {
    res.status(403).send("❌ Access denied! Admins only.");
  }
});

// Delete a user
app.post("/admin/users/delete/:id", async (req, res) => {
  try {
    await studentUser.findByIdAndDelete(req.params.id);
    res.redirect("/manageusers");
  } catch (err) {
    console.error("❌ Error deleting user:", err);
    res.status(500).send("Internal server error");
  }
});


//VLOG UPDATE BY ADMIN


const vlogData = require('./vlogdata'); // adjust path if needed

// Admin: View all vlogs
app.get('/managevlogs', async (req, res) => {
  try {
    if (req.session.user && req.session.user.role === 'admin') {
      const vlogs = await vlogData.find().sort({ timestamp: -1 });
      res.render('managevlogs', { vlogs });
    } else {
      res.status(403).send('Access denied');
    }
  } catch (err) {
    console.error("❌ Error fetching vlogs:", err);
    res.status(500).send("Internal server error");
  }
});

// Admin: Delete a vlog
app.post('/admin/vlogs/delete/:id', async (req, res) => {
  try {
    await vlogData.findByIdAndDelete(req.params.id);
    res.redirect('/managevlogs');
  } catch (err) {
    console.error("❌ Error deleting vlog:", err);
    res.status(500).send("Internal server error");
  }
});

