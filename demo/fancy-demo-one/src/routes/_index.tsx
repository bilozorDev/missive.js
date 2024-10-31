import { json, LoaderFunctionArgs } from '@remix-run/node';

export const loader = async ({ context }: LoaderFunctionArgs) => {
    const intent = context.createQuery('ListAllCharacters', {});
    const characters = await context.dispatchQuery(intent);
    return json({ characters });
};

export default function Index() {
    return (
        <main className="p-10">
            <h1 className="text-4xl">Hero Quest Manager</h1>

            <h2 className="text-3xl">Characters</h2>
        </main>
    );
}
