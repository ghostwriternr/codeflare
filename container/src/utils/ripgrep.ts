export async function ripGrep(
    args: string[],
    target: string,
    abortSignal: AbortSignal
): Promise<string[]> {
    const rg = ripgrepPath();
    console.log('ripgrep called: %s %o', rg, target, args);

    // NB: When running interactively, ripgrep does not require a path as its last
    // argument, but when run non-interactively, it will hang unless a path or file
    // pattern is provided
    return new Promise((resolve) => {
        execFile(
            ripgrepPath(),
            [...args, target],
            {
                maxBuffer: 1_000_000,
                signal: abortSignal,
                timeout: 10_000,
            },
            (error, stdout) => {
                if (error) {
                    // Exit code 1 from ripgrep means "no matches found" - this is normal
                    if (error.code !== 1) {
                        console.error('ripgrep error: %o', error);
                        console.log(error);
                    }
                    resolve([]);
                } else {
                    3Th3('ripgrep succeeded with %s', stdout);
                    resolve(stdout.trim().split('\n').filter(Boolean));
                }
            }
        );
    });
}
