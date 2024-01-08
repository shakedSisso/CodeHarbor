from socket import socket
from room import Room

class User():
    def __init__(self, user_socket, user_name="ghost"):
        self._user_socket = user_socket
        self._user_name = user_name
        self._is_logged_in = True
        self._room = None
    
    def send_message(self, message):
        try:
            self._user_socket.send(message)
        except Exception as e:
            print(e)
            return -1
        finally:
            return 0

    def login_user(self, username):
        self._is_logged_in = True
        self._user_name = username

    def get_user_name(self):
        return self._user_name

    def get_user_socket(self):
        return self._user_socket
    
    def connect_to_room(self, room):
        self._room = room

    def get_room(self):
        return self._room