document.getElementById("registerForm").addEventListener("submit", handleSubmit);

function handleSubmit(e) {
  e.preventDefault();

  const fullname = document.getElementById("fullname").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const errorMsg = document.getElementById("error-msg");

  if (password !== confirmPassword) {
    errorMsg.textContent = "Passwords do not match.";
    return;
  }

  fetch("http://127.0.0.1:5000/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fullname, email, phone, password })
  })
  .then(res => res.json())
  .then(data => {
    console.log(data); // Debugging
    if (data.message) {
      document.getElementById('successModal').style.display = 'flex';
    } else {
      errorMsg.textContent = data.error;
    }
  })
  .catch(err => {
    errorMsg.textContent = "Server error!";
  });
}

function closeModal() {
  document.getElementById('successModal').style.display = 'none';
  document.getElementById('registerForm').reset();
}
