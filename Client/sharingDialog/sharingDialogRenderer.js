const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const objectField = document.getElementById('objectInput');
const shareCodeField = document.getElementById('shareCodeInput');

const fileRadioButton = document.getElementById('file');
const folderRadioButton = document.getElementById('folder');

// Event listeners
okButton.addEventListener('click', () => {
  var objectName, isFolder, shareCode;
  const shareCodeRegex = /^[a-zA-Z0-9]{11}$/;
  const fileNameRegex = /\.(c|h)$/;

  // Validate radio buttons and input fields
  if (validateRadioButtons()) {
    objectName = objectField.value;
    shareCode = shareCodeField.value;

    // Validate share code format
    if(!shareCodeRegex.test(shareCode))
    {
        alert("Enter a valid share code!");
        return;
    }

    // Determine if sharing a file or folder based on radio button selection
    const checked = getCheckedRadioButton();
    if (checked == folderRadioButton){
      isFolder = true;
    } else {
      // Validate file name format
      if(!fileNameRegex.test(objectName))
      {
        alert("A file name must end in .c or .h");
        return;
      }
      isFolder = false;
    }

    // Call Electron API to share the object and close the window
    window.electronAPI.share(objectName, shareCode, isFolder);
    window.close();
  }
});

// Cancel button event listener
cancelButton.addEventListener('click', () => {
  window.close();
});

// Function to get the checked radio button
function getCheckedRadioButton() {
  var radioButtons = document.getElementsByName('radioGroup');

  for (var i = 0; i < radioButtons.length; i++) {
    if (radioButtons[i].checked) {
      return radioButtons[i];
    }
  }
  return null;
}

// Function to validate radio button selection
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