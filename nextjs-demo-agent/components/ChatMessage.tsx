import { Conversation, Message } from "../interfaces";
import {Text, Stack, IconButton, IStackStyles, FontIcon } from '@fluentui/react';


type MessageProps = {
  message: Message;
};

export default function ChatMessageComponent({ message }: MessageProps) {

    if (message.From === 'agent') {
        return (
          <Stack horizontal horizontalAlign="end" style={{ marginTop: 10, marginBottom: 10 }} tokens={{ childrenGap: 10 }} verticalAlign='center'>
            <Stack style={{ marginLeft: 30, padding: 5, borderRadius: 5, boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)' }}>
              <Text variant="mediumPlus" style={{ textAlign: 'left' }}>{message.Text}</Text>
            </Stack>
            <FontIcon aria-label="ChatBot" iconName="ChatBot" style={{ height: 20, width: 20, fontSize: 20 }} />
          </Stack>
    
        );
      } else {
        return (
          <Stack horizontal horizontalAlign="start" style={{ marginTop: 10, marginBottom: 10 }} tokens={{ childrenGap: 10 }} verticalAlign='center'>
            <FontIcon aria-label="Contact" iconName="Contact" style={{ height: 20, width: 20, fontSize: 20 }} />
            <Stack style={{ padding: 5, borderRadius: 5, boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)', marginRight: 30 }}>
              <Text variant="mediumPlus" block style={{ textAlign: 'left' }}>{message.Text}</Text>
            </Stack>
          </Stack>
        );
      }
  }
  