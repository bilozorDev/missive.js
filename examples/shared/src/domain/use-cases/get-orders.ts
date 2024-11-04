import { Envelope, QueryHandlerDefinition } from 'missive.js';
import { CacheableStamp } from 'missive.js';
import { z } from 'zod';

type Deps = {};

export const getOrdersQuerySchema = z.object({
    userId: z.string().optional(),
});
type Query = z.infer<typeof getOrdersQuerySchema>;
type Result = Awaited<ReturnType<typeof handler>>;

export type GetOrdersHandlerDefinition = QueryHandlerDefinition<'getOrders', Query, Result>;

const handler = async (envelope: Envelope<Query>, deps: Deps) => {
    const { userId } = envelope.message;
    console.log(`Get Orders Handler: Getting Orders for userId ${userId}`);
    envelope.addStamp<CacheableStamp>('missive:cacheable', { ttl: 60 });
    return {
        success: true,
        user: {
            id: '1234',
            email: 'plopix@example.com',
        },
        orders: [
            {
                ref: 'A',
                status: 'pending',
            },
            {
                ref: 'B',
                status: 'delivered',
            },
        ],
    };
};
export const createGetOrdersHandler = (deps: Deps) => (query: Envelope<Query>) => handler(query, deps);
