import { Conversation } from "../interfaces";
import {Text, Stack, IconButton, IStackStyles } from '@fluentui/react';


type ConversationProps = {
  conversation: Conversation;
  onclick: (conversation: Conversation) => void;
};

export default function ConversationComponent({ conversation, onclick }: ConversationProps) {

  const styles: IStackStyles = {
    root: {
      justifyContent: 'space-between',
      alignItems: 'center',
      width: 260,	
      height: 50
    },
  };

  return (
    <Stack horizontal styles={styles}>
      <Stack>
      <Text variant='large'>
        {conversation.userName ? conversation.userName : 'Anonymous'}
      </Text>
      <Text variant='medium'>
        {conversation.ChannelId}
      </Text>
      </Stack>
      <IconButton  onClick={() => onclick(conversation)}iconProps={{iconName: 'ChevronRightMed'}} />
    </Stack>
  );
}
