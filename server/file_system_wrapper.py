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
        return FSWrapper.check_if_folder_exists(file_path, file_name)
    
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
    def delete_file(file_path, file_name):
        os.remove(os.path.join(file_path, file_name))
    @staticmethod
    def write_change_to_file(file, line_number, new_line):
        file.seek(0)
        lines = file.readlines()
        line_number = int(line_number)
        new_line += "\n"
        if line_number <= len(lines):
            lines[line_number - 1] = new_line
        else:
            while len(lines) < line_number - 1:
                lines.append("\n")
            lines.append(new_line)
        file.seek(0)
        file.truncate()
        file.writelines(lines)
        file.flush()

    @staticmethod
    def trim_end_of_file(file, last_line_number):
        file.seek(0)
        lines = file.readlines()
        lines = lines[:last_line_number]
        file.seek(0)
        file.truncate()
        file.writelines(lines)
        file.flush()