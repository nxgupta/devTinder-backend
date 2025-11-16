const cron = require('node-cron');
const moment = require('moment');
const sendEmail = require('./sendEmail')
const { ConnectionRequestModel } = require('../Models/connectionRequest');

// cron.schedule('0 8 * * *', () => connectionRequestReminder())

let connectionRequestReminder = async () => {
    try {
        let yDayStart = moment().subtract(1, 'days').startOf('day').toISOString();
        let yDayEnd = moment().subtract(1, "days").endOf('day').toISOString();
        const pendingConnections = await ConnectionRequestModel.find({
            status: 'intrested',
            createdAt: {
                $gte: yDayStart,
                $lte: yDayEnd
            }
        })
            .populate('fromUserId toUserId');


        let emails = [...new Set(pendingConnections.map(connection => connection.toUserId.emailId))];
        for (const email of emails) {
            await sendEmail.run(email)
        }
    }
    catch (e) { console.log('error:', e) }
}

