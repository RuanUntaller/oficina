import { useEffect, useState } from 'react'

function App() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchBackendStatus() {
      try {
        const response = await fetch('https://oficina-servidor.onrender.com', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Erro ao consultar o backend (${response.status})`)
        }

        const body = await response.text()
        let serverMessage = body

        try {
          const data = JSON.parse(body)
          if (typeof data?.message === 'string') {
            serverMessage = data.message
          }
        } catch {
          // A resposta pode ser texto simples.
        }

        if (!serverMessage.trim()) {
          throw new Error('O backend retornou uma resposta vazia')
        }

        setMessage(serverMessage)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Não foi possível conectar ao backend')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchBackendStatus()

    return () => controller.abort()
  }, [])

  return (
    <main>
      <h1>Status do backend</h1>
      {loading && <p>Carregando...</p>}
      {error && <p role="alert">Erro: {error}</p>}
      {message && <p>{message}</p>}
    </main>
  )
}

export default App
