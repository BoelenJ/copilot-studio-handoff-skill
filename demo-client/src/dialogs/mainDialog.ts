import { ChoiceFactory, ChoicePrompt, ComponentDialog, DialogSet, DialogState, DialogTurnStatus, SkillDialog, TextPrompt, WaterfallDialog } from 'botbuilder-dialogs';
import { ActivityTypes, BotFrameworkClient, SkillConversationIdFactory, StatePropertyAccessor, TurnContext, UserState } from 'botbuilder';
import { UserResponse } from '../definitions/userResponse';
import { WeatherDialog, WEATHER_DIALOG } from './weatherDialog';
import { SkillsConfiguration } from '../skillsConfig';

const MAIN_DIALOG = 'MAIN_DIALOG';
const NAME_PROMPT = 'NAME_PROMPT';
const CHOICE_PROMPT = 'CHOICE_PROMPT';
const WATERFALL_DIALOG = 'WATERFALL_DIALOG';
const USER_RESPONSE = 'USER_RESPONSE';
const SKILL_HANDOFF = 'HandOffSkill';
const HANDOFF_ACTION = 'Handoff';

export class MainDialog extends ComponentDialog {

    private userResponse: StatePropertyAccessor<any>;
    activeSkillPropertyName: string;
    activeSkillProperty: StatePropertyAccessor<any>;
    selectedSkillKey: string;

    constructor(userState: UserState, skillsConfig: SkillsConfiguration, skillClient: BotFrameworkClient, conversationIdFactory: SkillConversationIdFactory) {

        // Assign unique id to the dialog.
        super(MAIN_DIALOG);

        if (!userState) throw new Error('[MainDialog]: Missing parameter \'userstate\' is required');
        if (!skillsConfig) throw new Error('[MainDialog]: Missing parameter \'skillsConfig\' is required');
        if (!skillClient) throw new Error('[MainDialog]: Missing parameter \'skillClient\' is required');
        if (!conversationIdFactory) throw new Error('[MainDialog]: Missing parameter \'conversationIdFactory\' is required');

        // Create state to keep user response.
        this.userResponse = userState.createProperty(USER_RESPONSE);

        // Skill related attributes.
        this.activeSkillPropertyName = `${MAIN_DIALOG}.activeSkillProperty`;
        this.activeSkillProperty = userState.createProperty(this.activeSkillPropertyName);
        this.selectedSkillKey = `${MAIN_DIALOG}.selectedSkillKey`;
        this.addSkillDialogs(userState, conversationIdFactory, skillClient, skillsConfig, process.env.MicrosoftAppId);


        // Add dialogs to the MainDialog.
        this.addDialog(new TextPrompt(NAME_PROMPT));
        this.addDialog(new ChoicePrompt(CHOICE_PROMPT));

        // Add waterfall dialog to construct the conversation.
        this.addDialog(new WaterfallDialog(WATERFALL_DIALOG, [
            this.nameStep.bind(this),
            this.choiceStep.bind(this),
            this.redirectStep.bind(this),
            this.endStep.bind(this)
        ]));

        // Add Weather Dialog.
        this.addDialog(new WeatherDialog(userState));

        // Assign initial dialog.
        this.initialDialogId = WATERFALL_DIALOG;
    }

    async nameStep(step) {
        return await step.prompt(NAME_PROMPT, 'What is your name?');
    }

    async choiceStep(step) {

        // Set the user response of the previous step.
        step.values.name = step.result;

        return await (step.prompt(CHOICE_PROMPT, {
            prompt: `Hi ${step.result}, what would you like to do?`,
            choices: ChoiceFactory.toChoices(['Get the weather', 'Talk to an agent'])
        }));
    }

    async redirectStep(step) {

        // Set the user response of the previous step.
        step.values.choice = step.result.value;

        await step.context.sendActivity(`You chose to ${step.result.value}.`);

        switch (step.result.value) {
            case 'Get the weather':
                return await step.beginDialog(WEATHER_DIALOG);
            case 'Talk to an agent':
            // Hand over to the skill.
                const skillActivity = {
                    type: ActivityTypes.Event,
                    name: HANDOFF_ACTION,
                    value: {
                        userName: step.values.name,
                        conversationHistory: `${step.values.name} started the conversation with the bot but needed a live agent to assist with the query.`
                    },
                    channelData: step.context.activity.channelData,
                    properties: step.context.activity.properties
                };
                const skillDialogArgs = { activity: skillActivity };
                await this.activeSkillProperty.set(step.context, SKILL_HANDOFF);
                await step.context.sendActivity('Redirecting you to an agent...');
                return await step.beginDialog(SKILL_HANDOFF, skillDialogArgs);
        }

    }

    async endStep(step) {

        // Save choices in the user response state.
        const userResponse = await this.userResponse.get(step.context, new UserResponse());

        userResponse.name = step.values.name;
        userResponse.choice = step.values.choice;

        return await step.endDialog();

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

    async addSkillDialogs(conversationState, conversationIdFactory, skillClient, skillsConfig, botId) {
        Object.keys(skillsConfig.skills).forEach((skillId) => {
            const skillInfo = skillsConfig.skills[skillId];

            const skillOptions = {
                botId: process.env.MicrosoftAppId,
                conversationIdFactory,
                conversationState,
                skill: skillInfo,
                skillHostEndpoint: process.env.SkillHostEndpoint,
                skillClient
            };
            // Add a SkillDialog for the selected skill.
            this.addDialog(new SkillDialog(skillOptions, skillInfo.id));
        });
    }

}

module.exports.MainDialog = MainDialog;