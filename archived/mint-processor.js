const amqplib = require('amqplib');

var conn;
var channelConsumer;
var channelProducer;

const queuePendingMint = 'pending-mint';
const queuePendingTransfer = 'pending-transfer';
const url = 'amqp://localhost:49154';

async function initializeQueues() {
    try {
        console.log('Creating connection...');
        conn = await amqplib.connect(url);

        process.once('SIGINT', () => { 
            console.log('Closing connection...');
            conn.close(); // clone connection
        });

        console.log('Creating channels...');
        channelConsumer = await conn.createChannel();
        channelProducer = await conn.createChannel();

        channelConsumer.assertQueue(queuePendingMint, { durable : true });
        channelProducer.assertQueue(queuePendingTransfer, { durable : true });
        
        channelConsumer.consume(queuePendingMint, (msg) => {
            console.log('Received mint request: ', msg.content.toString());
            console.log('Processing mint request...');
            channelConsumer.ack(msg); // this will remove the message from the queue
        });

    } catch (err) {
        console.log('error', err);
    }
}

function handleMintRequest(request) {
    // validate wallet
    // get balance of tokens
    // generate NFT metadata
    // build mint command/transaction
}

initializeQueues();
