from pymongo import MongoClient

class MongoDBWrapper:
    # Set your MongoDB connection details here
    DATABASE_NAME = 'codeHarbor'

    @staticmethod
    def connect_to_mongo(collection_name):
        client = MongoClient('mongodb://localhost:27017/')
        return client[MongoDBWrapper.DATABASE_NAME][collection_name] #returns the collection with the given name in the database "codeHarbor"

    @staticmethod
    def insert_document(data, collection):
        result = collection.insert_one(data)
        return result.inserted_id

    @staticmethod
    def find_document(query, collection):
        return collection.find_one(query)

    @staticmethod
    def update_document(query, update_data, collection):
        result = collection.update_one(query, {'$set': update_data})
        return result.modified_count

    @staticmethod
    def delete_document(query, collection):
        result = collection.delete_one(query)
        return result.deleted_count

    @staticmethod
    def find_documents(query, collection):
        documents = collection.find(query)
        return list(documents)

    @staticmethod
    def create_new_file_record(file_name, location, owner_name=""):
        data = {"file_name": file_name, "location": location, "owner": owner_name}
        collection = MongoDBWrapper.connect_to_mongo("Files")
        MongoDBWrapper.insert_document(data, collection)
