import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Resolve o diretório de dados do greencode.
 *
 * Prioridade:
 *   1. Variável de ambiente GREENCODE_HOME (para dev/testes/demo);
 *   2. Windows: %APPDATA%\greencode;
 *   3. Linux/macOS: ~/.greencode.
 */
export function obterDiretorioDados(): string {
  const override = process.env.GREENCODE_HOME;
  if (override && override.trim().length > 0) {
    return override.trim();
  }
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA;
    if (appData) {
      return join(appData, 'greencode');
    }
    return join(homedir(), 'AppData', 'Roaming', 'greencode');
  }
  return join(homedir(), '.greencode');
}
