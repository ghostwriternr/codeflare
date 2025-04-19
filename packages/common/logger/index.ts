import { type Logger, type LoggerOptions } from 'pino';
// Without this, the worker env crashes with node related errors.
import pino from 'pino/browser';

const baseConfig: LoggerOptions = {
    level: 'info',
    formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
    },
};

const getServerConfig = (name: string): LoggerOptions => {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    return {
        ...baseConfig,
        name,
        level: isDevelopment ? 'debug' : 'info',
        ...(!isDevelopment && {
            transport: undefined,
        }),
    };
};

interface WorkerGlobalScope {
    requestId?: string;
}

interface ExtendedGlobal {
    requestId?: string;
    WorkerGlobalScope?: WorkerGlobalScope;
}

// Factory function to create the appropriate logger
export function createLogger(name: string): Logger {
    const isBrowser = typeof window !== 'undefined';
    const isWorker =
        typeof (globalThis as { WorkerGlobalScope?: unknown })
            .WorkerGlobalScope !== 'undefined';

    if (isBrowser) {
        return pino({ ...baseConfig, name, browser: { asObject: false } });
    }

    if (isWorker) {
        // Worker environment - always JSON format for production
        const serverConfig = getServerConfig(name);
        return pino({
            ...serverConfig,
            formatters: {
                ...serverConfig.formatters,
                // Add request ID if available in worker context
                bindings: () => ({
                    requestId:
                        (globalThis as unknown as ExtendedGlobal).requestId ||
                        undefined,
                }),
            },
        });
    }

    // Container environment
    return pino(getServerConfig(name));
}

export function dateToFilename(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-');
}
