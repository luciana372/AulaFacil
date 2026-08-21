import "server-only"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const EMAIL_FROM = process.env.EMAIL_FROM || "AulaFácil <onboarding@resend.dev>"

export async function enviarEmailRecuperacion(email: string, link: string) {
  if (!resend) {
    console.warn(
      `[email] Falta configurar RESEND_API_KEY. Link de recuperación para ${email}: ${link}`
    )
    return
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Recuperar tu contraseña en AulaFácil",
    html: `
      <p>Recibimos un pedido para restablecer tu contraseña en AulaFácil.</p>
      <p><a href="${link}">Hacé clic acá para elegir una nueva contraseña</a>. El enlace vence en 1 hora.</p>
      <p>Si vos no pediste esto, podés ignorar este email.</p>
    `,
  })
}

export async function enviarEmailRecordatorio(
  email: string,
  datos: { materia: string; aula: string; horaInicio: string; horaFin: string; minutosAntes: number }
) {
  if (!resend) {
    console.warn(
      `[email] Falta configurar RESEND_API_KEY. Recordatorio para ${email}: ${datos.materia} en ${datos.aula} a las ${datos.horaInicio}`
    )
    return
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `En ${datos.minutosAntes} minutos: ${datos.materia}`,
    html: `
      <p>Tenés clase pronto:</p>
      <p><strong>${datos.materia}</strong> en <strong>${datos.aula}</strong>, de ${datos.horaInicio} a ${datos.horaFin}.</p>
    `,
  })
}

export async function enviarEmailAulaLiberada(
  email: string,
  datos: { materia: string; aula: string; dia: string; horaInicio: string; horaFin: string }
) {
  if (!resend) {
    console.warn(
      `[email] Falta configurar RESEND_API_KEY. Aula liberada para ${email}: ${datos.aula} el ${datos.dia} ${datos.horaInicio}`
    )
    return
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: `Se liberó ${datos.aula} — ${datos.dia} ${datos.horaInicio}`,
    html: `
      <p>Estabas en la lista de espera y hay buenas noticias:</p>
      <p><strong>${datos.aula}</strong> quedó libre los <strong>${datos.dia}</strong> de ${datos.horaInicio} a ${datos.horaFin}, el horario que necesitabas para <strong>${datos.materia}</strong>.</p>
      <p>Avisale a administración si todavía te sirve para que te lo asignen.</p>
    `,
  })
}
