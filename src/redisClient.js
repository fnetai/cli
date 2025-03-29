import redis from 'redis';
import fnetIsRedisOnline from '@flownet/lib-is-redis-online';

export default async function createRedisClient() {
    const isOnline = await fnetIsRedisOnline({ host: process.env.REDIS_HOST, port: process.env.REDIS_PORT });
    if (!isOnline) return;

    const redisClient = redis.createClient({
        socket: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
    });
    await redisClient.connect();

    return redisClient;
}