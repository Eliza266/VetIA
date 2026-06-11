const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

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
