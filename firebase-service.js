// firebase-service.js
// Serviço de integração com Firebase Realtime Database - Versão Corrigida

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

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

// Inicializa Firebase com tratamento de erro
let app, db;
let isConnected = navigator.onLine;
let syncQueue = [];
let isLoading = false;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// Caminho do banco
const PATH = "pdiApp";

// Atualiza status de conexão
window.addEventListener('online', () => {
    isConnected = true;
    console.log('🟢 Online - Processando fila...');
    processSyncQueue();
    updateSyncStatus('connected');
});

window.addEventListener('offline', () => {
    isConnected = false;
    console.log('🔴 Offline - Modo local ativado');
    updateSyncStatus('offline');
});

/**
 * Serviço Firebase para operações de CRUD
 */
export const FirebaseService = {
    
    /**
     * Carrega dados do Firebase com fallback para localStorage
     */
    async loadData() {
        if (isLoading) {
            console.log('⏳ Carregamento já em andamento...');
            return this.loadFromLocalStorage();
        }
        
        isLoading = true;
        
        try {
            if (!isConnected || !db) {
                console.log('📱 Offline ou Firebase não inicializado - Carregando do localStorage');
                updateSyncStatus('offline');
                return this.loadFromLocalStorage();
            }

            // Timeout de 5 segundos para não travar
            const data = await Promise.race([
                this.getFirebaseData(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);
            
            if (data) {
                // Salva cache local
                this.saveToLocalStorage(data);
                console.log('☁️ Dados carregados do Firebase');
                updateSyncStatus('connected');
                return data;
            } else {
                console.log('📦 Nenhum dado no Firebase - Usando localStorage');
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar Firebase:', error);
            updateSyncStatus('error');
            // Fallback para localStorage em caso de erro
            return this.loadFromLocalStorage();
        } finally {
            isLoading = false;
        }
    },
    
    /**
     * Função auxiliar para buscar dados do Firebase
     */
    async getFirebaseData() {
        if (!db) return null;
        
        const snapshot = await get(ref(db, PATH));
        if (snapshot.exists()) {
            return snapshot.val();
        }
        return null;
    },

    /**
     * Salva dados no Firebase com fallback para localStorage
     */
    async saveData(data) {
        try {
            // Sempre salva no localStorage primeiro (garantia)
            this.saveToLocalStorage(data);
            console.log('💾 Dados salvos no localStorage');

            if (!isConnected || !db) {
                // Adiciona à fila de sincronização
                syncQueue.push({ type: 'save', data, timestamp: Date.now() });
                console.log('📱 Offline - Dados na fila de sync');
                updateSyncStatus('offline');
                return { success: true, source: 'local' };
            }

            // Timeout de 5 segundos
            await Promise.race([
                set(ref(db, PATH), data),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                )
            ]);
            
            console.log('☁️ Dados salvos no Firebase ✅');
            updateSyncStatus('connected');
            return { success: true, source: 'firebase' };
        } catch (error) {
            console.error('❌ Erro ao salvar Firebase:', error);
            updateSyncStatus('error');
            // Dados já foram salvos no localStorage, então é seguro
            return { success: true, source: 'local', error: error.message };
        }
    },

    /**
     * Processa fila de sincronização quando online
     */
    async processSyncQueue() {
        if (syncQueue.length === 0 || !db) {
            console.log('📭 Fila vazia ou Firebase não disponível');
            return;
        }

        console.log(`🔄 Processando ${syncQueue.length} operações pendentes...`);
        
        for (const operation of syncQueue) {
            try {
                if (operation.type === 'save') {
                    await set(ref(db, PATH), operation.data);
                    console.log('✅ Operação sync processada');
                }
            } catch (error) {
                console.error('❌ Erro ao sincronizar operação:', error);
            }
        }
        
        syncQueue = [];
        console.log('✅ Fila de sincronização processada');
        updateSyncStatus('connected');
    },

    /**
     * Salva no localStorage (fallback/cache)
     */
    saveToLocalStorage(data) {
        try {
            localStorage.setItem('pdi_areas_interesse', JSON.stringify(data.areasInteresse || []));
            localStorage.setItem('pdi_metas', JSON.stringify(data.pdi || []));
            localStorage.setItem('pdi_cache', JSON.stringify({
                data,
                timestamp: Date.now()
            }));
            console.log('💾 Cache local atualizado');
        } catch (error) {
            console.error('❌ Erro ao salvar no localStorage:', error);
        }
    },

    /**
     * Carrega do localStorage
     */
    loadFromLocalStorage() {
        try {
            const cache = localStorage.getItem('pdi_cache');
            if (cache) {
                const parsed = JSON.parse(cache);
                // Verifica se cache tem menos de 7 dias
                const age = Date.now() - parsed.timestamp;
                const sevenDays = 7 * 24 * 60 * 60 * 1000;
                
                if (age < sevenDays && parsed.data) {
                    console.log('📂 Dados carregados do cache local');
                    return parsed.data;
                }
            }
            
            // Fallback para dados individuais
            return {
                areasInteresse: JSON.parse(localStorage.getItem('pdi_areas_interesse') || '[]'),
                pdi: JSON.parse(localStorage.getItem('pdi_metas') || '[]')
            };
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            return { areasInteresse: [], pdi: [] };
        }
    },

    /**
     * Atualiza UI de status de sincronização
     */
    updateSyncStatus(status) {
        updateSyncStatus(status);
    },

    /**
     * Mostra toast notification
     */
    showToast(message, type = 'success') {
        showToast(message, type);
    },

    /**
     * Mostra/oculta loading overlay
     */
    setLoading(loading) {
        setLoading(loading);
    }
};

// Funções globais para UI
function updateSyncStatus(status) {
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
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.log(type === 'success' ? '✅' : '❌', message);
        return;
    }

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
}

function setLoading(loading) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.toggle('hidden', !loading);
    }
}

// Exporta para uso global
window.FirebaseService = FirebaseService;
window.updateSyncStatus = updateSyncStatus;
window.showToast = showToast;
window.setLoading = setLoading;
