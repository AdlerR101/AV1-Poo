export enum StatusRastreamento {
  AGUARDANDO_TRIAGEM = 'AGUARDANDO_TRIAGEM',
  EM_TRIAGEM = 'EM_TRIAGEM',
  AGUARDANDO_DESMONTE = 'AGUARDANDO_DESMONTE',
  EM_DESMONTE = 'EM_DESMONTE',
  PECAS_REAPROVEITADAS = 'PECAS_REAPROVEITADAS',
  MATERIAL_RECICLAVEL = 'MATERIAL_RECICLAVEL',
  DESCARTE_SEGURO = 'DESCARTE_SEGURO',
  BAIXA_DEFINITIVA = 'BAIXA_DEFINITIVA',
}

/**
 * Fluxo de estados permitido para o rastreamento de um equipamento.
 * Garante que o equipamento só chegue ao desmonte depois de passar pela
 * triagem (EM_TRIAGEM).
 */
const TRANSICOES: Record<StatusRastreamento, StatusRastreamento[]> = {
  [StatusRastreamento.AGUARDANDO_TRIAGEM]: [StatusRastreamento.EM_TRIAGEM],
  [StatusRastreamento.EM_TRIAGEM]: [StatusRastreamento.AGUARDANDO_DESMONTE],
  [StatusRastreamento.AGUARDANDO_DESMONTE]: [StatusRastreamento.EM_DESMONTE],
  [StatusRastreamento.EM_DESMONTE]: [
    StatusRastreamento.PECAS_REAPROVEITADAS,
    StatusRastreamento.MATERIAL_RECICLAVEL,
    StatusRastreamento.DESCARTE_SEGURO,
  ],
  [StatusRastreamento.PECAS_REAPROVEITADAS]: [StatusRastreamento.BAIXA_DEFINITIVA],
  [StatusRastreamento.MATERIAL_RECICLAVEL]: [StatusRastreamento.BAIXA_DEFINITIVA],
  [StatusRastreamento.DESCARTE_SEGURO]: [StatusRastreamento.BAIXA_DEFINITIVA],
  [StatusRastreamento.BAIXA_DEFINITIVA]: [],
};

const STATUS_DESMONTE = new Set<StatusRastreamento>([
  StatusRastreamento.AGUARDANDO_DESMONTE,
  StatusRastreamento.EM_DESMONTE,
]);

export function transicaoPermitida(de: StatusRastreamento, para: StatusRastreamento): boolean {
  return TRANSICOES[de].includes(para);
}

export function ehStatusDesmonte(status: StatusRastreamento): boolean {
  return STATUS_DESMONTE.has(status);
}
