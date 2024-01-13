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
        const valTopic = topic + "/val";
        client.subscribe(valTopic, (err) => {
            if (!err) {
                console.log(`Subscribed to ${valTopic}`);
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

async function saveValueToDB(topic, messages) {
    const databaseLog = db.db("Log");
    const databaseStream = db.db("Data");
    const collectionName = topic.replace(/\/val$/, '');;
    const currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 7);

    const dataToInsert = {
        ...JSON.parse(messages),
        updatedAt: currentDate
    };

    const dataToUpdate = {
        ...JSON.parse(messages),
        serial_number: collectionName,
        status: "Connected",
        updatedAt: currentDate
    };

    var myquery = { serial_number: collectionName };
    var newvalues = { $set: dataToUpdate };
    var options = { upsert: true };
    var statusUpdate = { $set: { status: "Connected" } };

    await databaseStream.collection("device").updateOne(myquery, statusUpdate, function(err, res) {
        if (err) throw err;
        console.log("1 doc updated");
    });

    await databaseStream.collection("data_streaming").updateOne(myquery, newvalues, options, function(err, res) {
        if (err) throw err;
        console.log("1 doc updated");
    });

    await databaseLog.collection(collectionName).insertOne(dataToInsert, function(err, res) {
        if (err) throw err;
        console.log("Number of inserted:" + res.insertedCount);
    });


}

client.on('connect', async() => {

    await watchForChanges();

});

client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    saveValueToDB(topic, message.toString());
});