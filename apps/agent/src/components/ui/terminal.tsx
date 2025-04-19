interface TerminalProps {
    username?: string;
    directory?: string;
    commands: Array<{
        command: string;
        output?: string;
        isError?: boolean;
    }>;
    height?: string;
    maxWidth?: string;
}

export default function Terminal({
    username = 'user@terminal',
    directory = '~',
    commands,
    height = '500px',
    maxWidth = '2xl',
}: TerminalProps) {
    return (
        <div
            className={`flex flex-col h-[${height}] w-full max-w-${maxWidth} bg-[#1e1e1e] rounded-lg overflow-hidden font-mono text-white border`}
        >
            <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                    {commands.map((item, index) => (
                        <div key={index} className="space-y-1">
                            <div className="flex items-start gap-2">
                                <div className="flex-shrink-0">
                                    <span className="text-[#9cdcfe]">
                                        {username}
                                    </span>
                                    <span className="text-[#ce9178]">
                                        {directory}
                                    </span>
                                    <span className="text-[#d4d4d4]">$</span>
                                </div>
                                <span className="whitespace-pre">
                                    {item.command}
                                </span>
                            </div>
                            {item.output && (
                                <div
                                    className={`whitespace-pre-wrap ${item.isError ? 'text-red-400' : 'text-[#d4d4d4]'}`}
                                >
                                    {item.output}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
