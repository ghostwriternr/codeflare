import './styles.css';
import { createRoot } from 'react-dom/client';
import App from './app';

const root = createRoot(document.getElementById('app')!);

root.render(
    <div className="scrollbar-thumb-foreground/10 scrollbar-track-background">
        <App />
    </div>
);
