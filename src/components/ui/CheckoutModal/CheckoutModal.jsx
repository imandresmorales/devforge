/**
 * @fileoverview Modal de Checkout interactivo con Stripe (Mejora 26).
 *
 * CARACTERÍSTICAS:
 * - Previsualización de tarjeta de crédito interactiva en vivo con cambio de franquicia.
 * - Validación matemática con Algoritmo de Luhn para números de tarjeta.
 * - Tokenización simulada (Stripe Elements pattern).
 * - Feedback accesible con aria-live y roles de diálogo.
 *
 * @module components/ui/CheckoutModal
 */
import { useState, useId } from 'react'
import Modal from '../Modal/Modal.jsx'
import {
  validateLuhn,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
  simulateStripeToken,
} from '../../../utils/stripe'
import { useToast } from '../../../context/ToastContext'
import './CheckoutModal.css'

function CheckoutModal({ isOpen, onClose, plan }) {
  const formId = useId()
  const { addToast } = useToast()

  const [cardHolder, setCardHolder] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(null)

  const brand = detectCardBrand(cardNumber)

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value)
    setCardNumber(formatted)
    if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: null }))
  }

  const handleExpiryChange = (e) => {
    const formatted = formatExpiry(e.target.value)
    setExpiry(formatted)
    if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: null }))
  }

  const handleCvcChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCvc(clean)
    if (errors.cvc) setErrors((prev) => ({ ...prev, cvc: null }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!cardHolder.trim()) {
      newErrors.cardHolder = 'El nombre del titular es obligatorio.'
    }

    if (!cardNumber.trim()) {
      newErrors.cardNumber = 'Introduce el número de tarjeta.'
    } else if (!validateLuhn(cardNumber)) {
      newErrors.cardNumber = 'Número de tarjeta inválido (falla validación Luhn).'
    }

    if (!expiry.trim()) {
      newErrors.expiry = 'Fecha requerida.'
    } else if (!validateExpiry(expiry)) {
      newErrors.expiry = 'Fecha inválida o vencida.'
    }

    if (!cvc.trim() || cvc.length < 3) {
      newErrors.cvc = 'CVC inválido (3 o 4 dígitos).'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsProcessing(true)

    try {
      const result = await simulateStripeToken({
        number: cardNumber,
        name: cardHolder,
        expiry,
        cvc,
      })

      setPaymentSuccess(result)
      addToast({
        type: 'success',
        title: '¡Pago completado con éxito!',
        message: `Suscripción al plan ${plan?.name} activada (Token: ${result.token.slice(0, 14)}…).`,
      })
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Fallo en la transacción',
        message: err.message || 'Error al procesar el pago.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setCardHolder('')
    setCardNumber('')
    setExpiry('')
    setCvc('')
    setErrors({})
    setPaymentSuccess(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title={paymentSuccess ? 'Confirmación de Suscripción' : `Suscripción: Plan ${plan?.name || 'Pro'}`}
    >
      {paymentSuccess ? (
        <div className="checkout-success" role="status">
          <div className="checkout-success__icon" aria-hidden="true">🎉</div>
          <h3 className="checkout-success__title">¡Gracias por tu compra!</h3>
          <p className="checkout-success__desc">
            Tu pago ha sido procesado de forma segura con Stripe.
          </p>

          <div className="checkout-receipt">
            <div className="checkout-receipt__row">
              <span>Plan:</span>
              <strong>{plan?.name}</strong>
            </div>
            <div className="checkout-receipt__row">
              <span>Monto:</span>
              <strong>${plan?.price} USD / {plan?.period}</strong>
            </div>
            <div className="checkout-receipt__row">
              <span>Método de pago:</span>
              <span className="checkout-receipt__card">
                {paymentSuccess.brand.toUpperCase()} terminada en •••• {paymentSuccess.last4}
              </span>
            </div>
            <div className="checkout-receipt__row">
              <span>ID Transacción:</span>
              <code className="checkout-receipt__token">{paymentSuccess.token}</code>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary checkout-success__btn"
            onClick={handleReset}
          >
            Ir a mi Dashboard
          </button>
        </div>
      ) : (
        <div className="checkout-body">
          {/* Previsualización de la Tarjeta Interactiva */}
          <div className={`credit-card credit-card--${brand}`} aria-hidden="true">
            <div className="credit-card__chip" />
            <div className="credit-card__brand">
              {brand === 'visa' && 'VISA'}
              {brand === 'mastercard' && 'Mastercard'}
              {brand === 'amex' && 'AMEX'}
              {brand === 'discover' && 'Discover'}
              {brand === 'unknown' && 'CARD'}
            </div>
            <div className="credit-card__number">
              {cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="credit-card__footer">
              <div className="credit-card__holder">
                <small>TITULAR</small>
                <span>{cardHolder || 'NOMBRE DEL TITULAR'}</span>
              </div>
              <div className="credit-card__exp">
                <small>EXP</small>
                <span>{expiry || 'MM/YY'}</span>
              </div>
            </div>
          </div>

          {/* Formulario de Checkout */}
          <form className="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor={`${formId}-holder`}>
                Titular de la tarjeta
              </label>
              <input
                id={`${formId}-holder`}
                type="text"
                className={`form-input${errors.cardHolder ? ' form-input--error' : ''}`}
                placeholder="Nombre como aparece en la tarjeta"
                value={cardHolder}
                onChange={(e) => {
                  setCardHolder(e.target.value)
                  if (errors.cardHolder) setErrors((prev) => ({ ...prev, cardHolder: null }))
                }}
                disabled={isProcessing}
                autoComplete="cc-name"
              />
              {errors.cardHolder && <span className="form-error">⚠ {errors.cardHolder}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor={`${formId}-number`}>
                Número de tarjeta
              </label>
              <input
                id={`${formId}-number`}
                type="text"
                className={`form-input${errors.cardNumber ? ' form-input--error' : ''}`}
                placeholder="4000 1234 5678 9010"
                value={cardNumber}
                onChange={handleCardNumberChange}
                disabled={isProcessing}
                autoComplete="cc-number"
                maxLength={19}
              />
              {errors.cardNumber && <span className="form-error">⚠ {errors.cardNumber}</span>}
            </div>

            <div className="checkout-row">
              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-expiry`}>
                  Expiración
                </label>
                <input
                  id={`${formId}-expiry`}
                  type="text"
                  className={`form-input${errors.expiry ? ' form-input--error' : ''}`}
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  disabled={isProcessing}
                  autoComplete="cc-exp"
                  maxLength={5}
                />
                {errors.expiry && <span className="form-error">⚠ {errors.expiry}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`${formId}-cvc`}>
                  CVC / CVV
                </label>
                <input
                  id={`${formId}-cvc`}
                  type="password"
                  className={`form-input${errors.cvc ? ' form-input--error' : ''}`}
                  placeholder="123"
                  value={cvc}
                  onChange={handleCvcChange}
                  disabled={isProcessing}
                  autoComplete="cc-csc"
                  maxLength={4}
                />
                {errors.cvc && <span className="form-error">⚠ {errors.cvc}</span>}
              </div>
            </div>

            <div className="checkout-security-badge" aria-label="Seguridad de la transacción">
              <span aria-hidden="true">🔒</span>
              <span>Encriptación SSL de 256-bit y cumplimiento PCI-DSS simulado.</span>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={isProcessing}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isProcessing}
              >
                {isProcessing ? 'Procesando pago…' : `Pagar $${plan?.price || 19} USD`}
              </button>
            </div>
          </form>
        </div>
      )}
    </Modal>
  )
}

export default CheckoutModal
