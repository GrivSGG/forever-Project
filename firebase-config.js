// Firebase Configuration для Forever Client
// Автоматическая синхронизация данных

const firebaseConfig = {
  apiKey: "AIzaSyBbZLa2MBIIMSto6exJhIH1Vv2POzhakRM",
  authDomain: "forever-client.firebaseapp.com",
  projectId: "forever-client",
  storageBucket: "forever-client.firebasestorage.app",
  messagingSenderId: "639676123653",
  appId: "1:639676123653:web:dd28cb5cc5ae537020326c"
};

// Экспорт конфигурации
window.firebaseConfig = firebaseConfig;

console.log('✅ Firebase config загружен');
