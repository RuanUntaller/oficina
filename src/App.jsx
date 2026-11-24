import { useEffect, useState } from 'react'
import './App.css'

const API_ROOT = 'https://oficina-servidor.onrender.com'
const API_URL = `${API_ROOT}/veiculos`
const SERVICES_URL = `${API_ROOT}/servicos`
const EMPTY_FORM = {
  placa: '',
  modelo: '',
  nome_dono: '',
  telefone_dono: '',
}

const FIELD_LABELS = {
  placa: 'Placa',
  modelo: 'Modelo',
  nome_dono: 'Nome do dono',
  telefone_dono: 'Telefone do dono',
}

const EMPTY_SERVICE_FORM = {
  veiculo_id: '',
  descricao_problema: '',
  status: 'aberto',
  data_entrada: '',
  servico_realizado: '',
}

const SERVICE_STATUSES = [
  { value: 'aberto', label: 'Aberto' },
  { value: 'aguardando_peca', label: 'Aguardando peça' },
  { value: 'finalizado', label: 'Finalizado' },
]

async function readResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(body, status) {
  if (typeof body === 'string' && body.trim()) {
    return body
  }

  if (body && typeof body === 'object') {
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message
    }

    if (typeof body.error === 'string' && body.error.trim()) {
      return body.error
    }

    if (typeof body.erro === 'string' && body.erro.trim()) {
      return body.erro
    }

    if (typeof body.detail === 'string' && body.detail.trim()) {
      return body.detail
    }
  }

  return `Não foi possível concluir a operação (erro ${status}).`
}

function isValidEntryDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) === 0) {
    return false
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

async function requestApi(url = API_URL, options = {}) {
  let response
  try {
    response = await fetch(url, options)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    throw new Error('Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.')
  }

  const body = await readResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(body, response.status))
  }

  return body
}

function App() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [validationErrors, setValidationErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [activeView, setActiveView] = useState('vehicles')
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM)
  const [serviceValidationErrors, setServiceValidationErrors] = useState({})
  const [serviceFormError, setServiceFormError] = useState('')
  const [serviceNotice, setServiceNotice] = useState('')
  const [services, setServices] = useState([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState('')
  const [serviceFilter, setServiceFilter] = useState('')
  const [serviceStatusDrafts, setServiceStatusDrafts] = useState({})
  const [updatingServiceId, setUpdatingServiceId] = useState(null)
  const [historyVehicleId, setHistoryVehicleId] = useState('')
  const [historyServices, setHistoryServices] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadVehicles() {
      try {
        const data = await requestApi(API_URL, {
          signal: controller.signal,
        })

        if (!Array.isArray(data)) {
          throw new Error('A resposta do servidor não contém uma lista de veículos.')
        }

        setVehicles(data)
        setListError('')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setListError(error.message || 'Não foi possível carregar os veículos.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadVehicles()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (activeView !== 'services') {
      return undefined
    }

    const controller = new AbortController()

    async function loadServices() {
      setServicesLoading(true)
      setServicesError('')

      try {
        const query = serviceFilter ? `?status=${encodeURIComponent(serviceFilter)}` : ''
        const data = await requestApi(`${SERVICES_URL}${query}`, {
          signal: controller.signal,
        })

        if (!Array.isArray(data)) {
          throw new Error('A resposta do servidor não contém uma lista de ordens de serviço.')
        }

        setServices(data)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setServicesError(error.message || 'Não foi possível carregar as ordens de serviço.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setServicesLoading(false)
        }
      }
    }

    loadServices()

    return () => controller.abort()
  }, [activeView, serviceFilter])

  useEffect(() => {
    if (activeView !== 'services' || !historyVehicleId) {
      return undefined
    }

    const controller = new AbortController()

    async function loadHistory() {
      setHistoryLoading(true)
      setHistoryError('')

      try {
        const data = await requestApi(
          `${API_URL}/${encodeURIComponent(historyVehicleId)}/servicos`,
          { signal: controller.signal },
        )

        if (!Array.isArray(data)) {
          throw new Error('A resposta do servidor não contém um histórico de serviços.')
        }

        setHistoryServices(data)
      } catch (error) {
        if (error.name !== 'AbortError') {
          setHistoryError(error.message || 'Não foi possível carregar o histórico de serviços.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setHistoryLoading(false)
        }
      }
    }

    loadHistory()

    return () => controller.abort()
  }, [activeView, historyVehicleId, historyRefreshKey])

  function handleFieldChange(event) {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
    setValidationErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
    setFormError('')
    setNotice('')
  }

  function resetForm() {
    setForm(EMPTY_FORM)
    setValidationErrors({})
    setFormError('')
    setEditingId(null)
  }

  function handleServiceFieldChange(event) {
    const { name, value } = event.target
    setServiceForm((currentForm) => ({ ...currentForm, [name]: value }))
    setServiceValidationErrors((currentErrors) => ({ ...currentErrors, [name]: '' }))
    setServiceFormError('')
    setServiceNotice('')
  }

  function validateServiceForm() {
    const errors = {}
    if (!serviceForm.veiculo_id) {
      errors.veiculo_id = 'Selecione um veículo.'
    }
    if (!serviceForm.descricao_problema.trim()) {
      errors.descricao_problema = 'Preencha a descrição do problema.'
    }
    if (!SERVICE_STATUSES.some(({ value }) => value === serviceForm.status)) {
      errors.status = 'Selecione um status válido.'
    }
    if (!isValidEntryDate(serviceForm.data_entrada)) {
      errors.data_entrada = 'Informe uma data válida no formato AAAA-MM-DD.'
    }

    setServiceValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  function getServicesUrl() {
    const query = serviceFilter ? `?status=${encodeURIComponent(serviceFilter)}` : ''
    return `${SERVICES_URL}${query}`
  }

  async function refreshServices() {
    const data = await requestApi(getServicesUrl())

    if (!Array.isArray(data)) {
      throw new Error('A resposta do servidor não contém uma lista de ordens de serviço.')
    }

    setServices(data)
    setServicesError('')
  }

  async function handleServiceSubmit(event) {
    event.preventDefault()
    setServiceNotice('')
    setServiceFormError('')

    if (!validateServiceForm()) {
      return
    }

    setSaving(true)

    try {
      const payload = {
        veiculo_id: serviceForm.veiculo_id,
        descricao_problema: serviceForm.descricao_problema.trim(),
        status: serviceForm.status,
        data_entrada: serviceForm.data_entrada,
      }
      if (serviceForm.servico_realizado.trim()) {
        payload.servico_realizado = serviceForm.servico_realizado.trim()
      }

      await requestApi(SERVICES_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      setHistoryRefreshKey((currentKey) => currentKey + 1)
      setServiceForm(EMPTY_SERVICE_FORM)
      setServiceValidationErrors({})

      try {
        await refreshServices()
        setServiceNotice('Ordem de serviço cadastrada com sucesso.')
      } catch (error) {
        setServicesError(error.message || 'Não foi possível atualizar a lista de serviços.')
        setServiceNotice('Ordem de serviço cadastrada com sucesso. A lista pode estar desatualizada.')
      }
    } catch (error) {
      setServiceFormError(error.message || 'Não foi possível cadastrar a ordem de serviço.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateServiceStatus(service) {
    const status = serviceStatusDrafts[service.id] ?? service.status
    setUpdatingServiceId(service.id)
    setServicesError('')
    setServiceNotice('')

    try {
      await requestApi(`${SERVICES_URL}/${encodeURIComponent(service.id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      setHistoryRefreshKey((currentKey) => currentKey + 1)
      setServiceStatusDrafts((currentDrafts) => {
        const nextDrafts = { ...currentDrafts }
        delete nextDrafts[service.id]
        return nextDrafts
      })

      try {
        await refreshServices()
        setServiceNotice('Status da ordem de serviço atualizado com sucesso.')
      } catch (error) {
        setServicesError(error.message || 'Não foi possível atualizar a lista de serviços.')
        setServiceNotice('Status atualizado com sucesso. A lista pode estar desatualizada.')
      }
    } catch (error) {
      setServicesError(error.message || 'Não foi possível atualizar o status da ordem de serviço.')
    } finally {
      setUpdatingServiceId(null)
    }
  }

  function handleViewHistory(vehicle) {
    setHistoryServices([])
    setHistoryError('')
    setHistoryLoading(false)
    setHistoryVehicleId(vehicle.id)
    setActiveView('services')
  }

  function handleHistoryVehicleChange(event) {
    setHistoryServices([])
    setHistoryError('')
    setHistoryLoading(false)
    setHistoryVehicleId(event.target.value)
  }

  function validateForm() {
    const errors = Object.fromEntries(
      Object.entries(form)
        .filter(([, value]) => !value.trim())
        .map(([field]) => [field, `Preencha ${FIELD_LABELS[field].toLowerCase()}.`]),
    )

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function refreshVehicles() {
    const data = await requestApi()

    if (!Array.isArray(data)) {
      throw new Error('A resposta do servidor não contém uma lista de veículos.')
    }

    setVehicles(data)
    setListError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    setFormError('')

    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const url = editingId === null ? API_URL : `${API_URL}/${editingId}`
      const method = editingId === null ? 'POST' : 'PUT'
      const successMessage =
        editingId === null ? 'Veículo cadastrado com sucesso.' : 'Veículo atualizado com sucesso.'

      await requestApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      resetForm()

      try {
        await refreshVehicles()
        setNotice(successMessage)
      } catch (error) {
        setListError(error.message || 'Não foi possível atualizar a lista de veículos.')
        setNotice(`${successMessage} A lista pode estar desatualizada.`)
      }
    } catch (error) {
      setFormError(error.message || 'Não foi possível salvar o veículo.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(vehicle) {
    setEditingId(vehicle.id)
    setForm({
      placa: vehicle.placa ?? '',
      modelo: vehicle.modelo ?? '',
      nome_dono: vehicle.nome_dono ?? '',
      telefone_dono: vehicle.telefone_dono ?? '',
    })
    setValidationErrors({})
    setFormError('')
    setNotice('')
    document.getElementById('formulario-veiculo')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  async function handleDelete(vehicle) {
    const confirmed = window.confirm(
      `Tem certeza de que deseja excluir o veículo ${vehicle.placa}?`,
    )

    if (!confirmed) {
      return
    }

    setDeletingId(vehicle.id)
    setNotice('')
    setListError('')

    try {
      await requestApi(`${API_URL}/${vehicle.id}`, { method: 'DELETE' })

      try {
        await refreshVehicles()
        setNotice('Veículo excluído com sucesso.')
      } catch (error) {
        setListError(error.message || 'Não foi possível atualizar a lista de veículos.')
        setNotice('Veículo excluído com sucesso. A lista pode estar desatualizada.')
      }
    } catch (error) {
      setListError(error.message || 'Não foi possível excluir o veículo.')
    } finally {
      setDeletingId(null)
    }
  }

  function renderField(field, label, type = 'text') {
    const errorId = `${field}-erro`

    return (
      <div className={`form-field${validationErrors[field] ? ' form-field--invalid' : ''}`}>
        <label htmlFor={field}>{label}</label>
        <input
          id={field}
          name={field}
          type={type}
          value={form[field]}
          onChange={handleFieldChange}
          required
          aria-invalid={Boolean(validationErrors[field])}
          aria-describedby={validationErrors[field] ? errorId : undefined}
        />
        {validationErrors[field] && (
          <span className="field-error" id={errorId}>
            {validationErrors[field]}
          </span>
        )}
      </div>
    )
  }

  return (
    <main className="app-shell">
      <header className="page-header">
        <p className="eyebrow">Oficina Moura</p>
        <h1>{activeView === 'vehicles' ? 'Veículos' : 'Ordens de serviço'}</h1>
        <p className="page-description">
          {activeView === 'vehicles'
            ? 'Cadastre e mantenha os veículos dos clientes organizados.'
            : 'Cadastre, acompanhe e consulte o histórico das ordens de serviço.'}
        </p>
      </header>

      <nav className="page-navigation" aria-label="Seções do sistema">
        <button
          className={`button ${activeView === 'vehicles' ? 'button--primary' : 'button--secondary'}`}
          type="button"
          onClick={() => setActiveView('vehicles')}
          aria-current={activeView === 'vehicles' ? 'page' : undefined}
        >
          Veículos
        </button>
        <button
          className={`button ${activeView === 'services' ? 'button--primary' : 'button--secondary'}`}
          type="button"
          onClick={() => setActiveView('services')}
          aria-current={activeView === 'services' ? 'page' : undefined}
        >
          Ordens de serviço
        </button>
      </nav>

      {activeView === 'vehicles' && (
        <>
      <section className="panel form-panel" id="formulario-veiculo">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Cadastro</p>
            <h2>{editingId === null ? 'Adicionar veículo' : 'Editar veículo'}</h2>
          </div>
          {editingId !== null && (
            <button className="button button--secondary" type="button" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            {renderField('placa', 'Placa')}
            {renderField('modelo', 'Modelo')}
            {renderField('nome_dono', 'Nome do dono')}
            {renderField('telefone_dono', 'Telefone do dono', 'tel')}
          </div>

          {formError && (
            <p className="feedback feedback--error" role="alert">
              {formError}
            </p>
          )}

          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>
              {saving ? 'Salvando...' : editingId === null ? 'Cadastrar veículo' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </section>

      <section className="panel list-panel" aria-labelledby="lista-titulo">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Clientes e veículos</p>
            <h2 id="lista-titulo">Veículos cadastrados</h2>
          </div>
          {!loading && !listError && (
            <span className="vehicle-count">
              {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'}
            </span>
          )}
        </div>

        {notice && (
          <p className="feedback feedback--success" role="status">
            {notice}
          </p>
        )}
        {listError && (
          <p className="feedback feedback--error" role="alert">
            {listError}
          </p>
        )}
        {loading && <p className="empty-state">Carregando veículos...</p>}
        {!loading && !listError && vehicles.length === 0 && (
          <p className="empty-state">Nenhum veículo cadastrado. Use o formulário para adicionar o primeiro.</p>
        )}
        {!loading && !listError && vehicles.length > 0 && (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th scope="col">Placa</th>
                  <th scope="col">Modelo</th>
                  <th scope="col">Nome do dono</th>
                  <th scope="col">Telefone</th>
                  <th scope="col"><span className="visually-hidden">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td data-label="Placa">{vehicle.placa}</td>
                    <td data-label="Modelo">{vehicle.modelo}</td>
                    <td data-label="Nome do dono">{vehicle.nome_dono}</td>
                    <td data-label="Telefone">{vehicle.telefone_dono}</td>
                    <td className="table-actions" data-label="Ações">
                      <button
                        className="button button--small button--secondary"
                        type="button"
                        onClick={() => handleEdit(vehicle)}
                        disabled={deletingId !== null}
                      >
                        Editar
                      </button>
                      <button
                        className="button button--small button--secondary"
                        type="button"
                        onClick={() => handleViewHistory(vehicle)}
                      >
                        Histórico
                      </button>
                      <button
                        className="button button--small button--danger"
                        type="button"
                        onClick={() => handleDelete(vehicle)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === vehicle.id ? 'Excluindo...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
        </>
      )}

      {activeView === 'services' && (
        <>
          <section className="panel form-panel" aria-labelledby="formulario-servico-titulo">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Cadastro</p>
                <h2 id="formulario-servico-titulo">Nova ordem de serviço</h2>
              </div>
            </div>

            <form onSubmit={handleServiceSubmit} noValidate>
              <div className="form-grid">
                <div className={`form-field${serviceValidationErrors.veiculo_id ? ' form-field--invalid' : ''}`}>
                  <label htmlFor="servico-veiculo">Veículo</label>
                  <select
                    id="servico-veiculo"
                    name="veiculo_id"
                    value={serviceForm.veiculo_id}
                    onChange={handleServiceFieldChange}
                    required
                    disabled={loading || Boolean(listError) || vehicles.length === 0}
                    aria-invalid={Boolean(serviceValidationErrors.veiculo_id)}
                    aria-describedby={serviceValidationErrors.veiculo_id ? 'servico-veiculo-erro' : undefined}
                  >
                    <option value="">Selecione um veículo</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.placa} — {vehicle.modelo}
                      </option>
                    ))}
                  </select>
                  {serviceValidationErrors.veiculo_id && (
                    <span className="field-error" id="servico-veiculo-erro">
                      {serviceValidationErrors.veiculo_id}
                    </span>
                  )}
                  {listError && <span className="field-error">{listError}</span>}
                  {!loading && !listError && vehicles.length === 0 && (
                    <span className="field-hint">Cadastre um veículo antes de abrir uma ordem de serviço.</span>
                  )}
                </div>

                <div className={`form-field${serviceValidationErrors.status ? ' form-field--invalid' : ''}`}>
                  <label htmlFor="servico-status">Status</label>
                  <select
                    id="servico-status"
                    name="status"
                    value={serviceForm.status}
                    onChange={handleServiceFieldChange}
                    required
                    aria-invalid={Boolean(serviceValidationErrors.status)}
                    aria-describedby={serviceValidationErrors.status ? 'servico-status-erro' : undefined}
                  >
                    {SERVICE_STATUSES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {serviceValidationErrors.status && (
                    <span className="field-error" id="servico-status-erro">
                      {serviceValidationErrors.status}
                    </span>
                  )}
                </div>

                <div className={`form-field${serviceValidationErrors.descricao_problema ? ' form-field--invalid' : ''}`}>
                  <label htmlFor="descricao-problema">Descrição do problema</label>
                  <textarea
                    id="descricao-problema"
                    name="descricao_problema"
                    value={serviceForm.descricao_problema}
                    onChange={handleServiceFieldChange}
                    required
                    aria-invalid={Boolean(serviceValidationErrors.descricao_problema)}
                    aria-describedby={serviceValidationErrors.descricao_problema
                      ? 'descricao-problema-erro'
                      : undefined}
                  />
                  {serviceValidationErrors.descricao_problema && (
                    <span className="field-error" id="descricao-problema-erro">
                      {serviceValidationErrors.descricao_problema}
                    </span>
                  )}
                </div>

                <div className={`form-field${serviceValidationErrors.data_entrada ? ' form-field--invalid' : ''}`}>
                  <label htmlFor="data-entrada">Data de entrada</label>
                  <input
                    id="data-entrada"
                    name="data_entrada"
                    type="date"
                    value={serviceForm.data_entrada}
                    onChange={handleServiceFieldChange}
                    required
                    aria-invalid={Boolean(serviceValidationErrors.data_entrada)}
                    aria-describedby={serviceValidationErrors.data_entrada ? 'data-entrada-erro' : undefined}
                  />
                  {serviceValidationErrors.data_entrada && (
                    <span className="field-error" id="data-entrada-erro">
                      {serviceValidationErrors.data_entrada}
                    </span>
                  )}
                </div>

                <div className="form-field form-field--full">
                  <label htmlFor="servico-realizado">Serviço realizado (opcional)</label>
                  <textarea
                    id="servico-realizado"
                    name="servico_realizado"
                    value={serviceForm.servico_realizado}
                    onChange={handleServiceFieldChange}
                  />
                </div>
              </div>

              {serviceFormError && (
                <p className="feedback feedback--error" role="alert">
                  {serviceFormError}
                </p>
              )}

              <div className="form-actions">
                <button className="button button--primary" type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Cadastrar ordem de serviço'}
                </button>
              </div>
            </form>
          </section>

          <section className="panel list-panel" aria-labelledby="lista-servicos-titulo">
            <div className="section-heading services-heading">
              <div>
                <p className="eyebrow">Acompanhamento</p>
                <h2 id="lista-servicos-titulo">Ordens de serviço</h2>
              </div>
              <label className="filter-field" htmlFor="filtro-status">
                <span>Filtrar por status</span>
                <select
                  id="filtro-status"
                  value={serviceFilter}
                  onChange={(event) => setServiceFilter(event.target.value)}
                >
                  <option value="">Todos</option>
                  {SERVICE_STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            {serviceNotice && (
              <p className="feedback feedback--success" role="status">{serviceNotice}</p>
            )}
            {servicesError && (
              <p className="feedback feedback--error" role="alert">{servicesError}</p>
            )}
            {servicesLoading && <p className="empty-state">Carregando ordens de serviço...</p>}
            {!servicesLoading && !servicesError && services.length === 0 && (
              <p className="empty-state">
                Nenhuma ordem de serviço encontrada para o filtro selecionado.
              </p>
            )}
            {!servicesLoading && !servicesError && services.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Veículo</th>
                      <th scope="col">Descrição do problema</th>
                      <th scope="col">Data de entrada</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="visually-hidden">Ações</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => {
                      const vehicleLabel = service.placa && service.modelo
                        ? `${service.placa} — ${service.modelo}`
                        : 'Veículo excluído'
                      const selectedStatus = serviceStatusDrafts[service.id] ?? service.status

                      return (
                        <tr key={service.id}>
                          <td data-label="Veículo">{vehicleLabel}</td>
                          <td data-label="Descrição do problema">{service.descricao_problema}</td>
                          <td data-label="Data de entrada">{service.data_entrada}</td>
                          <td data-label="Status">
                            <select
                              className="inline-status"
                              aria-label={`Status da ordem de serviço ${service.id}`}
                              value={selectedStatus}
                              onChange={(event) => setServiceStatusDrafts((currentDrafts) => ({
                                ...currentDrafts,
                                [service.id]: event.target.value,
                              }))}
                              disabled={updatingServiceId !== null}
                            >
                              {SERVICE_STATUSES.map(({ value, label }) => (
                                <option key={value} value={value}>{label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="table-actions" data-label="Ações">
                            <button
                              className="button button--small button--primary"
                              type="button"
                              onClick={() => handleUpdateServiceStatus(service)}
                              disabled={updatingServiceId !== null || selectedStatus === service.status}
                            >
                              {updatingServiceId === service.id ? 'Salvando...' : 'Salvar status'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="panel history-panel" aria-labelledby="historico-servicos-titulo">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Veículo selecionado</p>
                <h2 id="historico-servicos-titulo">Histórico de serviços</h2>
              </div>
            </div>

            <div className="history-control">
              <label className="form-field" htmlFor="historico-veiculo">
                <span>Consultar histórico do veículo</span>
                <select
                  id="historico-veiculo"
                  value={historyVehicleId}
                  onChange={handleHistoryVehicleChange}
                >
                  <option value="">Selecione um veículo</option>
                  {historyVehicleId && !vehicles.some((vehicle) => vehicle.id === historyVehicleId) && (
                    <option value={historyVehicleId}>Veículo não encontrado na lista</option>
                  )}
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.placa} — {vehicle.modelo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {historyError && <p className="feedback feedback--error" role="alert">{historyError}</p>}
            {historyLoading && <p className="empty-state">Carregando histórico...</p>}
            {!historyLoading && !historyError && !historyVehicleId && (
              <p className="empty-state">Selecione um veículo para consultar o histórico.</p>
            )}
            {!historyLoading && !historyError && historyVehicleId && historyServices.length === 0 && (
              <p className="empty-state">Este veículo ainda não possui ordens de serviço.</p>
            )}
            {!historyLoading && !historyError && historyServices.length > 0 && (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th scope="col">Descrição do problema</th>
                      <th scope="col">Data de entrada</th>
                      <th scope="col">Status</th>
                      <th scope="col">Serviço realizado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyServices.map((service) => (
                      <tr key={service.id}>
                        <td data-label="Descrição do problema">{service.descricao_problema}</td>
                        <td data-label="Data de entrada">{service.data_entrada}</td>
                        <td data-label="Status">
                          {SERVICE_STATUSES.find(({ value }) => value === service.status)?.label
                            ?? service.status}
                        </td>
                        <td data-label="Serviço realizado">{service.servico_realizado || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  )
}

export default App
