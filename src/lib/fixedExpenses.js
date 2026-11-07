function quebrarData(data) {
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

function formatarData(ano, mes, dia) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const diaValido = Math.min(dia, ultimoDia);
  return `${ano}-${String(mes).padStart(2, "0")}-${String(diaValido).padStart(2, "0")}`;
}

function competenciaDe(data) {
  return data.slice(0, 7);
}

function avancarMes(data, quantidade = 1) {
  const partes = quebrarData(data);
  if (!partes) return "";
  const competencia = partes.ano * 12 + partes.mes - 1 + quantidade;
  return formatarData(Math.floor(competencia / 12), (competencia % 12) + 1, partes.dia);
}

function paraCentavos(valor) {
  return Math.round(Number(valor || 0) * 100);
}

function gerarIdSerie() {
  return globalThis.crypto?.randomUUID?.() || `fixa-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function criarDespesaFixa({ lancamento, forma, quantidadeParcelas = null }) {
  const data = quebrarData(lancamento.data);
  const totalCentavos = Math.round(Number(lancamento.valor) * 100);

  if (!data || !Number.isSafeInteger(totalCentavos) || totalCentavos <= 0) {
    throw new Error("Informe uma data e um valor válidos para a despesa fixa.");
  }

  if (forma !== "continua" && forma !== "parcelada") {
    throw new Error("Selecione a forma da despesa fixa.");
  }

  let parcelas = null;
  let valorParcelaCentavos = totalCentavos;

  if (forma === "parcelada") {
    parcelas = Number(quantidadeParcelas);
    if (!Number.isSafeInteger(parcelas) || parcelas < 1 || parcelas > totalCentavos) {
      throw new Error("Informe uma quantidade de parcelas válida.");
    }
    valorParcelaCentavos = Math.floor(totalCentavos / parcelas);
  }

  const serieId = gerarIdSerie();
  const primeiroValorCentavos = forma === "parcelada"
    ? parcelas === 1
      ? totalCentavos
      : valorParcelaCentavos
    : totalCentavos;

  return {
    ...lancamento,
    valor: primeiroValorCentavos / 100,
    recorrente: false,
    despesaFixa: true,
    tipoDespesaFixa: forma,
    serieId,
    serieOrigem: true,
    serieAtiva: true,
    descricaoBase: lancamento.descricao,
    competencia: competenciaDe(lancamento.data),
    competenciaOrigem: competenciaDe(lancamento.data),
    dataInicio: lancamento.data,
    diaVencimento: data.dia,
    quantidadeParcelas: parcelas,
    parcelaAtual: forma === "parcelada" ? 1 : null,
    parcelaInicial: forma === "parcelada" ? 1 : null,
    valorTotal: forma === "parcelada" ? totalCentavos / 100 : null,
    valorTotalRestante: forma === "parcelada" ? totalCentavos / 100 : null,
    valorParcela: valorParcelaCentavos / 100,
  };
}

export function gerarDespesasFixas(despesas, hoje = new Date()) {
  const resultado = [...despesas];
  const existentes = new Set(
    resultado
      .filter((item) => item.serieId && item.data)
      .map((item) => `${item.serieId}:${item.competencia || competenciaDe(item.data)}`)
  );
  resultado
    .filter((item) => item.serieId && item.serieOrigem && item.competenciaOrigem)
    .forEach((item) => existentes.add(`${item.serieId}:${item.competenciaOrigem}`));
  const atuais = hoje.getFullYear() * 12 + hoje.getMonth();

  for (const origem of despesas.filter(
    (item) => item.despesaFixa === true && item.serieOrigem === true && item.serieAtiva !== false
  )) {
    const inicio = quebrarData(origem.dataInicio || origem.data);
    if (!inicio || !origem.serieId) continue;

    const competenciaInicio = inicio.ano * 12 + inicio.mes - 1;
    const limiteParcelas = origem.tipoDespesaFixa === "parcelada"
      ? Number(origem.quantidadeParcelas)
      : Infinity;
    const parcelaInicial = origem.tipoDespesaFixa === "parcelada"
      ? Math.max(1, Number(origem.parcelaInicial) || 1)
      : 1;
    const dia = Number(origem.diaVencimento) || inicio.dia;
    const totalCentavos = paraCentavos(origem.valorTotalRestante ?? origem.valorTotal);
    const parcelasRestantes = origem.tipoDespesaFixa === "parcelada"
      ? Math.max(1, limiteParcelas - parcelaInicial + 1)
      : 1;
    const baseCentavos = Math.floor(totalCentavos / parcelasRestantes);

    for (
      let competenciaNumero = competenciaInicio, parcela = parcelaInicial;
      competenciaNumero <= atuais && parcela <= limiteParcelas;
      competenciaNumero += 1, parcela += 1
    ) {
      const ano = Math.floor(competenciaNumero / 12);
      const mes = (competenciaNumero % 12) + 1;
      const data = formatarData(ano, mes, dia);
      const competencia = competenciaDe(data);
      const chave = `${origem.serieId}:${competencia}`;
      if (existentes.has(chave)) continue;

      const centavos = origem.tipoDespesaFixa === "parcelada"
        ? parcela === limiteParcelas
          ? totalCentavos - baseCentavos * (parcelasRestantes - 1)
          : baseCentavos
        : Math.round(Number(origem.valorParcela ?? origem.valor) * 100);
      const descricao = origem.tipoDespesaFixa === "parcelada"
        ? `${origem.descricaoBase || origem.descricao} - ${parcela}/${limiteParcelas}`
        : origem.descricaoBase || origem.descricao;

      resultado.push({
        ...origem,
        id: `${origem.serieId}:${competencia}`,
        descricao,
        valor: centavos / 100,
        data,
        competencia,
        status: "pendente",
        serieOrigem: false,
        parcelaAtual: origem.tipoDespesaFixa === "parcelada" ? parcela : null,
      });
      existentes.add(chave);
    }
  }

  return resultado;
}

export function cancelarSerieDespesa(despesas, serieId) {
  return despesas.map((item) =>
    item.serieId === serieId && item.serieOrigem
      ? { ...item, serieAtiva: false }
      : item
  );
}

export function editarDespesaFixa(despesas, itemId, formulario, escopo, hoje = new Date()) {
  const selecionada = despesas.find((item) => item.id === itemId);
  if (!selecionada?.despesaFixa || !selecionada.serieId) {
    throw new Error("Não foi possível localizar a despesa fixa.");
  }

  const campos = {
    descricao: formulario.descricao.trim(),
    categoria: formulario.categoria.trim(),
    data: formulario.data,
    competencia: competenciaDe(formulario.data),
    observacoes: formulario.observacoes || "",
    status: formulario.status,
  };

  if (escopo === "somente-este") {
    const valor = Number(formulario.valor);
    if (!Number.isFinite(valor) || valor <= 0) {
      throw new Error("Informe um valor válido.");
    }

    return despesas.map((item) =>
      item.id === itemId ? { ...item, ...campos, valor } : item
    );
  }

  const origem = despesas.find(
    (item) => item.serieId === selecionada.serieId && item.serieOrigem === true
  );
  if (!origem) throw new Error("Não foi possível localizar a origem da série.");

  const parcelada = origem.tipoDespesaFixa === "parcelada";
  const parcelaSelecionada = Number(selecionada.parcelaAtual) || 1;
  const inicioParcela = parcelada
    ? parcelaSelecionada + (selecionada.status === "pago" ? 1 : 0)
    : 1;
  if (parcelada && inicioParcela > Number(origem.quantidadeParcelas)) {
    throw new Error("Não há parcelas futuras para atualizar.");
  }

  const dataInicio = selecionada.status === "pago"
    ? avancarMes(selecionada.data)
    : formulario.data;
  if (!dataInicio) throw new Error("Informe uma data válida para a série.");

  let novaOrigem;
  if (parcelada) {
    const quantidadeRestante = Number(formulario.quantidadeParcelas);
    const valorRestanteCentavos = paraCentavos(formulario.valor);
    if (
      !Number.isSafeInteger(quantidadeRestante) ||
      quantidadeRestante < 1 ||
      quantidadeRestante > 1000 ||
      valorRestanteCentavos < quantidadeRestante
    ) {
      throw new Error("Informe um total e uma quantidade válida para as parcelas restantes.");
    }

    const totalAnterior = despesas
      .filter(
        (item) =>
          item.serieId === selecionada.serieId &&
          Number(item.parcelaAtual) < inicioParcela
      )
      .reduce((total, item) => total + paraCentavos(item.valor), 0);
    const novaQuantidade = inicioParcela + quantidadeRestante - 1;

    novaOrigem = {
      ...origem,
      descricaoBase: campos.descricao,
      categoria: campos.categoria,
      observacoes: campos.observacoes,
      dataInicio,
      diaVencimento: Number(dataInicio.slice(-2)),
      parcelaInicial: inicioParcela,
      quantidadeParcelas: novaQuantidade,
      valorTotal: (totalAnterior + valorRestanteCentavos) / 100,
      valorTotalRestante: valorRestanteCentavos / 100,
      valorParcela: Math.floor(valorRestanteCentavos / quantidadeRestante) / 100,
      serieAtiva: true,
    };
  } else {
    const valorParcela = Number(formulario.valor);
    if (!Number.isFinite(valorParcela) || valorParcela <= 0) {
      throw new Error("Informe um valor válido para a despesa fixa.");
    }

    novaOrigem = {
      ...origem,
      descricaoBase: campos.descricao,
      categoria: campos.categoria,
      observacoes: campos.observacoes,
      dataInicio,
      diaVencimento: Number(dataInicio.slice(-2)),
      valorParcela,
      serieAtiva: true,
    };
  }

  const novaLista = despesas
    .filter((item) => {
      if (item.serieId !== selecionada.serieId || item.serieOrigem) return true;
      if (item.status === "pago") return true;
      return parcelada
        ? Number(item.parcelaAtual) < inicioParcela
        : item.data < dataInicio;
    })
    .map((item) => {
      if (item.id !== origem.id) return item;

      const atualizaLancamentoOrigem =
        selecionada.id === origem.id && selecionada.status !== "pago" &&
        (!parcelada || inicioParcela === 1);
      if (!atualizaLancamentoOrigem) return novaOrigem;

      return {
        ...novaOrigem,
        ...campos,
        data: dataInicio,
        competencia: competenciaDe(dataInicio),
        valor: parcelada
          ? novaOrigem.valorParcela
          : novaOrigem.valorParcela,
        parcelaAtual: parcelada ? inicioParcela : null,
      };
    });

  if (!novaLista.some((item) => item.id === origem.id)) {
    novaLista.push(novaOrigem);
  }

  return gerarDespesasFixas(novaLista, hoje);
}
