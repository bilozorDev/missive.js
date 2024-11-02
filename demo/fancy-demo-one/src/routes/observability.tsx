import { Stamp } from 'missive.js';
import { useEffect, useState } from 'react';
import { useEventSource } from 'remix-utils/sse/react';
type REvent = {
    id: string;
    type: string;
    intent: string;
    message: unknown;
    results: unknown;
    stamps: Stamp[];
};
export default function Observability() {
    const data = useEventSource(`/api/bus/stream`);
    const [events, setEvents] = useState<REvent[]>([]);
    useEffect(() => {
        if (data) {
            const decoded = JSON.parse(data);
            const [type, id, encoded] = decoded;
            const { message, results, stamps } = JSON.parse(encoded);
            const { __type, ...rest } = message;
            setEvents((prev) => [
                ...prev,
                {
                    id,
                    type,
                    intent: __type,
                    message: rest,
                    results,
                    stamps,
                },
            ]);
        }
    }, [data]);

    return (
        <main className="p-10">
            <h1 className="text-4xl">Hero Quest Manager</h1>
            <table className="table-auto w-full">
                <thead>
                    <tr>
                        <th className="border px-4 py-2">Id</th>
                        <th className="border px-4 py-2">Type</th>
                        <th className="border px-4 py-2">Intent</th>
                        <th className="border px-4 py-2">Message</th>
                        <th className="border px-4 py-2">Results</th>
                        <th className="border px-4 py-2">Stamps</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((event, i) => (
                        <tr key={i}>
                            <td className="border px-4 py-2">{event.id}</td>
                            <td className="border px-4 py-2">{event.type}</td>
                            <td className="border px-4 py-2">{event.intent}</td>
                            <td className="border px-4 py-2">{JSON.stringify(event.message)}</td>
                            <td className="border px-4 py-2">{JSON.stringify(event.results)}</td>
                            <td className="border px-4 py-2">{JSON.stringify(event.stamps)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}
