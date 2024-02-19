dynamicallyCreateItem("../images/folder.png", "Owned");
dynamicallyCreateItem("../images/folder.png", "Shared");
const fileViewingForm = document.getElementById('fileViewingForm');

var usernameFolder;
var pressedFile;
var isFolder;

window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.requestUsername();
    window.electronAPI.checkLocation();
    menuIsSet = false;
    fileViewingForm.addEventListener('click', handleImageClick);
    fileViewingForm.alt = ""; //used to keep track on the location the user is in
  });

window.electronAPI.getUsername((event, username) => {
    usernameFolder = username + "/";
});

window.electronAPI.getLocation((event, location) => {
    fileViewingForm.alt = location + "/";
    //function is called if location isn't empty so there should be a `..` folder instead of the original folder/s
    deleteAllItems();
    dynamicallyCreateItem("../images/folder.png", "..");
});

window.electronAPI.showFilesAndFolders((event, filesAndFolders) => {
    if (fileViewingForm.alt.includes(usernameFolder)){ //used when user creates a new folder to show the folder was created
        deleteAllItems();
        dynamicallyCreateItem("../images/folder.png", "..");
    }

    for (const folder of filesAndFolders.folders){
        dynamicallyCreateItem("../images/folder.png", folder.folder_name, folder.location);
    }
    for (const file of filesAndFolders.files){
        dynamicallyCreateItem("../images/file.png", file.file_name, file.location);
    }
    
    //this check is used to set the menu when a user exits a file
    if (fileViewingForm.alt != "" && !menuIsSet)
    {
      if (fileViewingForm.alt.includes(usernameFolder))
        window.electronAPI.setMenu("Owned/");
      else
        window.electronAPI.setMenu("Shared/");
    }
});

function handleImageClick(event) {
    // Check if the clicked element is an image
    if (event.target.tagName === 'IMG') {
        deleteAllItems();
        const name = event.target.title;

        if ((fileViewingForm.alt === usernameFolder && name != "Owned/") || fileViewingForm.alt === "Shared/")
        {
            dynamicallyCreateItem("../images/folder.png", "Owned");
            dynamicallyCreateItem("../images/folder.png", "Shared");
        }
        else 
        {
            dynamicallyCreateItem("../images/folder.png", "..");
        }
        
        if (name.endsWith('/'))
        {
            if (name === "../")
            {
                if (fileViewingForm.alt == usernameFolder || fileViewingForm.alt == "Shared/"){
                    fileViewingForm.alt = "";
                    window.electronAPI.resetLocation();
                }
                else {
                    fileViewingForm.alt = goBackAFolder(fileViewingForm.alt);
                }
            }
            else 
            {
                if (name.startsWith("Shared/"))
                {
                    if(name === "Shared/")
                    {
                        window.electronAPI.setMenu(name);
                        menuIsSet = true;
                        window.electronAPI.showMenu();
                        fileViewingForm.alt = name;
                    }
                    else
                    {
                        fileViewingForm.alt = fileViewingForm.alt + name;
                    }
                    window.electronAPI.getSharedFilesAndFolders(fileViewingForm.alt);
                    return;
                }
                else if (name === "Owned/") 
                {
                    fileViewingForm.alt = usernameFolder;
                    window.electronAPI.setMenu(name);
                    menuIsSet = true;
                    window.electronAPI.showMenu();
                }
                else 
                {
                    fileViewingForm.alt = fileViewingForm.alt + name;
                }
            }
            window.electronAPI.getFilesAndFolders(fileViewingForm.alt);
        }
        else 
        {
            if(fileViewingForm.alt.startsWith("Shared/"))
            {
                window.electronAPI.switchToSharedEditFile(name, event.target.alt);
            }
            else
            {
                window.electronAPI.switchToEditFile(name);
            }
            
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

function dynamicallyCreateItem(imageSrc, labelText, location) {
    let container = document.createElement('div');
    container.classList.add('file-container');

    let label = document.createElement('label');
    label.textContent = labelText;

    let img = document.createElement('img');
    if (imageSrc === "../images/folder.png")
        labelText += "/";
    img.title = labelText;
    img.alt = location;
    img.src = imageSrc;
    img.width = 45;
    img.height = 65;
    img.style.margin = '5px';

    img.addEventListener('contextmenu', function(event) {
      //the main folders, the folder used to go back to the parent folder and the files in the shared folder don't have a context menu
      if (labelText !== "Owned/" && labelText !== "Shared/" && labelText !== "../" && !fileViewingForm.alt.startsWith("Shared"))
      {
        pressedFile = labelText;
        isFolder = imageSrc === "../images/folder.png";
        event.preventDefault(); 
        showContextMenu(event.clientX, event.clientY);
      }
  });

    container.appendChild(img);
    container.appendChild(label);
    document.getElementById('fileViewingForm').appendChild(container);
}

function showContextMenu(x, y) {
  const contextMenu = document.getElementById('contextMenu');
  contextMenu.style.display = 'block';
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;

  // Handle click on Share option
  const shareOption = document.getElementById('shareOption');
  shareOption.addEventListener('click', share);

  // Hide the context menu when clicking outside of it
  document.addEventListener('click', function hideContextMenu() {
      contextMenu.style.display = 'none';
      document.removeEventListener('click', hideContextMenu);
  });
}

function share() {
    window.electronAPI.getShareCode(pressedFile, fileViewingForm.alt, isFolder);
}

function deleteAllItems() {
    var container = document.getElementById('fileViewingForm');
    container.innerHTML = '';
}
