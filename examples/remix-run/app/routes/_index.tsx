import { json, LoaderFunctionArgs } from '@remix-run/node';
import { Await, defer, Form, useLoaderData } from '@remix-run/react';
import { queryBus, commandBus } from 'missive.js-shared-code-example';
import { Suspense } from 'react';

export const loader = async ({}: LoaderFunctionArgs) => {
    const getUserQuery = queryBus.createQuery('getUser', { email: 'plopix@example.com' });
    const promise = queryBus.dispatch(getUserQuery);
    return defer({ promise });
};

export const action = async () => {
    const createUserCommand = commandBus.createCommand('createUser', {
        email: 'plopix@example.com',
        firstname: 'Plopix',
        lastname: 'ix',
    });
    const { result } = await commandBus.dispatch(createUserCommand);
    const removeUserCommand = commandBus.createCommand('removeUser', { userId: '1234' });
    const { result: result2 } = await commandBus.dispatch(removeUserCommand);
    return json({ result, result2 });
};

export default function Index() {
    const { promise } = useLoaderData<typeof loader>();
    return (
        <div className="flex h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-16">
                <header className="flex flex-col items-center gap-9">
                    <h1 className="leading text-2xl font-bold text-gray-800 dark:text-gray-100">
                        Welcome to <span className="sr-only">Remix</span>
                    </h1>
                    <div className="h-[144px] w-[434px]">
                        <img src="/logo-light.png" alt="Remix" className="block w-full dark:hidden" />
                        <img src="/logo-dark.png" alt="Remix" className="hidden w-full dark:block" />
                    </div>
                </header>

                <Suspense fallback={<div>Loading...</div>}>
                    <Await resolve={promise}>{({ result }) => <p>{JSON.stringify(result)}</p>}</Await>
                </Suspense>

                <Form method="post">
                    <button type="submit" className="btn">
                        Mutate
                    </button>
                </Form>
            </div>
        </div>
    );
}
