export function dateToFilename(date: Date): string {
    return date.toISOString().replace(/[:.]/g, '-');
}

export function logEvent(
    eventName: string,
    metadata: { [key: string]: string | undefined }
): void {
    console.log(
        `Event: ${eventName}`,
        ...Object.entries(metadata).map(([key, value]) => `${key}: ${value}`)
    );
}

export function logError(error: unknown): void {
    console.error(error);
}
