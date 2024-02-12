import { createClient } from 'redis';

const redisConfig = {
  password: process.env.REDIS_PW,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : undefined,
  },
};

const redis = createClient(redisConfig);

redis.on('error', (err) => console.error('Redis Client Error', err));

redis.connect().catch((err) => {
  console.error('Error connecting to Redis', err);
});

export { redis };

