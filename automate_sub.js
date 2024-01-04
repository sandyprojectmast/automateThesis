import mqtt from 'mqtt';
const topics = ['SN123', 'SN124', 'SN125']; // Add or remove topics as needed

const client = mqtt.connect('mqtt://localhost', {
  username: 'mqtt_pass',
  password: 'thesismania',
});

client.on('connect', () => {
  topics.forEach((topic) => {
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to ${topic}`);
      }
    });
  });
});
//testing
client.on('message', (topic, message) => {
  console.log(`Received message on topic ${topic}: ${message.toString()}`);
});
