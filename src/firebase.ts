import { initializeApp } from 'firebase/app';
import {
  browserPopupRedirectResolver,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function getAuthEnvironmentWarning(): string | null {
  if (typeof window === 'undefined') return null;
  const ua = window.navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isStandalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    Boolean((window.navigator as { standalone?: boolean }).standalone);
  const isInAppBrowser = /(Line\/|FBAN|FBAV|Instagram|MicroMessenger|Threads)/i.test(ua);

  if (isInAppBrowser) {
    return '偵測到您正在使用社群軟體內建瀏覽器，Google 登入容易被阻擋；請點擊右上角「在 Safari / 瀏覽器中開啟」後再登入。';
  }
  if (isIOS && isStandalone) {
    return '偵測到您正從 iPhone 主畫面（PWA 獨立視窗）開啟遊戲，iOS 會隔離彈窗導致 Google 登入出現「The requested action is invalid」。請改用 Safari 瀏覽器開啟網址並完成登入！';
  }
  return null;
}

export function formatFirebaseAuthError(error: unknown, currentHost?: string): string {
  const code = (error as { code?: string })?.code ?? '';
  const message = error instanceof Error ? error.message : String(error ?? '');
  const hostText = currentHost ? `（目前網域：${currentHost}）` : '';

  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return `此網域尚未加入 Firebase「已授權的網域」白名單${hostText}。請至 Firebase Console → Authentication → Settings → Authorized domains 新增此網域。`;
  }
  if (code === 'auth/popup-blocked') {
    return '瀏覽器封鎖了 Google 登入彈窗，請允許彈出式視窗後再試一次，或改用 Safari 瀏覽器開啟。';
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '登入視窗已關閉或取消；若畫面出現「The requested action is invalid」，請確認目前網域已加入 Firebase 已授權網域，並改在 Safari 直接開啟（勿從主畫面 PWA 或 LINE 內建瀏覽器登入）。';
  }
  if (code === 'auth/operation-not-supported-in-this-environment') {
    return '目前瀏覽環境不支援彈窗登入，請改用 Safari 或 Chrome 瀏覽器開啟遊戲後再登入。';
  }
  return `登入未完成：${message || '請稍後再試'}${hostText}`;
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
}

export async function signOutPlayer() {
  return signOut(auth);
}
