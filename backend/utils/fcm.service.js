const { admin } = require("../config/firebase");

const sendPushNotification = async ({ token, title, body, data = {} }) => {
    if (!token) {
        console.warn("⚠️  No FCM token provided");
        return { status: 'SKIPPED', message: 'No FCM token' };
    }

    // Validate token format
    if (typeof token !== 'string' || token.length < 20) {
        console.error("❌ Invalid FCM token format:", token);
        return { status: 'FAILED', messageId: null, error: 'Invalid token format' };
    }

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
        console.log("📤 Sending FCM to token:", token.substring(0, 30) + '...');
        const response = await admin.messaging().send(message);
        console.log("✅ FCM sent successfully | MessageID:", response);
        return { status: 'SENT', messageId: response, error: null };
    } catch (error) {
        console.error("❌ FCM Error Code:", error.code);
        console.error("❌ FCM Error Message:", error.message);
        console.error("❌ FCM Full Error:", error);
        return { status: 'FAILED', messageId: null, error: error.message };
    }
};

module.exports = {
    sendPushNotification
};
