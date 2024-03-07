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
import secrets

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
            RequestCodes.CREATE_SHARE_CODE.value: self.create_share_code_for_file,
            RequestCodes.CONNECT_TO_SHARED_FILE.value: self.connect_to_shared_file,
            RequestCodes.GET_SHARED_FILES_AND_FOLDERS.value: self.get_shared_files_and_folders,
            RequestCodes.GET_FILES.value: self.get_files,
            RequestCodes.DELETE_OBJECT: self.delete_object_request
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
        file_content = self.get_file_content(fileName, fileLocation)
        for room in self.rooms:  # checking is there is an open room for the file
            if room.get_file_name() == fileName:
                room.add_user(user)
        room = [room for room in self.rooms if room.get_file_name() == fileName and room.get_file_path() == fileLocation]
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
        return {"data": files}
        
    def create_share_code_for_file(self, data, user):
        try:
            location = "./files/" + data["data"]["location"]
            if location[-1] == '/':
                location = location[:-1]
            if data["data"]["is_folder"]:
                collection = MongoDBWrapper.connect_to_mongo("Folders")
                document = MongoDBWrapper.find_document({"folder_name": data["data"]["name"][:-1], "location": location}, collection)
            else:
                collection = MongoDBWrapper.connect_to_mongo("Files")
                document = MongoDBWrapper.find_document({"file_name": data["data"]["name"], "location": location}, collection)

            if document is None:  # If file doesn't have a record in the database
                return {"data": {"status": "error"}}

            if document.get("owner") != user.get_user_name():  # If the owner of the file is not the same as the requesting user
                return {"data": {"status": "error"}}

            objectId = document.get("_id")

            share_codes_collection = MongoDBWrapper.connect_to_mongo("Share Codes")
            code_document = MongoDBWrapper.find_document({"shareId": objectId}, share_codes_collection)

            if code_document is None:
                code = self.generate_share_code()
                MongoDBWrapper.create_share_code(code, objectId, data["data"]["is_folder"])
                return {"data": {"status": "success", "shareCode": code}}
            return {"data": {"status": "success", "shareCode": code_document["code"]}}
        except Exception as e:
            return {"data": {"status": "error"}}


    def generate_share_code(self):
        return secrets.token_urlsafe(8)
    
    def connect_to_shared_file(self, data, user):
        user_collection = MongoDBWrapper.connect_to_mongo("Users")
        user_document =  MongoDBWrapper.find_document({"username": user.get_user_name()}, user_collection)
        user_id = user_document.get("_id")
        shares_collection = MongoDBWrapper.connect_to_mongo("Shares")
        user_share = MongoDBWrapper.find_document({"userId": user_id}, shares_collection)
        if user_share is not None:
            return {"data": {"status": "error", "message": "This share already exists"}}
        if data["data"]["is_folder"]:
            collection = MongoDBWrapper.connect_to_mongo("Folders")
            documents = MongoDBWrapper.find_documents({"folder_name": data["data"]["name"]}, collection)
        else:
            collection = MongoDBWrapper.connect_to_mongo("Files")
            documents = MongoDBWrapper.find_documents({"file_name": data["data"]["name"]}, collection)
        if documents is None:
            return {"data": {"status": "error", "message": "No object with the given name was found"}}
        objectIds = [document.get("_id") for document in documents if document.get("owner") != user.get_user_name()]
        if objectIds is None:
            return {"data": {"status": "error", "message": "You can't add objects you own as shared files"}}
        share_codes_collection = MongoDBWrapper.connect_to_mongo("Share Codes")
        code_document = MongoDBWrapper.find_document({"code": data["data"]["share_code"]}, share_codes_collection)
        if code_document is None:
            return {"data": {"status": "error", "message": "This share code doesn't exist"}}
        for objectId in objectIds:
            if code_document.get("shareId") == objectId:
                MongoDBWrapper.create_a_share(user_id, data["data"]["share_code"], data["data"]["is_folder"])
                return {"data": {"status": "success"}}
        return {"data": {"status": "error", "message": "This share code doesn't match the file "}}
    
    def get_shared_files_and_folders(self, data, user):
        shares_collection = MongoDBWrapper.connect_to_mongo("Shares")
        share_codes_collection = MongoDBWrapper.connect_to_mongo("Share Codes")
        user_collection = MongoDBWrapper.connect_to_mongo("Users")
        files_collection = MongoDBWrapper.connect_to_mongo("Files")
        folders_collection = MongoDBWrapper.connect_to_mongo("Folders")
        user_document =  MongoDBWrapper.find_document({"username": user.get_user_name()}, user_collection)
        user_id = user_document.get("_id")
        files_documents = []
        folders_documents = []
        top_level_files = []
        top_level_folders = []
        if data["data"]["location"] == "Shared":
            user_shares = MongoDBWrapper.find_documents({"userId": user_id}, shares_collection)
            for share in user_shares:
                share_document = MongoDBWrapper.find_document({"code": share.get("shareCode")}, share_codes_collection)
                if share_document.get("is_folder"):
                    folder_document = MongoDBWrapper.find_document({"_id": share_document.get("shareId")}, folders_collection)
                    folders_documents.append(folder_document)
                else:
                    file_document = MongoDBWrapper.find_document({"_id": share_document.get("shareId")}, files_collection)
                    files_documents.append(file_document)
            top_level_files = [file for file in files_documents if not self.is_object_in_folder(file, folders_documents)]
            top_level_folders = [folder for folder in folders_documents if not self.is_object_in_folder(folder, folders_documents)]
            top_level_files_list = [{"file_name": document.get("file_name", ""), "location": document.get("location", ""), "owner": document.get("owner", "")} for document in top_level_files]
            top_level_folders_list = [{"folder_name": document.get("folder_name", ""), "location": document.get("location", ""), "owner": document.get("owner", "")} for document in top_level_folders]
            return {
                "data": {
                    "status": "success",
                    "files": top_level_files_list,
                    "folders": top_level_folders_list
                }
            }
        else:
            user_shares = MongoDBWrapper.find_documents({"userId": user_id}, shares_collection)
            for share in user_shares:
                share_document = MongoDBWrapper.find_document({"code": share.get("shareCode")}, share_codes_collection)
                if share_document.get("is_folder"):
                    folder_document = MongoDBWrapper.find_document({"_id": share_document.get("shareId")}, folders_collection)
                    if folder_document.get("location") == data["data"]["location"]:
                        folders_documents.append(folder_document)
                else:
                    file_document = MongoDBWrapper.find_document({"_id": share_document.get("shareId")}, files_collection)
                    if file_document.get("location") == data["data"]["location"]:
                        files_documents.append(file_document)
            return {
                "data": {
                    "status": "success",
                    "files": files_documents,
                    "folders": folders_documents
                }
            }
            
    def delete_object_request(self, data, user):
        files_collection = MongoDBWrapper.connect_to_mongo("Files")
        if not data["data"]["is_folder"]:
            if self.check_if_file_used(data["data"]["name"], data["data"]["location"]):
                return {"data": {"status": "error", "message": "File currently in use. Try again later"}}
            try:
                file_document = MongoDBWrapper.find_document({"file_name": data["data"]["name"], "location": data["data"]["location"], "owner": user.get_user_name()}, files_collection)
                if file_document is None:
                    return {"data": {"status": "error", "message": "File was not found in the DB"}}
                self.clear_object_db_fs(file_document, False)
            except Exception:
                return {"data": {"status": "error", "message": "Error has occurred while trying to remove file from File system and DB"}}
            return {"data": {"status": "success"}}
        try:
            self.delete_folder(data["data"]["name"], data["data"]["location"], user.get_user_name())
        except Exception as e:
            return {"data": {"status": "error", "message": e}}
        return {"data": {"status": "success"}}

        

    def is_object_in_folder(self, object, folders):
        owner = object.get("owner")
        location = object.get("location")
        owner_folders = [folder for folder in folders if folder.get("owner") == owner]
        if owner_folders is None:
            return False
        for folder in owner_folders:
            if folder is object:
                continue
            if location == folder.get("location") + "/" + folder.get("folder_name"):
                return True
        return False
    
    def delete_folder(self, name, location, owner):
        folders_collection = MongoDBWrapper.connect_to_mongo("Folders")
        files_collection = MongoDBWrapper.connect_to_mongo("Files")
        folders_in_folder = MongoDBWrapper.find_documents({"location": location + "/" + name, "owner": owner}, folders_collection)
        if not folders_in_folder is None:
            for folder in folders_in_folder:
                self.delete_folder(folder.get("folder_name"), location + "/" + name, owner)
        files_in_folder = MongoDBWrapper.find_documents({"location": location + "/" + name, "owner": owner}, files_collection)
        if not files_in_folder is None:
            for file in files_in_folder:
                if not self.check_if_file_used(file.get("file_name"), file.get("location")):
                    self.clear_object_db_fs(file, False)
                else:
                    raise Exception("File {} @ {} is being used".format(file.get("file_name"), file.get("location")))
        folder_document = MongoDBWrapper.find_document({"folder_name": name, "location": location, "owner": owner}, folders_collection)
        self.clear_object_db_fs(folder_document, True)
        

    def check_if_file_used(self, name, location):
        file_room = [room for room in self.rooms if room.get_file_name() == name and room.get_file_path() == location]
        if not file_room is None:
           return True
        return False  
    
    def clear_object_db_fs(self, document, is_folder):
        files_collection = MongoDBWrapper.connect_to_mongo("Files")
        shares_collection = MongoDBWrapper.connect_to_mongo("Shares")
        folders_collection = MongoDBWrapper.connect_to_mongo("Folders")
        share_codes_collection = MongoDBWrapper.connect_to_mongo("Share Codes")
        object_share_document = MongoDBWrapper.find_document({"shareId": document.get("_id")}, share_codes_collection)
        if not object_share_document is None:
            MongoDBWrapper.delete_documents({"shareCode": object_share_document.get("code")}, shares_collection)
            MongoDBWrapper.delete_document({"_id": object_share_document.get("_id")}, share_codes_collection)
        FSWrapper.delete_file(document.get("location"), document.get("file_name"))
        if is_folder:
            MongoDBWrapper.delete_document({"_id": document.get("_id")}, folders_collection)
        else:
            MongoDBWrapper.delete_document({"_id": document.get("_id")}, files_collection)


def main():
    main_server = server()
    main_server.accept_connections(10)

if __name__ == '__main__':
    main()
        
