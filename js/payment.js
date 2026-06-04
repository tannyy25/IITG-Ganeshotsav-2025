// ============================================
//  GANESHOTSAV — PAYMENT & MODAL JS
//  Dummy Razorpay flow — swap key_id when ready
// ============================================

const API_BASE = 'http://127.0.0.1:5001/api';

// When you get Razorpay account:
// 1. Add to .env: RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
// 2. Change RAZORPAY_KEY_ID below to your real key
const RAZORPAY_KEY_ID = 'rzp_test_Sx3PUYHGI7SXLb';

let currentMerchItem = { name: '', amount: 0 };


function toggleCombo(checkbox) {
  const singleGroup = document.getElementById('merch-size-group');
  const comboGroup  = document.getElementById('merch-combo-group');
  const priceEl     = document.getElementById('modal-item-price');

  if (checkbox.checked) {
    singleGroup.style.display = 'none';
    comboGroup.style.display  = 'block';
    // Add ₹99 savings to price
    const base = currentMerchItem.amount;
    const otherItem = base === 499 ? 399 : 499;
    currentMerchItem.comboAmount = base + otherItem ;
    currentMerchItem.isCombo = true;
    priceEl.textContent = `₹${currentMerchItem.comboAmount}`;
  } else {
    singleGroup.style.display = 'block';
    comboGroup.style.display  = 'none';
    currentMerchItem.isCombo = false;
    priceEl.textContent = `₹${currentMerchItem.amount}`;
  }
}

// ============================================
//  MERCH MODAL
// ============================================
function openMerchModal(itemName, amount, isCombo = false) {
  currentMerchItem = { name: itemName, amount, isCombo };
  document.getElementById('modal-item-name').textContent = itemName;
  document.getElementById('modal-item-price').textContent = `₹${amount}`;
  document.getElementById('merch-form').reset();

  const sizeGroup = document.getElementById('merch-size-group');
  const comboGroup = document.getElementById('merch-combo-group');

  if (isCombo) {
    sizeGroup.style.display = 'none';
    comboGroup.style.display = 'block';
  } else {
    sizeGroup.style.display = 'block';
    comboGroup.style.display = 'none';
  }

  document.getElementById('merch-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

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

// ============================================
//  DUMMY RAZORPAY (replace when you get key)
// ============================================
function launchRazorpay({ amount, name, email, description, onSuccess }) {

   //── REAL Razorpay (uncomment when you have key) ──
   const options = {
     key: RAZORPAY_KEY_ID,
     amount: amount * 100,       // Razorpay takes paise
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

  /* ── DUMMY flow (remove when Razorpay is ready) ──
  const confirmed = confirm(
    `[DUMMY PAYMENT]\n\nItem: ${description}\nAmount: ₹${amount}\nName: ${name}\n\nClick OK to simulate successful payment.`
  );
  if (confirmed) {
    const dummyPaymentId = 'DUMMY_' + Date.now();
    onSuccess(dummyPaymentId);
  }*/
}

// ============================================
//  MERCH FORM SUBMIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {

  const merchForm = document.getElementById('merch-form');
  if (merchForm) {
    merchForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name     = document.getElementById('merch-name').value.trim();
      const roll     = document.getElementById('merch-roll').value.trim();
      const email    = document.getElementById('merch-email').value.trim();
      const { name: itemName, amount, isCombo, comboAmount } = currentMerchItem;
const finalAmount = isCombo ? comboAmount : amount;
const size = isCombo
  ? `Oversized: ${document.getElementById('merch-size-oversized').value}, Normal: ${document.getElementById('merch-size-normal').value}`
  : document.getElementById('merch-size').value;

      const submitBtn = document.getElementById('merch-submit-btn');
      submitBtn.classList.add('btn-loading');
      submitBtn.querySelector('.btn-text').textContent = 'Opening Payment...';

      launchRazorpay({
        amount: finalAmount,
        name,
        email,
        description: `${itemName} (Size: ${size})`,
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
                itemDetails: `${itemName} | Size: ${size} | Payment ID: ${paymentId}`,
                amount: finalAmount
              })
            });
            const data = await res.json();
            if (data.success) {
              showSuccess(`Your order for ${itemName} (Size: ${size}) is confirmed! A receipt has been sent to ${email}.Check your spam/junk folder if you don't see it. 🙏`);
            } else {
              alert('Payment done but order save failed: ' + data.message);
            }
          } catch (err) {
            alert('Payment done but could not reach server. Please contact organizers with Payment ID: ' + paymentId);
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

  // ============================================
  //  DONATION FORM SUBMIT
  // ============================================
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
              // Show success inline
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
            alert('Payment done but could not reach server. Payment ID: ' + paymentId);
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

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.getElementById('merch-modal')?.classList.remove('open');
      document.getElementById('success-modal')?.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
});
