import * as path from 'path';

import { config } from 'dotenv';
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

const endpoint = process.env.AgentHostEndpoint || 'http://localhost:3000/api/conversations';

// Function to start handoff.
export const startHandoff = async (conversationId: string, channelId: string, serviceUrl: string, notificationEndpoint: string, userName?: string, summary?: string) => {
    
    const response = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationId: conversationId,
            channelId: channelId,
            serviceUrl: serviceUrl,
            notificationEndpoint: notificationEndpoint,
            userName: userName,
            conversationHistory: summary
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to start handoff: ${response.statusText}`);
    }

    return await response.json();
};

// Function to add message.
export const sendMessageToAgent = async (text: string, from: string, conversationId: string) => {

    const response = await fetch(`${endpoint}/${conversationId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            text: text,
            from: from
        }),
    });

    if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
    }

    return await response.json();
}
