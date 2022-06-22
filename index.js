'use strict'
// Example from quickstart fastify.io
const fastify = require('fastify')()
const io = require("socket.io")
const PORT = 3000

const schema = {
  schema: {
    response: {
      200: {
        type: 'object',
        properties: {
          hello: {
            type: 'string'
          }
        }
      }
    }
  }
}

fastify.register(require("fastify-cors"), {
  origin: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
})
fastify.register(require("fastify-rate-limit"), {
  max: 500,
  timeWindow: 2000,
  whitelist: ['127.0.0.1', 'localhost'],
})
fastify.register(require("fastify-formbody"));
fastify.register(require("fastify-helmet"), { hidePoweredBy: { setTo: 'Martian APIs' } });

/** create a socket fastify */
const ioServer = io(fastify.server);
ioServer.use((socket, next) => {
  const requestId = socket.handshake.query.PAYREQUESTID;
  const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!requestId) {
      return next(new Error('authentication error'));
  }
  if (!pattern.test(requestId)) {
      return next(new Error("Invalid pay-request-id passed"));
  }
  return next();
});
ioServer.on('connection', (socket) => {
  const room = socket.handshake.query.PAYREQUESTID;
  socket.join(room);
  ioServer.to(room).emit('joined', 'Socket connected');
});
const build = async () => {
  try {
      //const PORT = parseInt(process.env.PORT);
      await fastify.listen(PORT, '0.0.0.0');
      console.info(`server is up and running on ${PORT}`);
  } catch (err) {
      console.log(err);
      process.exit(1);
  }
};

/** routes */
fastify.route({
  method: 'POST',
  url: '/payment/complete',
  handler: async (request, reply) => {
      console.log(request.body);
      const room = request.body.PAY_REQUEST_ID;
      iofastify.to(room).emit('complete', request.body.PAY_REQUEST_ID);
      return reply.send('Ok');
  },
});
fastify.route({
  method: 'GET',
  url: '/payment/complete',
  handler: async (request, reply) => {
      return reply.send('OK');
  },
});
/** end routes */

process.on('uncaughtException', err => {
  console.error(err);
  process.exit(1);
});
process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(1);
});

build();
