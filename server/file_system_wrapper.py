import os

class FSWrapper():

    @staticmethod
    def create_folder(folder_path, folder_name):
        os.mkdir(os.path.join(folder_path, folder_name))

    @staticmethod
    def check_if_folder_exists(folder_path, folder_name):
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
    
    @staticmethod
    def write_change_to_file(file, line_number, new_line):
        file = open("text", "r+")
        line_count = 0
        for line in file:
            line_count += 1

            if line_count == line_number:
                file.seek(file.tell() - len(line))
                file.write(new_line)
                break