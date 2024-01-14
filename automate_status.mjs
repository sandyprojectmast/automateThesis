import db from "../../configs/database_config.js";

function hasPassedOneMinutes(data) {
    // Extract the updatedAt timestamp and convert it to a Date object
    const updatedAt = new Date(data.updatedAt.$date);

    const currentTime = new Date();
    const timeDifference = (currentTime - updatedAt) / (1000 * 60);

    // Check if the time difference is greater than 10 minutes
    return timeDifference > 1;
}

async function getLastUpdateFromMongoDB(serialNumbers) {

    try {
        const database = db.db("Data");
        const collection = database.collection("data_streaming");

        const devices = await collection.find({ serial_number: { $in: serialNumbers } }).toArray();
        console.log(devices);
        // devices.foreach((serial_number) => {
        //   hasPassedOneMinutes()
        // });
    } catch (error) {
        console.error(error);
    }
}

async function getSerialNumberFromMongoDB() {

    try {
        const database = db.db("Data");
        const collection = database.collection("device");

        const devices = await collection.find({}).toArray();
        return devices.map((device) => device.serial_number);
    } catch (error) {
        console.error(error);
    }
}

async function watchForChanges() {
    while (true) {
        const serial_number = await getSerialNumberFromMongoDB();
        await getLastUpdateFromMongoDB(serial_number);
        await new Promise(resolve => setTimeout(resolve, 10000)); // Adjust the interval as needed
    }
}