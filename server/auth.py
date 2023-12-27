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
        new_user_id = MongoDBWrapper.insert_document(new_user, Auth.users_collection)
        return new_user_id

    @staticmethod
    def get_user(username):
        result = MongoDBWrapper.find_document({
            "username": username
        }, Auth.users_collection)
        return result
