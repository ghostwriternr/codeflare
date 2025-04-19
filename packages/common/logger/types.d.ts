declare module 'pino/browser' {
    import type { Logger, LoggerOptions } from 'pino';
    export * from 'pino';
    declare function logger(options?: LoggerOptions): Logger;
    export default logger;
}
