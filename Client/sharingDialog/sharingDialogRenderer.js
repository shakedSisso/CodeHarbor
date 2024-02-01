const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const objectField = document.getElementById('objectInput');
const shareCodeField = document.getElementById('shareCodeInput');

const fileRadioButton = document.getElementById('file');
const folderRadioButton = document.getElementById('folder');

okButton.addEventListener('click', () => {
  var objectName, isFolder, shareCode;
  const shareCodeRegex = /^[a-zA-Z0-9]{8}$/;
  if (validateRadioButtons()) {
    objectName = objectField.value;
    shareCode = shareCodeField.value;
    if(!shareCodeRegex.test(shareCode))
    {
        alert("Enter a valid share code!");
        return;
    }
    const checked = getCheckedRadioButton();
    if (checked == folderRadioButton){
      isFolder = true;
    } else {
      isFolder = false;
    }
    window.electronAPI.share(objectName, shareCode, isFolder);
    window.close();
  }
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