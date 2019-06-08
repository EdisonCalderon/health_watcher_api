var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

const topic = Symbol()
const sns = Symbol()

class SNS {
    constructor(topic_arn) {
        this[topic] = topic_arn
        this[sns] = new AWS.SNS({ apiVersion: '2010-03-31' })
        this[sns].setSMSAttributes(
            {
                attributes: {
                    DefaultSMSType: "Transactional"
                }
            },
            function (error) {
                if (error) {
                    console.log(error);
                }
            }
        )
    }

    publishMessage(text) {
        const parameters = { Message: text, TopicArn: this[topic] }
        var publishTextPromise = this[sns].publish(parameters).promise()
        publishTextPromise.then(
            (data) => {
                console.log(`Message ${parameters.Message} sent to the topic ${parameters.TopicArn}`);
                console.log("MessageID is " + data.MessageId);
            }).catch(console.error);
    }
}

export default SNS