const API_URL =
  'https://community-resource-api-8no4.onrender.com/api/resources';
const AUTH_URL = 'https://community-resource-api-8no4.onrender.com/api';

const resourceList = document.getElementById('resource-list');
const categoryFilter = document.getElementById('category-filter');
const resourceForm = document.getElementById('resource-form');
const formMessage = document.getElementById('form-message');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const authMessage = document.getElementById('auth-message');
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const userEmailSpan = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');
const addResourceSection = document.getElementById('add-resource-section');

// Check if we're already logged in (token saved from a previous visit)
function getToken() {
  return localStorage.getItem('token');
}

function updateAuthUI() {
  const token = getToken();
  const email = localStorage.getItem('email');
  if (token) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
    addResourceSection.style.display = 'block';
    userEmailSpan.textContent = email;
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
    addResourceSection.style.display = 'none';
  }
}

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  try {
    const response = await fetch(`${AUTH_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Signup failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    authMessage.textContent = '';
    updateAuthUI();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await fetch(`${AUTH_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('token', data.token);
    localStorage.setItem('email', data.email);
    authMessage.textContent = '';
    updateAuthUI();
  } catch (err) {
    authMessage.textContent = err.message;
  }
});

logoutBtn.addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('email');
  updateAuthUI();
  loadResources(categoryFilter.value);
});

async function loadResources(category = '') {
  resourceList.innerHTML = '<p>Loading resources...</p>';
  try {
    const url = category
      ? `${API_URL}?category=${encodeURIComponent(category)}`
      : API_URL;
    const response = await fetch(url);
    const resources = await response.json();

    if (resources.length === 0) {
      resourceList.innerHTML = '<p>No resources found.</p>';
      return;
    }

    resourceList.innerHTML = '';
    resources.forEach((resource) => {
      const card = document.createElement('div');
      card.className = 'resource-card';
      const token = getToken();
      card.innerHTML = `
        <span class="category-tag">${resource.category}</span>
        <h3>${resource.name}</h3>
        <p><strong>Address:</strong> ${resource.address}</p>
        ${
          resource.phone
            ? `<p><strong>Phone:</strong> ${resource.phone}</p>`
            : ''
        }
        ${
          resource.hours
            ? `<p><strong>Hours:</strong> ${resource.hours}</p>`
            : ''
        }
        ${
          resource.notes
            ? `<p><strong>Notes:</strong> ${resource.notes}</p>`
            : ''
        }
        ${
          token
            ? `<button class="delete-btn" data-id="${resource._id}">Delete</button>`
            : ''
        }
      `;
      resourceList.appendChild(card);
    });

    document.querySelectorAll('.delete-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const token = getToken();
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401) {
          alert('Your session expired. Please log in again.');
          localStorage.removeItem('token');
          localStorage.removeItem('email');
          updateAuthUI();
        }
        loadResources(categoryFilter.value);
      });
    });
  } catch (err) {
    resourceList.innerHTML =
      '<p>Error loading resources. The server may be waking up — try again in a moment.</p>';
    console.error(err);
  }
}

categoryFilter.addEventListener('change', () => {
  loadResources(categoryFilter.value);
});

resourceForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMessage.textContent = 'Submitting...';
  const token = getToken();

  const newResource = {
    name: document.getElementById('name').value,
    category: document.getElementById('category').value,
    address: document.getElementById('address').value,
    phone: document.getElementById('phone').value,
    hours: document.getElementById('hours').value,
    notes: document.getElementById('notes').value,
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newResource),
    });

    if (response.status === 401) {
      formMessage.textContent = 'Your session expired. Please log in again.';
      localStorage.removeItem('token');
      localStorage.removeItem('email');
      updateAuthUI();
      return;
    }

    if (!response.ok) throw new Error('Failed to add resource');

    formMessage.textContent = 'Resource added!';
    resourceForm.reset();
    loadResources(categoryFilter.value);
  } catch (err) {
    formMessage.textContent = 'Error adding resource. Please try again.';
    console.error(err);
  }
});

updateAuthUI();

if (getToken()) {
  loadResources();
}

