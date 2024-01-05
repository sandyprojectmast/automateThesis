import mqtt from 'mqtt';
import db from "../../configs/database_config.js";

//const topics = ['SN123', 'SN124', 'SN125'];

async function getTopicsFromMongoDB() {

    try {
        const database = db.db("Data");
        const collection = database.collection("device");

        const devices = await collection.find({}).toArray();
        return devices.map((device) => device.serial_number);
    } catch (error) {
        console.error(error);
    }
}

const client = mqtt.connect('mqtt://localhost', {
    username: 'mqtt_pass',
    password: 'thesismania',
});


async function subscribeToTopics(topics) {
    topics.forEach((topic) => {
        client.subscribe(topic, (err) => {
            if (!err) {
                console.log(`Subscribed to ${topic}`);
            }
        });
    });
}

async function watchForChanges() {
    while (true) {
        const topics = await getTopicsFromMongoDB();
        await subscribeToTopics(topics);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Adjust the interval as needed
    }
}

async function createCollectionIfNotExists(topic) {
    const database = db.db("Log");
    const collectionName = topic;

    const collections = await database.listCollections({ name: collectionName }).toArray();

    if (collections.length === 0) {
        // Collection doesn't exist, create it
        const options = {
            capped: true, // if you want a capped collection
            size: 100000, // specify the size for capped collections
        };

        await database.createCollection(collectionName, options);
        console.log('Collection created successfully.');
    } else {
        console.log('Collection already exists.');
    }

}

client.on('connect', async() => {

    await watchForChanges();

});

client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    createCollectionIfNotExists(topic);
});