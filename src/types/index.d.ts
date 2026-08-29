/**
 * @fileoverview Definiciones globales de tipos de datos para DevForge (Mejora 36).
 *
 * Provee contratos estricto de tipos e interfaces para TypeScript y JSDoc.
 */

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user' | 'guest'
  avatar?: string | null
  provider?: 'local' | 'google' | 'github'
  twoFactorEnabled?: boolean
  linkedAccounts?: Record<string, boolean>
}

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, pass: string) => Promise<void>
  register: (data: { name: string; email: string; pass: string }) => Promise<void>
  loginWithOAuth: (profile: any, token?: string) => void
  logout: () => void
  getAccessToken: () => string | null
}

export interface ImprovementItem {
  id: number
  num: string
  title: string
  status: 'done' | 'wip' | 'pending'
  commit: string
  description?: string
  phase?: number
}

export interface KanbanTask {
  id: string
  title: string
  category: string
  priority: 'alta' | 'media' | 'baja'
  column: 'todo' | 'in_progress' | 'done'
}

export interface PricingPlan {
  id: string
  name: string
  badge: string
  price: number
  period: string
  description: string
  features: string[]
  isPopular: boolean
  buttonText: string
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: number
}

export interface QRConfig {
  text: string
  size?: number
  color?: string
  bgColor?: string
}

export interface FeedbackData {
  rating: number // 1 a 5
  category: 'usability' | 'performance' | 'security' | 'features'
  comments: string
  wouldRecommend: boolean
}
