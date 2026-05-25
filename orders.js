// ===== TAB SWITCHING =====
function showTab(name) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.snav').forEach(a => a.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.closest('.snav').classList.add('active');
}

// ===== SERVICE DROPDOWN =====
const serviceMap = {
  '2d': ['Character Design','Background Design','Sprite Animation','UI Design','2D Environment Design'],
  '3d': ['3D Character Modeling','Environment Design','Props & Assets','Weapon Design','Vehicle Design'],
  'illustration': ['Story Illustration','Book Cover Illustration','Comic Art','Concept Art'],
  'graphic': ['Logo Design','Business Card Design','Brochure Design','Poster Design','Social Media Posts','Banner Design'],
  'merch': ['T-Shirt Design','Mug Design','Sticker Design'],
  'book': ['Novel Cover Design','Book Layout Design','Typography Design']
};

function updateServices() {
  const cat = document.getElementById('orderCategory').value;
  const sel = document.getElementById('orderService');
  sel.innerHTML = '';
  if (!cat) { sel.innerHTML = '<option>Select category first...</option>'; return; }
  serviceMap[cat].forEach(s => {
    const o = document.createElement('option');
    o.textContent = s;
    sel.appendChild(o);
  });
  document.getElementById('sum-service').textContent = serviceMap[cat][0];
}

document.getElementById('orderService').addEventListener('change', function() {
  document.getElementById('sum-service').textContent = this.value;
});

// Update price on tier change
document.querySelectorAll('input[name="tier"]').forEach(r => {
  r.addEventListener('change', function() {
    const prices = { basic: '$29', standard: '$79', pro: '$149' };
    const days = { basic: '7 days', standard: '5 days', pro: '3 days' };
    const revs = { basic: '2', standard: '5', pro: 'Unlimited' };
    document.getElementById('sum-price').textContent = prices[this.value];
    document.getElementById('sum-tier').textContent = this.value.charAt(0).toUpperCase() + this.value.slice(1);
  });
});

// ===== PAYMENT METHODS =====
function setMethod(btn, method) {
  document.querySelectorAll('.pay-method').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('cardMethod').style.display = method === 'card' ? 'block' : 'none';
  document.getElementById('paypalMethod').style.display = method === 'paypal' ? 'block' : 'none';
  document.getElementById('cryptoMethod').style.display = method === 'crypto' ? 'block' : 'none';
}

function formatCard(input) {
  let val = input.value.replace(/\D/g, '').substring(0, 16);
  val = val.replace(/(.{4})/g, '$1 ').trim();
  input.value = val;
  const display = val || '•••• •••• •••• ••••';
  document.getElementById('cardNumDisplay').textContent = display;
}

function processPayment() {
  const btn = document.querySelector('#tab-payment .btn-auth');
  btn.textContent = 'Processing...';
  btn.disabled = true;
  setTimeout(() => {
    document.getElementById('confirmOverlay').classList.remove('hidden');
    btn.textContent = 'Pay $79 Now ✦';
    btn.disabled = false;
  }, 1800);
}

function connectMetaMask() {
  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => alert('Wallet connected: ' + accounts[0]))
      .catch(err => alert('Connection rejected.'));
  } else {
    alert('MetaMask not detected. Please install the MetaMask extension.');
  }
}

// ===== CANCEL ORDER =====
function cancelOrder(btn) {
  if (confirm('Are you sure you want to cancel this order?')) {
    const row = btn.closest('.order-row');
    row.style.opacity = '0.4';
    row.querySelector('.status-badge').textContent = 'Cancelled';
    row.querySelector('.status-badge').className = 'status-badge';
    row.querySelector('.status-badge').style.cssText = 'background:#fde8e8;color:#f87171;font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px';
    btn.disabled = true;
    btn.textContent = 'Cancelled';
  }
}

// ===== STAR RATING =====
const stars = document.querySelectorAll('.star');
stars.forEach(star => {
  star.addEventListener('click', function() {
    const val = parseInt(this.dataset.val);
    stars.forEach((s, i) => {
      s.classList.toggle('active', i < val);
    });
  });
  star.addEventListener('mouseover', function() {
    const val = parseInt(this.dataset.val);
    stars.forEach((s, i) => s.style.color = i < val ? '#f59e0b' : '#f0e6f8');
  });
  star.addEventListener('mouseout', function() {
    stars.forEach(s => {
      s.style.color = s.classList.contains('active') ? '#f59e0b' : '#f0e6f8';
    });
  });
});

// ===== SUBMIT REVIEW =====
function submitReview() {
  const btn = document.querySelector('#tab-review .btn-primary');
  btn.textContent = 'Submitting...';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Review Submitted ✓';
    btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
  }, 1200);
}