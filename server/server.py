import socket
import threading
import json
import os
from database_wrapper import MongoDBWrapper
from file_system_wrapper import FSWrapper
from user import User
from room import Room
from codes import RequestCodes
from auth import Auth

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
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind(("0.0.0.0", SERVER_PORT_NUMBER))
        self.clients = {}
        self.rooms = []
        self.handlers = {
            RequestCodes.CONNECT_TO_FILE.value: self.get_file_content_and_connect_to_room,
            RequestCodes.UPDATE_CHANGES.value: self.update_file_changes,
            RequestCodes.CREATE_FILE.value: self.create_file,
            RequestCodes.SIGN_UP.value: self.sign_up_user,
            RequestCodes.LOGIN.value: self.login_user,
            RequestCodes.CREATE_FOLDER.value: self.create_folder,
            RequestCodes.GET_FILES_AND_FOLDERS.value: self.get_files_and_folders_in_location,
            RequestCodes.DISCONNECT_FROM_FILE.value: self.disconnect_user_from_file,
            RequestCodes.GET_FILES.value: self.get_files
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
            try:
                client_message_code, client_message_len = self.get_message_info(client_socket)
                if client_message_code == 0:
                    self.remove_and_disconnect(user)
                    break
                client_message_data_json = self.get_message_data(client_socket, client_message_len)
            except json.decoder.JSONDecodeError:
                continue
            except ConnectionResetError:
                self.remove_and_disconnect(user)
                break
            response = self.handle_request(client_message_code, client_message_data_json, user)
            if response is not None:
                user.send_message(response)

    def remove_and_disconnect(self, user):
        room = user.get_room()
        if room is not None:
            room.remove_user(user)
        print(user.get_user_socket().getpeername(), "has disconnected")

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
        if response_data is None:
            return None
        response_data["code"] = code
        response_data_json = json.dumps(response_data)
        len_bytes = len(response_data_json).to_bytes(MESSAGE_LEN_FIELD_SIZE, byteorder="big", signed=False)
        return len_bytes + response_data_json.encode()

    def get_file_content(self, fileName, fileLocation):
        if not FSWrapper.check_if_file_exists(fileLocation, fileName):
            FSWrapper.create_file(fileLocation, fileName)
        file_object = FSWrapper.open_file(fileLocation, fileName, "r")
        file_content = FSWrapper.read_file_content(file_object)
        file_object.close()
        return file_content

    def get_file_content_and_connect_to_room(self, data, user):
        fileName = data["data"]["file_name"]
        fileLocation = "files/"+ data["data"]["location"]
        file_content = get_file_content(fileName, fileLocation)
        for room in self.rooms:  # checking is there is an open room for the file
            if room.get_file_name() == fileName:
                room.add_user(user)
        room = [room for room in self.rooms if room.get_file_name() == fileName]
        try:
            room[0].add_user(user)
            user.connect_to_room(room[0])
        except IndexError:
            self.rooms.append(Room(fileLocation, fileName))
            self.rooms[-1].add_user(user)
            user.connect_to_room(self.rooms[-1])
        return {"data": file_content}
    
    def update_file_changes(self, data, user):
        room = user.get_room()
        room.update_changes(data["data"]["updates"], data["data"]["line_count"], user)
        room.send_changes_to_all_room_users(data, user)
        return None
        
    def create_file(self, data, user):
        file_name = data["data"]["file_name"]
        file_path = "./files/" + data["data"]["location"]
        if FSWrapper.check_if_file_exists(file_path, file_name):
            return {"data": {"status": "error"}}
        try:
            MongoDBWrapper.create_new_file_record(file_name, file_path, user.get_user_name())
            FSWrapper.create_file(file_path, file_name)
        except Exception:
            return {"data": {"status": "error"}}
        self.get_file_content_and_connect_to_room(data, user)
        return {"data": {"status": "success"}}
    
    def create_folder(self, data, user):
        folder_name = data["data"]["folder_name"]
        folder_path = "./files/" + data["data"]["location"]
        if FSWrapper.check_if_folder_exists(folder_path, folder_name):
            return {"data": {"status": "error"}}
        try:
            MongoDBWrapper.create_new_folder_record(folder_name, folder_path, user.get_user_name())
            FSWrapper.create_folder(folder_path, folder_name)
        except Exception:
            return {"data": {"status": "error"}}
        return {"data": {"status": "success"}}
    
    def sign_up_user(self, data, user):
        try:
            Auth.add_new_user(data["data"]["username"], data["data"]["password"], data["data"]["email"])
        except Exception as e:
            return {"data": {"status": "error"}}
        user.login_user(data["data"]["username"])
        try:
            FSWrapper.create_folder("./files/", data["data"]["username"])
        except OSError:
            return {"data": {"status": "error"}}
        return {"data": {"status": "success"}}

    def login_user(self, data, user):
        try:
            auth_result = Auth.validate_user(data["data"]["username"], data["data"]["password"])
        except Exception as e:
            return {"data": {"status": "error"}}
        if auth_result:
            user.login_user(data["data"]["username"])
            return {"data": {"status": "success"}}
        else:
            return {"data": {"status": "error"}}
        
    def get_files_and_folders_in_location(self, data, user):
        location = "./files/" + data["data"]["location"]
        try:
            files_collection = MongoDBWrapper.connect_to_mongo("Files")
            files_documents = MongoDBWrapper.find_documents({"location": location}, files_collection)
            folders_collection = MongoDBWrapper.connect_to_mongo("Folders")
            folders_documents = MongoDBWrapper.find_documents({"location": location}, folders_collection)
        except Exception:
            return {"data": {"status": "error"}} 
        files_list = []
        for document in files_documents:
            files_list.append({"file_name": document.get("file_name", ""), "location": document.get("location", "")})
        folders_list = []
        for document in folders_documents:
            folders_list.append({"folder_name": document.get("folder_name", ""), "location": document.get("location", "")})
        return {
            "data": {
                "status": "success",
                "files": files_list,
                "folders": folders_list
            }
        }
    
    def disconnect_user_from_file(self, data, user):
        user_room = user.get_room()
        user_room.remove_user(user)
        user.connect_to_room(None)
        return None

    def get_files(self, data, user):
        data = data["data"]
        files = {"files":{}}
        for fileData in data["file_names"]:
            fileLocation, fileName = os.path.split(fileData)
            files["files"][fileName] = self.get_file_content(fileName, fileLocation)
        print(files)
        return {"data": files}

def main():
    main_server = server()
    main_server.accept_connections(10)

if __name__ == '__main__':
    main()
        
