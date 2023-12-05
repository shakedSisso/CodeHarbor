from file_system_wrapper import FSWrapper
import threading

class Room():
    def __init__(self, file_path, file_name):
        self._file_name = file_name
        self._file_path = file_path
        self._file_object = FSWrapper.open_file(file_path, file_name, "r+")
        self._users = []
        self._file_lock = threading.Lock()
    
    def add_user(self, user):
        self._users.append(user)
    
    def get_file_name(self):
        return self._file_name
    
    def update_changes(self, changes, updating_user):
        with self._file_lock:
            for line_number, new_line in changes.items():
                FSWrapper.write_change_to_file(self._file_object, line_number, new_line)