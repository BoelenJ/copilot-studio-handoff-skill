import * as path from 'path';
import { config } from 'dotenv';
const ENV_FILE = path.join(__dirname, '..', '.env');
config({ path: ENV_FILE });

import * as restify from 'restify';
import { INodeSocket } from 'botframework-streaming';
import { MemoryStorage, ConversationState, UserState, ConfigurationBotFrameworkAuthentication, ActivityTypes, TurnContext, CloudSkillHandler, ChannelServiceRoutes, SkillConversationIdFactory, Activity } from 'botbuilder';
import {CloudAdapter, ConfigurationServiceClientCredentialFactory, createBotFrameworkAuthenticationFromConfiguration } from 'botbuilder';
import {allowedCallersClaimsValidator, AuthenticationConfiguration, AuthenticationConstants } from 'botframework-connector';
import { MainDialog } from './dialogs/mainDialog';
import { SkillsConfiguration } from './skillsConfig';
import { EchoBot } from './bot';

// Create HTTP server.
const server = restify.createServer();
server.use(restify.plugins.bodyParser());

server.listen(process.env.port || process.env.PORT || 3978, () => {
    console.log(`\n${server.name} listening to ${server.url}`);
    console.log('\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator');
    console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Load skills configuration.
const skillsConfig = new SkillsConfiguration();

const allowedSkills = Object.values(skillsConfig.skills).map(skill => skill.appId);

const claimsValidators = allowedCallersClaimsValidator(allowedSkills);

let validTokenIssuers = [];
const { MicrosoftAppTenantId } = process.env;

if (MicrosoftAppTenantId) {
    // For SingleTenant/MSI auth, the JWT tokens will be issued from the bot's home tenant.
    // Therefore, these issuers need to be added to the list of valid token issuers for authenticating activity requests.
    validTokenIssuers = [
        `${ AuthenticationConstants.ValidTokenIssuerUrlTemplateV1 }${ MicrosoftAppTenantId }/`,
        `${ AuthenticationConstants.ValidTokenIssuerUrlTemplateV2 }${ MicrosoftAppTenantId }/v2.0/`,
        `${ AuthenticationConstants.ValidGovernmentTokenIssuerUrlTemplateV1 }${ MicrosoftAppTenantId }/`,
        `${ AuthenticationConstants.ValidGovernmentTokenIssuerUrlTemplateV2 }${ MicrosoftAppTenantId }/v2.0/`
    ];
}

const authConfig = new AuthenticationConfiguration([], claimsValidators, validTokenIssuers);


const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId
});

const botFrameworkAuthConfig = {
    MicrosoftAppId: process.env.MicrosoftAppId,
    MicrosoftAppTenantId: process.env.MicrosoftAppTenantId,
    MicrosoftAppPassword: process.env.MicrosoftAppPassword,
    MicrosoftAppType: process.env.MicrosoftAppType,
};

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(botFrameworkAuthConfig, credentialsFactory, authConfig);

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = new CloudAdapter(botFrameworkAuthentication);


// Create user and conversation state with in-memory storage provider.
const memoryStorage = new MemoryStorage();
const userState = new UserState(memoryStorage);
const conversationState = new ConversationState(memoryStorage);
const conversationIdFactory = new SkillConversationIdFactory(new MemoryStorage());

// Skills client.
const skillClient = botFrameworkAuthentication.createBotFrameworkClient();

// Create the main dialog.
const dialog = new MainDialog(userState, skillsConfig, skillClient, conversationIdFactory);

const myBot = new EchoBot(conversationState, userState, dialog);

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
    // This check writes out errors to console log .vs. app insights.
    // NOTE: In production environment, you should consider logging this to Azure
    //       application insights.
    console.error(`\n [onTurnError] unhandled error: ${ error }`);

    // Send a trace activity, which will be displayed in Bot Framework Emulator
    await context.sendTraceActivity(
        'OnTurnError Trace',
        `${ error }`,
        'https://www.botframework.com/schemas/error',
        'TurnError'
    );

    // Send a message to the user
    await context.sendActivity('The bot encountered an error or bug.');
    await context.sendActivity('To continue to run this bot, please fix the bot source code.');
    await endSkillConversation(context);
};

async function endSkillConversation(context) {
    try {
        // Inform the active skill that the conversation is ended so that it has a chance to clean up.
        // Note: the root bot manages the ActiveSkillPropertyName, which has a value while the root bot
        // has an active conversation with a skill.
        const activeSkill = await conversationState.createProperty(dialog.activeSkillPropertyName).get(context);
        if (activeSkill) {
            const botId = process.env.MicrosoftAppId;

            let endOfConversation: Partial<Activity> = {
                type: ActivityTypes.EndOfConversation,
                code: 'RootSkillError'
            };
            endOfConversation = TurnContext.applyConversationReference(endOfConversation, TurnContext.getConversationReference(context.activity), true);
            
            await conversationState.saveChanges(context, true);
            await skillClient.postActivity(botId, activeSkill.appId, activeSkill.skillEndpoint, skillsConfig.skillHostEndpoint, endOfConversation.id, endOfConversation as Activity);
        }
    } catch (err) {
        console.error(`\n [onTurnError] Exception caught on attempting to send EndOfConversation : ${ err }`);
    }
}

// Set the onTurnError for the singleton CloudAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Listen for incoming requests.
server.post('/api/messages', async (req, res) => {
    // Route received a request to adapter for processing
    await adapter.process(req, res, (context) => myBot.run(context));
});

// Create and initialize the skill classes.
const handler = new CloudSkillHandler(adapter, (context) => myBot.run(context), conversationIdFactory, botFrameworkAuthentication);
const skillEndpoint = new ChannelServiceRoutes(handler);
skillEndpoint.register(server, '/api/skills');

// Listen for Upgrade requests for Streaming.
server.on('upgrade', async (req, socket, head) => {
    // Create an adapter scoped to this WebSocket connection to allow storing session data.
    const streamingAdapter = new CloudAdapter(botFrameworkAuthentication);

    // Set onTurnError for the CloudAdapter created for each connection.
    streamingAdapter.onTurnError = onTurnErrorHandler;

    await streamingAdapter.process(req, socket as unknown as INodeSocket, head, (context) => myBot.run(context));
});
