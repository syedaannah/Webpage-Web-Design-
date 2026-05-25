let pendingPayloadMetadata = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 Orders page loading...');
    
    // Check session and load user info
    checkSessionAndLoad();
});

function checkSessionAndLoad() {
    // Get session from localStorage
    const sessionEmail = localStorage.getItem('userSessionEmail');
    const sessionRole = localStorage.getItem('userSessionRole');
    
    console.log('🔍 Session check:', { email: sessionEmail, role: sessionRole });
    
    // If no session, redirect to login
    if (!sessionEmail) {
        console.log('❌ No session found, redirecting to login');
        window.location.href = '/login.html';
        return;
    }

    // UPDATE SIDEBAR PROFILE - NOW USES ACTUAL NAME FROM REGISTRATION!
    const profileNameEl = document.getElementById('userProfileName');
    const profileEmailEl = document.getElementById('userProfileEmail');
    const avatarEl = document.getElementById('userAvatarPlaceholder');
    
    // Try to get the saved user name, fallback to email if not found
    const savedUserName = localStorage.getItem('userName') || sessionEmail.split('@')[0];
    
    if (profileNameEl) {
        // Display the actual name entered during registration (or email part as fallback)
        profileNameEl.textContent = savedUserName;
        console.log('✓ Updated profile name:', profileNameEl.textContent);
    }
    
    if (profileEmailEl) {
        profileEmailEl.textContent = sessionEmail;
        console.log('✓ Updated profile email:', profileEmailEl.textContent);
    }
    
    if (avatarEl) {
        // Show first letter of actual name in avatar
        const firstLetter = savedUserName.charAt(0).toUpperCase();
        avatarEl.textContent = firstLetter;
        console.log('✓ Updated avatar with:', firstLetter);
    }

    // Extract values from pricing/service selection
    const svc = localStorage.getItem('intendedServiceSelection') || "Character Design Architecture";
    const tier = localStorage.getItem('selectedTierName') || "Standard Tier Plan";
    const price = localStorage.getItem('selectedTierCost') || "79";

    const serviceInput = document.getElementById('orderServiceType');
    const tierInput = document.getElementById('orderTierPlan');
    const costInput = document.getElementById('orderBaseCost');
    
    if (serviceInput) serviceInput.value = svc;
    if (tierInput) tierInput.value = tier;
    if (costInput) costInput.value = `$${price}`;

    // Load active orders from MongoDB
    console.log('📊 Fetching orders for:', sessionEmail);
    pullLiveClientOrdersFromDatabase();
}

// Show/hide tabs
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Remove active from all nav links
    document.querySelectorAll('.sidebar-nav .snav').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show selected tab
    const tabEl = document.getElementById(`tab-${tabName}`);
    if (tabEl) {
        tabEl.classList.add('active');
    }
    
    // Mark nav link as active
    event.target.classList.add('active');
}

// Create and submit new order
function createNewStudioOrder(event) {
    event.preventDefault();
    
    const sessionEmail = localStorage.getItem('userSessionEmail');
    if (!sessionEmail) {
        alert("Please log in to submit an order.");
        return;
    }

    const serviceType = document.getElementById('orderService').value || "Design Service";
    const tierRadio = document.querySelector('input[name="tier"]:checked');
    const tierPlan = tierRadio ? tierRadio.value : "standard";
    const tierPrices = { basic: 29, standard: 79, pro: 149 };
    const baseCost = tierPrices[tierPlan] || 79;
    
    const formatSpecs = document.querySelector('textarea')?.value || "";
    const briefNotes = document.querySelector('textarea')?.value || "";

    pendingPayloadMetadata = {
        serviceType: serviceType,
        tierPlan: tierPlan,
        baseCost: baseCost,
        formatSpecs: formatSpecs,
        briefNotes: briefNotes,
        customerEmail: sessionEmail,
        status: 'Pending'
    };

    console.log('📦 Order created:', pendingPayloadMetadata);

    // Show payment modal
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Fetch orders from MongoDB
async function pullLiveClientOrdersFromDatabase() {
    const sessionEmail = localStorage.getItem('userSessionEmail');
    const sessionRole = localStorage.getItem('userSessionRole');
    
    if (!sessionEmail) return;

    try {
        const response = await fetch(`/api/orders?email=${sessionEmail}&role=${sessionRole}`);
        const orders = await response.json();
        
        console.log('📥 Fetched orders:', orders);
        displayOrders(orders);
    } catch (err) {
        console.error('Error fetching orders:', err);
    }
}

// Display orders in table
function displayOrders(orders) {
    const container = document.getElementById('ordersTable') || document.querySelector('.orders-list');
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 20px;">No orders yet. Create one above!</p>';
        return;
    }

    let html = '<table style="width:100%; border-collapse: collapse;">';
    html += '<tr style="border-bottom: 2px solid #c084d4;"><th>Service</th><th>Tier</th><th>Cost</th><th>Status</th><th>Action</th></tr>';
    
    orders.forEach(order => {
        const status = order.status || 'Pending';
        const statusColor = status === 'Completed' ? '#10b981' : status === 'Processing' ? '#fbbf24' : '#f87171';
        
        html += `<tr style="border-bottom: 1px solid #e5d9f2;">
            <td>${order.serviceType || 'N/A'}</td>
            <td>${order.tierPlan || 'N/A'}</td>
            <td>$${order.baseCost || '0'}</td>
            <td style="color: ${statusColor}; font-weight: bold;">${status}</td>
            <td><button onclick="cancelOrder('${order._id}')" style="background: #f87171; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">Cancel</button></td>
        </tr>`;
    });
    
    html += '</table>';
    container.innerHTML = html;
}

// Cancel order
async function cancelOrder(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Order cancelled successfully');
            pullLiveClientOrdersFromDatabase();
        }
    } catch (err) {
        console.error('Error canceling order:', err);
    }
}

// Process payment
async function processPayment(method) {
    if (!pendingPayloadMetadata) {
        alert('No order to process');
        return;
    }

    try {
        const response = await fetch('/api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pendingPayloadMetadata)
        });

        if (response.ok) {
            alert(`Order placed successfully via ${method}!`);
            
            // Close modal
            const modal = document.getElementById('paymentModal');
            if (modal) modal.style.display = 'none';
            
            // Reset form and refresh orders
            pendingPayloadMetadata = null;
            document.querySelector('form')?.reset();
            pullLiveClientOrdersFromDatabase();
        }
    } catch (err) {
        console.error('Payment error:', err);
        alert('Failed to place order');
    }
}

// Leave review
async function submitReview() {
    const name = document.getElementById('reviewName')?.value;
    const rating = document.getElementById('reviewRating')?.value;
    const text = document.getElementById('reviewText')?.value;

    if (!name || !rating || !text) {
        alert('Please fill in all review fields');
        return;
    }

    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, rating, text, role: 'customer' })
        });

        if (response.ok) {
            alert('Review submitted successfully!');
            document.getElementById('reviewName').value = '';
            document.getElementById('reviewRating').value = '5';
            document.getElementById('reviewText').value = '';
        }
    } catch (err) {
        console.error('Review error:', err);
    }
}

// Close payment modal
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) modal.style.display = 'none';
}

// Update services based on category
function updateServices() {
    const category = document.getElementById('orderCategory').value;
    const serviceSelect = document.getElementById('orderService');
    
    const services = {
        '2d': ['Character Design', 'Game Asset Design', 'Concept Art', 'Character Animation', 'UI Design', 'Background Art', 'Sprite Sheet Design', 'Logo Animation'],
        '3d': ['3D Character Modeling', '3D Environment Design', 'Product Visualization', 'Architectural Rendering', '3D Animation'],
        'illustration': ['Custom Illustration', 'Book Illustration', 'Portrait Art', 'Fantasy Art'],
        'graphic': ['Poster Design', 'Brochure Design', 'Business Card Design', 'Infographic Design', 'Social Media Graphics', 'Banner Design'],
        'merch': ['T-Shirt Design', 'Mug Design', 'Hoodie Design'],
        'book': ['Book Cover Design', 'Book Layout Design', 'Illustration for Books']
    };
    
    serviceSelect.innerHTML = '';
    
    if (services[category]) {
        services[category].forEach(service => {
            const option = document.createElement('option');
            option.value = service;
            option.textContent = service;
            serviceSelect.appendChild(option);
        });
    } else {
        serviceSelect.innerHTML = '<option>Select category first...</option>';
    }
}

// Logout - FIXED to properly clear and redirect
function executeSignOutRoute() {
    console.log('🔓 Logging out...');
    
    // Clear ALL session data
    localStorage.removeItem('userSessionRole');
    localStorage.removeItem('userSessionEmail');
    localStorage.removeItem('intendedServiceSelection');
    localStorage.removeItem('selectedTierName');
    localStorage.removeItem('selectedTierCost');
    
    console.log('✓ Session cleared');
    
    // Redirect to login page
    setTimeout(() => {
        window.location.href = '/login.html';
    }, 100);
}