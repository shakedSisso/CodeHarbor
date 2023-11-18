from socket import socket

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