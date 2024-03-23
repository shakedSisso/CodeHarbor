const closeButton = document.getElementById('closeButton');

window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.getFileSharesNames();
});

closeButton.addEventListener('click', () => {
    var isOneUnchecked = false;
    let usernames = [];
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(function(checkbox) {
        if (!checkbox.checked) {
            isOneUnchecked = true;
            const name = checkbox.alt;
            usernames.push(name);
        }
    });
    
    if (isOneUnchecked)
    {
        window.electronAPI.removeShares(usernames);
    }
    else
    {
        window.close();
    }
});

function createCheckboxes(checkboxLabels) {
    const compilingForm = document.getElementById('sharesForm');

    checkboxLabels.forEach(labelText => {
        const fileName = labelText.substring(labelText.lastIndexOf('/') + 1);

        const container = document.createElement('div');
        container.classList.add('checkbox-container');

        const label = document.createElement('label');
        label.classList.add('checkbox-label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'checkbox';
        checkbox.checked = true;
        checkbox.value = labelText;
        checkbox.alt = labelText;
        checkbox.classList.add('checkbox');

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(fileName));

        container.appendChild(label);

        compilingForm.appendChild(container);
    });
}

window.electronAPI.getCurrentFileShares((event, value) => {
    createCheckboxes(value);
  })