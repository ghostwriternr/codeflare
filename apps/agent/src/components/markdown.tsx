import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const Markdown = ({ children }: { children: string }) => {
    return (
        <div className="prose dark:prose-invert max-w-none prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-code:text-primary-foreground prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-4">{children}</p>,
                    // @ts-expect-error inline is indeed a valid prop
                    code: ({ inline, className, children, ...props }) =>
                        inline ? (
                            <code
                                className="bg-muted px-1.5 py-0.5 rounded text-sm text-primary"
                                {...props}
                            >
                                {children}
                            </code>
                        ) : (
                            <code className={className} {...props}>
                                {children}
                            </code>
                        ),
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
};
