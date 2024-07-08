import { ConversationReference } from "botbuilder";

export class AgentResponse {
    
    ConversationReference: Partial<ConversationReference>;
    from: string;
    activity: string;
    
    constructor(ConversationReference: Partial<ConversationReference>, from: string, activity: string) {
        this.ConversationReference = ConversationReference;
        this.from = from;
        this.activity = activity;
    }
}