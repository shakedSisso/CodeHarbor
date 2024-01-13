dynamicallyCreateItem("../images/folder.png", "Owned");
const fileViewingForm = document.getElementById('fileViewingForm');

var usernameFolder;

window.addEventListener('DOMContentLoaded', () => {
    window.api.setMenu();
    fileViewingForm.addEventListener('click', handleImageClick);
    fileViewingForm.alt = ""; //used to keep track on the location the user is in
  });

window.electronAPI.getUsername((event, username) => {
    usernameFolder = username + "/";
});

window.electronAPI.showFilesAndFolders((event, filesAndFolders) => {
    for (const file of filesAndFolders.folders){
        dynamicallyCreateItem("../images/folder.png", file);
    }
    for (const file of filesAndFolders.files){
        dynamicallyCreateItem("../images/file.png", file);
    }
});

function handleImageClick(event) {
    // Check if the clicked element is an image
    if (event.target.tagName === 'IMG') {
        deleteAllItems();
        const name = event.target.alt;

        if (fileViewingForm.alt === usernameFolder && name != "Owned/")
        {
            dynamicallyCreateItem("../images/folder.png", "Owned");
        }
        else 
        {
            dynamicallyCreateItem("../images/folder.png", "..");
        }

        if (name.endsWith('/'))
        {
            if (name === "../")
            {
                fileViewingForm.alt = goBackAFolder(fileViewingForm.alt);
            }
            else 
            {
                if (name != "Owned/") 
                    fileViewingForm.alt = fileViewingForm.alt + name;
                else 
                    fileViewingForm.alt = usernameFolder;
            }
            window.electronAPI.getFilesAndFolders(fileViewingForm.alt);
        }
        else 
        {
            window.electronAPI.switchToEditFile(name);
        }
    }
}

function goBackAFolder(inputString) {
    const lastSlashIndex = inputString.lastIndexOf('/');
    const secondToLastSlashIndex = inputString.lastIndexOf('/', lastSlashIndex - 1);
  
    if (secondToLastSlashIndex !== -1) {
      // Extract the substring before the one before the last '/'
      const result = inputString.substring(0, secondToLastSlashIndex + 1);
      return result;
    } else {
      // Handle the case when there are not enough slashes
      return inputString;
    }
  }

function dynamicallyCreateItem(imageSrc, labelText) {
    let container = document.createElement('div');
    container.classList.add('file-container');

    let label = document.createElement('label');
    label.textContent = labelText;

    let img = document.createElement('img');
    if (imageSrc === "../images/folder.png")
        labelText += "/";
    img.alt = labelText;
    img.src = imageSrc;
    img.width = 45;
    img.height = 65;
    img.style.margin = '5px';

    container.appendChild(img);
    container.appendChild(label);

    document.getElementById('fileViewingForm').appendChild(container);
}

function deleteAllItems() {
    var container = document.getElementById('fileViewingForm');
    container.innerHTML = '';
}