import { useEffect, useState } from 'react'
import './App.css'

const API_URL = 'https://oficina-servidor.onrender.com/veiculos'
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

    if (typeof body.detail === 'string' && body.detail.trim()) {
      return body.detail
    }
  }

  return `Não foi possível concluir a operação (erro ${status}).`
}

async function requestVehicles(url = API_URL, options = {}) {
  const response = await fetch(url, options)
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

  useEffect(() => {
    const controller = new AbortController()

    async function loadVehicles() {
      try {
        const data = await requestVehicles(API_URL, {
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
    const data = await requestVehicles()

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

      await requestVehicles(url, {
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
      await requestVehicles(`${API_URL}/${vehicle.id}`, { method: 'DELETE' })

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
        <h1>Veículos</h1>
        <p className="page-description">
          Cadastre e mantenha os veículos dos clientes organizados.
        </p>
      </header>

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
    </main>
  )
}

export default App
