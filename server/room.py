from file_system_wrapper import FSWrapper
import threading
import json

class Room():
    def __init__(self, file_path, file_name):
        self._file_name = file_name
        self._file_path = file_path
        self._file_object = FSWrapper.open_file(file_path, file_name, "r+")
        self._users = []
        self._file_lock = threading.Lock()
    
    def add_user(self, user):
        self._users.append(user)

    def remove_user(self, user):
        if user in self._users:
            self._users.remove(user)
    
    def get_file_name(self):
        return self._file_name
    
    def get_file_path(self):
        return self._file_path
    
    def update_changes(self, changes, amount_of_lines, updating_user):
        with self._file_lock:
            for line_number, new_line in changes.items():
                FSWrapper.write_change_to_file(self._file_object, line_number, new_line)
            FSWrapper.trim_end_of_file(self._file_object, amount_of_lines)
        
    def send_changes_to_all_room_users(self, data, sending_user):
        data["code"] = 2 #add the update code to the data dictionary
        print(data)
        for user in self._users:
            if user.get_user_socket() != sending_user.get_user_socket():
                data_json = json.dumps(data) 
                user.send_message(data_json.encode())
