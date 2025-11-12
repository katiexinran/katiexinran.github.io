const { MongoClient } = require('mongodb');
const dns = require('dns');
require('dotenv').config();

// Fix DNS resolution
dns.setDefaultResultOrder('ipv4first');

const MONGODB_URI = process.env.MONGODB_URI;

console.log('Testing MongoDB connection...');
console.log('Connection string:', MONGODB_URI.replace(/:[^:]*@/, ':****@'));

async function testConnection() {
  try {
    console.log('\n1️⃣ Attempting connection...');
    const client = await MongoClient.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ Connected successfully!');
    
    console.log('\n2️⃣ Testing database access...');
    const db = client.db('hw3');
    const collections = await db.listCollections().toArray();
    console.log('✅ Database accessible. Collections:', collections.map(c => c.name).join(', ') || 'none');
    
    console.log('\n3️⃣ Testing collection operations...');
    const testCollection = db.collection('test');
    await testCollection.insertOne({ test: 'data', timestamp: new Date() });
    console.log('✅ Write operation successful');
    
    const doc = await testCollection.findOne({ test: 'data' });
    console.log('✅ Read operation successful:', doc);
    
    await testCollection.deleteMany({ test: 'data' });
    console.log('✅ Delete operation successful');
    
    await client.close();
    console.log('\n✅ All tests passed! MongoDB connection is working.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();
