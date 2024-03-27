const okButton = document.getElementById('okButton'); // The OK button element.
const cancelButton = document.getElementById('cancelButton'); // The Cancel button element.
const error = document.getElementById('errorMessage'); // The error message element.
const inputField = document.getElementById('textInput'); // The input text field element.

/**
 * Event listener for the 'DOMContentLoaded' event that triggers the electronAPI to get files.
 */
window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.getFiles();
});

/**
 * Event listener for the 'click' event on the OK button.
 * Validates input and triggers the electronAPI to get files and run based on user selections.
 */
okButton.addEventListener('click', () => {
    const fileNameRegex = /\./;
    var input = inputField.value;
    var isOneChecked = false;
    let files = [];
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function(checkbox) {
        if (checkbox.checked) {
            isOneChecked = true;
            files.push(checkbox.value);
        }
    });
    if (!isOneChecked)
    {
        alert('You must choose at least one file to compile and run');
        window.close();
    }
    else if (fileNameRegex.test(input)) 
    {
        alert('The executable`s name cannot include `.`');
        window.close();
    }
    else 
    {
        window.electronAPI.getFilesAndRun(input, files);
    }
});

/**
 * Event listener for the 'click' event on the Cancel button to close the window.
 */
cancelButton.addEventListener('click', () => {
    window.close();
});

/**
 * Creates checkboxes based on the provided checkbox labels.
 * @param {Array} checkboxLabels - An array of strings representing checkbox labels.
 */
function createCheckboxes(checkboxLabels) {
    const compilingForm = document.getElementById('compilingForm');

    checkboxLabels.forEach(labelText => {
        const fileName = labelText.substring(labelText.lastIndexOf('/') + 1);

        const container = document.createElement('div');
        container.classList.add('checkbox-container');

        const label = document.createElement('label');
        label.classList.add('checkbox-label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'checkbox';
        checkbox.value = labelText;
        checkbox.classList.add('checkbox');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(fileName));

        container.appendChild(label);


        compilingForm.appendChild(container);
    });
}

/**
 * Retrieves current location files and calls createCheckboxes to create checkboxes based on file names.
 * @param {Function} callback - The callback function to handle the event and value returned by electronAPI.
 */
window.electronAPI.getCurrentLocationFiles((event, value) => {
    createCheckboxes(value);
  })