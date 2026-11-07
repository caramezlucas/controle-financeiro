const listFields = [
  "receitas",
  "despesas",
  "contasPagar",
  "contasReceber",
  "orcamentos",
];

export function criarIdFinanceiro() {
  return globalThis.crypto?.randomUUID?.() ||
    `financeiro-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clone(item)]));
  }
  return value;
}

export function financialValuesEqual(first, second) {
  if (Object.is(first, second)) return true;
  if (Array.isArray(first) || Array.isArray(second)) {
    return Array.isArray(first) && Array.isArray(second) &&
      first.length === second.length && first.every((item, index) => financialValuesEqual(item, second[index]));
  }
  if (isObject(first) || isObject(second)) {
    if (!isObject(first) || !isObject(second)) return false;
    const firstKeys = Object.keys(first);
    const secondKeys = Object.keys(second);
    return firstKeys.length === secondKeys.length &&
      firstKeys.every((key) => Object.hasOwn(second, key) && financialValuesEqual(first[key], second[key]));
  }
  return false;
}

function mergeObject(base = {}, local = {}, remote = {}) {
  const result = clone(remote);
  const keys = new Set([
    ...Object.keys(base || {}),
    ...Object.keys(local || {}),
    ...Object.keys(remote || {}),
  ]);

  for (const key of keys) {
    const hasBase = Object.hasOwn(base || {}, key);
    const hasLocal = Object.hasOwn(local || {}, key);
    const hasRemote = Object.hasOwn(remote || {}, key);
    const baseValue = base?.[key];
    const localValue = local?.[key];
    const remoteValue = remote?.[key];

    if (hasLocal === hasBase && financialValuesEqual(localValue, baseValue)) continue;
    if (!hasLocal) {
      delete result[key];
      continue;
    }
    if (!hasRemote || (hasBase && financialValuesEqual(remoteValue, baseValue))) {
      result[key] = clone(localValue);
      continue;
    }
    if (isObject(localValue) && isObject(remoteValue) && isObject(baseValue)) {
      result[key] = mergeObject(baseValue, localValue, remoteValue);
      continue;
    }

    result[key] = clone(localValue);
  }

  return result;
}

function idKey(item, index) {
  return item?.id === undefined || item?.id === null
    ? `__missing_id_${index}`
    : String(item.id);
}

function indexById(items = []) {
  return new Map(items.map((item, index) => [idKey(item, index), item]));
}

function mergeList(base = [], local = [], remote = []) {
  const baseById = indexById(base);
  const localById = indexById(local);
  const remoteById = indexById(remote);
  const keys = new Set([
    ...remoteById.keys(),
    ...localById.keys(),
    ...baseById.keys(),
  ]);
  const merged = [];

  for (const key of keys) {
    const inBase = baseById.has(key);
    const inLocal = localById.has(key);
    const inRemote = remoteById.has(key);
    const baseItem = baseById.get(key);
    const localItem = localById.get(key);
    const remoteItem = remoteById.get(key);

    if (!inBase) {
      if (inLocal && inRemote) {
        merged.push(mergeObject({}, localItem, remoteItem));
      } else if (inLocal) {
        merged.push(clone(localItem));
      } else if (inRemote) {
        merged.push(clone(remoteItem));
      }
      continue;
    }

    if (!inLocal) continue;
    if (!inRemote) {
      if (!financialValuesEqual(localItem, baseItem)) merged.push(clone(localItem));
      continue;
    }

    merged.push(mergeObject(baseItem, localItem, remoteItem));
  }

  return merged;
}

function mergeEmergencyFund(base = {}, local = {}, remote = {}) {
  const merged = mergeObject(base, local, remote);
  const saldoBaseCentavos = Math.round(Number(base.saldo || 0) * 100);
  const saldoLocalCentavos = Math.round(Number(local.saldo || 0) * 100);
  const saldoRemotoCentavos = Math.round(Number(remote.saldo || 0) * 100);
  const deltaLocal = saldoLocalCentavos - saldoBaseCentavos;

  merged.saldo = (saldoRemotoCentavos + deltaLocal) / 100;
  merged.movimentacoes = mergeList(
    base.movimentacoes || [],
    local.movimentacoes || [],
    remote.movimentacoes || []
  );

  return merged;
}

export function mergeFinancialData(base = {}, local = {}, remote = {}) {
  const merged = clone(remote);
  const fields = new Set([
    ...Object.keys(base),
    ...Object.keys(local),
    ...Object.keys(remote),
  ]);

  for (const field of fields) {
    if (listFields.includes(field)) {
      merged[field] = mergeList(base[field] || [], local[field] || [], remote[field] || []);
    } else if (field === "reservaEmergencia") {
      merged[field] = mergeEmergencyFund(
        base[field] || {},
        local[field] || {},
        remote[field] || {}
      );
    } else {
      const value = mergeObject(
        { value: base[field] },
        { value: local[field] },
        { value: remote[field] }
      );
      if (Object.hasOwn(value, "value")) merged[field] = value.value;
      else delete merged[field];
    }
  }

  return merged;
}
