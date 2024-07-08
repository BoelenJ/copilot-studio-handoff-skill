# Copilot studio handoff skill

Copilot studio supports handoffs to live agents out of the box, allowing you to easily hand off the conversation to engagement hubs. This requires the engagement hub to provide a chat canvas that will call directline to use Copilot Studio in the backend, and respond accordingly
when Copilot Studio initiates a handoff event. However, this is not always feasible, so as an alternative, skills could be used to handle the handoff.

https://github.com/BoelenJ/copilot-studio-handoff-skill/assets/117845677/9cc0c972-5034-4bf5-84ef-51a6fb0305ea

### Demo implementation

This repo contains a basic demo implementation of a skill that can easily be run locally. This is by no means a production ready set-up, but it is meant for inspiration and starting point. There are three components included:
- demo-client: this is a simple bot framework SDK bot that acts as the client that consumes the skill. In a real life scenario, this could be Copilot Studio.
- handoff-skill: the actual skill that performs the handoff. This skill is consumed by the demo client, but could also be consumed from Copilot Studio when deployed to Azure.
- nextjs-demo-agent: a small demo agent application that will receive the conversations that have been handed off to an agent, this is meant to locally simulate how the process could work.

### Handoff set-up

As mentioned, this is a simple set-up that should not be used for production use-cases, but is mostly for illustrative purposes. The handoff set-up is as follows:
- The entire handoff is handled in the skill. The skill has a dialog "HandOffDialog" that has one waterfall dialog that basically loops until someone breaks the loop.
- The waterfall dialog calls the sample handoffadapter to forward the conversation and following user messages to the live agent.
- The skill exposes an endpoint that accepts messages from the live agent and forwards those to the end user.
- The user can type quit or cancel at any time to cancel the skill, stop the live conversation and go back to the main bot.

The current handoffadapter is all REST API based, but could very well be replaced by for example websockets or even the directline API.

### How to run

For the handoff skill and demo client, you need to set-up your .env files with some keys as the code relies on these. These keys are also relevant when deploying the bot to Azure, for more information on those key/values, please check the Microsoft documentation.
#### 1. Run the demo agent
Open the nextjs-demo-agent in a terminal and execute the following commands:
```npm install```
```npm run dev```

#### 2. Run the handoff skill
Open the handoff-skill in VSCode or another editor and add a .env file with the following keys:

```
MicrosoftAppType=
MicrosoftAppId=
MicrosoftAppPassword=
MicrosoftAppTenantId=
AllowedCallers=*

AgentHostEndpoint=http://localhost:3000/api/conversations
SkillBaseUrl=http://localhost:39783/api/notify
```

Open the handoff-skill in a terminal and execute the following commands:
```npm install```
```npm start```

#### 3. Run the demo client
Open the demo-client in VSCode or another editor and add the following .env file:

```
MicrosoftAppType=
MicrosoftAppId=
MicrosoftAppPassword=
MicrosoftAppTenantId=
SkillHostEndpoint=http://localhost:3978/api/skills/

SkillId=HandOffSkill
SkillAppId=
SkillEndpoint=http://localhost:39783/api/messages
```

Open the demo-client in a terminal and execute the following commands:
```npm install```
```npm start```

#### 4. Open the bot framework emulator and the demo agent
Open the bot framwork emulator and connect to the demo client by connecting to ```http://localhost:3978/api/messages```. Also open the demo agent tool in the browser by opening ```http://localhost:3000/```
Please note that the local demo agent does not have any persistent storage and all conversations will be lost on rerunning the agent. This tool is only for testing the interaction between the skill and the handoff and needs to be replaced by an actual (custom) engagement hub.
