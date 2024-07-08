import { ComponentDialog, DialogSet, DialogState, DialogTurnStatus, TextPrompt, WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { ActivityTypes, ConversationState, EndOfConversationCodes, InputHints, StatePropertyAccessor, TurnContext } from 'botbuilder';
import { startHandoff, sendMessageToAgent } from '../handoffadapter/handoffadapter';

const MAIN_DIALOG = 'MAIN_DIALOG';
const HANDOFF_DIALOG = 'HANDOFF_DIALOG';
const TEXT_PROMPT = 'TEXT_PROMPT';

export class HandoffDialog extends ComponentDialog {

    private userResponse: StatePropertyAccessor<any>;
    activeSkillPropertyName: string;
    activeSkillProperty: StatePropertyAccessor<any>;
    selectedSkillKey: string;
    conversationState: ConversationState;
    baseUrl: string;

    constructor(conversationState: ConversationState, baseUrl: string) {

        // Assign unique id to the dialog.
        super(MAIN_DIALOG);

        this.conversationState = conversationState;
        this.baseUrl = baseUrl;

        this.addDialog(new TextPrompt(TEXT_PROMPT));

        // Add waterfall dialog to construct the conversation.
        this.addDialog(new WaterfallDialog(HANDOFF_DIALOG, [
            this.getMessage.bind(this),
            this.endStep.bind(this)
        ]));

        // Assign initial dialog.
        this.initialDialogId = HANDOFF_DIALOG;
    }

    async onContinueDialog(innerDc) {
        const result = await this.interrupt(innerDc);
        if (result) {
            return result;
        }
        return await super.onContinueDialog(innerDc);
    }

    async interrupt(innerDc) {
        if (innerDc.context.activity.text) {
            const text = innerDc.context.activity.text.toLowerCase();

            switch (text) {
                case 'cancel':
                case 'quit': {
                    const cancelMessageText = 'Ending conversation with agent...';
                    await innerDc.context.sendActivity(cancelMessageText, cancelMessageText, InputHints.IgnoringInput);
                    await innerDc.context.sendActivity({
                        type: ActivityTypes.EndOfConversation,
                        code: EndOfConversationCodes.CompletedSuccessfully
                    });
                    sendMessageToAgent("--- User ended the session ---", innerDc.context.activity.from.name, innerDc.context.activity.conversation.id);

                    return await innerDc.cancelAllDialogs();
                }
            }
        }
    }

    async getMessage(step: WaterfallStepContext) {

        const context = step.context;
        // Open conversation for the agent.
        if (context.activity.type === 'event' && context.activity.name === 'Handoff') {

            console.log('Handoff event received');
            console.log(context.activity.value);

            const turnContext = TurnContext.getConversationReference(step.context.activity);
            startHandoff(turnContext.conversation.id, turnContext.channelId, turnContext.serviceUrl, this.baseUrl, context.activity.value.userName, context.activity.value.conversationHistory)
        } else {
            // Forward the user message to the agent.
            const text = context.activity.text;

            if (text) {
                sendMessageToAgent(text, context.activity.from.name, context.activity.conversation.id);
            }
        }

        return await step.prompt(TEXT_PROMPT, {});
    }

    async endStep(step: WaterfallStepContext) {

        return await step.replaceDialog(HANDOFF_DIALOG)

    }

    // Create and access dialog context.
    async run(context: TurnContext, accessor: StatePropertyAccessor<DialogState>) {
        const dialogSet = new DialogSet(accessor);
        dialogSet.add(this);

        const dialogContext = await dialogSet.createContext(context);
        const results = await dialogContext.continueDialog();
        if (results.status === DialogTurnStatus.empty) {
            await dialogContext.beginDialog(this.id);
        }
    }

}