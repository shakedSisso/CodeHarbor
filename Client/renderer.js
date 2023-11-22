var textarea = document.getElementById('text-box');
var text = "";
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
        if (text[i] != lines[i] && lines[i] != '') {
          changes[i+1] = lines[i];
      } else if (text[i] != lines[i]) {
        changes[i+1] = 'new line';
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
    document.getElementById('key').innerText = event.key;
    var resultString = '';
    for (var key in changes) {
      resultString += key + ': ' + changes[key] + '\n';
  }
    document.getElementById('data').innerText = resultString; 
  });
  updateCursorPosition();

  setInterval(() => {
    if (Object.keys(changes).length != 0)
      window.electronAPI.sendChanges(changes);
    changes = {};
  }, 1000);
