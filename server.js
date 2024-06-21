// server.js
const fastify = require('fastify')({ logger: true });
const dotenv = require('dotenv');
const rawBody = require('fastify-raw-body');

// Load environment variables from .env file
dotenv.config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

fastify.register(rawBody, {
  field: 'rawBody', // change the default request.rawBody property name
  global: false, // add the rawBody to every request
  encoding: 'utf8', // set it to false to set rawBody as a Buffer
  runFirst: true, // get the body before any preParsing hook change/uncompress it
  routes: [] // array of routes, it can be an array of strings (exact match) or regex
});

// Temporary basic endpoint to test server
fastify.get('/', async (request, reply) => {
  return { status: 'Server is running' };
});

// Stripe webhook endpoint
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

fastify.post('/webhook', { preValidation: fastify.rawBody }, async (request, reply) => {
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
  } catch (err) {
    reply.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent was successful!`);
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log(`PaymentMethod was attached to a Customer!`);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  reply.send({ received: true });
});

const start = async () => {
    try {
      await fastify.listen(3000, '127.0.0.1');
      console.log('Server is listening on port 3000');
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  
  start();
  