var error = document.getElementById('errorMessage');
var button = document.getElementById('loginButton');
var input_username = document.getElementById('username');
var input_password = document.getElementById('password');
error.classList.toggle('bold-italic');

button.addEventListener('click', () => {
  const username = input_username.value;
  const password = input_password.value;

  if (username == "" || password == "") {
    error.textContent = 'You must fill all the fields';
  } else {
    window.electronAPI.sendLoginDetails(username, password);
  }
});

function switchForm() {
  window.electronAPI.switchToSignup();
}