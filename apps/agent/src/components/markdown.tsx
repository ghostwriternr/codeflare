import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';

export const Markdown = ({ children }: { children: string }) => {
    return (
        <div className="prose dark:prose-invert max-w-none prose-pre:p-0 prose-pre:rounded-lg prose-code:text-primary-foreground prose-code:before:content-none prose-code:after:content-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => <p className="mb-4">{children}</p>,
                    code(props) {
                        const { children, className, ...rest } = props;
                        const match = /language-(\w+)/.exec(className || '');
                        const isMultiline = String(children).includes('\n');

                        return isMultiline ? (
                            // @ts-expect-error the types are fine
                            <SyntaxHighlighter
                                {...rest}
                                PreTag="div"
                                children={String(children).replace(/\n$/, '')}
                                language={match?.[1] || 'text'}
                                style={docco}
                                className="!bg-muted !p-4 !m-0 rounded-lg"
                            />
                        ) : (
                            <code
                                className="bg-muted px-1.5 py-0.5 rounded text-sm text-primary"
                                {...rest}
                            >
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {children}
            </ReactMarkdown>
        </div>
    );
};
