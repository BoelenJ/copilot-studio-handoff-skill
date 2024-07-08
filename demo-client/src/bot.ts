import { ActivityHandler, MessageFactory, TurnContext } from 'botbuilder';
import {ConversationState, UserState } from 'botbuilder';
import { MainDialog } from './dialogs/mainDialog';

export class EchoBot extends ActivityHandler {
    
    conversationState: ConversationState;
    userState: UserState;
    dialog: MainDialog;
    dialogState: any;

    constructor(conversationState: ConversationState, userState: UserState, dialog: MainDialog) {
        super();

        this.conversationState = conversationState;
        this.userState = userState;
        this.dialog = dialog;
        this.dialogState = this.conversationState.createProperty('DialogState');
        
        this.onMessage(async (context, next) => {
            console.log('Running dialog on message.');

            // Run the Dialog on message.
            await this.dialog.run(context, this.dialogState);

            await next();
        });

        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Welcome to the demo client for the handoff skill!';
            for (const member of membersAdded) {
                if (member.id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText, welcomeText));
                }
            }
            
            await next();
        });

        this.onEndOfConversation(async (context, next) => {
            

            // We are back at the root
            await context.sendActivity('Back in the root bot');

            // Save conversation state
            await this.conversationState.saveChanges(context, true);

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }

    async run(context: TurnContext){
        await super.run(context);

        // Save any state changes.
        await this.conversationState.saveChanges(context, false);
        await this.userState.saveChanges(context, false);
    }
}
