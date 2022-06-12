const { MongoClient, ObjectID } = require('mongodb');
const util = require('util');

util.promisify(MongoClient.connect);


let dbConnection;

const connect = async () => {
  try {
    const client = await MongoClient.connect("mongodb+srv://alyelazazy:azazypassword123%5E_@cluster0.1mkgj.mongodb.net/rabbit?authMechanism=DEFAULT");
    dbConnection = client.db("orders");
  } catch (e) {
    throw new Error(`Could not establish database connection: ${e}`);
  }
};

const mongoClient = async () => {
  if (!dbConnection) {
    await connect();
  }
  return dbConnection;
};

module.exports = {
  mongoClient,
  ObjectID
};

