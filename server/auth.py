from database_wrapper import MongoDBWrapper
import bcrypt

class Auth:

    users_collection = MongoDBWrapper.connect_to_mongo("users")

    @staticmethod
    def add_new_user(username, password, email):
        if Auth.get_user(username) is None:
            raise Exception("User already exists")
        hashed_password = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
        new_user = {
            "username": username,
            "password": hashed_password,
            "email": email
        }
        MongoDBWrapper.insert_document(new_user, Auth.users_collection)

    @staticmethod
    def get_user(username):
        result = MongoDBWrapper.find_document({
            "username": username
        }, Auth.users_collection)
        return result
    
    @staticmethod
    def validate_user(username, password):
        user = Auth.get_user(username)
        if user is None:
            raise Exception("User doesn't exists")
        hashed_user_password = user.get("password")
        if bcrypt.checkpw(password.encode('utf-8'), hashed_user_password):
            return True
        else:
            return False

