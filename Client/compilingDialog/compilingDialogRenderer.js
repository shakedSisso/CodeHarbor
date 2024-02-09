const okButton = document.getElementById('okButton');
const cancelButton = document.getElementById('cancelButton');
const inputField = document.getElementById('textInput');

okButton.addEventListener('click', () => {
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
    }
    else {
        window.electronAPI.getFilesAndRun(input, files);
    }
});

cancelButton.addEventListener('click', () => {
    window.close();
});

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

window.electronAPI.getCurrentLocationFiles((event, value) => {
    createCheckboxes(value);
  })