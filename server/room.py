from file_system_wrapper import FSWrapper

class Room():
    def __init__(self, file_path, file_name):
        self._file_name = file_name
        self._file_path = file_path
        self._file_object = FSWrapper.open_file(file_path, file_name, "r+")
        self._users = []
    
    def add_user(self, user):
        self._users.append(user)
    
    def get_file_name(self):
        return self._file_name
    
    def update_changes(self, changes, updating_user):
        pass