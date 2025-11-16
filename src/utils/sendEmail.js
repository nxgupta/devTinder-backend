const { SendEmailCommand } = require('@aws-sdk/client-ses');
const { sesCLient } = require('./sesCLient')

const createSendEmailCommand = (toAddress, fromAddress) => {
    return new SendEmailCommand({
        Destination: {
            /* required */
            CcAddresses: [
                /* more items */
            ],
            ToAddresses: [
                toAddress,
                /* more To-email addresses */
            ],
        },
        Message: {
            /* required */
            Body: {
                /* required */
                Html: {
                    Charset: "UTF-8",
                    Data: "<h1>This is the email body</h1>",
                },
                Text: {
                    Charset: "UTF-8",
                    Data: "This is the text format email",
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Hello form SES",
            },
        },
        Source: fromAddress,
        ReplyToAddresses: [
            /* more items */
        ],
    });
};

const run = async (toAddress) => {
    const sendEmailCommand = createSendEmailCommand(
        toAddress,
        "no-reply@nxgupta.shop",
    );

    try {
        return await sesCLient.send(sendEmailCommand);
    } catch (caught) {
        if (caught instanceof Error && caught.name === "MessageRejected") {
            /** @type { import('@aws-sdk/client-ses').MessageRejected} */
            const messageRejectedError = caught;
            return messageRejectedError;
        }
        throw caught;
    }

};

module.exports = { run }
