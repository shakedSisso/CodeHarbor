var textarea = document.getElementById('text-box');
var text = {};
var changes = {};
var currentLine = 1;
var currentIndex = 0;

  function updateCursorPosition() {
    var cursorPosition = textarea.selectionStart;
    var lines = textarea.value.substr(0, cursorPosition).split('\n');
    currentLine = lines.length;
    currentIndex = lines[currentLine - 1].length;
  }

  textarea.addEventListener('keyup', function(event) {
    var lines = textarea.value.split('\n');
    updateCursorPosition();
    if (event.key === 'Tab') {
      lines[currentLine - 1] = lines[currentLine - 1].substring(0, currentIndex) + '\t' + lines[currentLine - 1].substring(currentIndex);
      textarea.value = lines.join('\n');
    }
    if (text != lines) {
      var i = 0;
      for (i = 0; i < lines.length; i++) {
        if (text[i] != lines[i]) {
          changes[i+1] = lines[i];
      }
      for (var key in changes) {
        var numericKey = parseFloat(key);
        if (!isNaN(numericKey) && numericKey > i - 1 && changes[key] === null) {
            changes[key] = "deleted";
        }
    }
    }
    }
    text = lines;
  });
  updateCursorPosition();

  setInterval(() => {
    if (Object.keys(changes).length != 0) 
      window.electronAPI.sendChanges(changes, text.length);
    changes = {};
  }, 1000);

  window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.connectHandler();
    window.api.setMenu();
    window.electronAPI.getFile();
  });

  window.electronAPI.getContentFile((event, value) => {
    textarea.value = value;
    text = textarea.value.split('\n');
  })

  window.electronAPI.getFileUpdates((event, value) => {
    let changes = value.updates;
    let currentText = textarea.value.split("\n");
    Object.entries(changes).forEach(([key, value]) => {
      currentText[parseInt(key, 10) - 1] = value;
    });
    let newText = currentText.join("\n");
    textarea.value = newText;
  })
