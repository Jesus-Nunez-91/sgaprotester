/**
 * Utilidades de validación para dominios institucionales UAH.
 * Restricciones estrictas según requerimiento de TICS:
 * 1. Solo se permite el correo específico admin@uah.cl (no el dominio completo).
 * 2. Se permiten los dominios @alumnos.uahurtado.cl y @uahurtado.cl.
 */

export const ALLOWED_DOMAINS = [
  'uahurtado.cl',
  'alumnos.uahurtado.cl'
];

export const SPECIAL_ALLOWED_EMAILS = [
  'admin@uah.cl'
];

/**
 * Valida si un correo electrónico pertenece a los dominios permitidos o excepciones especiales.
 * @param email Correo a validar
 * @returns boolean
 */
export function validateInstitucionalEmail(email: string): boolean {
  if (!email) return false;
  const lowerEmail = email.toLowerCase();
  
  // 1. Verificar si es un correo especial permitido (ej: admin@uah.cl)
  if (SPECIAL_ALLOWED_EMAILS.includes(lowerEmail)) {
    return true;
  }

  // 2. Verificar si pertenece a los dominios autorizados
  const domain = lowerEmail.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
}

/**
 * Mensaje de error estándar para dominios no autorizados.
 */
export const DOMAIN_ERROR_MESSAGE = 'Acceso denegado: Solo se permiten correos @uahurtado.cl, @alumnos.uahurtado.cl o el administrador institucional.';
