from socket import socket
from room import Room

class User():
    def __init__(self, user_socket, user_name="ghost"):
        self._user_socket = user_socket
        self._user_name = user_name
    
    def send_message(self, message):
        try:
            self._user_socket.send(message)
        except Exception as e:
            print(e)
            return -1
        finally:
            return 0

    def get_user_name(self):
        return self._user_name
    
    def connect_to_room(self, room):
        self._room = room

    def get_room(self):
        return self._room