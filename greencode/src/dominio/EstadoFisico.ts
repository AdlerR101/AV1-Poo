export enum EstadoFisico {
  NOVO = 'NOVO',
  BOM_ESTADO = 'BOM_ESTADO',
  USADO_LEVE = 'USADO_LEVE',
  USADO_MODERADO = 'USADO_MODERADO',
  DANIFICADO_LEVE = 'DANIFICADO_LEVE',
  DANIFICADO_GRAVE = 'DANIFICADO_GRAVE',
  INSERVIVEL = 'INSERVIVEL',
}

/**
 * Ordem crescente de deterioração: quanto maior o índice, pior o estado.
 * Usada para aplicar a regra de negócio que exige justificativa quando o
 * estado físico cai "duas categorias abaixo" do anterior.
 */
const ORDEM: Record<EstadoFisico, number> = {
  [EstadoFisico.NOVO]: 0,
  [EstadoFisico.BOM_ESTADO]: 1,
  [EstadoFisico.USADO_LEVE]: 2,
  [EstadoFisico.USADO_MODERADO]: 3,
  [EstadoFisico.DANIFICADO_LEVE]: 4,
  [EstadoFisico.DANIFICADO_GRAVE]: 5,
  [EstadoFisico.INSERVIVEL]: 6,
};

export function ordemEstadoFisico(estado: EstadoFisico): number {
  return ORDEM[estado];
}

/**
 * Verifica se a transição `de -> para` rebaixa o equipamento em pelo menos
 * duas categorias (ou seja, piora o estado físico em dois níveis ou mais).
 */
export function rebaixouDuasCategorias(de: EstadoFisico, para: EstadoFisico): boolean {
  return ordemEstadoFisico(para) - ordemEstadoFisico(de) >= 2;
}
