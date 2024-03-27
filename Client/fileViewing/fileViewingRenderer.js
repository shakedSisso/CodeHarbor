// Function to dynamically create items with specified image and text
function dynamicallyCreateItem(imagePath, text) {
    // Implementation is missing
}

// Get the fileViewingForm element from the DOM
const fileViewingForm = document.getElementById('fileViewingForm');

// Variables to store username folder, pressed file, and flag for folder
var usernameFolder;
var pressedFile;
var isFolder;

// Event listener for when the DOM content is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Request username from the electronAPI
    window.electronAPI.requestUsername();
    // Check the current location
    window.electronAPI.checkLocation();
    // Initialize menuIsSet to false
    menuIsSet = false;
    // Add click event listener to the fileViewingForm
    fileViewingForm.addEventListener('click', handleImageClick);
    // Set the alt attribute of fileViewingForm to an empty string
    fileViewingForm.alt = ""; //used to keep track of the location the user is in
  });

// Callback function to handle the username received from electronAPI
window.electronAPI.getUsername((event, username) => {
    // Concatenate the username with a slash for folder structure
    usernameFolder = username + "/";
});

// Callback function to handle the location received from electronAPI
window.electronAPI.getLocation((event, location) => {
    // Set the alt attribute of fileViewingForm to the current location
    fileViewingForm.alt = location + "/";
    // Call deleteAllItems function to clear existing items
    deleteAllItems();
    // Dynamically create a ".." folder item using specified image
    dynamicallyCreateItem("../images/folder.png", "..");
});
// Function to handle showing files and folders in the Electron application
window.electronAPI.showFilesAndFolders((event, filesAndFolders) => {
    // Check if the fileViewingForm has the usernameFolder in its alt attribute
    if (fileViewingForm.alt.includes(usernameFolder)){ 
        // Clear all items and dynamically create an item to show that a folder was created
        deleteAllItems();
        dynamicallyCreateItem("../images/folder.png", "..");
    }

    // Loop through the folders in filesAndFolders and dynamically create items for each folder
    for (const folder of filesAndFolders.folders){
        dynamicallyCreateItem("../images/folder.png", folder.folder_name, folder.location);
    }

    // Loop through the files in filesAndFolders and dynamically create items for each file
    for (const file of filesAndFolders.files){
        dynamicallyCreateItem("../images/file.png", file.file_name, file.location);
    }

    // Check if the fileViewingForm alt attribute is not empty and menuIsSet is false
    if (fileViewingForm.alt != "" && !menuIsSet)
    {
        // Set the menu based on whether the user owns the folder or not
      if (fileViewingForm.alt.includes(usernameFolder))
        window.electronAPI.setMenu("Owned/");
      else
        window.electronAPI.setMenu("Shared/");
    }
});

// Function to handle clicks on images
function handleImageClick(event) {
    // Check if the clicked element is an image
    if (event.target.tagName === 'IMG') {
        // Clear all items and get the name of the clicked image
        deleteAllItems();
        const name = event.target.title;

        // Check conditions based on fileViewingForm alt attribute and clicked image name
        if (name === "../" && (fileViewingForm.alt === usernameFolder || fileViewingForm.alt === "Shared/"))
        {
            // Create items for "Owned" and "Shared" folders
            dynamicallyCreateItem("../images/folder.png", "Owned");
            dynamicallyCreateItem("../images/folder.png", "Shared");
        }
        else 
        {
            // Create item for navigating back to the previous folder
            dynamicallyCreateItem("../images/folder.png", "..");
        }

        // Check if the name ends with '/'
        if (name.endsWith('/'))
        {
            if (name === "../")
            {
                const location = fileViewingForm.alt;
                const slashCount = location.split('/').length - 1; //count the amount of folders are in the path
                if (slashCount === 1) { //if the user only entered one of the main folders
                    fileViewingForm.alt = "";
                    window.electronAPI.resetLocation();
                }
                else 
                {
                    fileViewingForm.alt = goBackAFolder(fileViewingForm.alt);
                    if (fileViewingForm.alt.startsWith("Shared/"))
                    {
                        if (slashCount === 5) //used to skip the folders 'files', '.' and the folder with the name of the owner
                        {
                            fileViewingForm.alt = "Shared/";
                        }
                        window.electronAPI.getSharedFilesAndFolders(fileViewingForm.alt);
                        return;
                    }
                }
            }
            else 
            {
                if (name === "Shared/")
                {
                    window.electronAPI.setMenu(name);
                    menuIsSet = true;
                    window.electronAPI.showMenu();
                    fileViewingForm.alt = name;
                    window.electronAPI.getSharedFilesAndFolders(fileViewingForm.alt);
                    return;
                }
                else if (fileViewingForm.alt.startsWith("Shared/"))
                {
                    fileViewingForm.alt = "Shared/" + event.target.alt + "/" + name;
                    window.electronAPI.getSharedFilesAndFolders(event.target.alt + "/" + name);
                }
                else if (name === "Owned/") 
                {
                    // Handle navigating into the owned folder
                    fileViewingForm.alt = usernameFolder;
                    window.electronAPI.setMenu(name);
                    menuIsSet = true;
                    window.electronAPI.showMenu();
                }
                else 
                {
                    fileViewingForm.alt += name;
                }
            }
            window.electronAPI.getFilesAndFolders(fileViewingForm.alt);
        }
        else 
        {
            if(fileViewingForm.alt.startsWith("Shared/"))
            {
                // Handle switching to edit a shared file
                window.electronAPI.switchToSharedEditFile(name, event.target.alt);
            }
            else
            {
                // Handle switching to edit a file
                window.electronAPI.switchToEditFile(name);
            }

        }
    }
}

// Function to navigate back a folder in the file path
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

// Function to dynamically create an item in the file viewing form
function dynamicallyCreateItem(imageSrc, labelText, location) {
    // Create a new container div element
    let container = document.createElement('div');
     // Add 'file-container' class to the container div
    container.classList.add('file-container');

    // Create a new label element and set its text content to the provided labelText
    let label = document.createElement('label');
    label.textContent = labelText;

    // Create a new img element
    let img = document.createElement('img');

    // Check if the image source is a folder icon, then modify labelText and add a slash
    if (imageSrc === "../images/folder.png")
        labelText += "/";

    // Set various attributes of the img element
    img.title = labelText;
    img.alt = location;
    img.src = imageSrc;
    img.width = 45;
    img.height = 65;
    img.style.margin = '5px';

    // Add an event listener for the contextmenu event on the img element
    img.addEventListener('contextmenu', function(event) {
      // Check if the labelText is not specific folders to exclude from context menu
      if (labelText !== "Owned/" && labelText !== "Shared/" && labelText !== "../")
      {
        pressedFile = labelText;
        isFolder = imageSrc === "../images/folder.png";
        event.preventDefault(); 
        showContextMenu(event.clientX, event.clientY);
      }
  });

    // Append the img and label elements to the container div
    container.appendChild(img);
    container.appendChild(label);

    // Append the container div to the fileViewingForm element in the document
    document.getElementById('fileViewingForm').appendChild(container);
}

// Function to show the context menu at the specified coordinates
function showContextMenu(x, y) {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  // Handle click events for the options in the context menu
  const shareOption = document.getElementById('shareOption');
  shareOption.addEventListener('click', share);

  const manageOption = document.getElementById('manageOption');
  manageOption.addEventListener('click', manage);

  const deleteOption = document.getElementById('deleteOption');
  deleteOption.addEventListener('click', remove);

  const downloadOption = document.getElementById('downloadOption');
  downloadOption.addEventListener('click', download);

  // Check if the current location is within the Shared folder
  if (fileViewingForm.alt.startsWith("Shared"))
  {
    //hide the share and manage options
    shareOption.style.display = 'none';
    manageOption.style.display = 'none';
    deleteOption.style.display = 'none';
  }
  else 
  {
    // display the share and manage options
    shareOption.style.display = 'flex';
    manageOption.style.display = 'flex';
    deleteOption.style.display = 'flex';
  }

  // Add an event listener to hide the context menu when clicking outside of it
  document.addEventListener('click', function hideContextMenu() {
      contextMenu.style.display = 'none';
      document.removeEventListener('click', hideContextMenu);
  });
}

// Function to handle the share option in the context menu
function share() {
    window.electronAPI.getShareCode(pressedFile, fileViewingForm.alt, isFolder);
}

/**
 * Function to manage file shares based on user actions.
 * Calls the 'getFileShares' function from the electronAPI.
 */
function manage() {
    window.electronAPI.getFileShares(pressedFile, fileViewingForm.alt, isFolder);
}

/**
 * Function to remove a file or folder based on user actions.
 * Calls the 'sendRequestToDelete' function from the electronAPI.
 */
function remove() {
    window.electronAPI.sendRequestToDelete(pressedFile, fileViewingForm.alt, isFolder);
}

/**
 * Function to initiate file download based on user actions.
 * Calls the 'getChosenFiles' function from the electronAPI.
 */
function download() {
    window.electronAPI.getChosenFiles(pressedFile, fileViewingForm.alt, isFolder);
}

/**
 * Function to delete all items in the file viewing form.
 * Clears the inner HTML content of the 'fileViewingForm' element.
 */
function deleteAllItems() {
    var container = document.getElementById('fileViewingForm');
    container.innerHTML = '';
}
