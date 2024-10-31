import { createRequestHandler } from '@remix-run/express';
import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import { buildContainer } from '~/core/container.server.js';

const isProduction = process.env.NODE_ENV === 'production';
const productionBuild = isProduction ? await import('../build/server/index.js') : undefined;

const viteDevServer = isProduction
    ? undefined
    : await import('vite').then((vite) =>
          vite.createServer({
              server: { middlewareMode: true },
          }),
      );

declare module '@remix-run/node' {
    interface AppLoadContext {
        logger: ReturnType<typeof buildContainer>['cradle']['logger'];
        createQuery: ReturnType<typeof buildContainer>['cradle']['queryBus']['createQuery'];
        dispatchQuery: ReturnType<typeof buildContainer>['cradle']['queryBus']['dispatch'];
        createCommand: ReturnType<typeof buildContainer>['cradle']['commandBus']['createCommand'];
        dispatchCommand: ReturnType<typeof buildContainer>['cradle']['commandBus']['dispatch'];
        createEvent: ReturnType<typeof buildContainer>['cradle']['eventBus']['createEvent'];
        dispatchEvent: ReturnType<typeof buildContainer>['cradle']['eventBus']['dispatch'];
    }
}

let container = buildContainer();
const remixHandler = createRequestHandler({
    // @ts-ignore comment
    build: viteDevServer ? () => viteDevServer.ssrLoadModule('virtual:remix/server-build') : productionBuild,
    getLoadContext: (request) => {
        const scopedServices = container.createScope();
        // here you can register the services that would be request-specific
        return {
            services: scopedServices.cradle,
            logger: scopedServices.cradle.logger,
            createQuery: scopedServices.cradle.queryBus.createQuery,
            dispatchQuery: scopedServices.cradle.queryBus.dispatch,
            createCommand: scopedServices.cradle.commandBus.createCommand,
            dispatchCommand: scopedServices.cradle.commandBus.dispatch,
            createEvent: scopedServices.cradle.eventBus.createEvent,
            dispatchEvent: scopedServices.cradle.eventBus.dispatch,
        };
    },
});

const app = express();
app.use(compression());
app.disable('x-powered-by');

if (viteDevServer) {
    app.use(viteDevServer.middlewares);
    viteDevServer.watcher.on('change', async () => {
        await container.dispose();
        container = buildContainer();
    });
} else {
    app.use('/assets', express.static('build/client/assets', { immutable: true, maxAge: '1y' }));
}
app.use(express.static('build/client', { maxAge: '1h' }));
app.use(
    morgan('tiny', {
        stream: {
            write: (message) => {
                container.cradle.logger.info(message.trim());
            },
        },
    }),
);

app.all('*', remixHandler);
const port = process.env.PORT || 3000;
app.listen(port, () => container.cradle.logger.start(`Remix server listening at http://localhost:${port}`));
