export class Message {

  Type: string;
  Text: string;
  From: string;

  constructor(type: string, text: string, from: string) {
    this.Type = type;
    this.Text = text;
    this.From = from;
  }
}

export class Conversation {

  ConversationId: string;
  ChannelId: string;
  ServiceUrl: string;
  NotificationEndpoint: string;
  Messages: Message[] = [];
  userName?: string;
  conversationHistory?: string;

  constructor(ConversationId: string, ChannelId: string, ServiceUrl: string, NotificationEndpoint: string, userName?: string, conversationHistory?: string) {
    this.ConversationId = ConversationId;
    this.ChannelId = ChannelId;
    this.ServiceUrl = ServiceUrl;
    this.NotificationEndpoint = NotificationEndpoint;
    this.userName = userName;
    this.conversationHistory = conversationHistory;
  }
}

export class AgentResponse {

  conversationReference: {
    conversation: {
      id: string;
    };
    channelId: string;
    locale: string;
    serviceUrl: string;
  };
  from: string;
  activity: string;

  constructor(conversationReference: { conversation: { id: string }, channelId: string, locale: string, serviceUrl: string }, from: string, activity: string) {
    this.conversationReference = conversationReference;
    this.from = from;
    this.activity = activity;
  }

}
