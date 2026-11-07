function lerDataISO(data) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data || "");

  if (!partes) return null;

  const ano = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const valida = new Date(ano, mes - 1, dia);

  if (
    valida.getFullYear() !== ano ||
    valida.getMonth() !== mes - 1 ||
    valida.getDate() !== dia
  ) {
    return null;
  }

  return { ano, mes, dia };
}

function formatarDataMensal(ano, mes, dia) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaValido = Math.min(dia, ultimoDia);

  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaValido).padStart(2, "0")}`;
}

function formatarCompetencia(data) {
  return data.slice(0, 7);
}

function chaveOcorrencia(recorrenciaId, data) {
  return `${recorrenciaId}:${formatarCompetencia(data)}`;
}

export function criarRecorrenciaId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `serie-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function aplicarMetadadosRecorrencia({
  lancamento,
  formulario,
  lancamentoAtual,
}) {
  if (
    lancamento.tipo !== "receita" &&
    lancamento.tipo !== "despesa" &&
    lancamento.tipo !== "conta-pagar"
  ) {
    return lancamento;
  }

  if (formulario.recorrente !== true) {
    return { ...lancamento, recorrente: false };
  }

  if (lancamentoAtual?.recorrenciaId) {
    return {
      ...lancamento,
      recorrente: true,
      recorrenciaId: lancamentoAtual.recorrenciaId,
      recorrenciaFrequencia: lancamentoAtual.recorrenciaFrequencia,
      recorrenciaDataInicio: lancamentoAtual.recorrenciaDataInicio,
      recorrenciaDia: lancamentoAtual.recorrenciaDia,
      recorrenciaOrigem: lancamentoAtual.recorrenciaOrigem,
    };
  }

  if (lancamentoAtual?.recorrenciaOrigem === false) {
    return { ...lancamento, recorrente: false };
  }

  return {
    ...lancamento,
    recorrente: true,
    recorrenciaId: criarRecorrenciaId(),
    recorrenciaFrequencia: "mensal",
    recorrenciaDataInicio: formulario.data,
    recorrenciaDia: Number(formulario.data.slice(-2)),
    recorrenciaOrigem: true,
  };
}

export function gerarOcorrenciasMensais(lancamentos, hoje = new Date()) {
  const resultado = [...lancamentos];
  const ocorrenciasExistentes = new Set(
    resultado
      .filter((item) => item.recorrenciaId && item.data)
      .map((item) => chaveOcorrencia(item.recorrenciaId, item.data))
  );
  const idsNumericos = resultado
    .map((item) => Number(item.id))
    .filter(Number.isFinite);
  let proximoId = Math.max(Date.now() + 1, ...idsNumericos.map((id) => id + 1));
  const competenciaAtual = hoje.getFullYear() * 12 + hoje.getMonth();

  const origens = resultado.filter(
    (item) =>
      item.recorrente === true &&
      item.despesaFixa !== true &&
      item.recorrenciaFrequencia === "mensal" &&
      item.recorrenciaOrigem === true &&
      item.recorrenciaId
  );

  for (const origem of origens) {
    const dataInicio = lerDataISO(origem.recorrenciaDataInicio || origem.data);

    if (!dataInicio) continue;

    const competenciaInicio = dataInicio.ano * 12 + dataInicio.mes - 1;
    const diaOriginal = Number(origem.recorrenciaDia) || dataInicio.dia;

    for (
      let competencia = competenciaInicio;
      competencia <= competenciaAtual;
      competencia += 1
    ) {
      const ano = Math.floor(competencia / 12);
      const mes = (competencia % 12) + 1;
      const data = formatarDataMensal(ano, mes, diaOriginal);
      const chave = chaveOcorrencia(origem.recorrenciaId, data);

      if (ocorrenciasExistentes.has(chave)) continue;

      resultado.push({
        ...origem,
        id: proximoId,
        data,
        status: "pendente",
        recorrenciaOrigem: false,
      });
      proximoId += 1;
      ocorrenciasExistentes.add(chave);
    }
  }

  return resultado;
}