const express = require('express');
const { userAuth } = require('../Middlewares/auth');
const paymentRouter = express.Router();
const paymentModel = require("../Models/payments")
const razorPayInstance = require('../utils/razorPay');
const { membershipAmount } = require('../utils/constants');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');
const UserModel = require('../Models/user');

paymentRouter.post('/payment/create', userAuth, async (req, res) => {
    try {
        const { membershipType } = req.body;
        const { firstName, lastName, emailId } = req.user;
        let options = {
            amount: membershipAmount[membershipType] * 100,
            currency: "INR",
            receipt: "recipt#1",
            notes: {
                firstName,
                lastName,
                emailId,
                membershipType
            }
        }
        let order = await razorPayInstance.orders.create(options);

        console.log(order);

        let payment = new paymentModel({
            userId: req.user._id,
            orderId: order.id,
            status: order.status,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt,
            notes: order.notes
        })

        let savedPayment = await payment.save()


        res.json({ ...savedPayment.toJSON(), key: process.env.RAZORPAY_KEY_ID });
    }
    catch (err) {
        console.log(err)
    }
})

paymentRouter.post('/payment/webhook', async (req, res) => {
    try {

        //valide sign
        const webhookSignature = req.headers("X-Razorpay-Signature")
        const isSignatureValid = validateWebhookSignature(JSON.stringify(req.body), webhookSignature, process.env.RAZORPAY_WEBHOOK_SECRET)
        if (!isSignatureValid) return res.status(400).json({ msg: "Webhook signature is inValid" })
        const paymentDetails = req.body.payload.payment.entity;

        const payment = await paymentModel.findOne({ orderId: paymentDetails.order_id })

        payment.status = paymentDetails.status;
        await payment.save()

        await UserModel.set({ _id: payment.userId }, { isPremium: true, membershipType: payment.notes.membershipType });

        if (req.body.event === "payment.captured") {

        }
        if (req.body.event === "payment.failed") {

        }
        return res.status(200).json({ msg: "Webook recieved successfully" })
        //return success response to razorpay
    }
    catch (err) {
        console.log(err)
    }
})

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
    try {
        let user = req.user;
        return res.json({ isPremium: user.isPremium })
    } catch (error) {
        console.log(error)
        res.statusCode(500)
    }
})



module.exports = paymentRouter;