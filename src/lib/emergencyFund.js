const reservaEmergenciaVazia = {
  saldo: 0,
  meta: null,
  movimentacoes: [],
};

export function normalizarReservaEmergencia(valor) {
  if (!valor || typeof valor !== "object") {
    return { ...reservaEmergenciaVazia };
  }

  const meta = Number(valor.meta);

  return {
    saldo: Number.isFinite(Number(valor.saldo)) ? Number(valor.saldo) : 0,
    meta: valor.meta !== null && valor.meta !== "" && Number.isFinite(meta) && meta > 0
      ? meta
      : null,
    movimentacoes: Array.isArray(valor.movimentacoes)
      ? valor.movimentacoes
      : [],
  };
}

export function registrarMovimentacaoReserva(reservaAtual, movimentacao) {
  const reserva = normalizarReservaEmergencia(reservaAtual);
  const valor = Number(movimentacao.valor);

  if (movimentacao.tipo !== "aporte" && movimentacao.tipo !== "retirada") {
    throw new Error("Tipo de movimentação inválido.");
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error("Informe um valor válido.");
  }

  if (movimentacao.tipo === "retirada" && valor > reserva.saldo) {
    throw new Error("O valor da retirada não pode superar o saldo da reserva.");
  }

  const novoRegistro = {
    id: globalThis.crypto?.randomUUID?.() || `reserva-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    tipo: movimentacao.tipo,
    valor,
    data: movimentacao.data,
    observacao: movimentacao.observacao?.trim() || "",
  };

  return {
    ...reserva,
    saldo: reserva.saldo + (movimentacao.tipo === "aporte" ? valor : -valor),
    movimentacoes: [novoRegistro, ...reserva.movimentacoes],
  };
}

export function calcularProgressoReserva(reserva) {
  const dados = normalizarReservaEmergencia(reserva);

  if (!dados.meta) return 0;

  return (dados.saldo / dados.meta) * 100;
}

export { reservaEmergenciaVazia };
