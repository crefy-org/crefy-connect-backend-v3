// Global type declarations to fix ESLint errors
declare global {
    const console: {
        error: (...args: unknown[]) => void;
        log: (...args: unknown[]) => void;
        warn: (...args: unknown[]) => void;
        info: (...args: unknown[]) => void;
    };

    const process: NodeJS.Process;
}

export {};
