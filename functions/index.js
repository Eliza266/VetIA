const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Generar número HC consecutivo
exports.generarNumeroHC = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado.');
  }
  const contadorRef = admin.firestore().doc('configuracion/contadorHC');
  const numero = await admin.firestore().runTransaction(async (transaction) => {
    const doc = await transaction.get(contadorRef);
    const actual = doc.exists ? doc.data().ultimo : 0;
    const nuevo = actual + 1;
    transaction.set(contadorRef, { ultimo: nuevo });
    return nuevo;
  });
  return { numeroHC: `HC${String(numero).padStart(6, '0')}` };
});

// Enviar historial por email
exports.enviarHistorialEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Debe estar autenticado.');
  }
  const { emailDestinatario, nombrePropietario, nombrePaciente, pdfUrl, nombreVet } = data;
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'vetiasoporte@gmail.com',
      pass: functions.config().email.pass
    }
  });

  await transporter.sendMail({
    from: '"VetIA" <vetiasoporte@gmail.com>',
    to: emailDestinatario,
    subject: `Historia Clínica - ${nombrePaciente}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0F6E56; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">VetIA</h1>
        </div>
        <div style="padding: 30px;">
          <p>Hola <strong>${nombrePropietario}</strong>,</p>
          <p>Adjunto la historia clínica de <strong>${nombrePaciente}</strong> generada por el Dr(a). <strong>${nombreVet}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${pdfUrl}" style="background: #0F6E56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
              Descargar Historia Clínica
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">Generado por VetIA</p>
        </div>
      </div>
    `
  });

  return { success: true };
});
