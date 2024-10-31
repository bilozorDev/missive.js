export type ExpirableBackendStorage<T> = Pick<BackendStorage<T>, 'get'> & {
    set: (key: string, value: T, ttl?: number) => Promise<void>;
};

export type BackendStorage<T> = {
    get(key: string): Promise<T | undefined> | undefined;
    set: (key: string, value: T) => Promise<void>;
};

export type CacherInterface<T> = (key: string, compute: () => Promise<T>, ttl?: number) => Promise<T>;
