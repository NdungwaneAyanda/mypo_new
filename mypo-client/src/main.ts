import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => {
  console.error('Bootstrap error:', err);
  document.body.innerHTML = `
    <div style="font-family:monospace;padding:2rem;color:#b91c1c;background:#fff">
      <h2>App failed to start</h2>
      <pre style="white-space:pre-wrap;font-size:.875rem">${err?.message ?? err}</pre>
    </div>`;
});
