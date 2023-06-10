"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_support_1 = require("@aws-sdk/client-support");
const webhook_1 = require("@slack/webhook");
const credential_provider_ini_1 = require("@aws-sdk/credential-provider-ini");
const webhookURL = process.env.SLACK_WEBHOOK_URL;
// Trusted AdvisorのAPIはap-northeast-1をサポートしていない。
const client = new client_support_1.SupportClient({
    region: 'us-east-1',
    credentials: (0, credential_provider_ini_1.fromIni)({ profile: 'localstack' }),
    endpoint: "http://localstack:4566",
});
async function getCheckResult(checkId) {
    const params = { checkId: checkId };
    const command = new client_support_1.DescribeTrustedAdvisorCheckResultCommand(params);
    const data = await client.send(command);
    return data;
}
async function sendSlack(checks) {
    var payloadBlocks = [];
    var payloadAttachments = [];
    payloadBlocks.push({
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: `Trusted Advisor Check Results`,
        },
    });
    for (const check of checks) {
        var checkResult = await getCheckResult(check.id);
        if (checkResult.result?.checkId == 'warning') {
            payloadAttachments.push({
                color: "#F6AA00",
                title: `[${check.category}]: ${check.name}`,
            });
        }
        else if (checkResult.result?.checkId == 'error') {
            payloadAttachments.push({
                color: "#FF0000",
                title: `[${check.category}]: ${check.name}`,
            });
        }
    }
    const webhook = new webhook_1.IncomingWebhook(webhookURL);
    const payload = {
        blocks: payloadBlocks,
        attachments: payloadAttachments,
    };
    console.log(payload);
    const slackResponse = await webhook.send(payload);
    console.log(slackResponse);
    return slackResponse;
}
const handler = async () => {
    var params = {
        language: 'ja'
    };
    try {
        const command = new client_support_1.DescribeTrustedAdvisorChecksCommand(params);
        const data = await client.send(command);
        await sendSlack(data.checks);
    }
    catch (err) {
        console.log(err);
    }
};
exports.handler = handler;
