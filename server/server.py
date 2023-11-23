import socket
import threading
import json
import os
from file_system_wrapper import FSWrapper
from user import User
from room import Room
from codes import RequestCodes

MAX_DEFAULT_CONNECTION_AMOUNT = 20
HEADER_LENGTH = 5
SERVER_PORT_NUMBER = 1888
MESSAGE_CODE_FIELD_SIZE = 2
MESSAGE_LEN_FIELD_SIZE = 3

exit_event = threading.Event()  # Event to signal threads to exit

class server():
    def __init__(self):
        if not FSWrapper.check_if_folder_exists(os.getcwd(), "files"):
            FSWrapper.create_folder(os.getcwd(), "files")
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.bind(("0.0.0.0", SERVER_PORT_NUMBER))
        self.clients = {}
        self.rooms = []
        self.handlers = {
            RequestCodes.CONNECT_TO_FILE.value: self.get_file_content_and_connect_to_room,
            RequestCodes.UPDATE_CHANGES.value: self.update_file_changes
            }
        
    
    def accept_connections(self, connections_amount=MAX_DEFAULT_CONNECTION_AMOUNT):
        self.sock.listen(connections_amount)
       
        try:
            while not exit_event.is_set():
                client_sock, client_addr = self.sock.accept()
                print("Recieved connetion from:", client_addr)
                self.clients[client_sock] = threading.Thread(target=self.handle_client, args=(client_sock,))
                self.clients[client_sock].deamon = True
                self.clients[client_sock].start()
        except KeyboardInterrupt:
            self.sock.close()
            quit(1)
    
    def handle_client(self, client_socket):
        user = User(client_socket)
        while not exit_event.is_set():
            client_message_code, client_message_len = self.get_message_info(client_socket)
            client_message_data_json = self.get_message_data(client_socket, client_message_len)
            message_data = client_message_data_json
            response = self.handle_request(client_message_code, message_data, user)
            user.send_message(response)



    def get_message_info(self, client_socket):
        header = client_socket.recv(HEADER_LENGTH)
        msg_code = header[0:2]
        msg_len = header[2:]
        msg_code = int.from_bytes(msg_code, byteorder="big")
        msg_len = int.from_bytes(msg_len, byteorder="big")
        return msg_code, msg_len

    def get_message_data(self, client_socket, msg_len):
        message_data =  client_socket.recv(msg_len).decode()
        message_json = json.loads(message_data)
        return message_json


    def handle_request(self, code, data, user):
        response_data = self.handlers[code](data, user)
        response_data["code"] = code
        response_data_json = json.dumps(response_data)
        len_bytes = len(response_data_json).to_bytes(MESSAGE_LEN_FIELD_SIZE, byteorder="big", signed=False)
        return len_bytes + response_data_json.encode()

    def get_file_content_and_connect_to_room(self, data, user):
        if not FSWrapper.check_if_file_exists("files", data["data"]["file_name"]):
            FSWrapper.create_file("files", data["data"]["file_name"])
        file_object = FSWrapper.open_file("files", data["data"]["file_name"], "r")
        file_content = FSWrapper.read_file_content(file_object)
        file_object.close()
        for room in self.rooms:  # checking is there is an open room for the file
            if room.get_file_name() == data["data"]["file_name"]:
                room.add_user(user)
        room = [room for room in self.rooms if room.get_file_name() == data["data"]["file_name"]]
        try:
            room[0].add_user(user)
            user.connect_to_room(room[0])
        except IndexError:
            self.rooms.append(Room("files", data["data"]["file_name"]))
            self.rooms[0].add_user(user)
            user.connect_to_room(self.rooms[0])
        return {"data": file_content}
    
    def update_file_changes(self, data, user):
        room = user.get_room()
        room.update_changes(data["data"]["changes"], user)
        
        


def main():
    main_server = server()
    main_server.accept_connections(10)

if __name__ == '__main__':
    main()
        