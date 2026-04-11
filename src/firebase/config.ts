import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const BOT_CORE_APP_NAME = 'bot-whatsapp-ai';
const AGENDA_APP_NAME = 'agendamento-ai';

const defaultBotFirebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCTZ2tYtXia4OHI8f-edraKkc46qc171C4',
  authDomain: 'bot-whatsapp-ai-d10ef.firebaseapp.com',
  projectId: 'bot-whatsapp-ai-d10ef',
  storageBucket: 'bot-whatsapp-ai-d10ef.firebasestorage.app',
  messagingSenderId: '486583055278',
  appId: '1:486583055278:web:d7229c4ac3364805db4e3f',
  measurementId: 'G-BLBTLV2WM9'
};

const defaultAgendaFirebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyBkjUzjpN-YnYwsTjuLbwFYTlqTe9q0gnU',
  authDomain: 'agendamento-ai-9fbfb.firebaseapp.com',
  projectId: 'agendamento-ai-9fbfb',
  storageBucket: 'agendamento-ai-9fbfb.appspot.com',
  messagingSenderId: '1052889456789',
  appId: '1:1052889456789:web:1234567890abcdef',
  measurementId: 'G-Q0MJQPDW6Z'
};

function readFirebaseEnv(primaryKey: string, fallbackKey?: string, defaultValue = '') {
  const env =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return env[primaryKey] ?? (fallbackKey ? env[fallbackKey] : undefined) ?? defaultValue;
}

function initializeNamedApp(name: string, config: FirebaseOptions): FirebaseApp {
  return getApps().find((app) => app.name === name) ?? initializeApp(config, name);
}

export const botFirebaseConfig: FirebaseOptions = {
  apiKey: readFirebaseEnv('VITE_BOT_FIREBASE_API_KEY', undefined, defaultBotFirebaseConfig.apiKey ?? ''),
  authDomain: readFirebaseEnv(
    'VITE_BOT_FIREBASE_AUTH_DOMAIN',
    undefined,
    defaultBotFirebaseConfig.authDomain ?? ''
  ),
  projectId: readFirebaseEnv(
    'VITE_BOT_FIREBASE_PROJECT_ID',
    undefined,
    defaultBotFirebaseConfig.projectId ?? ''
  ),
  storageBucket: readFirebaseEnv(
    'VITE_BOT_FIREBASE_STORAGE_BUCKET',
    undefined,
    defaultBotFirebaseConfig.storageBucket ?? ''
  ),
  messagingSenderId: readFirebaseEnv(
    'VITE_BOT_FIREBASE_MESSAGING_SENDER_ID',
    undefined,
    defaultBotFirebaseConfig.messagingSenderId ?? ''
  ),
  appId: readFirebaseEnv('VITE_BOT_FIREBASE_APP_ID', undefined, defaultBotFirebaseConfig.appId ?? ''),
  measurementId: readFirebaseEnv(
    'VITE_BOT_FIREBASE_MEASUREMENT_ID',
    undefined,
    defaultBotFirebaseConfig.measurementId ?? ''
  )
};

export const agendaFirebaseConfig: FirebaseOptions = {
  apiKey: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_API_KEY',
    'VITE_FIREBASE_API_KEY',
    defaultAgendaFirebaseConfig.apiKey ?? ''
  ),
  authDomain: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_AUTH_DOMAIN',
    defaultAgendaFirebaseConfig.authDomain ?? ''
  ),
  projectId: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_PROJECT_ID',
    defaultAgendaFirebaseConfig.projectId ?? ''
  ),
  storageBucket: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_STORAGE_BUCKET',
    defaultAgendaFirebaseConfig.storageBucket ?? ''
  ),
  messagingSenderId: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    defaultAgendaFirebaseConfig.messagingSenderId ?? ''
  ),
  appId: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_APP_ID',
    'VITE_FIREBASE_APP_ID',
    defaultAgendaFirebaseConfig.appId ?? ''
  ),
  measurementId: readFirebaseEnv(
    'VITE_AGENDA_FIREBASE_MEASUREMENT_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    defaultAgendaFirebaseConfig.measurementId ?? ''
  )
};

export const BOT_FIREBASE_PROJECT_ID = botFirebaseConfig.projectId ?? '';
export const AGENDAMENTO_FIREBASE_PROJECT_ID = agendaFirebaseConfig.projectId ?? '';
export const SERVICES_SOURCE_FIREBASE_PROJECT_ID = AGENDAMENTO_FIREBASE_PROJECT_ID;
export const CONVERSATION_FIREBASE_PROJECT_ID = BOT_FIREBASE_PROJECT_ID;
export const APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID = AGENDAMENTO_FIREBASE_PROJECT_ID;
export const APPOINTMENT_REQUESTS_TARGET_FIREBASE_PROJECT_ID = AGENDAMENTO_FIREBASE_PROJECT_ID;

export const botFirebaseApp = initializeNamedApp(BOT_CORE_APP_NAME, botFirebaseConfig);
export const agendaFirebaseApp = initializeNamedApp(AGENDA_APP_NAME, agendaFirebaseConfig);

export const botDb = getFirestore(botFirebaseApp);
export const agendaDb = getFirestore(agendaFirebaseApp);

// Alias temporario para reduzir churn durante a transicao: `db` aponta
// explicitamente para o dominio bot/core, nunca para a agenda operacional.
export const db = botDb;

console.info(`[firebase][bot-core] projectId=${BOT_FIREBASE_PROJECT_ID}`);
console.info(`[firebase][agenda] projectId=${AGENDAMENTO_FIREBASE_PROJECT_ID}`);
console.info(
  `[core][architecture] servicesSource=${SERVICES_SOURCE_FIREBASE_PROJECT_ID} conversationSource=${CONVERSATION_FIREBASE_PROJECT_ID} appointmentsTarget=${APPOINTMENTS_TARGET_FIREBASE_PROJECT_ID}`
);
