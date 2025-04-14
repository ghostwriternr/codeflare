import { EOL } from 'os';
import type { Out } from '../../../../worker/tools/BashTool/bashTool.js';
import { logEvent } from '../../../../worker/utils/log.js';
import { getCwd, getOriginalCwd } from '../../../../worker/utils/state.js';
import { isInDirectory } from '../../utils/file.js';
import { PersistentShell } from '../../utils/PersistentShell.js';
import { formatOutput } from './utils.js';

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
        logEvent('bash_tool_reset_to_original_dir', {});
    }

    const { totalLines: stdoutLines, truncatedContent: stdoutContent } =
        formatOutput(stdout.trim());
    const { totalLines: stderrLines, truncatedContent: stderrContent } =
        formatOutput(stderr.trim());

    const data: Out = {
        stdout: stdoutContent,
        stdoutLines,
        stderr: stderrContent,
        stderrLines,
        interrupted: result.interrupted,
    };

    return data;
}
