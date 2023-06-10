import { 
    SupportClient, 
    DescribeTrustedAdvisorChecksCommand, 
    DescribeTrustedAdvisorChecksCommandOutput, 
    DescribeTrustedAdvisorCheckResultCommand,
    DescribeTrustedAdvisorCheckResultCommandOutput,  
    } from "@aws-sdk/client-support";
import { IncomingWebhook } from '@slack/webhook'
import type { TrustedAdvisorCheckDescription } from "@aws-sdk/client-support";

const webhookURL = process.env.SLACK_WEBHOOK_URL as string;
// Trusted AdvisorのAPIはap-northeast-1をサポートしていない。
const client = new SupportClient({ 
    region: 'us-east-1',
});

async function getCheckResult(checkId: string) {
    
    const params = { checkId: checkId }
    const command = new DescribeTrustedAdvisorCheckResultCommand (params);
    const data: DescribeTrustedAdvisorCheckResultCommandOutput = await client.send(command);

    return data
}

async function sendSlack(checks: TrustedAdvisorCheckDescription[]) {

    var payloadBlocks: Array<any> = [];
    var payloadAttachments: Array<any> = [];

    payloadBlocks.push(
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: `Trusted Advisor Check Results`,
            },
        }
    )

    for (const check of checks) {
        
        var checkResult = await getCheckResult(check.id!);

        if (checkResult.result?.status == 'warning') {
            payloadAttachments.push(
                {
                    color: "#F6AA00",
                    title: `[${check.category}]: ${check.name}`,
                }
            )
        } else if (checkResult.result?.status == 'error') {
            payloadAttachments.push(
                {
                    color: "#FF0000",
                    title: `[${check.category}]: ${check.name}`,
                }
            )
        }
        
        
    }

    const webhook = new IncomingWebhook(webhookURL);

    const payload = {
        blocks: payloadBlocks,
        attachments: payloadAttachments,
    } 

    const slackResponse = await webhook.send(payload);
    return slackResponse;
}

export const handler = async () => {

    var params = {
        language: 'ja'
    };

    try {
        const command = new DescribeTrustedAdvisorChecksCommand(params);
        const data: DescribeTrustedAdvisorChecksCommandOutput = await client.send(command);
        await sendSlack(data.checks!);
    } catch (err) {
        console.log(err);
    }

};
