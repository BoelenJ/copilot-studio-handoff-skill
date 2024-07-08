import { Conversation, Message } from "../interfaces";

export const conversations: Conversation[] = [];

// Export method to add to the conversations array.
export function addConversation(conversation: Conversation) {
  conversations.push(conversation);
}

// Export method to retrieve a conversation by id.
export function getConversationById(conversationId: string) {
  return conversations.find((c) => c.ConversationId === conversationId);
}

// Export method to update messages in a conversation.
export function addMessageToConversation(conversationId: string, message: Message) {
  const conversation = conversations.find((c) => c.ConversationId === conversationId);
  conversation.Messages.push(message);
}