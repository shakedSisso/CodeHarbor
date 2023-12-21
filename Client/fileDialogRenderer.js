document.addEventListener('DOMContentLoaded', () => {
    console.log("on callback");
    const okButton = document.getElementById('okButton');
    const cancelButton = document.getElementById('cancelButton');
    const inputField = document.getElementById('textInput');

    okButton.addEventListener('click', () => {
      console.log("ok button clicked");
      const input = inputField.value;
      window.electronAPI.createNewFile(input);
      window.close();
    });

    cancelButton.addEventListener('click', () => {
      console.log("cancel button clicked");
      window.close();
    });
  });