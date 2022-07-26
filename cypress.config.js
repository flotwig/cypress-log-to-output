import { defineConfig } from 'cypress';
import * as logToOutput from './src/log-to-output.js';

export default defineConfig({
  e2e: {
    supportFile: false,
    setupNodeEvents(on) {
      logToOutput.install(on, () => true, {
        recordLogs: true,
      });
    },
  },
});
