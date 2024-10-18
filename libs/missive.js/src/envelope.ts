export type Envelope<T> = {
    stamps: Stamp[];
    message: T;
    addStamp: <C, ST extends string = string>(type: ST, context?: C) => void;
    addStamps: <C, ST extends string = string>(...stamps: Stamp<C, ST>[]) => void;
    firstStamp: <C, ST extends string = string>(type: ST) => Stamp<C, ST> | undefined;
    lastStamp: <C, ST extends string = string>(type: ST) => Stamp<C, ST> | undefined;
    stampsOfType: <C, ST extends string = string>(type: ST) => Stamp<C, ST>[];
};

export type Stamp<C = unknown, T extends string = string> = {
    type: T;
    context?: C;
};

export const createEnvelope = <T>(message: T, ...stamps: Stamp[]): Envelope<T> => {
    return {
        stamps,
        message,
        addStamp: <C, ST extends string = string>(type: ST, context?: C): void => {
            stamps.push({ type, context });
        },
        addStamps: <C, ST extends string = string>(...newStamps: Stamp<C, ST>[]): void => {
            stamps.push(...newStamps);
        },
        stampsOfType: <C, ST extends string = string>(type: string) => {
            return stamps.filter((stamp) => stamp.type === type) as Stamp<C, ST>[];
        },
        firstStamp: <C, ST extends string = string>(type: string) => {
            return stamps.find((stamp) => stamp.type === type) as Stamp<C, ST>;
        },
        lastStamp: <C, ST extends string = string>(type: string) => {
            return [...stamps].reverse().find((stamp) => stamp.type === type) as Stamp<C, ST>;
        },
    };
};
