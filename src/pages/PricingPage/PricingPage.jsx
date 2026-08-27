/**
 * @fileoverview PricingPage — Página de planes y pasarela de pago con Stripe (Mejora 26).
 *
 * CARACTERÍSTICAS:
 * - Selector interactivo de facturación Mensual / Anual (con 20% de descuento).
 * - 3 Planes de suscripción detallados con lista de características.
 * - Integración con CheckoutModal y simulación segura de tokenización de pagos.
 * - Sección de Preguntas Frecuentes (FAQ) accesible.
 *
 * @module pages/PricingPage
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutModal from '../../components/ui/CheckoutModal/CheckoutModal.jsx'
import './PricingPage.css'

const FAQS = [
  {
    q: '¿Cómo funciona la prueba gratuita?',
    a: 'Puedes explorar el plan gratuito de por vida sin necesidad de ingresar tarjeta de crédito. Los planes Pro y Enterprise cuentan con 14 días de garantía de reembolso.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Aceptamos todas las tarjetas de crédito y débito principales (Visa, Mastercard, American Express, Discover) mediante la pasarela segura de Stripe.',
  },
  {
    q: '¿Puedo cambiar o cancelar mi plan en cualquier momento?',
    a: 'Sí, puedes mejorar, degradar o cancelar tu suscripción en cualquier momento desde tu panel de usuario sin penalizaciones.',
  },
  {
    q: '¿Mis datos de tarjeta están seguros?',
    a: 'Totalmente. La información nunca toca nuestros servidores; es tokenizada directamente por los estándares PCI-DSS de Stripe con cifrado SSL de 256 bits.',
  },
]

function PricingPage() {
  const navigate = useNavigate()
  const [annualBilling, setAnnualBilling] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const plans = [
    {
      id: 'free',
      name: 'Comunidad',
      badge: 'Básico',
      price: 0,
      period: 'siempre gratis',
      description: 'Ideal para desarrolladores que inician y quieren explorar el roadmap.',
      features: [
        'Acceso a las primeras 25 mejoras',
        'Documentación técnica básica',
        'Visualizador de gráficos SVG nativos',
        'Soporte comunitario en GitHub',
      ],
      isPopular: false,
      buttonText: 'Empezar Gratis',
    },
    {
      id: 'pro',
      name: 'Desarrollador Pro',
      badge: 'Más Popular',
      price: annualBilling ? 15 : 19,
      period: annualBilling ? 'mes (facturado anual)' : 'mes',
      description: 'Para profesionales que buscan dominar el stack completo con proyectos reales.',
      features: [
        'Acceso a las 100 mejoras completas',
        'Ejemplos de código descargables',
        'Pasarelas de pago y Webhooks',
        'Centro de notificaciones y PWA offline',
        'Soporte prioritario 24/7',
      ],
      isPopular: true,
      buttonText: 'Suscribirme a Pro',
    },
    {
      id: 'enterprise',
      name: 'Empresa / Equipo',
      badge: 'Avanzado',
      price: annualBilling ? 39 : 49,
      period: annualBilling ? 'mes (facturado anual)' : 'mes',
      description: 'Para equipos y startups que requieren integraciones a medida y consultoría.',
      features: [
        'Todo lo incluido en el plan Pro',
        'Licencia para equipos ilimitados',
        'Integración personalizada de WhatsApp & OAuth',
        'Sesiones de mentoría técnica 1-a-1',
        'SLA garantizado del 99.9%',
      ],
      isPopular: false,
      buttonText: 'Contratar Plan Equipo',
    },
  ]

  const handleSelectPlan = (plan) => {
    if (plan.price === 0) {
      navigate('/register')
      return
    }
    setSelectedPlan(plan)
    setCheckoutOpen(true)
  }

  return (
    <main id="main-content" className="page-main">
      <div className="container">

        {/* ── Hero de Precios ── */}
        <section className="page-hero text-center" aria-labelledby="pricing-title">
          <span className="badge badge--brand">💳 Planes & Precios</span>
          <h1 id="pricing-title">
            Invierte en tu <span className="text-gradient">carrera técnica</span>
          </h1>
          <p>
            Planes flexibles diseñados para acompañarte desde los fundamentos
            hasta el despliegue en producción a gran escala.
          </p>

          {/* Toggle Mensual / Anual */}
          <div className="pricing-toggle-wrapper">
            <span className={!annualBilling ? 'pricing-toggle-active' : ''}>Facturación Mensual</span>
            <button
              type="button"
              className={`pricing-toggle${annualBilling ? ' pricing-toggle--annual' : ''}`}
              onClick={() => setAnnualBilling((prev) => !prev)}
              aria-label="Alternar facturación anual con 20% de descuento"
            >
              <span className="pricing-toggle__handle" />
            </button>
            <span className={annualBilling ? 'pricing-toggle-active' : ''}>
              Facturación Anual <strong className="pricing-discount-badge">-20% DTO</strong>
            </span>
          </div>
        </section>

        {/* ── Grid de Planes ── */}
        <div className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`pricing-card${plan.isPopular ? ' pricing-card--popular' : ''}`}
            >
              {plan.isPopular && (
                <div className="pricing-card__badge-ribbon">⭐ RECOMENDADO</div>
              )}
              <div className="pricing-card__header">
                <span className="badge badge--neutral">{plan.badge}</span>
                <h2 className="pricing-card__title">{plan.name}</h2>
                <p className="pricing-card__desc">{plan.description}</p>
              </div>

              <div className="pricing-card__price-box">
                <span className="pricing-card__currency">$</span>
                <span className="pricing-card__amount">{plan.price}</span>
                <span className="pricing-card__period">USD / {plan.period}</span>
              </div>

              <ul className="pricing-card__features" aria-label={`Características del plan ${plan.name}`}>
                {plan.features.map((feat) => (
                  <li key={feat}>
                    <span className="pricing-check" aria-hidden="true">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                className={plan.isPopular ? 'btn-primary pricing-card__btn' : 'btn-secondary pricing-card__btn'}
                onClick={() => handleSelectPlan(plan)}
              >
                {plan.buttonText}
              </button>
            </article>
          ))}
        </div>

        {/* ── FAQ ── */}
        <section className="pricing-faq" aria-labelledby="faq-title">
          <h2 id="faq-title" className="text-center">Preguntas Frecuentes</h2>
          <div className="pricing-faq-grid">
            {FAQS.map((faq) => (
              <div key={faq.q} className="faq-item">
                <h3 className="faq-question">❓ {faq.q}</h3>
                <p className="faq-answer">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Modal de Checkout */}
      {selectedPlan && (
        <CheckoutModal
          isOpen={checkoutOpen}
          onClose={() => setCheckoutOpen(false)}
          plan={selectedPlan}
        />
      )}
    </main>
  )
}

export default PricingPage
