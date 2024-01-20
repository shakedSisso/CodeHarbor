const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const inputField = document.getElementById('textInput');

const hFileRadioButton = document.getElementById('hFile');
const cFileRadioButton = document.getElementById('cFile');
const folderRadioButton = document.getElementById('folder');

okButton.addEventListener('click', () => {
  var input, isFolder;
  if (validateRadioButtons()) {
    input = inputField.value;
    const checked = getCheckedRadioButton();
    if (checked == folderRadioButton){
      isFolder = true;
    } else {
      isFolder = false;
      if (checked == hFileRadioButton){
        input += '.h';
      } else {
        input += '.c';
      }
    }
  }
  window.electronAPI.create(input, isFolder);
  window.close();
});

cancelButton.addEventListener('click', () => {
  window.close();
});

function getCheckedRadioButton() {
  var radioButtons = document.getElementsByName('radioGroup');

  for (var i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      return radioButtons[i];
    }
  }
  return null;
}

function validateRadioButtons() {
  var radioButtons = document.getElementsByName('radioGroup');
  var radioSelected = false;

  for (var i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      radioSelected = true;
      break;  // Exit the loop once a checked radio button is found
    }
  }

  if (radioSelected)
    return true;
  alert('Please choose at least one radio button.');
  return false;
}