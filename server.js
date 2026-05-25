const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt'); // 🔒 Added encryption library
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/')));

// ===== DATABASE =====
mongoose.connect('mongodb://127.0.0.1:27017/artcanvas_db')
  .then(() => console.log('✦ Connected to MongoDB Database successfully.'))
  .catch(err => console.error('MongoDB error:', err.message));

// User Schema - FIXED: Add indexing options
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true }, // Will now store secure hashed strings
    role: { type: String, default: 'customer' }
});

// Handle duplicate key errors gracefully
UserSchema.post('save', function(error, doc, next) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Email already exists'));
  } else {
    next(error);
  }
});

const User = mongoose.model('User', UserSchema);

// Drop and recreate indexes on startup
User.collection.dropIndex('email_1').catch(() => {});
User.syncIndexes().catch(err => console.error('Index sync error:', err));

// Orders Schema - NORMALIZED EMAIL SCHEMA SEARCH TARGETS
const OrderSchema = new mongoose.Schema({
    serviceType: String,
    tierPlan: String,
    baseCost: Number,
    formatSpecs: String,
    briefNotes: String,
    status: { type: String, default: 'Pending' },
    customerEmail: { type: String, lowercase: true, trim: true },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

// Reviews Schema
const ReviewSchema = new mongoose.Schema({
    name: String,
    role: String,
    rating: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
});
const Review = mongoose.model('Review', ReviewSchema);

// Payments Schema
const PaymentSchema = new mongoose.Schema({
    orderId: mongoose.Schema.Types.ObjectId,
    cardName: String,
    amount: Number,
    paymentStatus: { type: String, default: 'Success' },
    createdAt: { type: Date, default: Date.now }
});
const Payment = mongoose.model('Payment', PaymentSchema);

// ===== AUTH ENDPOINTS =====

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`📥 Login attempt received for: ${email}`);
    
    try {
        // 1. Check for master hardcoded Admin account
        if (email === 'admin@artcanvas.com' && password === 'admin123') {
            console.log(`✦ Admin master account login validated successfully.`);
            return res.json({ success: true, role: 'admin', email: email.toLowerCase().trim() });
        }
        
        // 2. Lookup customer in Database
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            console.log(`❌ User not found pattern match inside MongoDB records: ${email}`);
            return res.status(404).json({ success: false, message: 'Account not found. Please register.' });
        }
        
        // 3. SECURE COMPARISON: Decrypt and compare hash strings
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log(`❌ Authentication hash check failure for user context email: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid password.' });
        }
        
        console.log(`✦ User logged in successfully: ${user.email}`);
        res.json({ success: true, role: user.role, email: user.email });
    } catch (err) {
        console.error('❌ Login error endpoint exception trace:', err.message);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// REGISTER - SECURE VERSION WITH HASHING
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`📥 Register database insertion request for: ${email}`);
    
    if (!email || !password) {
        console.log(`❌ Missing user core text entry credential parameters.`);
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    try {
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if email already exists
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            console.log(`❌ Unique value validation blocking registration context: ${normalizedEmail}`);
            return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
        }
        
        // SECURE HASHING: Scramble the raw text password 10 times
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Create new user with secure password
        const newUser = new User({
            email: normalizedEmail,
            password: hashedPassword, // 🔒 Saved as secure hash string
            role: 'customer'
        });
        
        await newUser.save();
        
        console.log(`✦ User entry instance saved securely to db cluster node:`, {
            id: newUser._id,
            email: newUser.email,
            role: newUser.role
        });
        
        res.status(201).json({ 
            success: true, 
            message: 'Account created successfully',
            role: newUser.role, 
            email: newUser.email 
        });
        
    } catch (err) {
        console.error('❌ Registration system crash stack:', err);
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ===== ORDERS API PIEPELINE =====

// CREATE NEW ORDER DOCUMENT
app.post('/api/orders/create', async (req, res) => {
    console.log('📥 Post incoming payload values caught inside order routing chain:', req.body);
    try {
        if (req.body.customerEmail) {
            req.body.customerEmail = req.body.customerEmail.toLowerCase().trim();
        }
        const newOrder = await Order.create(req.body);
        console.log('✦ Document item successfully pushed live to MongoDB Collection instance:', newOrder._id);
        res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
        console.error('❌ Failed to construct order payload matching database requirements:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// READ PASSIVE ORDERS LIST - CASE-INSENSITIVE RESOLVED
app.get('/api/orders', async (req, res) => {
    const { email, role } = req.query;
    try {
        const searchEmail = email ? email.toLowerCase().trim() : '';
        const filter = role === 'admin' ? {} : { customerEmail: searchEmail };
        
        console.log('📊 Querying Order document collection space utilizing telemetry variables:', filter);
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error('❌ Find execution broke downstream filters on MongoDB instance:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// UPDATE EXISTING ORDER
app.put('/api/orders/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// REMOVE/CANCEL CHANNELS
app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order dropped from records registry cluster successfully.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== REVIEWS ROUTING API =====
app.post('/api/reviews', async (req, res) => {
    try {
        const review = await Review.create(req.body);
        res.status(201).json({ success: true, review });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== STATIC ROUTE ENDPOINTS =====
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/services.html', (req, res) => res.sendFile(path.join(__dirname, 'services.html')));
app.get('/portfolio.html', (req, res) => res.sendFile(path.join(__dirname, 'portfolio.html')));
app.get('/pricing.html', (req, res) => res.sendFile(path.join(__dirname, 'pricing.html')));
app.get('/orders.html', (req, res) => res.sendFile(path.join(__dirname, 'orders.html')));
app.get('/reviews.html', (req, res) => res.sendFile(path.join(__dirname, 'reviews.html')));
app.get('/about-contact.html', (req, res) => res.sendFile(path.join(__dirname, 'about-contact.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/admin.html', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

app.use((req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
    console.log(`\n✦ Express Server instance running: http://localhost:${PORT}`);
    console.log(`✦ Workspace Link: http://localhost:${PORT}/login.html`);
    console.log(`✦ Admin credentials - Email: admin@artcanvas.com | Password: admin123\n`);
});