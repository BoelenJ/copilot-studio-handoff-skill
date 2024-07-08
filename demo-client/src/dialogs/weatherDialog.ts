import { UserState } from "botbuilder";
import { ChoiceFactory, ChoicePrompt, ComponentDialog, TextPrompt, WaterfallDialog } from "botbuilder-dialogs";

export const WEATHER_DIALOG = 'WEATHER_DIALOG';
const LOCATION_PROMPT = 'LOCATION_PROMPT';
const METRIC_PROMPT = 'METRIC_PROMPT';


export class WeatherDialog extends ComponentDialog {
    
    private userState: UserState;

    constructor(userState: UserState) {

        // Assign id.
        super(WEATHER_DIALOG);

        this.userState = userState;

        // Add dialog to the WeatherDialog.
        this.addDialog(new TextPrompt(LOCATION_PROMPT));
        this.addDialog(new ChoicePrompt(METRIC_PROMPT));

        // Add waterfall dialog to construct the conversation.
        this.addDialog(new WaterfallDialog(WEATHER_DIALOG, [
            this.locationStep.bind(this),
            this.metricStep.bind(this),
            this.endStep.bind(this)
        ]));

        // Assign initial dialog.
        this.initialDialogId = WEATHER_DIALOG;


    }

    async locationStep(step) {
        return await step.prompt(LOCATION_PROMPT, 'What is your location?');
    }

    async metricStep(step) {
        step.values.location = step.result;

        return await step.prompt(METRIC_PROMPT, {
            prompt: 'What metric would you like to use?',
            choices: ChoiceFactory.toChoices(['Celsius', 'Fahrenheit'])
        });
    }

    async endStep(step) {
        step.values.metric = step.result.value;

        await step.context.sendActivity(`The weather in ${step.values.location} is 72 degrees ${step.values.metric}.`);

        return await step.endDialog();
    }
}