import type { LoaderFunctionArgs } from '@remix-run/node';
import { eventStream } from 'remix-utils/sse/server';

export async function loader({ request, context }: LoaderFunctionArgs) {
    const emitter = context.services.emitter;
    const target = context.services.busObsName;
    return eventStream(request.signal, (send) => {
        const handler = (data: unknown) => {
            send({ event: 'message', data: JSON.stringify(data) });
        };
        emitter.addListener(target, handler);
        send({ event: 'init', data: 'ialization' });
        const interval = setInterval(() => {
            send({ event: 'ping', data: 'pong' });
        }, 10000);
        return function clear() {
            emitter.removeListener(target, handler);
            clearInterval(interval);
        };
    });
}
