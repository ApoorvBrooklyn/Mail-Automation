const form = document.getElementById('interestForm');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const successMessage = document.getElementById('successMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Form validation
function validateForm() {
    let isValid = true;
    
    // Reset error states
    document.querySelectorAll('.error-message').forEach(el => el.style.display = 'none');
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));

    // Validate name
    const name = document.getElementById('name').value.trim();
    if (!name) {
        showFieldError('name', 'Full name is required');
        isValid = false;
    } else if (name.length < 2) {
        showFieldError('name', 'Name must be at least 2 characters');
        isValid = false;
    }

    // Validate email
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showFieldError('email', 'Email address is required');
        isValid = false;
    } else if (!emailRegex.test(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate phone
    const phone = document.getElementById('phone').value.trim();
    if (!phone) {
        showFieldError('phone', 'Phone number is required');
        isValid = false;
    } else if (phone.length < 10) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(fieldId + 'Error');
    
    field.classList.add('error');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function showLoading() {
    form.style.display = 'none';
    loading.style.display = 'block';
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function showSuccess() {
    loading.style.display = 'none';
    successMessage.style.display = 'block';
}

function showError(message) {
    loading.style.display = 'none';
    form.style.display = 'block';
    errorText.textContent = message;
    errorMessage.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    showLoading();

    const formData = {
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        phone: document.getElementById('phone').value.trim()
    };

    try {
        const response = await fetch('/api/submissions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showSuccess();
            // Reset form
            form.reset();
        } else {
            showError(result.message || result.error || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Network error. Please check your connection and try again.');
    }
});

// Real-time validation
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('blur', () => {
        validateForm();
    });
});