const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const axios = require("axios");
const moment = require("moment-timezone");

const apiId = 28596369;
const apiHash = "f50cfe3b10da015b2c2aa0ad31414a55";
const sessionKey = "1BQANOTEuMTA4LjU2LjE2MgG7xdDOm6fZrHa3TZlzYirstKm6txAmMgpKEa6fqAnQXa1qjTvr1AGBj1yuESEJltVLvDuh8vslQVZvvFk10MU57H90GIU7Xy3B8DZOzU/khYqsoeAd0A4CQXG+MC0OAroo4rAx4jBohsl+KzyoTPM/gnji026iQPv93LZmtVKDxUPaNlh6+mSfe+PEalenAehhhdjQ80buNnOeHG1jt7J1/La6qgxS0opc6NWLaOhiUe380qMuC2sX+l3tbiVnLUOsZfZtZsyFWNcP6KSdZXJPu44GiMQT4cPvi/sfseRrtwv/SYEXQPrYzyMJNRuATHoZFr+xFJwn0BTLUIsVrkubVA==";

const apiUrl = "https://cooe.top/user/redeem_gift_code";
const apiToken = 'Token b1211337241167aeae1efc9b796e47f5c7d5aaee'; 


const session = new StringSession(sessionKey); 
const client = new TelegramClient(session, apiId, apiHash, {});

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const extractRedeemCode = (text) => {
    const regex = /\b[A-Z0-9]{24}\b/;
    const match = text.match(regex);
    if (match) {
        return match[0]; 
    } else {
        return null; 
    }
};

const isWithinWorkingHours = () => {
    const now = moment().tz("Asia/Kolkata"); // Get current time in IST
    const start = moment().tz("Asia/Kolkata").set({ hour: 19, minute: 30 }); // 7:30 PM
    const end = moment().tz("Asia/Kolkata").set({ hour: 22, minute: 0 }); // 10:00 PM

    return now.isBetween(start, end, null, '[]'); // Check if current time is between start and end time
};
const getTimeUntilNextStart = () => {
    const now = moment().tz("Asia/Kolkata");
    const start = moment().tz("Asia/Kolkata").set({ hour: 19, minute: 30 });
    
    // If it's already past start time, check for the next day
    if (now.isAfter(start)) {
        start.add(1, 'days');
    }
    
    return start.diff(now); // Returns the difference in milliseconds
};

const startBot = async () => {
    await client.connect();

    let lastMessageIds = { "@cooegamebot": null, "@testinggroupbonustaken": null };
    console.log("Bot connected and ready to fetch messages...");

    while (true) {
        if (isWithinWorkingHours()) {
            for (const channel of ["@cooegamebot", "@testinggroupbonustaken"]) {   

                const messages = await client.getMessages(channel, { limit: 1 });
                
                if (messages.length > 0) {
                    const latestMessage = messages[0];

                    if (lastMessageIds[channel] === null || latestMessage.id > lastMessageIds[channel]) {
                        lastMessageIds[channel] = latestMessage.id;

                        const redeemCode = extractRedeemCode(latestMessage.message);

                        if (redeemCode) {
                            try {
                                console.log(`Redeem code found: ${redeemCode}`);
                                const response = await axios.post(
                                    apiUrl,
                                    {
                                        gift_code: redeemCode,
                                    },
                                    {
                                        headers: {
                                            Authorization: apiToken,
                                            'Content-Type': 'application/json', 
                                        },
                                    }
                                );
                                console.log('Response from redeem API:', response.data.msg); 
                            } catch (error) {
                                console.error(`Error handling redeem response: ${error.message}`);
                            }
                        } 
                    } 
                } 
            } 
        } else {
            const sleepTime = getTimeUntilNextStart(); 
            console.log(`Outside working hours, bot will sleep for ${Math.ceil(sleepTime / 60000)} minutes...`);
            await delay(sleepTime);
        }

        await delay(1000);
    }
};

const init = async () => {
    await startBot();
};

init();
 