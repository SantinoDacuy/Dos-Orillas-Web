import { contactCopy } from '@/content/site';

export const contactFeedback = {
  optional: 'Opcional',
  alternative: 'Escribinos por email →',
  noJavaScript: 'Podés escribirnos directamente por email.',
  unavailable: 'El formulario no está disponible por ahora. Podés escribirnos por email.',
  uncertain: 'No pudimos confirmar el envío. Podés escribirnos por email; tu mensaje sigue en el formulario.',
  bodyTimeout: 'La lectura del mensaje tardó demasiado. Probá de nuevo o escribinos por email.',
  rateLimited: 'Recibimos varios intentos seguidos. Esperá unos minutos o escribinos por email.',
  invalidRequest: 'No pudimos procesar el mensaje. Revisá los campos o escribinos por email.',
  tooLarge: 'El mensaje es demasiado largo. Acortalo o escribinos por email.',
  copyFailed: 'No pudimos copiar el email. Podés seleccionarlo o abrir el enlace.',
  validations: {
    name: contactCopy.errors.name,
    email: contactCopy.errors.email,
    organization: 'Revisá el nombre del negocio o empresa.',
    message: contactCopy.errors.message,
    nameTooLong: 'Usá hasta 120 caracteres para tu nombre.',
    organizationTooLong: 'Usá hasta 160 caracteres para el negocio o empresa.',
    messageTooLong: 'Usá hasta 5000 caracteres para el mensaje.',
    invalidText: 'Revisá el texto: hay caracteres que no podemos procesar.',
  },
  mailSubject: (name: string): string => `Nuevo mensaje desde la web — ${name}`,
  privacyTitle: 'Privacidad',
  privacyLink: 'Privacidad',
} as const;

// A confirmed short form notice does not imply an approved legal document.
export const privacyDocumentCopy: { title: string; paragraphs: readonly string[] | null } = {
  title: contactFeedback.privacyTitle,
  paragraphs: null,
};
