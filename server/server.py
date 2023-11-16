import socket
import threading
import json

MAX_DEFAULT_CONNECTION_AMOUNT = 20
HEADER_LENGTH = 5
TEMP_MESSAGE_LENGTH = 1024

class server():
    def __init__(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.bind(("0.0.0.0", 1888))
        self.clients = {}
        self.handlers = {1: self.get_file_content}
    
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
        while not exit_event.is_set():
            client_message_code, client_message_len = self.get_message_info(client_socket)
            client_message_code = 1
            client_message_len = TEMP_MESSAGE_LENGTH
            client_message_data_json = self.get_message_data(client_socket, client_message_len)
            message_data = client_message_data_json["data"]
            handle_request(client_message_code, message_data)


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


    def handle_request(self, code, data):
        return self.handlers[code](data)

    def get_file_content(self, data):
        pass

        
        


def main():
    main_server = server()
    main_server.accept_connections(10)

if __name__ == '__main__':
    main()
        