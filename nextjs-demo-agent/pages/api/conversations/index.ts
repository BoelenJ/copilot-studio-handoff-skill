import { NextApiResponse, NextApiRequest } from "next";
import {addConversation, getConversationById, conversations} from '../../../localdb/conversations';

export default function handler(req: NextApiRequest,res: NextApiResponse) {
    
    if (req.method === 'POST'){
        if (!req.body.conversationId || !req.body.channelId || !req.body.serviceUrl || !req.body.notificationEndpoint) {
            res.status(400).json({ message: 'Missing parameters.' });
            return;
        }
    
        // Check if conversation exists
        const conversation = getConversationById(req.body.conversationId as string);
        
        if (conversation) {
            res.status(409).json({ message: 'Conversation already exists.' });
            return;
        }
    
        // If not, add conversation.
        addConversation({
            ConversationId: req.body.conversationId as string,
            ChannelId: req.body.channelId as string,
            ServiceUrl: req.body.serviceUrl as string,
            NotificationEndpoint: req.body.notificationEndpoint as string,
            Messages: [],
            userName: req.body.userName ? req.body.userName as string : undefined,
            conversationHistory: req.body.conversationHistory ? req.body.conversationHistory as string : undefined
        });
    
        // Return success.
        res.status(200).json({ message: 'Conversation accepted.' });
    } else if (req.method === 'GET') {
        // Return all conversations.
        res.status(200).json(conversations);
    } else {
        res.status(405).json({ message: 'Method not allowed.' });
    }


    
}
