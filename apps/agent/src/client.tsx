import { logger } from '@worker/log';
import { createRoot } from 'react-dom/client';
import App from './app';
import './styles.css';

logger.info('Initializing client application');

const root = createRoot(document.getElementById('app')!);

root.render(
    <div className="font-mono scrollbar-thumb-foreground/10 scrollbar-track-background">
        <App />
    </div>
);
