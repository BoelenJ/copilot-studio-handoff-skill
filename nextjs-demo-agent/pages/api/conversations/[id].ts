import { NextApiResponse, NextApiRequest } from "next";
import { addMessageToConversation, getConversationById } from '../../../localdb/conversations';
import { AgentResponse, Message } from "../../../interfaces";


export default function handler(req: NextApiRequest, res: NextApiResponse) {

    if (req.method !== 'GET' && req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed.' });
        return;
    }

    if (!req.query.id) {
        res.status(400).json({ message: 'Missing parameters.' });
        return;
    }

    // Check if conversation exists
    const conversation = getConversationById(req.query.id as string);

    if (!conversation) {
        res.status(404).json({ message: 'Conversation not found.' });
        return;
    }

    if (req.method === 'GET') {

        res.status(200).json(conversation);
    } else if (req.method === 'POST') {

        if (!req.body.text || !req.body.from) {
            res.status(400).json({ message: 'Missing parameters.' });
            return;
        }
        // Add message to conversation.
        const message = new Message('message', req.body.text, req.body.from);
        addMessageToConversation(req.query.id as string, message);

        // If agent is calling, forward message to the end user as well.
        const agentResponse = new AgentResponse({
            conversation: {
                id: conversation.ConversationId
            },
            channelId: conversation.ChannelId,
            locale: 'en-US',
            serviceUrl: conversation.ServiceUrl

        }, req.body.from, req.body.text);

        if (req.body.from === 'agent') {

            console.log("SENDING BACK")
            console.log(conversation);
            
            fetch(conversation.NotificationEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(agentResponse),
            }).then((response) => {
                if (!response.ok) {
                    throw new Error(`Failed to send message: ${response.statusText}`);
                }
            }).catch((error) => {
                console.error(`Failed to send message: ${error}`);

            })
        };

        res.status(200).json({ message: 'Message added to conversation.' });

    }
}
