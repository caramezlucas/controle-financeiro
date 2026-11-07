import assert from "node:assert/strict";
import test from "node:test";
import {
  cancelarSerieDespesa,
  criarDespesaFixa,
  editarDespesaFixa,
  gerarDespesasFixas,
} from "./fixedExpenses.js";

function criarParcelada({ total = "1000", quantidade = 3, data = "2026-10-10" } = {}) {
  return criarDespesaFixa({
    lancamento: {
      id: 1,
      tipo: "despesa",
      descricao: "Seguro",
      categoria: "Proteção",
      valor: total,
      data,
      status: "pago",
      observacoes: "Apólice anual",
    },
    forma: "parcelada",
    quantidadeParcelas: quantidade,
  });
}

test("despesa contínua gera competência ausente até o mês atual, sem futuro", () => {
  const origem = criarDespesaFixa({
    lancamento: {
      id: 10,
      tipo: "despesa",
      descricao: "Aluguel",
      categoria: "Moradia",
      valor: "2000",
      data: "2026-10-31",
      status: "pago",
    },
    forma: "continua",
  });
  const geradas = gerarDespesasFixas([origem], new Date(2026, 11, 12));

  assert.deepEqual(geradas.map((item) => item.data), [
    "2026-10-31",
    "2026-11-30",
    "2026-12-31",
  ]);
  assert.ok(geradas.slice(1).every((item) => item.status === "pendente"));
  assert.equal(gerarDespesasFixas(geradas, new Date(2026, 11, 12)).length, 3);
});

test("parcelamento ajusta o último centavo e encerra na quantidade definida", () => {
  const origem = criarParcelada();
  const geradas = gerarDespesasFixas([origem], new Date(2027, 1, 15));
  const valores = geradas.map((item) => item.valor);

  assert.deepEqual(valores, [333.33, 333.33, 333.34]);
  assert.equal(valores.reduce((soma, valor) => soma + Math.round(valor * 100), 0), 100000);
  assert.deepEqual(geradas.map((item) => item.parcelaAtual), [1, 2, 3]);
  assert.equal(gerarDespesasFixas(geradas, new Date(2028, 0, 1)).length, 3);
});

test("competência e ID determinísticos evitam duplicar ao repetir a geração", () => {
  const origem = criarParcelada({ data: "2026-11-10" });
  const primeira = gerarDespesasFixas([origem], new Date(2027, 0, 1));
  const segunda = gerarDespesasFixas(primeira, new Date(2027, 0, 1));

  assert.equal(segunda.length, primeira.length);
  assert.equal(new Set(segunda.map((item) => item.id)).size, segunda.length);
  assert.equal(new Set(segunda.map((item) => `${item.serieId}:${item.competencia}`)).size, segunda.length);
});

test("editar somente esta ocorrência não altera as outras parcelas", () => {
  const origem = criarParcelada();
  const itens = gerarDespesasFixas([origem], new Date(2026, 11, 1));
  const segunda = itens.find((item) => item.parcelaAtual === 2);
  const editadas = editarDespesaFixa(itens, segunda.id, {
    descricao: "Seguro ajustado",
    categoria: "Proteção",
    valor: "400",
    data: segunda.data,
    status: segunda.status,
    observacoes: "Somente esta",
  }, "somente-este", new Date(2026, 11, 1));

  assert.equal(editadas.find((item) => item.id === segunda.id).valor, 400);
  assert.equal(editadas.find((item) => item.id === origem.id).valor, 333.33);
  assert.equal(editadas.find((item) => item.parcelaAtual === 3).valor, 333.34);
});

test("editar a data da ocorrência original não regenera a competência de origem", () => {
  const origem = criarDespesaFixa({
    lancamento: {
      id: 9,
      tipo: "despesa",
      descricao: "Aluguel",
      categoria: "Moradia",
      valor: "1500",
      data: "2026-10-10",
      status: "pago",
    },
    forma: "continua",
  });
  const editada = editarDespesaFixa([origem], origem.id, {
    descricao: "Aluguel ajustado",
    categoria: "Moradia",
    valor: "1500",
    data: "2026-12-10",
    status: "pago",
    observacoes: "",
  }, "somente-este", new Date(2027, 0, 15));
  const geradas = gerarDespesasFixas(editada, new Date(2027, 0, 15));

  assert.equal(geradas.filter((item) => item.serieId === origem.serieId && item.competencia === "2026-10").length, 0);
  assert.equal(new Set(geradas.filter((item) => item.serieId === origem.serieId).map((item) => item.competencia)).size,
    geradas.filter((item) => item.serieId === origem.serieId).length);
});

test("editar este e os próximos preserva o pago e recalcula as parcelas restantes", () => {
  const origem = criarParcelada();
  const itens = gerarDespesasFixas([origem], new Date(2026, 11, 1));
  const segunda = itens.find((item) => item.parcelaAtual === 2);
  const editadas = editarDespesaFixa(itens, segunda.id, {
    descricao: "Seguro atualizado",
    categoria: "Proteção",
    valor: "500",
    data: segunda.data,
    status: "pendente",
    observacoes: "Parcelas restantes",
    quantidadeParcelas: "2",
  }, "este-e-os-proximos", new Date(2026, 11, 1));

  assert.equal(editadas.find((item) => item.parcelaAtual === 1).status, "pago");
  assert.deepEqual(editadas.filter((item) => item.serieId === origem.serieId).map((item) => item.valor), [333.33, 250, 250]);
  assert.ok(editadas.filter((item) => item.parcelaAtual > 1).every((item) => item.status === "pendente"));
});

test("cancelar série preserva ocorrências existentes e impede gerar meses seguintes", () => {
  const origem = criarDespesaFixa({
    lancamento: {
      id: 22,
      tipo: "despesa",
      descricao: "Aluguel",
      categoria: "Moradia",
      valor: "2000",
      data: "2026-10-10",
      status: "pago",
    },
    forma: "continua",
  });
  const itens = gerarDespesasFixas([origem], new Date(2026, 11, 1));
  const canceladas = cancelarSerieDespesa(itens, origem.serieId);

  assert.equal(canceladas.length, itens.length);
  assert.equal(canceladas.find((item) => item.serieOrigem).serieAtiva, false);
  assert.equal(gerarDespesasFixas(canceladas, new Date(2027, 5, 1)).length, itens.length);
});

test("quantidade de parcelas inválida é recusada", () => {
  assert.throws(() => criarParcelada({ total: "0.02", quantidade: 3 }), /quantidade de parcelas válida/);
});
