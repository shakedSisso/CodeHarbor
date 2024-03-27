var error = document.getElementById('errorMessage');
var button = document.getElementById('loginButton');
var input_username = document.getElementById('username');
var input_password = document.getElementById('password');

// Apply a CSS class to the error element
error.classList.toggle('bold-italic');

// Event listener for the login button click
button.addEventListener('click', () => {
  const username = input_username.value;
  const password = input_password.value;

  // Check if username or password is empty
  if (username == "" || password == "") {
    error.textContent = 'You must fill all the fields';
  } else {
    // Send login details to Electron main process
    window.electronAPI.sendLoginDetails(username, password);
  }
});

/**
 * Switches to the signup form.
 */
function switchForm() {
  window.electronAPI.switchToSignup();
}

// Listen for error messages from the Electron main process
window.electronAPI.showError((event, value) => {
  error.textContent = value;
});