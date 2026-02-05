const admin = require("../config/firebase");

const sendPushNotification = async ({ token, title, body, data = {} }) => {
    if (!token) return;

    const message = {
        token,
        notification: {
            title,
            body
        },
        data: {
            ...data
        }
    };

    try {
        await admin.messaging().send(message);
        console.log("FCM sent successfully");
    } catch (error) {
        console.error("FCM error:", error.message);
    }
};

module.exports = {
    sendPushNotification
};
