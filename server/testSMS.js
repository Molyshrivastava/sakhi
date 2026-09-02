require("dotenv").config();

const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

console.log(process.env.TWILIO_ACCOUNT_SID);
console.log(process.env.TWILIO_AUTH_TOKEN);
console.log(process.env.TWILIO_PHONE_NUMBER);

client.messages.create({
  body: "Hello from Sakhi 🚨",
  from: process.env.TWILIO_PHONE_NUMBER,
  to: "+917898008150",
})
.then(msg => console.log(msg.sid))
.catch(err => console.log(err));