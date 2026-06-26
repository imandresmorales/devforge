/**
 * @fileoverview FetchDemo — demo interactivo del hook useFetch.
 *
 * Muestra en vivo:
 * - Estado loading con spinner CSS
 * - Estado error con mensaje legible
 * - Datos de la API pública JSONPlaceholder
 * - Botón de refetch
 * - Cambio dinámico de endpoint
 * - Snippet de código del hook
 *
 * @module components/ui/FetchDemo
 */
import { useState } from 'react'
import { useFetch } from '../../../hooks/useFetch'
import { truncate } from '../../../utils'
import './FetchDemo.css'

/** Endpoints disponibles para demo */
const ENDPOINTS = [
  { id: 'posts', label: '/posts', url: 'https://jsonplaceholder.typicode.com/posts?_limit=5' },
  { id: 'users', label: '/users', url: 'https://jsonplaceholder.typicode.com/users?_limit=5' },
  { id: 'error', label: '/error (404)', url: 'https://jsonplaceholder.typicode.com/invalid-endpoint' },
]

/**
 * Tarjeta de Post.
 * @param {{ post: {id: number, title: string, body: string} }} props
 */
function PostCard({ post }) {
  return (
    <article className="fetch-demo__post-card">
      <div className="fetch-demo__post-id" aria-label={`Post ID ${post.id}`}>
        #{post.id}
      </div>
      <h3 className="fetch-demo__post-title">{post.title}</h3>
      <p className="fetch-demo__post-body">{truncate(post.body, 120)}</p>
    </article>
  )
}

/**
 * Tarjeta de Usuario.
 * @param {{ user: {id: number, name: string, email: string, company: {name: string}} }} props
 */
function UserCard({ user }) {
  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <article className="fetch-demo__user-card">
      <div className="fetch-demo__user-avatar" aria-hidden="true">
        {initials}
      </div>
      <div>
        <div className="fetch-demo__user-name">{user.name}</div>
        <div className="fetch-demo__user-email">{user.email}</div>
        <div className="fetch-demo__user-company">{user.company?.name}</div>
      </div>
    </article>
  )
}

/**
 * Componente demo interactivo del hook useFetch.
 * @returns {JSX.Element}
 */
function FetchDemo() {
  const [activeEndpointId, setActiveEndpointId] = useState('posts')

  const activeEndpoint = ENDPOINTS.find((e) => e.id === activeEndpointId)
  const { data, isLoading, error, refetch } = useFetch(activeEndpoint.url)

  return (
    <div className="fetch-demo">
      <div className="fetch-demo__header">
        <div>
          <h2 className="fetch-demo__title">
            🪝 Demo — <span className="text-gradient">useFetch</span>
          </h2>
          <p className="fetch-demo__subtitle">
            Hook personalizado con <strong>AbortController</strong>, manejo de errores
            HTTP y cancelación automática al desmontar el componente.
          </p>
        </div>
        <button
          className="fetch-demo__refetch-btn"
          onClick={refetch}
          disabled={isLoading}
          aria-label="Volver a hacer la petición"
        >
          <span aria-hidden="true">{isLoading ? '⏳' : '🔄'}</span>
          Refetch
        </button>
      </div>

      {/* Selector de endpoint */}
      <div
        className="fetch-demo__controls"
        role="group"
        aria-label="Seleccionar endpoint de prueba"
      >
        {ENDPOINTS.map((ep) => (
          <button
            key={ep.id}
            className={`fetch-demo__endpoint-btn${activeEndpointId === ep.id ? ' active' : ''}`}
            onClick={() => setActiveEndpointId(ep.id)}
            aria-pressed={activeEndpointId === ep.id}
          >
            {ep.label}
          </button>
        ))}
      </div>

      {/* Resultado */}
      <div aria-live="polite" aria-atomic="true">
        {isLoading && (
          <div className="fetch-demo__loading" role="status">
            <div className="fetch-demo__spinner" aria-hidden="true" />
            Cargando datos de {activeEndpoint.url}…
          </div>
        )}

        {!isLoading && error && (
          <div className="fetch-demo__error" role="alert">
            <span aria-hidden="true">❌</span>
            <div>
              <strong>Error en la petición:</strong><br />
              {error}
            </div>
          </div>
        )}

        {!isLoading && !error && data && (
          <div className="fetch-demo__results">
            {Array.isArray(data) && activeEndpointId === 'posts' &&
              data.map((post) => <PostCard key={post.id} post={post} />)
            }
            {Array.isArray(data) && activeEndpointId === 'users' &&
              data.map((user) => <UserCard key={user.id} user={user} />)
            }
          </div>
        )}
      </div>

      {/* Snippet de código */}
      <div className="fetch-demo__code-info" aria-label="Ejemplo de uso del hook useFetch">
        <div className="fetch-demo__code-comment">{'// Uso del hook useFetch'}</div>
        <div>
          <span className="fetch-demo__code-keyword">const </span>
          <span className="fetch-demo__code-var">{'{ data, isLoading, error, refetch }'} </span>
          <span>= </span>
          <span className="fetch-demo__code-keyword">useFetch</span>
          <span>(</span>
          <span className="fetch-demo__code-string">'{activeEndpoint.url}'</span>
          <span>)</span>
        </div>
        <div className="fetch-demo__code-comment">
          {'// AbortController cancela la petición al desmontar el componente'}
        </div>
      </div>
    </div>
  )
}

export default FetchDemo
