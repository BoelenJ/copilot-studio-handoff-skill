import useSWR from "swr";
import ConversationComponent from "../components/Conversation";
import type { Conversation } from "../interfaces";
import { getTheme, Text, Stack, TextField, IList, ScrollToMode, FontIcon, List, IconButton, IStackItemStyles, DefaultPalette, IStackStyles, DefaultButton, PrimaryButton, VerticalDivider, Separator, CompoundButton } from '@fluentui/react';
import React from "react";
import { initializeIcons } from '@fluentui/font-icons-mdl2';
import ChatMessageComponent from "../components/ChatMessage";
initializeIcons();

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function Index() {

  // Getting data.
  const { data: conversations, error, isLoading } = useSWR<Conversation[]>("/api/conversations", fetcher, {
    refreshInterval: 1000
  });
  const [selectedConversationId, setSelectedConversationId] = React.useState<number>(-1);
  const [newMessage, setNewMessage] = React.useState<string>("");

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || selectedConversationId === -1) {
      // Don't send empty messages
      return;
    }

    await fetch(`/api/conversations/${conversations[selectedConversationId].ConversationId}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: newMessage,
        from: 'agent',
      })
    })

    setNewMessage('');
  };

  const handleKeyDown = (event: any) => {
    if (event.key === 'Enter') {
      // Submit the message on Enter key press
      handleSendMessage();
    }
  };

  const theme = getTheme();

  if (error) return <div>Failed to load</div>;
  if (isLoading) return <div>Loading...</div>;
  if (!conversations) return null;


  const stackStyles: IStackStyles = {
    root: {
      height: '80vh',
      width: '70vw',
      margin: 'auto',
      display: 'flex',
    },
  };

  const headerStyles: IStackItemStyles = {
    root: {
      alignItems: 'center',
      background: DefaultPalette.themeSecondary,
      display: 'flex',
      justifyContent: 'center',
      boxShadow: theme.effects.elevation4,
      minWidth: 250,
      borderRadius: theme.effects.roundedCorner6,
      padding: 20
    },
  };

  const contentStyles: IStackItemStyles = {
    root: {
      overflow: 'hidden',
      boxShadow: theme.effects.elevation4,
      borderRadius: theme.effects.roundedCorner6,
      minWidth: 250,
      padding: 20,
      flex: 1
    },
  }

  const conversationsListStyles: IStackItemStyles = {
    root: {
      display: 'flex',
      overflow: 'hidden',
      width: 300,
    },
  };

  const chatStyles: IStackItemStyles = {
    root: {
      display: 'flex',
      overflow: 'hidden',
      paddingLeft: 20,
      flexGrow: 1,
      justifyContent: 'space-between'
    },
  };

  // Set active conversation.
  const setActiveConversation = (conversation: Conversation) => {
    // find index of conversation.
    const index = conversations.findIndex((c) => c.ConversationId === conversation.ConversationId);
    setSelectedConversationId(index);
  };

  return (
    <Stack enableScopedSelectors styles={stackStyles} tokens={{ childrenGap: 20 }}>

      {/* Header */}
      <Stack.Item styles={headerStyles}>
        <Text variant='xLarge' style={{ color: "white" }}>Local demo agent</Text>
      </Stack.Item>

      <Stack.Item styles={contentStyles}>
        <Stack horizontal style={{ height: '100%' }}>

          { /* Conversations */}
          <Stack.Item styles={conversationsListStyles} >
            <Stack tokens={{ childrenGap: 10 }}>
              <Text variant='xLarge'>Conversations</Text>
              <List items={conversations} onRenderCell={(item, index) => <ConversationComponent conversation={item} onclick={setActiveConversation} />} />
            </Stack>
          </Stack.Item>

          {/* Separator */}
          <Separator vertical />

          {/* Messages */}
          <Stack.Item styles={chatStyles}>
            <Stack style={{ flex: 1, flexGrow: 1 }} tokens={{ childrenGap: 10 }}>
              <Text variant='xLarge'>{conversations[selectedConversationId] ? `Chatting with ${conversations[selectedConversationId].userName}` : "Select a conversation"}</Text>

              {conversations[selectedConversationId]?.conversationHistory && <>
                <Text variant='medium'>Conversation History</Text>
                <Text variant='small'>{conversations[selectedConversationId].conversationHistory}</Text>
              </>
              }

              <Stack.Item grow style={{ overflow: 'auto', width: '100%' }} >
                <List items={conversations[selectedConversationId] ? conversations[selectedConversationId].Messages : []} onRenderCell={(item) => <ChatMessageComponent message={item} />} />
              </Stack.Item>
              <Stack horizontal tokens={{ childrenGap: 20 }}>
                <Stack.Item grow={1}>
                  <TextField
                    value={newMessage}
                    onChange={(e, newValue) => setNewMessage(newValue || "")}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                  />
                </Stack.Item>
                <PrimaryButton text="Send message" onClick={handleSendMessage} />
              </Stack>
            </Stack>
          </Stack.Item>
        </Stack>
      </Stack.Item>
    </Stack>
  );
}