import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const meses = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "receitas", label: "Receitas" },
  { id: "despesas", label: "Despesas" },
  { id: "pagar", label: "Contas a pagar" },
  { id: "receber", label: "Contas a receber" },
  { id: "analise-categorias", label: "Análise por Categorias" },
  { id: "relatorios", label: "Relatórios" },
];

const temas = [
  { id: "executivo", label: "Executivo" },
  { id: "clean", label: "Clean" },
];

const lancamentoInicial = {
  descricao: "",
  categoria: "",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  status: "pago",
  observacoes: "",
};

const piColors = [
  "#2563eb",
  "#10b981",
  "#f97316",
  "#8b5cf6",
  "#22c55e",
  "#0ea5e9",
  "#f43f5e",
  "#a855f7",
];

function carregarDados(chave) {
  try {
    const dadosSalvos = localStorage.getItem(chave);

    if (dadosSalvos) {
      return JSON.parse(dadosSalvos);
    }

    return [];
  } catch (erro) {
    console.error("Erro ao carregar dados:", erro);
    return [];
  }
}

function carregarFiltrosSalvos(dataAtual) {
  const filtrosPadrao = {
    mesSelecionado: String(dataAtual.getMonth()),
    anoSelecionado: String(dataAtual.getFullYear()),
    periodoInicio: "",
    periodoFim: "",
    filtroCategoria: "",
    filtroTipo: "all",
    filtroStatus: "all",
    busca: "",
  };

  try {
    const bruto = localStorage.getItem("controle-financeiro-filtros");

    if (!bruto) {
      return filtrosPadrao;
    }

    const filtros = JSON.parse(bruto);

    return {
      mesSelecionado: String(filtros?.mesSelecionado ?? filtrosPadrao.mesSelecionado),
      anoSelecionado: String(filtros?.anoSelecionado ?? filtrosPadrao.anoSelecionado),
      periodoInicio: filtros?.periodoInicio || "",
      periodoFim: filtros?.periodoFim || "",
      filtroCategoria: filtros?.filtroCategoria || "",
      filtroTipo: filtros?.filtroTipo || "all",
      filtroStatus: filtros?.filtroStatus || "all",
      busca: filtros?.busca || "",
    };
  } catch (erro) {
    console.error("Erro ao carregar filtros salvos:", erro);
    return filtrosPadrao;
  }
}

function obterAnosDisponiveis(listas) {
  const anos = new Set();

  listas.forEach((lista) => {
    lista.forEach((item) => {
      if (item?.data) {
        anos.add(item.data.slice(0, 4));
      }
    });
  });

  return [...anos].sort((a, b) => Number(b) - Number(a));
}

function obterCategoriasDisponiveis(listas) {
  const categorias = new Set();

  listas.forEach((lista) => {
    lista.forEach((item) => {
      const categoria = item?.categoria?.trim();

      if (categoria) {
        categorias.add(categoria);
      }
    });
  });

  return [...categorias].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { sensitivity: "base" })
  );
}

function App() {
  const dataAtual = new Date();
  const filtrosIniciais = carregarFiltrosSalvos(dataAtual);

  const [pagina, setPagina] = useState("dashboard");
  const [mesSelecionado, setMesSelecionado] = useState(
    filtrosIniciais.mesSelecionado
  );
  const [anoSelecionado, setAnoSelecionado] = useState(
    filtrosIniciais.anoSelecionado
  );
  const [periodoInicio, setPeriodoInicio] = useState(filtrosIniciais.periodoInicio);
  const [periodoFim, setPeriodoFim] = useState(filtrosIniciais.periodoFim);
  const [filtroCategoria, setFiltroCategoria] = useState(filtrosIniciais.filtroCategoria);

  const [receitas, setReceitas] = useState(() =>
    carregarDados("controle-financeiro-receitas")
  );

  const [despesas, setDespesas] = useState(() =>
    carregarDados("controle-financeiro-despesas")
  );

  const [contasPagar, setContasPagar] = useState(() =>
    carregarDados("controle-financeiro-contas-pagar")
  );

  const [contasReceber, setContasReceber] = useState(() =>
    carregarDados("controle-financeiro-contas-receber")
  );

  const [formReceita, setFormReceita] = useState(lancamentoInicial);
  const [formDespesa, setFormDespesa] = useState(lancamentoInicial);
  const [formPagar, setFormPagar] = useState({
    ...lancamentoInicial,
    status: "pendente",
  });
  const [formReceber, setFormReceber] = useState({
    ...lancamentoInicial,
    status: "pendente",
  });

  const [filtroTipo, setFiltroTipo] = useState(filtrosIniciais.filtroTipo);
  const [filtroStatus, setFiltroStatus] = useState(filtrosIniciais.filtroStatus);
  const [orcamentos, setOrcamentos] = useState(() =>
    carregarDados("controle-financeiro-orcamentos")
  );
  const [formOrcamento, setFormOrcamento] = useState({
    categoria: "",
    valor: "",
    ano: String(dataAtual.getFullYear()),
    mes: String(dataAtual.getMonth()),
  });
  const [busca, setBusca] = useState(filtrosIniciais.busca);
  const [edicaoReceitaId, setEdicaoReceitaId] = useState(null);
  const [edicaoDespesaId, setEdicaoDespesaId] = useState(null);
  const [edicaoPagarId, setEdicaoPagarId] = useState(null);
  const [edicaoReceberId, setEdicaoReceberId] = useState(null);
  const [edicaoOrcamentoId, setEdicaoOrcamentoId] = useState(null);
  const [tema, setTema] = useState(() => {
    const temaSalvo = localStorage.getItem("controle-financeiro-tema");

    if (temaSalvo === "clean" || temaSalvo === "executivo") {
      return temaSalvo;
    }

    return "executivo";
  });

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-receitas",
      JSON.stringify(receitas)
    );
  }, [receitas]);

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-despesas",
      JSON.stringify(despesas)
    );
  }, [despesas]);

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-contas-pagar",
      JSON.stringify(contasPagar)
    );
  }, [contasPagar]);

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-contas-receber",
      JSON.stringify(contasReceber)
    );
  }, [contasReceber]);

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-orcamentos",
      JSON.stringify(orcamentos)
    );
  }, [orcamentos]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
    localStorage.setItem("controle-financeiro-tema", tema);
  }, [tema]);

  useEffect(() => {
    localStorage.setItem(
      "controle-financeiro-filtros",
      JSON.stringify({
        mesSelecionado,
        anoSelecionado,
        periodoInicio,
        periodoFim,
        filtroCategoria,
        filtroTipo,
        filtroStatus,
        busca,
      })
    );
  }, [
    mesSelecionado,
    anoSelecionado,
    periodoInicio,
    periodoFim,
    filtroCategoria,
    filtroTipo,
    filtroStatus,
    busca,
  ]);

  const anosDisponiveis = useMemo(() => {
    const anos = obterAnosDisponiveis([
      receitas,
      despesas,
      contasPagar,
      contasReceber,
    ]);

    const anoAtualString = String(dataAtual.getFullYear());

    if (!anos.includes(anoAtualString)) {
      return [anoAtualString, ...anos];
    }

    return anos;
  }, [receitas, despesas, contasPagar, contasReceber, dataAtual]);

  const categoriasDisponiveis = useMemo(
    () =>
      obterCategoriasDisponiveis([
        receitas,
        despesas,
        contasPagar,
        contasReceber,
      ]),
    [receitas, despesas, contasPagar, contasReceber]
  );

  function pertenceAoPeriodo(item, mes, ano) {
    if (!item?.data) {
      return false;
    }

    const partes = item.data.split("-");
    const anoDoItem = Number(partes[0]);
    const mesDoItem = Number(partes[1]) - 1;

    return anoDoItem === Number(ano) && mesDoItem === Number(mes);
  }

  function aplicarFiltroTipoStatus(item) {
    if (filtroTipo !== "all") {
      if (filtroTipo === "receitas" && item.tipo !== "receita") {
        return false;
      }

      if (filtroTipo === "despesas" && item.tipo !== "despesa") {
        return false;
      }
    }

    if (filtroStatus !== "all" && item.status !== filtroStatus) {
      return false;
    }

    return true;
  }

  function itemEstaNoFiltro(item) {
    if (!item?.data) {
      return false;
    }

    if (!aplicarFiltroTipoStatus(item)) {
      return false;
    }

    if (
      filtroCategoria &&
      item.categoria?.trim().toLowerCase() !==
        filtroCategoria.toLowerCase()
    ) {
      return false;
    }

    if (periodoInicio && item.data < periodoInicio) {
      return false;
    }

    if (periodoFim && item.data > periodoFim) {
      return false;
    }

    if (!periodoInicio && !periodoFim) {
      const partes = item.data.split("-");
      const anoDoItem = Number(partes[0]);
      const mesDoItem = Number(partes[1]) - 1;

      if (anoSelecionado !== "all" && Number(anoSelecionado) !== anoDoItem) {
        return false;
      }

      if (mesSelecionado !== "all" && Number(mesSelecionado) !== mesDoItem) {
        return false;
      }
    }

    return true;
  }

  function obterPeriodoAnterior() {
    if (periodoInicio && periodoFim) {
      const inicio = new Date(periodoInicio);
      const fim = new Date(periodoFim);
      const dias = Math.round((fim - inicio) / 86400000) + 1;
      const fimAnterior = new Date(inicio);
      fimAnterior.setDate(fimAnterior.getDate() - 1);
      const inicioAnterior = new Date(fimAnterior);
      inicioAnterior.setDate(inicioAnterior.getDate() - (dias - 1));

      return {
        inicio: inicioAnterior.toISOString().slice(0, 10),
        fim: fimAnterior.toISOString().slice(0, 10),
      };
    }

    if (mesSelecionado !== "all" && anoSelecionado !== "all") {
      const ano = Number(anoSelecionado);
      const mes = Number(mesSelecionado);
      const inicioAnterior = new Date(ano, mes - 1, 1);
      const fimAnterior = new Date(ano, mes, 0);

      return {
        inicio: inicioAnterior.toISOString().slice(0, 10),
        fim: fimAnterior.toISOString().slice(0, 10),
      };
    }

    if (mesSelecionado !== "all" && anoSelecionado === "all") {
      const mes = Number(mesSelecionado);
      const anoAtual = dataAtual.getFullYear();
      const inicioAnterior = new Date(anoAtual - 1, mes, 1);
      const fimAnterior = new Date(anoAtual - 1, mes + 1, 0);

      return {
        inicio: inicioAnterior.toISOString().slice(0, 10),
        fim: fimAnterior.toISOString().slice(0, 10),
      };
    }

    if (mesSelecionado === "all" && anoSelecionado !== "all") {
      const ano = Number(anoSelecionado) - 1;
      return {
        inicio: `${ano}-01-01`,
        fim: `${ano}-12-31`,
      };
    }

    return null;
  }

  const totais = useMemo(() => {
    function somar(lista) {
      return lista.reduce(
        (total, item) => total + Number(item.valor || 0),
        0
      );
    }

    // aplica os mesmos filtros de mês/ano/período/tipo/status/categoria usados no restante do app
    const receitasFiltradas = receitas.filter(itemEstaNoFiltro);
    const despesasFiltradas = despesas.filter(itemEstaNoFiltro);
    const contasPagarFiltradas = contasPagar.filter(itemEstaNoFiltro);
    const contasReceberFiltradas = contasReceber.filter(itemEstaNoFiltro);

    const receitasPagas = receitasFiltradas.filter(
      (item) => item.status === "pago"
    );

    const despesasPagas = despesasFiltradas.filter(
      (item) => item.status === "pago"
    );

    const contasPagarPendentes = contasPagarFiltradas.filter(
      (item) => item.status === "pendente"
    );

    const contasReceberPendentes = contasReceberFiltradas.filter(
      (item) => item.status === "pendente"
    );

    const totalReceitas = somar(receitasPagas);
    const totalDespesas = somar(despesasPagas);
    const totalEntradas = totalReceitas + somar(contasReceberPendentes);
    const totalSaidas = totalDespesas + somar(contasPagarPendentes);
    const saldoAtual = totalEntradas - totalSaidas;

    return {
      totalReceitas,
      totalDespesas,
      totalEntradas,
      totalSaidas,
      saldo: saldoAtual,
      totalPagar: somar(contasPagarPendentes),
      totalReceber: somar(contasReceberPendentes),
    };
  }, [
    receitas,
    despesas,
    contasPagar,
    contasReceber,
    anoSelecionado,
    mesSelecionado,
    periodoInicio,
    periodoFim,
    filtroCategoria,
    filtroStatus,
    filtroTipo,
  ]);

  const dadosGraficos = useMemo(() => {
    const filtrarLista = (lista) => lista.filter(itemEstaNoFiltro);

    const receitasFiltradas = filtrarLista(receitas);
    const despesasFiltradas = filtrarLista(despesas);
    const contasPagarFiltradas = filtrarLista(contasPagar);
    const contasReceberFiltradas = filtrarLista(contasReceber);

    const somar = (lista) =>
      lista.reduce((total, item) => total + Number(item.valor || 0), 0);

    const receitasPagas = receitasFiltradas.filter((item) => item.status === "pago");
    const despesasPagas = despesasFiltradas.filter((item) => item.status === "pago");
    const contasPagarPendentes = contasPagarFiltradas.filter(
      (item) => item.status === "pendente"
    );
    const contasReceberPendentes = contasReceberFiltradas.filter(
      (item) => item.status === "pendente"
    );

    const totalReceitas = somar(receitasPagas);
    const totalDespesas = somar(despesasPagas);
    const totalPagar = somar(contasPagarPendentes);
    const totalReceber = somar(contasReceberPendentes);
    const saldoAtual = totalReceitas - totalDespesas;

    const hoje = new Date().toISOString().slice(0, 10);
    const data7 = new Date();
    data7.setDate(data7.getDate() + 7);
    const hoje7 = data7.toISOString().slice(0, 10);
    const data30 = new Date();
    data30.setDate(data30.getDate() + 30);
    const hoje30 = data30.toISOString().slice(0, 10);
    const data90 = new Date();
    data90.setDate(data90.getDate() + 90);
    const hoje90 = data90.toISOString().slice(0, 10);

    const contasVencidas = [...contasPagarPendentes, ...contasReceberPendentes].filter(
      (item) => item.data < hoje
    ).length;
    const contasVenceHoje = [...contasPagarPendentes, ...contasReceberPendentes].filter(
      (item) => item.data === hoje
    ).length;
    const contasVence7Dias = [...contasPagarPendentes, ...contasReceberPendentes].filter(
      (item) => item.data > hoje && item.data <= hoje7
    ).length;

    const entradasPrevistas7 = somar(
      contasReceberPendentes.filter((item) => item.data <= hoje7)
    );
    const saidasPrevistas7 = somar(
      contasPagarPendentes.filter((item) => item.data <= hoje7)
    );
    const entradasPrevistas30 = somar(
      contasReceberPendentes.filter((item) => item.data <= hoje30)
    );
    const saidasPrevistas30 = somar(
      contasPagarPendentes.filter((item) => item.data <= hoje30)
    );
    const entradasPrevistas90 = somar(
      contasReceberPendentes.filter((item) => item.data <= hoje90)
    );
    const saidasPrevistas90 = somar(
      contasPagarPendentes.filter((item) => item.data <= hoje90)
    );

    const saldoProjetado7 = saldoAtual + entradasPrevistas7 - saidasPrevistas7;
    const saldoProjetado30 = saldoAtual + entradasPrevistas30 - saidasPrevistas30;
    const saldoProjetado90 = saldoAtual + entradasPrevistas90 - saidasPrevistas90;

    const registrosParaGrafico = [...receitasFiltradas, ...despesasFiltradas].filter(
      (item) => item.data
    );

    const agrupamentoMensal = {};

    registrosParaGrafico.forEach((item) => {
      const [ano, mes] = item.data.split("-");
      const chave = `${ano}-${mes}`;

      if (!agrupamentoMensal[chave]) {
        agrupamentoMensal[chave] = {
          name: `${meses[Number(mes) - 1].slice(0, 3)}/${ano}`,
          receitas: 0,
          despesas: 0,
        };
      }

      if (item.tipo === "receita") {
        agrupamentoMensal[chave].receitas += Number(item.valor || 0);
      }

      if (item.tipo === "despesa") {
        agrupamentoMensal[chave].despesas += Number(item.valor || 0);
      }
    });

    const evolucaoMensal = Object.keys(agrupamentoMensal)
      .sort()
      .map((chave) => agrupamentoMensal[chave]);

    let acumulado = 0;
    const saldoAcumuladoMensal = evolucaoMensal.map((item) => {
      acumulado += item.receitas - item.despesas;
      return {
        ...item,
        saldoAcumulado: acumulado,
      };
    });

    const agrupamentoPrevistoRealizado = {};

    [...receitasFiltradas, ...despesasFiltradas, ...contasReceberFiltradas, ...contasPagarFiltradas].forEach((item) => {
      if (!item.data) {
        return;
      }

      const [ano, mes] = item.data.split("-");
      const chave = `${ano}-${mes}`;

      if (!agrupamentoPrevistoRealizado[chave]) {
        agrupamentoPrevistoRealizado[chave] = {
          name: `${meses[Number(mes) - 1].slice(0, 3)}/${ano}`,
          realizadoReceitas: 0,
          realizadoDespesas: 0,
          previstoReceitas: 0,
          previstoDespesas: 0,
        };
      }

      if (item.tipo === "receita" && item.status === "pago") {
        agrupamentoPrevistoRealizado[chave].realizadoReceitas += Number(item.valor || 0);
      }

      if (item.tipo === "despesa" && item.status === "pago") {
        agrupamentoPrevistoRealizado[chave].realizadoDespesas += Number(item.valor || 0);
      }

      if (item.tipo === "conta-receber" && item.status === "pendente") {
        agrupamentoPrevistoRealizado[chave].previstoReceitas += Number(item.valor || 0);
      }

      if (item.tipo === "conta-pagar" && item.status === "pendente") {
        agrupamentoPrevistoRealizado[chave].previstoDespesas += Number(item.valor || 0);
      }
    });

    const previstoRealizadoMensal = Object.keys(agrupamentoPrevistoRealizado)
      .sort()
      .map((chave) => agrupamentoPrevistoRealizado[chave]);

    const receitasPorCategoria = Object.entries(
      receitasFiltradas.reduce((acc, item) => {
        const categoria = item.categoria?.trim() || "Sem categoria";
        acc[categoria] = (acc[categoria] || 0) + Number(item.valor || 0);
        return acc;
      }, {})
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const despesasPorCategoria = Object.entries(
      despesasFiltradas.reduce((acc, item) => {
        const categoria = item.categoria?.trim() || "Sem categoria";
        acc[categoria] = (acc[categoria] || 0) + Number(item.valor || 0);
        return acc;
      }, {})
    )
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const categoriasUnicas = [
      ...new Set([
        ...receitasPorCategoria.map((item) => item.name),
        ...despesasPorCategoria.map((item) => item.name),
      ]),
    ];

    const totalReceitasPorCategoria = receitasPorCategoria.reduce(
      (total, item) => total + item.value,
      0
    );

    const totalDespesasPorCategoria = despesasPorCategoria.reduce(
      (total, item) => total + item.value,
      0
    );

    const comparativoCategorias = categoriasUnicas
      .map((categoria) => ({
        name: categoria,
        receitas:
          receitasPorCategoria.find((item) => item.name === categoria)
            ?.value || 0,
        despesas:
          despesasPorCategoria.find((item) => item.name === categoria)
            ?.value || 0,
      }))
      .sort((a, b) => b.receitas + b.despesas - (a.receitas + a.despesas));

    const maioresDespesas = [...despesasFiltradas]
      .sort((a, b) => Number(b.valor || 0) - Number(a.valor || 0))
      .slice(0, 5)
      .map((item) => ({
        name: item.categoria || item.descricao || "Despesa",
        value: Number(item.valor || 0),
        detalhe: item.descricao,
        data: item.data,
      }));

    const periodoAnterior = obterPeriodoAnterior();
    const receitasAnterior = periodoAnterior
      ? somar(
          receitas.filter(
            (item) =>
              item.status === "pago" &&
              item.data >= periodoAnterior.inicio &&
              item.data <= periodoAnterior.fim
          )
        )
      : 0;
    const despesasAnterior = periodoAnterior
      ? somar(
          despesas.filter(
            (item) =>
              item.status === "pago" &&
              item.data >= periodoAnterior.inicio &&
              item.data <= periodoAnterior.fim
          )
        )
      : 0;

    const periodoOrcamento = orcamentos.filter((item) => {
      if (anoSelecionado !== "all" && item.ano !== anoSelecionado) {
        return false;
      }

      if (mesSelecionado !== "all" && item.mes !== mesSelecionado) {
        return false;
      }

      return true;
    });

    const mediaDespesaCategoria =
      despesasPorCategoria.length > 0
        ? totalDespesas / despesasPorCategoria.length
        : 0;

    const categoriasAcimaMedia = despesasPorCategoria.filter(
      (item) => item.value > mediaDespesaCategoria
    );

    const orcamentosProcessados = periodoOrcamento.map((orc) => {
      const utilizado =
        despesasPorCategoria.find((item) => item.name === orc.categoria)
          ?.value || 0;
      const restante = orc.valor - utilizado;
      const percentual = orc.valor ? (utilizado / orc.valor) * 100 : 0;

      return {
        ...orc,
        utilizado,
        restante,
        percentual,
      };
    });

    const categoriasAcimaOrcamento = orcamentosProcessados.filter(
      (item) => item.percentual > 100
    );

    const orcamentosVisiveis = orcamentosProcessados;

    const comparacaoPeriodo = {
      receitas: {
        atual: totalReceitas,
        anterior: receitasAnterior,
        variacao: receitasAnterior
          ? ((totalReceitas - receitasAnterior) / receitasAnterior) * 100
          : 0,
      },
      despesas: {
        atual: totalDespesas,
        anterior: despesasAnterior,
        variacao: despesasAnterior
          ? ((totalDespesas - despesasAnterior) / despesasAnterior) * 100
          : 0,
      },
    };

    return {
      totalReceitas,
      totalDespesas,
      totalPagar,
      totalReceber,
      saldo: saldoAtual,
      resultado: saldoAtual,
      evolucaoMensal,
      saldoAcumuladoMensal,
      previstoRealizadoMensal,
      despesasPorCategoria,
      receitasPorCategoria,
      comparativoCategorias,
      maioresDespesas,
      contasVencidas,
      contasVenceHoje,
      contasVence7Dias,
      entradasPrevistas7,
      saidasPrevistas7,
      entradasPrevistas30,
      saidasPrevistas30,
      entradasPrevistas90,
      saidasPrevistas90,
      saldoProjetado7,
      saldoProjetado30,
      saldoProjetado90,
      comparacaoPeriodo,
      mesesVisiveis:
        evolucaoMensal.length > 0
          ? evolucaoMensal
          : meses.map((mes) => ({ name: mes.slice(0, 3), receitas: 0, despesas: 0 })),
      totalReceitasPorCategoria,
      totalDespesasPorCategoria,
      receitaCategorias: receitasPorCategoria,
      despesaCategorias: despesasPorCategoria,
      categoriasAcimaMedia,
      categoriasAcimaOrcamento,
      orcamentosVisiveis,
    };
  }, [
    receitas,
    despesas,
    contasPagar,
    contasReceber,
    orcamentos,
    anoSelecionado,
    mesSelecionado,
    periodoInicio,
    periodoFim,
    filtroCategoria,
    filtroStatus,
    filtroTipo,
  ]);

  function alterarFormulario(setFormulario) {
    return (evento) => {
      const { name, value } = evento.target;

      setFormulario((formularioAnterior) => ({
        ...formularioAnterior,
        [name]: value,
      }));
    };
  }

  function salvarLancamento({
    evento,
    formulario,
    setLista,
    setFormulario,
    idEdicao,
    setIdEdicao,
    tipo,
  }) {
    evento.preventDefault();

    if (!formulario.descricao.trim()) {
      alert("Digite a descrição.");
      return;
    }

    if (!formulario.valor || Number(formulario.valor) <= 0) {
      alert("Digite um valor válido.");
      return;
    }

    const lancamento = {
      id: idEdicao || Date.now(),
      tipo,
      ...formulario,
    };

    if (idEdicao) {
      setLista((listaAnterior) =>
        listaAnterior.map((item) =>
          item.id === idEdicao ? lancamento : item
        )
      );
      setIdEdicao(null);
    } else {
      setLista((listaAnterior) => [...listaAnterior, lancamento]);
    }

    setFormulario({
      ...lancamentoInicial,
      status:
        tipo === "conta-pagar" || tipo === "conta-receber"
          ? "pendente"
          : "pago",
    });
  }

  function iniciarEdicaoLancamento(item, setFormulario, setIdEdicao) {
    setFormulario({
      descricao: item.descricao || "",
      categoria: item.categoria || "",
      valor: item.valor || "",
      data: item.data || new Date().toISOString().slice(0, 10),
      status: item.status || "pago",
      observacoes: item.observacoes || "",
    });
    setIdEdicao(item.id);
  }

  function cancelarEdicaoLancamento(setFormulario, setIdEdicao, tipo) {
    setIdEdicao(null);
    setFormulario({
      ...lancamentoInicial,
      status:
        tipo === "conta-pagar" || tipo === "conta-receber"
          ? "pendente"
          : "pago",
    });
  }

  function excluirItem(setLista, id) {
    const confirmou = window.confirm(
      "Deseja excluir este lançamento?"
    );

    if (!confirmou) {
      return;
    }

    setLista((listaAnterior) =>
      listaAnterior.filter((item) => item.id !== id)
    );
  }

  function alternarStatus(setLista, id) {
    setLista((listaAnterior) =>
      listaAnterior.map((item) =>
        item.id === id
          ? {
              ...item,
              status:
                item.status === "pago" ? "pendente" : "pago",
            }
          : item
      )
    );
  }

  function salvarOrcamento(evento) {
    evento.preventDefault();

    if (!formOrcamento.categoria.trim()) {
      alert("Digite a categoria do orçamento.");
      return;
    }

    if (!formOrcamento.valor || Number(formOrcamento.valor) <= 0) {
      alert("Digite um valor de orçamento válido.");
      return;
    }

    const orcamento = {
      id: edicaoOrcamentoId || Date.now(),
      categoria: formOrcamento.categoria.trim(),
      valor: Number(formOrcamento.valor),
      ano: formOrcamento.ano,
      mes: formOrcamento.mes,
    };

    if (edicaoOrcamentoId) {
      setOrcamentos((listaAnterior) =>
        listaAnterior.map((item) =>
          item.id === edicaoOrcamentoId ? orcamento : item
        )
      );
      setEdicaoOrcamentoId(null);
    } else {
      setOrcamentos((listaAnterior) => [...listaAnterior, orcamento]);
    }

    setFormOrcamento({
      categoria: "",
      valor: "",
      ano: String(dataAtual.getFullYear()),
      mes: String(dataAtual.getMonth()),
    });
  }

  function editarOrcamento(item) {
    setEdicaoOrcamentoId(item.id);
    setFormOrcamento({
      categoria: item.categoria || "",
      valor: item.valor || "",
      ano: item.ano || String(dataAtual.getFullYear()),
      mes: item.mes || String(dataAtual.getMonth()),
    });
  }

  function cancelarEdicaoOrcamento() {
    setEdicaoOrcamentoId(null);
    setFormOrcamento({
      categoria: "",
      valor: "",
      ano: String(dataAtual.getFullYear()),
      mes: String(dataAtual.getMonth()),
    });
  }

  function excluirOrcamento(id) {
    const confirmou = window.confirm("Deseja excluir este orçamento?");

    if (!confirmou) {
      return;
    }

    setOrcamentos((listaAnterior) =>
      listaAnterior.filter((item) => item.id !== id)
    );
  }

  function formatarValor(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarData(data) {
    if (!data) {
      return "Data não informada";
    }

    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  function formatarPercentual(valor, total) {
    if (!total || Number(total) === 0) {
      return "0,0%";
    }

    return `${((Number(valor || 0) / Number(total)) * 100).toFixed(1).replace('.', ',')}%`;
  }

  function filtrarLista(lista) {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return lista;
    }

    return lista.filter((item) =>
      [item.descricao, item.categoria, item.observacoes]
        .join(" ")
        .toLowerCase()
        .includes(termo)
    );
  }

  function limparFiltros() {
    setMesSelecionado(String(dataAtual.getMonth()));
    setAnoSelecionado(String(dataAtual.getFullYear()));
    setPeriodoInicio("");
    setPeriodoFim("");
    setFiltroCategoria("");
    setFiltroTipo("all");
    setFiltroStatus("all");
    setBusca("");
  }

  function renderFilters() {
    return (
      <section className="panel filter-panel">
        <div className="filter-grid">
          <label className="filter-field">
            <span>Mês</span>
            <select
              value={mesSelecionado}
              onChange={(evento) => setMesSelecionado(evento.target.value)}
            >
              <option value="all">Todos os meses</option>
              {meses.map((nome, index) => (
                <option key={nome} value={index}>
                  {nome}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Ano</span>
            <select
              value={anoSelecionado}
              onChange={(evento) => setAnoSelecionado(evento.target.value)}
            >
              <option value="all">Todos os anos</option>
              {anosDisponiveis.map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>
          </label>

          <label className="filter-field">
            <span>Tipo</span>
            <select
              value={filtroTipo}
              onChange={(evento) => setFiltroTipo(evento.target.value)}
            >
              <option value="all">Todos</option>
              <option value="receitas">Receitas</option>
              <option value="despesas">Despesas</option>
            </select>
          </label>

          <label className="filter-field">
            <span>Status</span>
            <select
              value={filtroStatus}
              onChange={(evento) => setFiltroStatus(evento.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
            </select>
          </label>

          <label className="filter-field">
            <span>Início</span>
            <input
              type="date"
              value={periodoInicio}
              onChange={(evento) => setPeriodoInicio(evento.target.value)}
            />
          </label>

          <label className="filter-field">
            <span>Fim</span>
            <input
              type="date"
              value={periodoFim}
              onChange={(evento) => setPeriodoFim(evento.target.value)}
            />
          </label>

          <label className="filter-field">
            <span>Categoria</span>
            <select
              value={filtroCategoria}
              onChange={(evento) => setFiltroCategoria(evento.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categoriasDisponiveis.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="secondary-button clear-button"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>
        </div>
      </section>
    );
  }

  function renderDashboardCharts() {
    const chartData = dadosGraficos.mesesVisiveis;

    return (
      <section className="chart-grid">
        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Tendência</p>
              <h2>Evolução mensal</h2>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="receitasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="despesasGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatarValor(value)} />
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <Area type="monotone" dataKey="receitas" stroke="#0ea5e9" fill="url(#receitasGradient)" />
              <Area type="monotone" dataKey="despesas" stroke="#ef4444" fill="url(#despesasGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Comparativo</p>
              <h2>Receitas x Despesas</h2>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => formatarValor(value)} />
              <Legend />
              <Bar dataKey="receitas" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Categorias</p>
              <h2>Despesas por categoria</h2>
            </div>
          </div>

          {dadosGraficos.despesasPorCategoria.length === 0 ? (
            <div className="empty-state compact">
              <strong>Nenhuma despesa encontrada</strong>
              <p>Use os filtros ou adicione despesas para ver o gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosGraficos.despesasPorCategoria}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {dadosGraficos.despesasPorCategoria.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={piColors[index % piColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatarValor(value)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Fluxo</p>
              <h2>Saldo acumulado</h2>
            </div>
          </div>

          {dadosGraficos.saldoAcumuladoMensal.length === 0 ? (
            <div className="empty-state compact">
              <strong>Sem dados de saldo acumulado</strong>
              <p>Selecione um período ou adicione movimentações.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dadosGraficos.saldoAcumuladoMensal} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <Area type="monotone" dataKey="saldoAcumulado" stroke="#14b8a6" fill="url(#saldoGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Previsto x Realizado</p>
              <h2>Previsão financeira</h2>
            </div>
          </div>

          {dadosGraficos.previstoRealizadoMensal.length === 0 ? (
            <div className="empty-state compact">
              <strong>Sem dados de previsão</strong>
              <p>Use contas a pagar e receber para gerar o gráfico.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosGraficos.previstoRealizadoMensal} margin={{ top: 12, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Legend />
                <Bar dataKey="realizadoReceitas" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                <Bar dataKey="previstoReceitas" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                <Bar dataKey="realizadoDespesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="previstoDespesas" fill="#fda4af" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <p className="subtitle">Performance</p>
              <h2>Maiores despesas</h2>
            </div>
          </div>

          {dadosGraficos.maioresDespesas.length === 0 ? (
            <div className="empty-state compact">
              <strong>Nenhuma despesa encontrada</strong>
              <p>Cadastre despesas para exibir os maiores valores.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dadosGraficos.maioresDespesas}
                layout="vertical"
                margin={{ top: 12, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis type="number" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip formatter={(value) => formatarValor(value)} />
                <Bar dataKey="value" fill="#f97316" radius={[8, 8, 8, 8]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </article>
      </section>
    );
  }

  function renderFormulario({
    titulo,
    subtitulo,
    formulario,
    setFormulario,
    setLista,
    idEdicao,
    setIdEdicao,
    tipo,
    textoBotao,
    textoBotaoEditar,
  }) {
    return (
      <section className="panel form-panel">
        <div className="section-heading">
          <div>
            <p className="subtitle">{subtitulo}</p>
            <h2>{titulo}</h2>
          </div>
        </div>

        <form
          onSubmit={(evento) =>
            salvarLancamento({
              evento,
              formulario,
              setLista,
              setFormulario,
              idEdicao,
              setIdEdicao,
              tipo,
            })
          }
        >
          <div className="form-grid">
            <div className="form-field">
              <label>Descrição</label>
              <input
                name="descricao"
                placeholder="Ex.: Venda do dia"
                value={formulario.descricao}
                onChange={alterarFormulario(setFormulario)}
              />
            </div>

            <div className="form-field">
              <label>Categoria</label>
              <input
                name="categoria"
                placeholder="Ex.: Vendas, aluguel, energia"
                value={formulario.categoria}
                onChange={alterarFormulario(setFormulario)}
              />
            </div>

            <div className="form-field">
              <label>Valor</label>
              <input
                name="valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="R$ 0,00"
                value={formulario.valor}
                onChange={alterarFormulario(setFormulario)}
              />
            </div>

            <div className="form-field">
              <label>Data</label>
              <input
                name="data"
                type="date"
                value={formulario.data}
                onChange={alterarFormulario(setFormulario)}
              />
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                name="status"
                value={formulario.status}
                onChange={alterarFormulario(setFormulario)}
              >
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>

          <div className="form-field textarea-field">
            <label>Observações</label>
            <textarea
              name="observacoes"
              placeholder="Informações adicionais"
              value={formulario.observacoes}
              onChange={alterarFormulario(setFormulario)}
            />
          </div>

          <div className="form-actions">
            <button className="primary-button form-button" type="submit">
              {idEdicao ? textoBotaoEditar : textoBotao}
            </button>

            {idEdicao && (
              <button
                className="secondary-button form-button"
                type="button"
                onClick={() =>
                  cancelarEdicaoLancamento(
                    setFormulario,
                    setIdEdicao,
                    tipo
                  )
                }
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>
    );
  }

  function renderLista({ titulo, subtitulo, lista, setLista, onEditar }) {
    const itensFiltrados = filtrarLista(lista);

    return (
      <section className="panel">
        <div className="section-heading search-heading">
          <div>
            <p className="subtitle">{subtitulo}</p>
            <h2>{titulo}</h2>
          </div>

          <input
            className="search-input"
            placeholder="Pesquisar..."
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
          />
        </div>

        {itensFiltrados.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum lançamento encontrado</strong>
            <p>Cadastre um lançamento ou altere sua pesquisa.</p>
          </div>
        ) : (
          <div className="finance-table">
            <div className="finance-table-header">
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Valor</span>
              <span>Data</span>
              <span>Status</span>
              <span>Ações</span>
            </div>

            {[...itensFiltrados].reverse().map((item) => (
              <div className="finance-table-row" key={item.id}>
                <strong>{item.descricao}</strong>
                <span>{item.categoria || "Sem categoria"}</span>
                <strong className="money-value">
                  {formatarValor(item.valor)}
                </strong>
                <span>{formatarData(item.data)}</span>
                <span className={`status ${item.status}`}>
                  {item.status}
                </span>
                <div className="actions">
                  <button
                    className="secondary-button small-button"
                    type="button"
                    onClick={() => onEditar(item)}
                  >
                    Editar
                  </button>
                  <button
                    className="secondary-button small-button"
                    type="button"
                    onClick={() => alternarStatus(setLista, item.id)}
                  >
                    Status
                  </button>
                  <button
                    className="delete-button"
                    type="button"
                    onClick={() => excluirItem(setLista, item.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  function baixarRelatorio() {
    window.print();
  }

  function renderDashboard() {
    const ultimosLancamentos = [
      ...receitas.map((item) => ({ ...item, origem: "Receita" })),
      ...despesas.map((item) => ({ ...item, origem: "Despesa" })),
      ...contasReceber.map((item) => ({ ...item, origem: "Conta a receber" })),
      ...contasPagar.map((item) => ({ ...item, origem: "Conta a pagar" })),
    ]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);

    function renderDashboardAlerts() {
      const alertas = [];

      if (dadosGraficos.contasVencidas > 0) {
        alertas.push(
          `Existem ${dadosGraficos.contasVencidas} contas vencidas aguardando ação.`
        );
      }

      if (dadosGraficos.contasVenceHoje > 0) {
        alertas.push(
          `Existem ${dadosGraficos.contasVenceHoje} contas que vencem hoje.`
        );
      }

      if (dadosGraficos.contasVence7Dias > 0) {
        alertas.push(
          `Existem ${dadosGraficos.contasVence7Dias} contas que vencem nos próximos 7 dias.`
        );
      }

      if (dadosGraficos.saldoProjetado7 < 0) {
        alertas.push(
          `O saldo projetado para 7 dias está negativo: ${formatarValor(
            dadosGraficos.saldoProjetado7
          )}`
        );
      }

      if (
        dadosGraficos.categoriasAcimaMedia &&
        dadosGraficos.categoriasAcimaMedia.length > 0
      ) {
        alertas.push(
          `Despesas acima da média em ${dadosGraficos.categoriasAcimaMedia.length} categoria(s).`
        );
      }

      if (
        dadosGraficos.categoriasAcimaOrcamento &&
        dadosGraficos.categoriasAcimaOrcamento.length > 0
      ) {
        alertas.push(
          `Orçamento ultrapassado em ${dadosGraficos.categoriasAcimaOrcamento.length} categoria(s).`
        );
      }

      if (alertas.length === 0) {
        return null;
      }

      return (
        <section className="panel alert-panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">Alerta</p>
              <h2>Alertas financeiros</h2>
            </div>
          </div>

          <div className="alert-list">
            {alertas.map((alerta, index) => (
              <div key={index} className="alert-item">
                {alerta}
              </div>
            ))}
          </div>
        </section>
      );
    }

    return (
      <>
        <header className="page-header">
          <div>
            <p className="subtitle">Visão geral</p>
            <h1>Dashboard financeiro</h1>
          </div>

          <button
            className="primary-button"
            onClick={() => setPagina("receitas")}
          >
            + Nova receita
          </button>
        </header>

        {renderFilters()}
        {renderDashboardAlerts()}

        <section className="cards cards-four">
          <article className="card">
            <p>Saldo atual</p>
            <strong className={totais.saldo >= 0 ? "positive" : "negative"}>
              {formatarValor(totais.saldo)}
            </strong>
          </article>

          <article className="card">
            <p>Total de entradas</p>
            <strong className="positive">
              {formatarValor(totais.totalEntradas)}
            </strong>
          </article>

          <article className="card">
            <p>Total de saídas</p>
            <strong className="negative">
              {formatarValor(totais.totalSaidas)}
            </strong>
          </article>

          <article className="card">
            <p>Resultado líquido</p>
            <strong className={totais.saldo >= 0 ? "positive" : "negative"}>
              {formatarValor(totais.saldo)}
            </strong>
          </article>

          <article className="card">
            <p>Contas a receber</p>
            <strong>{formatarValor(totais.totalReceber)}</strong>
          </article>

          <article className="card">
            <p>Contas a pagar</p>
            <strong>{formatarValor(totais.totalPagar)}</strong>
          </article>

          <article className="card">
            <p>Contas vencidas</p>
            <strong>{dadosGraficos.contasVencidas}</strong>
          </article>

          <article className="card">
            <p>Vence em 7 dias</p>
            <strong>{dadosGraficos.contasVence7Dias}</strong>
          </article>
        </section>

        <section className="summary-grid">
          <article className="panel summary-card">
            <p className="subtitle">Projeção</p>
            <h2>Saldo 7 dias</h2>
            <strong className={dadosGraficos.saldoProjetado7 >= 0 ? "positive" : "negative"}>
              {formatarValor(dadosGraficos.saldoProjetado7)}
            </strong>
          </article>

          <article className="panel summary-card">
            <p className="subtitle">Projeção</p>
            <h2>Saldo 30 dias</h2>
            <strong className={dadosGraficos.saldoProjetado30 >= 0 ? "positive" : "negative"}>
              {formatarValor(dadosGraficos.saldoProjetado30)}
            </strong>
          </article>

          <article className="panel summary-card">
            <p className="subtitle">Projeção</p>
            <h2>Saldo 90 dias</h2>
            <strong className={dadosGraficos.saldoProjetado90 >= 0 ? "positive" : "negative"}>
              {formatarValor(dadosGraficos.saldoProjetado90)}
            </strong>
          </article>

          <article className="panel summary-card">
            <p className="subtitle">Comparação</p>
            <h2>Período anterior</h2>
            <strong>
              Receitas: {dadosGraficos.comparacaoPeriodo.receitas.variacao.toFixed(1).replace('.', ',')}%
            </strong>
            <p>Despesas: {dadosGraficos.comparacaoPeriodo.despesas.variacao.toFixed(1).replace('.', ',')}%</p>
          </article>
        </section>

        {renderDashboardCharts()}

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">Movimentações recentes</p>
              <h2>Últimos lançamentos</h2>
            </div>
          </div>

          {ultimosLancamentos.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum lançamento cadastrado</strong>
              <p>Comece adicionando uma receita ou despesa.</p>
            </div>
          ) : (
            <div className="recent-list">
              {ultimosLancamentos.map((item) => (
                <div className="recent-item" key={`${item.origem}-${item.id}`}>
                  <div>
                    <strong>{item.descricao}</strong>
                    <span>{item.origem}</span>
                  </div>
                  <strong className={item.origem === "Receita" ? "positive" : "negative"}>
                    {formatarValor(item.valor)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderRelatorios() {
    const filtradas = (lista) => lista.filter(itemEstaNoFiltro);
    const receitasFiltradas = filtradas(receitas);
    const despesasFiltradas = filtradas(despesas);
    const contasPagarFiltradas = filtradas(contasPagar);
    const contasReceberFiltradas = filtradas(contasReceber);

    const totalMovimentacoes = receitasFiltradas.length + despesasFiltradas.length;
    const totalReceitasPagas = receitasFiltradas
      .filter((item) => item.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const totalDespesasPagas = despesasFiltradas
      .filter((item) => item.status === "pago")
      .reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const totalPendente =
      contasPagarFiltradas
        .filter((item) => item.status === "pendente")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0) +
      contasReceberFiltradas
        .filter((item) => item.status === "pendente")
        .reduce((acc, item) => acc + Number(item.valor || 0), 0);
    const pendencias =
      contasPagarFiltradas.filter((item) => item.status === "pendente").length +
      contasReceberFiltradas.filter((item) => item.status === "pendente").length;
    const resultado = totalReceitasPagas - totalDespesasPagas;
    const margem = totalReceitasPagas > 0 ? (resultado / totalReceitasPagas) * 100 : 0;
    const relatorioData = formatarData(new Date().toISOString().slice(0, 10));
    const despesasPorCategoriaRelatorio = Object.entries(
      despesasFiltradas.reduce((acumulador, item) => {
        const categoria = item.categoria?.trim() || "Sem categoria";
        acumulador[categoria] = (acumulador[categoria] || 0) + Number(item.valor || 0);
        return acumulador;
      }, {})
    )
      .map(([categoria, valor]) => ({ categoria, valor }))
      .sort((a, b) => b.valor - a.valor);
    const topCategoriasDespesas = despesasPorCategoriaRelatorio.slice(0, 5);
    const totalOutrasCategoriasDespesas = despesasPorCategoriaRelatorio
      .slice(5)
      .reduce((total, item) => total + item.valor, 0);
    const topicosDespesasRelatorio = totalOutrasCategoriasDespesas > 0
      ? [
          ...topCategoriasDespesas,
          {
            categoria: "Outras categorias",
            valor: totalOutrasCategoriasDespesas,
          },
        ]
      : topCategoriasDespesas;
    const totalDespesasPorCategoriaRelatorio = despesasPorCategoriaRelatorio.reduce(
      (total, item) => total + item.valor,
      0
    );

    return (
      <>
        <header className="page-header report-header">
          <div>
            <p className="subtitle">Análises</p>
            <h1>Relatórios</h1>
            <p className="report-date">Relatório gerado em {relatorioData}</p>
          </div>

          <div className="report-actions">
            <button className="secondary-button" type="button" onClick={baixarRelatorio}>
              Baixar PDF
            </button>
          </div>
        </header>

        {renderFilters()}

        <section className="cards cards-four report-summary">
          <article className="card">
            <p>Total de movimentações</p>
            <strong>{totalMovimentacoes}</strong>
          </article>

          <article className="card">
            <p>Receitas pagas</p>
            <strong className="positive">{formatarValor(totalReceitasPagas)}</strong>
          </article>

          <article className="card">
            <p>Despesas pagas</p>
            <strong className="negative">{formatarValor(totalDespesasPagas)}</strong>
          </article>

          <article className="card">
            <p>Pendências</p>
            <strong>{pendencias}</strong>
          </article>
        </section>

        <section className="panel report-breakdown">
          <div className="section-heading">
            <div>
              <p className="subtitle">Indicadores</p>
              <h2>Resumo financeiro</h2>
            </div>
          </div>

          <div className="report-grid">
            <div className="report-metric">
              <span className="metric-label">Resultado acumulado</span>
              <strong className={resultado >= 0 ? "positive" : "negative"}>
                {formatarValor(resultado)}
              </strong>
            </div>

            <div className="report-metric">
              <span className="metric-label">Margem financeira</span>
              <strong>{margem.toFixed(1).replace('.', ',')}%</strong>
            </div>

            <div className="report-metric">
              <span className="metric-label">Entradas pendentes</span>
              <strong>{formatarValor(contasReceberFiltradas
                .filter((item) => item.status === "pendente")
                .reduce((acc, item) => acc + Number(item.valor || 0), 0))}</strong>
            </div>

            <div className="report-metric">
              <span className="metric-label">Saídas pendentes</span>
              <strong>{formatarValor(contasPagarFiltradas
                .filter((item) => item.status === "pendente")
                .reduce((acc, item) => acc + Number(item.valor || 0), 0))}</strong>
            </div>
          </div>
        </section>

        <section className="panel report-notes">
          <div className="section-heading">
            <div>
              <p className="subtitle">Observações</p>
              <h2>Apresentação de resultados</h2>
            </div>
          </div>
          <p>
            Este relatório foi gerado com os dados atuais do sistema, respeitando filtros de período,
            categorias e status aplicados. Use o botão acima para exportar em PDF e compartilhar com
            stakeholders.
          </p>
        </section>

        <section className="panel report-categories">
          <div className="section-heading">
            <div>
              <p className="subtitle">Despesas</p>
              <h2>Tópicos por categoria</h2>
            </div>
          </div>

          {despesasPorCategoriaRelatorio.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhuma despesa encontrada no período</strong>
              <p>Altere os filtros para visualizar os tópicos por categoria.</p>
            </div>
          ) : (
            <ul className="report-topics">
              {topicosDespesasRelatorio.map((item) => (
                <li key={item.categoria}>
                  <div>
                    <strong>{item.categoria}</strong>
                    <span>{formatarPercentual(item.valor, totalDespesasPorCategoriaRelatorio)} do total</span>
                  </div>
                  <strong className="negative">{formatarValor(item.valor)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </>
    );
  }

  function renderAnalisePorCategorias() {
    const receitasFiltradas = receitas.filter(itemEstaNoFiltro);
    const despesasFiltradas = despesas.filter(itemEstaNoFiltro);
    const totalLancamentos = receitasFiltradas.length + despesasFiltradas.length;

    return (
      <>
        <header className="page-header">
          <div>
            <p className="subtitle">Categoria</p>
            <h1>Análise por Categorias</h1>
          </div>
        </header>

        {renderFilters()}

        <section className="cards cards-four">
          <article className="card">
            <p>Total de receitas</p>
            <strong className="positive">
              {formatarValor(dadosGraficos.totalReceitas)}
            </strong>
          </article>

          <article className="card">
            <p>Total de despesas</p>
            <strong className="negative">
              {formatarValor(dadosGraficos.totalDespesas)}
            </strong>
          </article>

          <article className="card">
            <p>Resultado líquido</p>
            <strong className={dadosGraficos.resultado >= 0 ? "positive" : "negative"}>
              {formatarValor(dadosGraficos.resultado)}
            </strong>
          </article>

          <article className="card">
            <p>Lançamentos encontrados</p>
            <strong>{totalLancamentos}</strong>
          </article>
        </section>

        <section className="chart-grid">
          <article className="chart-panel">
            <div className="panel-heading">
              <div>
                <p className="subtitle">Receitas</p>
                <h2>Receitas por categoria</h2>
              </div>
            </div>

            {dadosGraficos.receitaCategorias.length === 0 ? (
              <div className="empty-state compact">
                <strong>Nenhuma receita encontrada</strong>
                <p>Use os filtros ou cadastre receitas para ver esta análise.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dadosGraficos.receitaCategorias}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {dadosGraficos.receitaCategorias.map((entry, index) => (
                      <Cell key={entry.name} fill={piColors[index % piColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatarValor(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </article>

          <article className="chart-panel">
            <div className="panel-heading">
              <div>
                <p className="subtitle">Despesas</p>
                <h2>Despesas por categoria</h2>
              </div>
            </div>

            {dadosGraficos.despesaCategorias.length === 0 ? (
              <div className="empty-state compact">
                <strong>Nenhuma despesa encontrada</strong>
                <p>Use os filtros ou cadastre despesas para ver esta análise.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={dadosGraficos.despesaCategorias}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={110}
                    paddingAngle={4}
                  >
                    {dadosGraficos.despesaCategorias.map((entry, index) => (
                      <Cell key={entry.name} fill={piColors[index % piColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatarValor(value)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </article>

          <article className="chart-panel">
            <div className="panel-heading">
              <div>
                <p className="subtitle">Comparação</p>
                <h2>Receitas x Despesas por categoria</h2>
              </div>
            </div>

            {dadosGraficos.comparativoCategorias.length === 0 ? (
              <div className="empty-state compact">
                <strong>Sem categorias para comparar</strong>
                <p>Adicione lançamentos ou ajuste os filtros.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart
                  data={dadosGraficos.comparativoCategorias}
                  margin={{ top: 12, right: 20, left: -10, bottom: 0 }}
                >
                  <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => formatarValor(value)} />
                  <Legend />
                  <Bar dataKey="receitas" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </article>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">Detalhes</p>
              <h2>Receitas por categoria</h2>
            </div>
          </div>

          {dadosGraficos.receitaCategorias.length === 0 ? (
            <div className="empty-state">
              <strong>Sem receitas para análise</strong>
            </div>
          ) : (
            <div className="category-list">
              {dadosGraficos.receitaCategorias.map((item) => (
                <div className="category-row" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatarPercentual(item.value, dadosGraficos.totalReceitasPorCategoria)}</span>
                  </div>
                  <strong>{formatarValor(item.value)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">Detalhes</p>
              <h2>Despesas por categoria</h2>
            </div>
          </div>

          {dadosGraficos.despesaCategorias.length === 0 ? (
            <div className="empty-state">
              <strong>Sem despesas para análise</strong>
            </div>
          ) : (
            <div className="category-list">
              {dadosGraficos.despesaCategorias.map((item) => (
                <div className="category-row" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{formatarPercentual(item.value, dadosGraficos.totalDespesasPorCategoria)}</span>
                  </div>
                  <strong>{formatarValor(item.value)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">Orçamento</p>
              <h2>Orçamento por categoria</h2>
            </div>
          </div>

          <div className="form-grid">
            <label className="form-field">
              <span>Categoria</span>
              <input
                name="categoria"
                placeholder="Ex.: Combustível"
                value={formOrcamento.categoria}
                onChange={alterarFormulario(setFormOrcamento)}
              />
            </label>

            <label className="form-field">
              <span>Ano</span>
              <select
                name="ano"
                value={formOrcamento.ano}
                onChange={alterarFormulario(setFormOrcamento)}
              >
                {anosDisponiveis.map((ano) => (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Mês</span>
              <select
                name="mes"
                value={formOrcamento.mes}
                onChange={alterarFormulario(setFormOrcamento)}
              >
                {meses.map((nome, index) => (
                  <option key={nome} value={index}>
                    {nome}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Valor</span>
              <input
                name="valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="R$ 0,00"
                value={formOrcamento.valor}
                onChange={alterarFormulario(setFormOrcamento)}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-button form-button" type="button" onClick={salvarOrcamento}>
              {edicaoOrcamentoId ? "Atualizar orçamento" : "Salvar orçamento"}
            </button>

            {edicaoOrcamentoId && (
              <button
                className="secondary-button form-button"
                type="button"
                onClick={cancelarEdicaoOrcamento}
              >
                Cancelar edição
              </button>
            )}
          </div>

          {dadosGraficos.orcamentosVisiveis.length === 0 ? (
            <div className="empty-state" style={{ marginTop: 24 }}>
              <strong>Nenhum orçamento cadastrado</strong>
              <p>Defina limites para acompanhar categoria por categoria.</p>
            </div>
          ) : (
            <div className="category-list" style={{ marginTop: 24 }}>
              {dadosGraficos.orcamentosVisiveis.map((item) => (
                <div className="category-row" key={item.id}>
                  <div>
                    <strong>{item.categoria}</strong>
                    <span>{formatarValor(item.valor)} orçamento</span>
                  </div>
                  <div className="budget-info">
                    <strong>{formatarValor(item.utilizado)}</strong>
                    <span>{item.percentual.toFixed(1).replace('.', ',')}%</span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(item.percentual, 100)}%` }}
                    />
                  </div>
                  <div className="budget-actions">
                    <button
                      className="secondary-button small-button"
                      type="button"
                      onClick={() => editarOrcamento(item)}
                    >
                      Editar
                    </button>
                    <button
                      className="delete-button small-button"
                      type="button"
                      onClick={() => excluirOrcamento(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </>
    );
  }

  function renderizarPagina() {
    if (pagina === "receitas") {
      return (
        <>
          <header className="page-header">
            <div>
              <p className="subtitle">Entradas</p>
              <h1>Receitas</h1>
            </div>
          </header>

          {renderFormulario({
            titulo: "Cadastrar receita",
            subtitulo: "Novo lançamento",
            formulario: formReceita,
            setFormulario: setFormReceita,
            setLista: setReceitas,
            idEdicao: edicaoReceitaId,
            setIdEdicao: setEdicaoReceitaId,
            tipo: "receita",
            textoBotao: "Salvar receita",
            textoBotaoEditar: "Atualizar receita",
          })}

          {renderLista({
            titulo: "Receitas cadastradas",
            subtitulo: "Histórico",
            lista: receitas,
            setLista: setReceitas,
            onEditar: (item) =>
              iniciarEdicaoLancamento(
                item,
                setFormReceita,
                setEdicaoReceitaId
              ),
          })}
        </>
      );
    }

    if (pagina === "despesas") {
      return (
        <>
          <header className="page-header">
            <div>
              <p className="subtitle">Saídas</p>
              <h1>Despesas</h1>
            </div>
          </header>

          {renderFormulario({
            titulo: "Cadastrar despesa",
            subtitulo: "Novo lançamento",
            formulario: formDespesa,
            setFormulario: setFormDespesa,
            setLista: setDespesas,
            idEdicao: edicaoDespesaId,
            setIdEdicao: setEdicaoDespesaId,
            tipo: "despesa",
            textoBotao: "Salvar despesa",
            textoBotaoEditar: "Atualizar despesa",
          })}

          {renderLista({
            titulo: "Despesas cadastradas",
            subtitulo: "Histórico",
            lista: despesas,
            setLista: setDespesas,
            onEditar: (item) =>
              iniciarEdicaoLancamento(
                item,
                setFormDespesa,
                setEdicaoDespesaId
              ),
          })}
        </>
      );
    }

    if (pagina === "pagar") {
      return (
        <>
          <header className="page-header">
            <div>
              <p className="subtitle">Compromissos</p>
              <h1>Contas a pagar</h1>
            </div>
          </header>

          {renderFormulario({
            titulo: "Cadastrar conta",
            subtitulo: "Nova obrigação",
            formulario: formPagar,
            setFormulario: setFormPagar,
            setLista: setContasPagar,
            idEdicao: edicaoPagarId,
            setIdEdicao: setEdicaoPagarId,
            tipo: "conta-pagar",
            textoBotao: "Salvar conta a pagar",
            textoBotaoEditar: "Atualizar conta",
          })}

          {renderLista({
            titulo: "Contas cadastradas",
            subtitulo: "Controle",
            lista: contasPagar,
            setLista: setContasPagar,
            onEditar: (item) =>
              iniciarEdicaoLancamento(
                item,
                setFormPagar,
                setEdicaoPagarId
              ),
          })}
        </>
      );
    }

    if (pagina === "receber") {
      return (
        <>
          <header className="page-header">
            <div>
              <p className="subtitle">Créditos</p>
              <h1>Contas a receber</h1>
            </div>
          </header>

          {renderFormulario({
            titulo: "Cadastrar recebimento",
            subtitulo: "Nova previsão",
            formulario: formReceber,
            setFormulario: setFormReceber,
            setLista: setContasReceber,
            idEdicao: edicaoReceberId,
            setIdEdicao: setEdicaoReceberId,
            tipo: "conta-receber",
            textoBotao: "Salvar conta a receber",
            textoBotaoEditar: "Atualizar recebimento",
          })}

          {renderLista({
            titulo: "Recebimentos cadastrados",
            subtitulo: "Controle",
            lista: contasReceber,
            setLista: setContasReceber,
            onEditar: (item) =>
              iniciarEdicaoLancamento(
                item,
                setFormReceber,
                setEdicaoReceberId
              ),
          })}
        </>
      );
    }

    if (pagina === "relatorios") {
      return renderRelatorios();
    }

    if (pagina === "analise-categorias") {
      return renderAnalisePorCategorias();
    }

    return renderDashboard();
  }

  return (
    <div className={`app theme-${tema}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">CF</div>
          <div>
            <h2>Controle Financeiro</h2>
            <p>Gestão empresarial</p>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={pagina === item.id ? "active" : ""}
              onClick={() => {
                setPagina(item.id);
                setBusca("");
              }}
            >
              <span className="menu-dot" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="theme-switcher">
            <span className="theme-title">Tema visual</span>
            <div className="theme-options">
              {temas.map((opcao) => (
                <button
                  key={opcao.id}
                  type="button"
                  className={tema === opcao.id ? "active" : ""}
                  onClick={() => setTema(opcao.id)}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>

          <strong>Versão 1.0</strong>
          <span>Dados salvos automaticamente</span>
        </div>
      </aside>

      <main className="content">{renderizarPagina()}</main>
    </div>
  );
}

export default App;
