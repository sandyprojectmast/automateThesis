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
        const currentTime = new Date();
        const minutesThreshold = 1;

        const isUpdatedWithinThreshold = devices.map((item) => {
            const updatedAtTime = item.updatedAt;
            const timeDifference = (currentTime - updatedAtTime) / (1000 * 60); // Convert milliseconds to minutes

            return timeDifference >= minutesThreshold;
        });

        isUpdatedWithinThreshold.forEach((isUpdated, index) => {
            if (isUpdated) {
                update(devices[index]);
            }
        });

    } catch (error) {
        console.error(error);
    }
}

function update(item) {

    console.log(`Updating item with _id: ${item._id}`);

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

watchForChanges();