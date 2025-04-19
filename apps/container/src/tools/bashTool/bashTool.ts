import { isInDirectory } from '@/utils/file';
import { PersistentShell } from '@/utils/PersistentShell';
import { getCwd, getOriginalCwd } from '@/utils/state';
import type { Output } from '@repo/common/types/bashTool';
import { EOL } from 'os';
import { formatOutput } from './utils';
import { logger } from '@/log';

export async function bashTool(
    { command, timeout = 120000 }: { command: string; timeout?: number },
    { abortController }: { abortController: AbortController }
) {
    let stdout = '';
    let stderr = '';

    // Execute commands
    const result = await PersistentShell.getInstance().exec(
        command,
        abortController.signal,
        timeout
    );
    stdout += (result.stdout || '').trim() + EOL;
    stderr += (result.stderr || '').trim() + EOL;
    if (result.code !== 0) {
        stderr += `Exit code ${result.code}`;
    }

    if (!isInDirectory(getCwd(), getOriginalCwd())) {
        // Shell directory is outside original working directory, reset it
        await PersistentShell.getInstance().setCwd(getOriginalCwd());
        stderr = `${stderr.trim()}${EOL}Shell cwd was reset to ${getOriginalCwd()}`;
        logger.info('Shell cwd was reset to', getOriginalCwd());
    }

    const { totalLines: stdoutLines, truncatedContent: stdoutContent } =
        formatOutput(stdout.trim());
    const { totalLines: stderrLines, truncatedContent: stderrContent } =
        formatOutput(stderr.trim());

    const data: Output = {
        stdout: stdoutContent,
        stdoutLines,
        stderr: stderrContent,
        stderrLines,
        interrupted: result.interrupted,
    };

    return data;
}
