import os

class FSWrapper():

    @staticmethod
    def create_folder(folder_name, folder_path):
        os.mkdir(os.path.join(folder_path, folder_name))

    @staticmethod
    def check_if_folder_exists(folder_name, folder_path):
        return os.path.exists(os.path.join(folder_path, folder_name))   

    @staticmethod 
    def check_if_file_exists(file_path, file_name):
        return FSWrapper.check_if_folder_exists(file_name, file_path)
    
    @staticmethod
    def create_file(file_path, file_name):
        new_file = open(os.path.join(file_path, file_name), "w")  # opening a file that doesn't exists in write mode, creates the file with the given name
        new_file.close()

    @staticmethod
    def open_file(file_path, file_name, mode):
        return open(os.path.join(file_path, file_name), mode)

    @staticmethod
    def read_file_content(file):
        file_lines = file.readlines()
        return file_lines
        