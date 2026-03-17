/**
 * Utilidades de validación para dominios institucionales UAH.
 */

export const ALLOWED_DOMAINS = [
  'uah.cl',
  'uahurtado.cl',
  'alumnos.uahurtado.cl'
];

/**
 * Valida si un correo electrónico pertenece a los dominios permitidos.
 * @param email Correo a validar
 * @returns boolean
 */
export function validateInstitucionalEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Mensaje de error estándar para dominios no autorizados.
 */
export const DOMAIN_ERROR_MESSAGE = 'Acceso denegado: Solo se permiten correos institucionales de la Universidad Alberto Hurtado.';
