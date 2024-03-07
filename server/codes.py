from enum import Enum

class RequestCodes(Enum):
    CONNECT_TO_FILE = 1
    UPDATE_CHANGES = 2
    CREATE_FILE = 3
    SIGN_UP = 4
    LOGIN = 5
    CREATE_FOLDER = 6
    GET_FILES_AND_FOLDERS = 7
    DISCONNECT_FROM_FILE = 8
    CREATE_SHARE_CODE = 9
    CONNECT_TO_SHARED_FILE = 10
    GET_SHARED_FILES_AND_FOLDERS = 11
    GET_FILES = 12
    GET_FILES_SHARES = 13
    REMOVE_SHARE = 14
    DELETE_OBJECT = 16
