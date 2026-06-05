// ============================================
//  GANESHOTSAV — PAYMENT JS
//  Multi-qty size selector + Razorpay
// ============================================

const API_BASE = 'http://127.0.0.1:5001/api';
const RAZORPAY_KEY_ID = 'rzp_test_Sx3PUYHGI7SXLb';

const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const PRICES = { normal: 399, oversized: 499 };

const ITEMS = {
  normal:    { label: 'Normal T-Shirt',    price: PRICES.normal,    other: 'oversized' },
  oversized: { label: 'Oversized T-Shirt', price: PRICES.oversized, other: 'normal'    }
};

let currentItem = null;
let primaryQty   = {};
let secondaryQty = {};

function initQty() {
  SIZES.forEach(s => { primaryQty[s] = 0; secondaryQty[s] = 0; });
}

// ── Open Modal ─────────────────────────────
function openMerchModal(itemKey) {
  currentItem = itemKey;
  initQty();

  const item  = ITEMS[itemKey];
  const other = ITEMS[item.other];

  document.getElementById('modal-item-name').textContent = item.label;
  document.getElementById('primary-item-label').textContent = `${item.label} — ₹${item.price} each`;
  buildQtyGrid('primary-qty-grid', 'primary', item.price);

  document.getElementById('secondary-item-label').textContent = `${other.label} — ₹${other.price} each`;
  document.getElementById('other-item-label').textContent = other.label;
  buildQtyGrid('secondary-qty-grid', 'secondary', other.price);

  document.getElementById('merch-combo-toggle').checked = false;
  document.getElementById('secondary-item-section').style.display = 'none';
  document.getElementById('merch-form').reset();
  updateTotal();

  document.getElementById('merch-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ── Build size rows ─────────────────────────
function buildQtyGrid(gridId, type, price) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = SIZES.map(size => `
    <div class="qty-row">
      <span class="qty-size-label">${size}</span>
      <div class="qty-controls">
        <button type="button" class="qty-btn" onclick="changeQty('${type}','${size}',-1)">−</button>
        <span class="qty-value" id="qty-${type}-${size}">0</span>
        <button type="button" class="qty-btn" onclick="changeQty('${type}','${size}',1)">+</button>
      </div>
      <span class="qty-subtotal" id="sub-${type}-${size}">—</span>
    </div>
  `).join('');
}

// ── Change quantity ─────────────────────────
function changeQty(type, size, delta) {
  if (type === 'primary') {
    primaryQty[size] = Math.max(0, (primaryQty[size] || 0) + delta);
    document.getElementById(`qty-primary-${size}`).textContent = primaryQty[size];
    const price = ITEMS[currentItem].price;
    const sub = document.getElementById(`sub-primary-${size}`);
    sub.textContent = primaryQty[size] > 0 ? `₹${primaryQty[size] * price}` : '—';
    sub.className = 'qty-subtotal' + (primaryQty[size] > 0 ? ' active' : '');
  } else {
    secondaryQty[size] = Math.max(0, (secondaryQty[size] || 0) + delta);
    document.getElementById(`qty-secondary-${size}`).textContent = secondaryQty[size];
    const price = ITEMS[ITEMS[currentItem].other].price;
    const sub = document.getElementById(`sub-secondary-${size}`);
    sub.textContent = secondaryQty[size] > 0 ? `₹${secondaryQty[size] * price}` : '—';
    sub.className = 'qty-subtotal' + (secondaryQty[size] > 0 ? ' active' : '');
  }
  updateTotal();
}

// ── Update total ────────────────────────────
function updateTotal() {
  const primaryPrice   = ITEMS[currentItem].price;
  const secondaryPrice = ITEMS[ITEMS[currentItem].other].price;
  const total = SIZES.reduce((sum, s) =>
    sum + (primaryQty[s] || 0) * primaryPrice + (secondaryQty[s] || 0) * secondaryPrice, 0);
  document.getElementById('order-total-display').textContent = `₹${total}`;
}

// ── Toggle combo ────────────────────────────
function toggleCombo(checkbox) {
  const sec = document.getElementById('secondary-item-section');
  sec.style.display = checkbox.checked ? 'block' : 'none';
  if (!checkbox.checked) {
    SIZES.forEach(s => {
      secondaryQty[s] = 0;
      const el = document.getElementById(`qty-secondary-${s}`);
      if (el) el.textContent = '0';
      const sub = document.getElementById(`sub-secondary-${s}`);
      if (sub) { sub.textContent = '—'; sub.className = 'qty-subtotal'; }
    });
    updateTotal();
  }
}

// ── Close modals ────────────────────────────
function closeMerchModal(event) {
  if (event && event.target !== document.getElementById('merch-modal')) return;
  document.getElementById('merch-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function closeSuccessModal(event) {
  if (event && event.target !== document.getElementById('success-modal')) return;
  document.getElementById('success-modal').classList.remove('open');
  document.body.style.overflow = '';
}

function showSuccess(message) {
  document.getElementById('merch-modal').classList.remove('open');
  document.getElementById('success-modal').classList.add('open');
  document.getElementById('success-message').textContent = message;
}

// ── Build order summary ─────────────────────
function buildOrderSummary() {
  const item  = ITEMS[currentItem];
  const other = ITEMS[item.other];
  let lines = [];
  SIZES.forEach(s => {
    if (primaryQty[s]   > 0) lines.push(`${item.label} ${s} x${primaryQty[s]}`);
    if (secondaryQty[s] > 0) lines.push(`${other.label} ${s} x${secondaryQty[s]}`);
  });
  return lines.join(', ');
}

// ── Razorpay ────────────────────────────────
function launchRazorpay({ amount, name, email, description, onSuccess }) {
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: amount * 100,
    currency: 'INR',
    name: 'IITG Ganeshotsav',
    description: description,
    prefill: { name, email },
    theme: { color: '#FF6B1A' },
    handler: function(response) {
      onSuccess(response.razorpay_payment_id);
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
}

// ── Form submit ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  const merchForm = document.getElementById('merch-form');
  if (merchForm) {
    merchForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name  = document.getElementById('merch-name').value.trim();
      const roll  = document.getElementById('merch-roll').value.trim();
      const email = document.getElementById('merch-email').value.trim();

      const primaryPrice   = ITEMS[currentItem].price;
      const secondaryPrice = ITEMS[ITEMS[currentItem].other].price;
      const total = SIZES.reduce((sum, s) =>
        sum + (primaryQty[s] || 0) * primaryPrice + (secondaryQty[s] || 0) * secondaryPrice, 0);

      if (total === 0) {
        alert('Please select at least 1 item before proceeding.');
        return;
      }

      const summary = buildOrderSummary();
      const submitBtn = document.getElementById('merch-submit-btn');
      submitBtn.classList.add('btn-loading');
      submitBtn.querySelector('.btn-text').textContent = 'Opening Payment...';

      launchRazorpay({
        amount: total,
        name,
        email,
        description: summary,
        onSuccess: async (paymentId) => {
          submitBtn.querySelector('.btn-text').textContent = 'Saving...';
          try {
            const res = await fetch(`${API_BASE}/transactions/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                rollNumber: roll,
                email,
                type: 'ORDER',
                itemDetails: `${summary} | Payment ID: ${paymentId}`,
                amount: total
              })
            });
            const data = await res.json();
            if (data.success) {
              showSuccess(`Your order is confirmed! 🙏\n\n${summary}\n\nReceipt sent to ${email}. Check spam/junk if not in inbox.`);
            } else {
              alert('Payment done but save failed: ' + data.message);
            }
          } catch (err) {
            alert('Payment done but server unreachable. Payment ID: ' + paymentId);
          } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.querySelector('.btn-text').textContent = 'Proceed to Pay';
          }
        }
      });

      submitBtn.classList.remove('btn-loading');
      submitBtn.querySelector('.btn-text').textContent = 'Proceed to Pay';
    });
  }

  // ── Donation form ───────────────────────
  const donationForm = document.getElementById('donation-form');
  if (donationForm) {
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name   = document.getElementById('customer-name').value.trim();
      const roll   = document.getElementById('customer-roll').value.trim();
      const email  = document.getElementById('customer-email').value.trim();
      const amount = Number(document.getElementById('payment-amount').value);

      const submitBtn = document.getElementById('donate-submit-btn');
      submitBtn.classList.add('btn-loading');
      submitBtn.querySelector('.btn-text').textContent = 'Opening Payment...';

      launchRazorpay({
        amount,
        name,
        email,
        description: 'Ganeshotsav Festival Donation',
        onSuccess: async (paymentId) => {
          submitBtn.querySelector('.btn-text').textContent = 'Saving...';
          try {
            const res = await fetch(`${API_BASE}/transactions/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name,
                rollNumber: roll,
                email,
                type: 'DONATION',
                itemDetails: `Festival Fund Donation | Payment ID: ${paymentId}`,
                amount
              })
            });
            const data = await res.json();
            if (data.success) {
              donationForm.reset();
              const wrapper = document.querySelector('.donation-link-wrapper');
              wrapper.innerHTML = `
                <div style="background:rgba(255,107,26,0.1);border:1px solid rgba(255,107,26,0.3);
                  border-radius:8px;padding:1.2rem;text-align:center;">
                  <div style="font-size:2rem;margin-bottom:0.5rem">🙏</div>
                  <div style="color:#FF6B1A;font-weight:600;margin-bottom:0.3rem">Donation Confirmed!</div>
                  <div style="color:rgba(245,237,224,0.6);font-size:0.82rem">Receipt sent to ${email}. Check spam/junk if not in inbox.</div>
                </div>`;
            } else {
              alert('Payment done but save failed: ' + data.message);
            }
          } catch (err) {
            alert('Payment done but server unreachable. Payment ID: ' + paymentId);
          } finally {
            submitBtn.classList.remove('btn-loading');
            submitBtn.querySelector('.btn-text').textContent = 'Donate Online';
          }
        }
      });

      submitBtn.classList.remove('btn-loading');
      submitBtn.querySelector('.btn-text').textContent = 'Donate Online';
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('merch-modal')?.classList.remove('open');
      document.getElementById('success-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});
