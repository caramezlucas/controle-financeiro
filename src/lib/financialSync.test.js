import assert from "node:assert/strict";
import test from "node:test";
import { financialValuesEqual, mergeFinancialData } from "./financialSync.js";

function baseFinanceData() {
  return {
    receitas: [{ id: "r1", descricao: "Venda", valor: 500, status: "pago" }],
    despesas: [{ id: "d1", descricao: "Luz", valor: 100, status: "pendente" }],
    contasPagar: [{ id: "c1", descricao: "Aluguel", valor: 1000, status: "pendente" }],
    contasReceber: [{ id: "cr1", descricao: "Crédito antigo", valor: 20 }],
    orcamentos: [{ id: "b1", categoria: "Moradia", valor: 2000 }],
    reservaEmergencia: {
      saldo: 1000,
      meta: 5000,
      movimentacoes: [{ id: "m0", tipo: "aporte", valor: 1000 }],
    },
  };
}

test("conserva alterações remotas e locais simultâneas por coleção", () => {
  const base = baseFinanceData();
  const local = {
    ...base,
    receitas: [...base.receitas, { id: "r-local", descricao: "Loja", valor: 75, status: "pago" }],
  };
  const remoto = {
    ...base,
    despesas: [...base.despesas, { id: "d-remoto", descricao: "Internet", valor: 80, status: "pago" }],
  };
  const combinado = mergeFinancialData(base, local, remoto);

  assert.ok(combinado.receitas.some((item) => item.id === "r-local"));
  assert.ok(combinado.despesas.some((item) => item.id === "d-remoto"));
  assert.equal(combinado.contasReceber[0].id, "cr1");
  assert.equal(combinado.orcamentos[0].id, "b1");
});

test("cache local sem mudanças não sobrescreve snapshot Firestore mais novo", () => {
  const base = baseFinanceData();
  const remoto = {
    ...base,
    receitas: [...base.receitas, { id: "r-remote", descricao: "Online", valor: 40 }],
  };
  const combinado = mergeFinancialData(base, base, remoto);

  assert.ok(combinado.receitas.some((item) => item.id === "r-remote"));
  assert.ok(financialValuesEqual(combinado, remoto));
});

test("dois ciclos de mudanças em aparelhos distintos preservam ambos os lançamentos", () => {
  const inicial = baseFinanceData();
  const aparelhoA = {
    ...inicial,
    receitas: [...inicial.receitas, { id: "device-a", descricao: "Aparelho A", valor: 10 }],
  };
  const snapshotA = mergeFinancialData(inicial, aparelhoA, inicial);
  const aparelhoBComCacheAntigo = {
    ...inicial,
    despesas: [...inicial.despesas, { id: "device-b", descricao: "Aparelho B", valor: 20 }],
  };
  const snapshotB = mergeFinancialData(inicial, aparelhoBComCacheAntigo, snapshotA);
  const aparelhoARecebeSnapshot = mergeFinancialData(snapshotA, snapshotA, snapshotB);

  assert.ok(aparelhoARecebeSnapshot.receitas.some((item) => item.id === "device-a"));
  assert.ok(aparelhoARecebeSnapshot.despesas.some((item) => item.id === "device-b"));
  assert.ok(financialValuesEqual(aparelhoARecebeSnapshot, snapshotB));
});

test("mescla campos locais e remotos distintos no mesmo lançamento", () => {
  const base = baseFinanceData();
  const local = {
    ...base,
    despesas: [{ ...base.despesas[0], observacoes: "Nota local" }],
  };
  const remoto = {
    ...base,
    despesas: [{ ...base.despesas[0], status: "pago" }],
  };
  const combinado = mergeFinancialData(base, local, remoto);

  assert.equal(combinado.despesas[0].status, "pago");
  assert.equal(combinado.despesas[0].observacoes, "Nota local");
});

test("merge simultâneo da reserva acumula saldo e histórico sem perder meta", () => {
  const base = baseFinanceData();
  const local = {
    ...base,
    reservaEmergencia: {
      saldo: 1250,
      meta: 6000,
      movimentacoes: [
        { id: "m-local", tipo: "aporte", valor: 250 },
        ...base.reservaEmergencia.movimentacoes,
      ],
    },
  };
  const remoto = {
    ...base,
    reservaEmergencia: {
      saldo: 900,
      meta: 5000,
      movimentacoes: [
        { id: "m-remote", tipo: "retirada", valor: 100 },
        ...base.reservaEmergencia.movimentacoes,
      ],
    },
  };
  const combinado = mergeFinancialData(base, local, remoto);

  assert.equal(combinado.reservaEmergencia.saldo, 1150);
  assert.equal(combinado.reservaEmergencia.meta, 6000);
  assert.deepEqual(
    combinado.reservaEmergencia.movimentacoes.map((item) => item.id),
    ["m-remote", "m0", "m-local"]
  );
});

test("exclusão local é aplicada sem eliminar novos registros remotos", () => {
  const base = baseFinanceData();
  const local = { ...base, despesas: [] };
  const remoto = {
    ...base,
    despesas: [
      base.despesas[0],
      { id: "d-new", descricao: "Novo remoto", valor: 20 },
    ],
  };
  const combinado = mergeFinancialData(base, local, remoto);

  assert.deepEqual(combinado.despesas.map((item) => item.id), ["d-new"]);
});
