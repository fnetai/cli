const redis = require('redis');
const fnetIsRedisOnline = require('@flownet/lib-is-redis-online');

module.exports = async () => {
    const isOnline = await fnetIsRedisOnline({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
    if (!isOnline) return;

    const redisClient = redis.createClient({
        socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
    });
    await redisClient.connect();

    return redisClient;
}