// ===== FIELD ERROR FUNCTIONS =====
function setFieldError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) el.innerText = message;
}

function clearFieldErrors() {
  document.querySelectorAll(".error-text").forEach((el) => {
    el.innerText = "";
  });
}

// ===== GLOBAL ERROR (for login/server) =====
function showError(message) {
  const errorBox = document.getElementById("errorBox");
  if (!errorBox) return;

  errorBox.style.display = "block";
  errorBox.innerText = message;
}

function hideError() {
  const errorBox = document.getElementById("errorBox");
  if (errorBox) {
    errorBox.style.display = "none";
  }
}

// ===== VALIDATORS =====
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  return regex.test(password);
}

// ===== SIGNUP VALIDATION =====
function setupSignupValidation() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const fullNameInput = form.fullName;
  const emailInput = form.email;
  const passwordInput = form.password;

  // 🔥 REAL-TIME CLEARING
  fullNameInput.addEventListener("input", () => {
    setFieldError("fullNameError", "");
  });

  emailInput.addEventListener("input", () => {
    setFieldError("emailError", "");
  });

  passwordInput.addEventListener("input", () => {
    setFieldError("passwordError", "");
  });

  form.onsubmit = function () {
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    clearFieldErrors();
    hideError();

    let isValid = true;

    if (fullName.length < 3) {
      setFieldError("fullNameError", "Full name must be at least 3 characters");
      isValid = false;
    }

    if (!isValidEmail(email)) {
      setFieldError("emailError", "Enter a valid email");
      isValid = false;
    }

    if (!isValidPassword(password)) {
      setFieldError(
        "passwordError",
        "Use 8+ chars with uppercase, lowercase, number & special character",
      );
      isValid = false;
    }

    return isValid;
  };
}

// ===== LOGIN VALIDATION =====
function setupLoginValidation() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const emailInput = form.email;
  const passwordInput = form.password;

  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");

  // clear errors on typing
  emailInput.addEventListener("input", () => {
    emailError.innerText = "";
  });

  passwordInput.addEventListener("input", () => {
    passwordError.innerText = "";
  });

  form.onsubmit = function () {
    let isValid = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    emailError.innerText = "";
    passwordError.innerText = "";

    // email check
    if (!email) {
      emailError.innerText = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      emailError.innerText = "Enter a valid email";
      isValid = false;
    }

    // password check
    if (!password) {
      passwordError.innerText = "Password is required";
      isValid = false;
    }

    return isValid; // ✅ if false → form stops
  };
}

document.addEventListener("DOMContentLoaded", setupLoginValidation);

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  console.log("Validation loaded for:", page);

  if (page === "signup") {
    setupSignupValidation();
  }

  if (page === "login" || page === "admin-login") {
    setupLoginValidation();
  }
});
