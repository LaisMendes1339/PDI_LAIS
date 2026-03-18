// firebase-service.js
// Serviço de integração com Firebase Realtime Database

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, get, set, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAjyyrjnmeh8QjI1qjhMOUvvhHgK6H1U-A",
  authDomain: "banco-de-dados-6d7a0.firebaseapp.com",
  databaseURL: "https://banco-de-dados-6d7a0-default-rtdb.firebaseio.com",
  projectId: "banco-de-dados-6d7a0",
  storageBucket: "banco-de-dados-6d7a0.firebasestorage.app",
  messagingSenderId: "943029756595",
  appId: "1:943029756595:web:a436e9f77d217bd5d9c6c6"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Caminho do banco
const PATH = "pdiApp";

// Estado de conexão
let isConnected = navigator.onLine;
let syncQueue = [];

// Atualiza status de conexão
window.addEventListener('online', () => {
  isConnected = true;
  processSyncQueue();
  FirebaseService.updateSyncStatus('connected');
});

window.addEventListener('offline', () => {
  isConnected = false;
  FirebaseService.updateSyncStatus('offline');
});

/**
 * Serviço Firebase para operações de CRUD
 */
export const FirebaseService = {
  
  /**
   * Carrega dados do Firebase com fallback para localStorage
   */
  async loadData() {
    try {
      if (!isConnected) {
        console.log('📱 Offline - Carregando do localStorage');
        return this.loadFromLocalStorage();
      }

      const snapshot = await get(ref(db, PATH));
      
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Salva cache local
        localStorage.setItem('pdi_cache', JSON.stringify({
          data,
          timestamp: Date.now()
        }));
        console.log('☁️ Dados carregados do Firebase');
        return data;
      } else {
        console.log('📦 Nenhum dado no Firebase - Usando localStorage');
        return this.loadFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ Erro ao carregar Firebase:', error);
      // Fallback para localStorage em caso de erro
      return this.loadFromLocalStorage();
    }
  },

  /**
   * Salva dados no Firebase com fallback para localStorage
   */
  async saveData(data) {
    try {
      // Sempre salva no localStorage primeiro (offline-first)
      this.saveToLocalStorage(data);

      if (!isConnected) {
        // Adiciona à fila de sincronização
        syncQueue.push({ type: 'save', data, timestamp: Date.now() });
        console.log('📱 Offline - Dados salvos localmente e na fila de sync');
        return { success: true, source: 'local' };
      }

      await set(ref(db, PATH), data);
      console.log('☁️ Dados salvos no Firebase ✅');
      return { success: true, source: 'firebase' };
    } catch (error) {
      console.error('❌ Erro ao salvar Firebase:', error);
      // Dados já foram salvos no localStorage, então é seguro
      return { success: true, source: 'local', error: error.message };
    }
  },

  /**
   * Adiciona item a uma lista no Firebase
   */
  async addItemToList(path, item) {
    try {
      if (!isConnected) {
        syncQueue.push({ type: 'add', path, item, timestamp: Date.now() });
        return this.loadFromLocalStorage();
      }

      const listRef = ref(db, `${PATH}/${path}`);
      const newItemRef = push(listRef);
      await set(newItemRef, { ...item, id: newItemRef.key, createdAt: Date.now() });
      
      return this.loadData();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      return this.loadFromLocalStorage();
    }
  },

  /**
   * Remove item do Firebase
   */
  async removeItem(path, itemId) {
    try {
      if (!isConnected) {
        syncQueue.push({ type: 'remove', path, itemId, timestamp: Date.now() });
        return this.loadFromLocalStorage();
      }

      await remove(ref(db, `${PATH}/${path}/${itemId}`));
      return this.loadData();
    } catch (error) {
      console.error('Erro ao remover item:', error);
      return this.loadFromLocalStorage();
    }
  },

  /**
   * Atualiza item específico
   */
  async updateItem(path, itemId, updates) {
    try {
      if (!isConnected) {
        syncQueue.push({ type: 'update', path, itemId, updates, timestamp: Date.now() });
        return this.loadFromLocalStorage();
      }

      await update(ref(db, `${PATH}/${path}/${itemId}`), {
        ...updates,
        updatedAt: Date.now()
      });
      return this.loadData();
    } catch (error) {
      console.error('Erro ao atualizar item:', error);
      return this.loadFromLocalStorage();
    }
  },

  /**
   * Processa fila de sincronização quando online
   */
  async processSyncQueue() {
    if (syncQueue.length === 0) return;

    console.log(`🔄 Processando ${syncQueue.length} operações pendentes...`);
    
    for (const operation of syncQueue) {
      try {
        switch (operation.type) {
          case 'save':
            await set(ref(db, PATH), operation.data);
            break;
          case 'add':
            const listRef = ref(db, `${PATH}/${operation.path}`);
            const newItemRef = push(listRef);
            await set(newItemRef, { ...operation.item, id: newItemRef.key, createdAt: operation.timestamp });
            break;
          case 'remove':
            await remove(ref(db, `${PATH}/${operation.path}/${operation.itemId}`));
            break;
          case 'update':
            await update(ref(db, `${PATH}/${operation.path}/${operation.itemId}`), {
              ...operation.updates,
              updatedAt: operation.timestamp
            });
            break;
        }
      } catch (error) {
        console.error('Erro ao sincronizar operação:', error);
      }
    }
    
    syncQueue = [];
    console.log('✅ Fila de sincronização processada');
  },

  /**
   * Salva no localStorage (fallback/cache)
   */
  saveToLocalStorage(data) {
    localStorage.setItem('pdi_areas_interesse', JSON.stringify(data.areasInteresse || []));
    localStorage.setItem('pdi_metas', JSON.stringify(data.pdi || []));
    localStorage.setItem('pdi_cache', JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  },

  /**
   * Carrega do localStorage
   */
  loadFromLocalStorage() {
    return {
      areasInteresse: JSON.parse(localStorage.getItem('pdi_areas_interesse') || '[]'),
      pdi: JSON.parse(localStorage.getItem('pdi_metas') || '[]'),
      // Outros dados podem ser adicionados aqui
    };
  },

  /**
   * Atualiza UI de status de sincronização
   */
  updateSyncStatus(status) {
    const statusEl = document.getElementById('sync-status');
    if (!statusEl) return;

    const icons = {
      connected: '<i class="ph ph-cloud-check"></i>',
      syncing: '<i class="ph ph-spinner-gap"></i>',
      offline: '<i class="ph ph-cloud-slash"></i>',
      error: '<i class="ph ph-warning-circle"></i>'
    };

    const labels = {
      connected: 'Sincronizado',
      syncing: 'Sincronizando...',
      offline: 'Modo Offline',
      error: 'Erro de conexão'
    };

    statusEl.className = `sync-status status-${status}`;
    statusEl.innerHTML = `${icons[status] || icons.connected}<span>${labels[status] || labels.connected}</span>`;
  },

  /**
   * Mostra toast notification
   */
  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="ph ${type === 'success' ? 'ph-check-circle' : 'ph-warning-circle'}"></i>
      <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Remove após 3 segundos
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  /**
   * Mostra/oculta loading overlay
   */
  setLoading(loading) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.toggle('hidden', !loading);
    }
  }
};

// Exporta para uso global (para modules)
window.FirebaseService = FirebaseService;