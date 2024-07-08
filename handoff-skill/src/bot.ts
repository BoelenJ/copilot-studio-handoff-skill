import { ActivityHandler, ConversationState } from 'botbuilder';
import { HandoffDialog } from './dialogs/handoffDialog';

export class HandoffBot extends ActivityHandler {

    private conversationState: ConversationState;
    dialogState: any;
    dialog: HandoffDialog;
    baseUrl: string;

    constructor(conversationState: ConversationState, dialog: HandoffDialog) {
        super();

        this.conversationState = conversationState;
        this.dialogState = conversationState.createProperty('DialogState');
        this.dialog = dialog;

        this.onTurn(async (context, next) => {

            // Run the Dialog on message.
            await this.dialog.run(context, this.dialogState);
            await next();
        });

        this.onEndOfConversation(async (context, next) => {
            await next();
        });

    }

    async run(context) {
        await super.run(context);

        // Save any state changes. The load happened during the execution of the Dialog.
        await this.conversationState.saveChanges(context, false);
    }
}
