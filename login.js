document.getElementById("loginForm").addEventListener("submit", function(e) {
  e.preventDefault();
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    showErrorModal("Please fill in both fields.");
    return;
  }

  fetch("http://127.0.0.1:5000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.message) {
      // Login success → redirect
      window.location.href = "homepage.html";
    } else {
      // Invalid credentials
      showErrorModal("Invalid email or password.");
    }
  })
  .catch(() => {
    showErrorModal("Server error! Please try again later.");
  });
});

// Show modal
function showErrorModal(message) {
  const modal = document.getElementById('errorModal');
  document.getElementById('errorText').textContent = message;
  modal.style.display = 'flex';
}

// Close modal
function closeErrorModal() {
  document.getElementById('errorModal').style.display = 'none';
}
