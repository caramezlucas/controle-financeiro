import { useEffect, useMemo, useState } from "react";
import "./App.css";

const menuItems = [
  { id: "dashboard", label: "Dashboard" },
  { id: "receitas", label: "Receitas" },
  { id: "despesas", label: "Despesas" },
  { id: "pagar", label: "Contas a pagar" },
  { id: "receber", label: "Contas a receber" },
  { id: "relatorios", label: "Relatórios" },
];

const lancamentoInicial = {
  descricao: "",
  categoria: "",
  valor: "",
  data: new Date().toISOString().slice(0, 10),
  status: "pago",
  observacoes: "",
};

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

function App() {
  const [pagina, setPagina] = useState("dashboard");

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

  const [formReceita, setFormReceita] =
    useState(lancamentoInicial);

  const [formDespesa, setFormDespesa] =
    useState(lancamentoInicial);

  const [formPagar, setFormPagar] = useState({
    ...lancamentoInicial,
    status: "pendente",
  });

  const [formReceber, setFormReceber] = useState({
    ...lancamentoInicial,
    status: "pendente",
  });

  const [busca, setBusca] = useState("");

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

  const totais = useMemo(() => {
    function somar(lista) {
      return lista.reduce(
        (total, item) => total + Number(item.valor || 0),
        0
      );
    }

    const receitasPagas = receitas.filter(
      (item) => item.status === "pago"
    );

    const despesasPagas = despesas.filter(
      (item) => item.status === "pago"
    );

    const contasPagarPendentes = contasPagar.filter(
      (item) => item.status === "pendente"
    );

    const contasReceberPendentes = contasReceber.filter(
      (item) => item.status === "pendente"
    );

    const totalReceitas = somar(receitasPagas);
    const totalDespesas = somar(despesasPagas);

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      totalPagar: somar(contasPagarPendentes),
      totalReceber: somar(contasReceberPendentes),
    };
  }, [receitas, despesas, contasPagar, contasReceber]);

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

    const novoLancamento = {
      id: Date.now(),
      tipo,
      ...formulario,
    };

    setLista((listaAnterior) => [
      ...listaAnterior,
      novoLancamento,
    ]);

    setFormulario({
      ...lancamentoInicial,
      status:
        tipo === "conta-pagar" ||
        tipo === "conta-receber"
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
                item.status === "pago"
                  ? "pendente"
                  : "pago",
            }
          : item
      )
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

  return dia + "/" + mes + "/" + ano
  }

  function filtrarLista(lista) {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return lista;
    }

    return lista.filter((item) =>
      [
        item.descricao,
        item.categoria,
        item.observacoes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(termo)
    );
  }

  function renderFormulario({
    titulo,
    subtitulo,
    formulario,
    setFormulario,
    setLista,
    tipo,
    textoBotao,
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

          <button
            className="primary-button form-button"
            type="submit"
          >
            {textoBotao}
          </button>
        </form>
      </section>
    );
  }

  function renderLista({
    titulo,
    subtitulo,
    lista,
    setLista,
  }) {
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
            onChange={(evento) =>
              setBusca(evento.target.value)
            }
          />
        </div>

        {itensFiltrados.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum lançamento encontrado</strong>

            <p>
              Cadastre um lançamento ou altere sua pesquisa.
            </p>
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

            {[...itensFiltrados]
              .reverse()
              .map((item) => (
                <div
                  className="finance-table-row"
                  key={item.id}
                >
                  <strong>{item.descricao}</strong>

                  <span>
                    {item.categoria || "Sem categoria"}
                  </span>

                  <strong className="money-value">
                    {formatarValor(item.valor)}
                  </strong>

                  <span>{formatarData(item.data)}</span>

                  <span
                   className={"status " + item.status}
                  >
                    {item.status}
                  </span>

                  <div className="actions">
                    <button
                      className="secondary-button small-button"
                      type="button"
                      onClick={() =>
                        alternarStatus(setLista, item.id)
                      }
                    >
                      Alterar
                    </button>

                    <button
                      className="delete-button"
                      type="button"
                      onClick={() =>
                        excluirItem(setLista, item.id)
                      }
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

  function renderDashboard() {
    const ultimosLancamentos = [
      ...receitas.map((item) => ({
        ...item,
        origem: "Receita",
      })),

      ...despesas.map((item) => ({
        ...item,
        origem: "Despesa",
      })),
    ]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);

    const saldoProjetado =
      totais.saldo +
      totais.totalReceber -
      totais.totalPagar;

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

        <section className="cards">
          <article className="card">
            <p>Saldo atual</p>

            <strong
              className={
                totais.saldo >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {formatarValor(totais.saldo)}
            </strong>
          </article>

          <article className="card">
            <p>Receitas</p>

            <strong className="positive">
              {formatarValor(totais.totalReceitas)}
            </strong>
          </article>

          <article className="card">
            <p>Despesas</p>

            <strong className="negative">
              {formatarValor(totais.totalDespesas)}
            </strong>
          </article>

          <article className="card">
            <p>A receber</p>

            <strong>
              {formatarValor(totais.totalReceber)}
            </strong>
          </article>
        </section>

        <section className="summary-grid">
          <article className="panel summary-card">
            <p className="subtitle">Compromissos</p>
            <h2>Contas a pagar</h2>

            <strong className="negative">
              {formatarValor(totais.totalPagar)}
            </strong>
          </article>

          <article className="panel summary-card">
            <p className="subtitle">Previsão</p>
            <h2>Saldo projetado</h2>

            <strong
              className={
                saldoProjetado >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {formatarValor(saldoProjetado)}
            </strong>
          </article>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="subtitle">
                Movimentações recentes
              </p>

              <h2>Últimos lançamentos</h2>
            </div>
          </div>

          {ultimosLancamentos.length === 0 ? (
            <div className="empty-state">
              <strong>
                Nenhum lançamento cadastrado
              </strong>

              <p>
                Comece adicionando uma receita ou despesa.
              </p>
            </div>
          ) : (
            <div className="recent-list">
              {ultimosLancamentos.map((item) => (
                <div
                  className="recent-item"
                  key={item.origem + "-" + item.id}
                >
                  <div>
                    <strong>{item.descricao}</strong>
                    <span>{item.origem}</span>
                  </div>

                  <strong
                    className={
                      item.origem === "Receita"
                        ? "positive"
                        : "negative"
                    }
                  >
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
    const totalMovimentacoes =
      receitas.length + despesas.length;

    const resultado =
      totais.totalReceitas - totais.totalDespesas;

    const margem =
      totais.totalReceitas > 0
        ? (resultado / totais.totalReceitas) * 100
        : 0;

    const pendencias =
      contasPagar.filter(
        (item) => item.status === "pendente"
      ).length +
      contasReceber.filter(
        (item) => item.status === "pendente"
      ).length;

    return (
      <>
        <header className="page-header">
          <div>
            <p className="subtitle">Análises</p>
            <h1>Relatórios</h1>
          </div>
        </header>

        <section className="cards">
          <article className="card">
            <p>Total de movimentações</p>
            <strong>{totalMovimentacoes}</strong>
          </article>

          <article className="card">
            <p>Resultado acumulado</p>

            <strong
              className={
                resultado >= 0
                  ? "positive"
                  : "negative"
              }
            >
              {formatarValor(resultado)}
            </strong>
          </article>

          <article className="card">
            <p>Margem financeira</p>
            <strong>{margem.toFixed(1)}%</strong>
          </article>

          <article className="card">
            <p>Pendências totais</p>
            <strong>{pendencias}</strong>
          </article>
        </section>

        <section className="panel">
          <div className="empty-state">
            <strong>Relatório resumido disponível</strong>

            <p>
              Os próximos passos poderão incluir gráficos,
              filtros por período e exportação.
            </p>
          </div>
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
            tipo: "receita",
            textoBotao: "Salvar receita",
          })}

          {renderLista({
            titulo: "Receitas cadastradas",
            subtitulo: "Histórico",
            lista: receitas,
            setLista: setReceitas,
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
            tipo: "despesa",
            textoBotao: "Salvar despesa",
          })}

          {renderLista({
            titulo: "Despesas cadastradas",
            subtitulo: "Histórico",
            lista: despesas,
            setLista: setDespesas,
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
            tipo: "conta-pagar",
            textoBotao: "Salvar conta a pagar",
          })}

          {renderLista({
            titulo: "Contas cadastradas",
            subtitulo: "Controle",
            lista: contasPagar,
            setLista: setContasPagar,
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
            tipo: "conta-receber",
            textoBotao: "Salvar conta a receber",
          })}

          {renderLista({
            titulo: "Recebimentos cadastrados",
            subtitulo: "Controle",
            lista: contasReceber,
            setLista: setContasReceber,
          })}
        </>
      );
    }

    if (pagina === "relatorios") {
      return renderRelatorios();
    }

    return renderDashboard();
  }

  return (
    <div className="app">
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
              className={
                pagina === item.id ? "active" : ""
              }
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
          <strong>Versão 1.0</strong>
          <span>Dados salvos automaticamente</span>
        </div>
      </aside>

      <main className="content">
        {renderizarPagina()}
      </main>
    </div>
  );
}

export default App;