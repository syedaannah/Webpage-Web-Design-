const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
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
    password: { type: String, required: true },
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

// Orders Schema
const OrderSchema = new mongoose.Schema({
    serviceType: String,
    tierPlan: String,
    baseCost: Number,
    formatSpecs: String,
    briefNotes: String,
    status: { type: String, default: 'Pending' },
    customerEmail: String,
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
    
    console.log(`📥 Login attempt: ${email}`);
    
    try {
        if (email === 'admin@artcanvas.com' && password === 'admin123') {
            console.log(`✦ Admin login successful`);
            return res.json({ success: true, role: 'admin', email });
        }
        
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            console.log(`❌ User not found: ${email}`);
            return res.status(404).json({ success: false, message: 'Account not found. Please register.' });
        }
        
        if (user.password !== password) {
            console.log(`❌ Invalid password for: ${email}`);
            return res.status(401).json({ success: false, message: 'Invalid password.' });
        }
        
        console.log(`✦ User login successful: ${email}`);
        res.json({ success: true, role: user.role, email: user.email });
    } catch (err) {
        console.error('❌ Login error:', err.message);
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// REGISTER - FIXED VERSION
app.post('/api/auth/register', async (req, res) => {
    const { email, password } = req.body;
    
    console.log(`📥 Register attempt: ${email}`);
    
    if (!email || !password) {
        console.log(`❌ Missing email or password`);
        return res.status(400).json({ success: false, message: 'Email and password required' });
    }
    
    try {
        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if email already exists
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            console.log(`❌ Email already registered: ${normalizedEmail}`);
            return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
        }
        
        // Create new user
        const newUser = new User({
            email: normalizedEmail,
            password: password,
            role: 'customer'
        });
        
        await newUser.save();
        
        console.log(`✦ User registered successfully: ${normalizedEmail}`);
        console.log(`📊 User saved to database:`, {
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
        console.error('❌ Register error:', err);
        
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }
        
        res.status(500).json({ success: false, message: 'Server error: ' + err.message });
    }
});

// ===== ORDERS =====
app.post('/api/orders/create', async (req, res) => {
    try {
        const newOrder = await Order.create(req.body);
        res.status(201).json({ success: true, order: newOrder });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/orders', async (req, res) => {
    const { email, role } = req.query;
    try {
        const filter = role === 'admin' ? {} : { customerEmail: email };
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.put('/api/orders/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, order: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Order deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ===== REVIEWS =====
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

// ===== ROUTES =====
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
    console.log(`\n✦ Server running: http://localhost:${PORT}`);
    console.log(`✦ Login: http://localhost:${PORT}/login.html`);
    console.log(`✦ Admin test - Email: admin@artcanvas.com | Password: admin123\n`);
});