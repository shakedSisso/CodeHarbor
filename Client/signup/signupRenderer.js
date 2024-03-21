var error = document.getElementById('errorMessage');
var button = document.getElementById('signupButton');
var input_username = document.getElementById('username');
var input_password = document.getElementById('password');
var input_email = document.getElementById('email');

// Apply CSS class to error message element
error.classList.toggle('bold-italic');

// Add event listener to signup button
button.addEventListener('click', () => {
  const username = input_username.value;
  const password = input_password.value;
  const email = input_email.value;

  if (checkIfInputValid(username, password, email)) {
    window.electronAPI.sendSignUpDetails(username, password, email);
  }
});

/**
 * Checks if the input fields (username, password, email) are valid.
 * @param {string} username - The username input value.
 * @param {string} password - The password input value.
 * @param {string} email - The email input value.
 * @returns {boolean} True if inputs are valid, false otherwise.
 */
function checkIfInputValid(username, password, email) {
  if (username == "" || password == "" || email == "") {
    error.textContent = 'You must fill all the fields';
    return false;
  }

  const usernameRegex = /^[a-zA-Z0-9_]{3,16}$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!usernameRegex.test(username)){
    error.textContent = 'Username must be between 3-16 characters and can only include English letters and numbers';
    return false;
  } 
  
  if (!emailRegex.test(email)) {
    error.textContent = 'Email address is not in the correct format';
    return false;
  } 
  
  if (!passwordRegex.test(password)){
    error.textContent = 'Password must be at least 8 characters long and require at least one uppercase letter, one lowercase letter, and one digit';
    return false;
  } 

  return true;
}

/**
 * Switches the form from signup to login.
 */
function switchForm() {
  window.electronAPI.switchToLogin();
}

// Listen for error event and update error message
window.electronAPI.showError((event, value) => {
  error.textContent = value;
});