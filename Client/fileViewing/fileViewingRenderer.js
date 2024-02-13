dynamicallyCreateItem("../images/folder.png", "Owned");
dynamicallyCreateItem("../images/folder.png", "Shared");
const fileViewingForm = document.getElementById('fileViewingForm');

var usernameFolder;
var menuState = 0;
var contextMenuActive = "block";
var menu;
var pressedFile;
var isFolder;
var menuIsSet;

window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.requestUsername();
    window.electronAPI.checkLocation();
    menuIsSet = false;
    fileViewingForm.addEventListener('click', handleImageClick);
    fileViewingForm.alt = ""; //used to keep track on the location the user is in
    menu = document.querySelector(".context-menu");
    document.addEventListener("click", (e) => {
        var button = e.which || e.button;
        if (button === 1) {
          toggleMenuOff();
        }
      });
      
      // Close Context Menu on Esc key press
      window.onkeyup = function (e) {
        if (e.keyCode === 27) {
          toggleMenuOff();
        }
      }
    document.getElementById("shareButtonDiv").addEventListener("click", (event) => {
        createShareRequest(pressedFile, fileViewingForm.alt, isFolder);
    })
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

    container.appendChild(img);
    container.appendChild(label);

    container.addEventListener('contextmenu', (event) => 
    {
        event.preventDefault();
        toggleMenuOn();
        pressedFile = labelText;
        if (imageSrc === "../images/folder.png")
        {
            isFolder = true;
        }
        else
        {
            isFolder = false;
        }
        positionMenu(event);
        return false;
    }, false);

    document.getElementById('fileViewingForm').appendChild(container);
}

function createShareRequest(objectName, location, isFolder)
{
    window.electronAPI.getShareCode(objectName, location, isFolder);
}

function deleteAllItems() {
    var container = document.getElementById('fileViewingForm');
    container.innerHTML = '';
}

function toggleMenuOn() {
    if (menuState !== 1) {
      menuState = 1;
      menu.classList.add(contextMenuActive);
    }
  }

  function toggleMenuOff() {
    if (menuState !== 0) {
      menuState = 0;
      menu.classList.remove(contextMenuActive);
    }
  }

  function getPosition(e) {
    var posx = 0;
    var posy = 0;
  
    if (!e) var e = window.event;
  
    if (e.pageX || e.pageY) {
      posx = e.pageX;
      posy = e.pageY;
    } else if (e.clientX || e.clientY) {
      posx =
        e.clientX +
        document.body.scrollLeft +
        document.documentElement.scrollLeft;
      posy =
        e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
  
    return {
      x: posx,
      y: posy
    };
  }

  function positionMenu(e) {
    let clickCoords = getPosition(e);
    let clickCoordsX = clickCoords.x;
    let clickCoordsY = clickCoords.y;
  
    let menuWidth = menu.offsetWidth + 4;
    let menuHeight = menu.offsetHeight + 4;
  
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
  
    if (windowWidth - clickCoordsX < menuWidth) {
      menu.style.left = windowWidth - menuWidth + "px";
    } else {
      menu.style.left = clickCoordsX + "px";
    }
  
    if (windowHeight - clickCoordsY < menuHeight) {
      menu.style.top = windowHeight - menuHeight + "px";
    } else {
      menu.style.top = clickCoordsY + "px";
    }
  }