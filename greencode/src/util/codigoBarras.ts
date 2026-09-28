import { TipoEquipamento } from '../dominio/TipoEquipamento.js';

/**
 * Gera um código de barras interno no formato `GCE-<TIPO>-<SEQUENCIA>`,
 * com a sequência preenchida à esquerda até 6 dígitos.
 * Ex.: gerarCodigoBarras(TipoEquipamento.NOTEBOOK, 42) -> "GCE-NOTEBOOK-000042"
 */
export function gerarCodigoBarras(tipo: TipoEquipamento, sequencia: number): string {
  return `GCE-${tipo}-${String(sequencia).padStart(6, '0')}`;
}
