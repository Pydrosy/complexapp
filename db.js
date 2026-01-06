// const dotenv = require('dotenv');
// dotenv.config();

// const {MongoClient} = require('mongodb');


// const client = new MongoClient(process.env.CONNECTIONSTRING);

// async function start (){
//     await client.connect();
//     module.exports = client;
//     const app = require('./App');
//     app.listen(process.env.PORT);

// }
// start();
const dotenv = require('dotenv');
dotenv.config();

const {MongoClient} = require('mongodb');

const client = new MongoClient(process.env.CONNECTIONSTRING);

// Export an empty client first, then connect
module.exports = client;

async function start (){
    await client.connect();
    console.log('MongoDB connected');
    
    const app = require('./App');
    app.listen(process.env.PORT, () => {
        console.log(`Server started on port ${process.env.PORT}`);
    });
}
start();