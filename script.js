/**
 * PDI MASTER - SISTEMA COMPLETO
 * Versão Final com Áreas de Interesse Otimizadas
 */

const FirebaseService = window.FirebaseService;

const defaultData = {
    perfil: {
        nome: "Laís Mendes",
        cargo: "Assistente Ambiental",
        lider: "Lizabeth Silva",
        ciclo: "Março/26",
        tipoAvaliacao: "180º",
        empresaArea: "Geoambiental"
    },
    areasInteresse: [
        { nome: "Geoprocessamento", conteudos: "QGIS, ArcGIS, Sensoriamento Remoto, Análise Espacial", updatedAt: Date.now(), contentsCollapsed: true },
        { nome: "Análise de Dados", conteudos: "Python, R, Estatística, Visualização de Dados", updatedAt: Date.now(), contentsCollapsed: true },
        { nome: "Tecnologia", conteudos: "Automação, Machine Learning, Big Data", updatedAt: Date.now(), contentsCollapsed: true },
        { nome: "Inovação", conteudos: "Design Thinking, Inovação Aberta, Sustentabilidade", updatedAt: Date.now(), contentsCollapsed: true }
    ],
    avaliacao: {
        comportamental: [
            { competencia: "Desenvolvimento", pergunta: "Busca oportunidades de aprendizado", lider: 4, auto: 4 },
            { competencia: "Comunicação", pergunta: "Comunica-se de forma clara", lider: 3, auto: 4 },
            { competencia: "Comunicação", pergunta: "Escuta ativa", lider: 3, auto: 5 },
            { competencia: "Foco em resultados", pergunta: "Mantém o foco nas metas", lider: 4, auto: 5 },
            { competencia: "Foco em resultados", pergunta: "Iniciativa para superar desafios", lider: 3, auto: 4 },
            { competencia: "Produtividade", pergunta: "Prioriza atividades", lider: 3, auto: 4 },
            { competencia: "Produtividade", pergunta: "Evita retrabalho", lider: 5, auto: 5 },
            { competencia: "Desenvolvimento", pergunta: "Aplica o que aprende", lider: 4, auto: 5 },
            { competencia: "Adaptabilidade", pergunta: "Lida bem com mudanças", lider: 3, auto: 4 },
            { competencia: "Atenção aos detalhes", pergunta: "Atenção aos aspectos técnicos", lider: 5, auto: 4 },
            { competencia: "Alinhamento", pergunta: "Contribui para metas da área", lider: 4, auto: 4 },
            { competencia: "Foco no cliente", pergunta: "Entende necessidades", lider: 4, auto: 4 },
            { competencia: "Habilidades interpessoais", pergunta: "Ambiente colaborativo", lider: 4, auto: 5 },
            { competencia: "Assiduidade", pergunta: "Responsabilidade com horários", lider: 5, auto: 5 }
        ],
        organizacional: [
            { competencia: "Trabalho em equipe", pergunta: "Compartilha conhecimento", lider: 4, auto: 5 },
            { competencia: "Ambição", pergunta: "Busca desafios além do escopo", lider: 2, auto: 4 },
            { competencia: "Inovação", pergunta: "Contribui com ideias", lider: 4, auto: 4 },
            { competencia: "Conservação", pergunta: "Cuidado com recursos", lider: 5, auto: 5 },
            { competencia: "Integridade", pergunta: "É confiável e transparente", lider: 3, auto: 5 },
            { competencia: "Compromisso", pergunta: "Comprometimento com resultados", lider: 5, auto: 5 }
        ],
        tecnica: [
            { competencia: "Análises estatísticas", pergunta: "Executa análises com precisão", lider: 4, auto: 4 },
            { competencia: "Políticas", pergunta: "Segue políticas e procedimentos", lider: 4, auto: 4 },
            { competencia: "Campo", pergunta: "Realiza atividades de campo", lider: 5, auto: 5 },
            { competencia: "Relatórios", pergunta: "Elabora relatórios técnicos", lider: 3, auto: 4 },
            { competencia: "Prazos", pergunta: "Cumpre prazos com eficiência", lider: 5, auto: 5 },
            { competencia: "Geoprocessamento", pergunta: "Utiliza ferramentas de geoprocessamento", lider: 5, auto: 5 },
            { competencia: "Stakeholders", pergunta: "Contato com stakeholders", lider: 4, auto: 5 },
            { competencia: "Logística", pergunta: "Segue diretrizes logísticas", lider: 3, auto: 4 },
            { competencia: "Inovação técnica", pergunta: "Propõe melhorias técnicas", lider: 4, auto: 4 },
            { competencia: "Organização", pergunta: "Colabora e organiza arquivos", lider: 4, auto: 5 }
        ]
    },
    pdi: []
};

let appData = { ...defaultData };
let processedData = null;

// UI Controller
const UI = {
    currentSection: 'dashboard',
    expandedMetas: {},

    async init() {
        console.log('🚀 Inicializando PDI Master...');
        
        if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
        
        try {
            const loadedData = await (FirebaseService?.loadData?.() || {});
            console.log('📥 Dados carregados:', loadedData);
            
            appData = {
                ...defaultData,
                ...loadedData,
                avaliacao: defaultData.avaliacao,
                areasInteresse: loadedData.areasInteresse?.map(a => ({
                    ...a,
                    conteudos: a.conteudos || '',
                    contentsCollapsed: a.contentsCollapsed !== undefined ? a.contentsCollapsed : true
                })) || defaultData.areasInteresse,
                pdi: loadedData.pdi?.map(p => ({
                    ...p,
                    acoes: p.acoes || [],
                    progresso: p.progresso || 0
                })) || []
            };
            
            console.log('📊 appData:', appData);
            processedData = Analytics.process(appData);
            this.renderAll();
            this.setupEventListeners();
            
            if(FirebaseService?.updateSyncStatus) {
                FirebaseService.updateSyncStatus(navigator.onLine ? 'connected' : 'offline');
            }
            
        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao carregar dados. Usando modo offline.', 'error');
            appData = { ...defaultData };
            processedData = Analytics.process(appData);
            this.renderAll();
            this.setupEventListeners();
        } finally {
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
        }
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(item.dataset.section);
            });
        });

        const menuToggle = document.getElementById('menuToggle');
        if(menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar')?.classList.toggle('active');
            });
        }
    },

    navigateTo(section) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === section);
        });

        document.querySelectorAll('.content-section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section)?.classList.add('active');

        const titles = {
            'dashboard': 'Dashboard', 'analise': 'Análise Inteligente',
            'pontos-fortes': 'Pontos Fortes', 'pontos-atencão': 'Pontos de Atenção',
            'mentoria': 'Mentoria', 'meu-pdi': 'Meu PDI', 'areas-interesse': 'Áreas de Interesse'
        };
        const pageTitle = document.getElementById('page-title');
        if(pageTitle) pageTitle.textContent = titles[section] || 'PDI Master';

        document.querySelector('.sidebar')?.classList.remove('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.currentSection = section;
        
        if(section === 'dashboard') this.renderCharts();
    },

    renderAll() {
        this.renderHeader();
        this.renderKPIs();
        this.renderCharts();
        this.renderAnalysis();
        this.renderMentorship();
        this.renderInterests();
        this.renderPDIList();
        this.updateBadges();
    },

    renderHeader() {
        const sidebarUserName = document.getElementById('sidebar-user-name');
        const sidebarUserRole = document.getElementById('sidebar-user-role');
        const headerMediaGeral = document.getElementById('header-media-geral');
        const headerCiclo = document.getElementById('header-ciclo');
        
        if(sidebarUserName) sidebarUserName.textContent = appData.perfil.nome;
        if(sidebarUserRole) sidebarUserRole.textContent = appData.perfil.cargo;
        if(headerMediaGeral) headerMediaGeral.textContent = processedData?.mediaGeral || '--';
        if(headerCiclo) headerCiclo.textContent = appData.perfil.ciclo;
    },

    renderKPIs() {
        if(!processedData) return;
        
        const kpiBehavioral = document.getElementById('kpi-behavioral');
        const kpiTechnical = document.getElementById('kpi-technical');
        const kpiOrganizational = document.getElementById('kpi-organizational');
        const kpiCritical = document.getElementById('kpi-critical');
        
        if(kpiBehavioral) kpiBehavioral.textContent = processedData.comportamentalMedia;
        if(kpiTechnical) kpiTechnical.textContent = processedData.tecnicaMedia;
        if(kpiOrganizational) kpiOrganizational.textContent = processedData.organizacionalMedia;
        
        const areaNames = { comportamental: 'Comportamental', organizacional: 'Organizacional', tecnica: 'Técnica' };
        if(kpiCritical) kpiCritical.textContent = areaNames[processedData.insights?.weakestArea] || '--';
    },

    renderCharts() {
        if(!processedData) return;
        this.renderRadarChart();
        this.renderAreaComparison();
        this.renderGapsList();
    },

    renderRadarChart() {
        const canvas = document.getElementById('radarChart');
        if(!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 60;
        
        const areas = [
            { label: 'Comportamental', valor: processedData.comportamentalMedia, valorLider: this.calculateLiderArea('comportamental') },
            { label: 'Organizacional', valor: processedData.organizacionalMedia, valorLider: this.calculateLiderArea('organizacional') },
            { label: 'Técnica', valor: processedData.tecnicaMedia, valorLider: this.calculateLiderArea('tecnica') }
        ];
        
        const angleStep = (2 * Math.PI) / areas.length;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        for(let level = 1; level <= 5; level++) {
            const levelRadius = (radius / 5) * level;
            ctx.beginPath();
            for(let i = 0; i < areas.length; i++) {
                const angle = i * angleStep - Math.PI / 2;
                const x = centerX + levelRadius * Math.cos(angle);
                const y = centerY + levelRadius * Math.sin(angle);
                if(i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.beginPath();
        ctx.strokeStyle = '#4f46e5';
        ctx.fillStyle = 'rgba(79, 70, 229, 0.2)';
        ctx.lineWidth = 3;
        areas.forEach((area, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const rRadius = (area.valor / 5) * radius;
            const x = centerX + rRadius * Math.cos(angle);
            const y = centerY + rRadius * Math.sin(angle);
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.lineWidth = 3;
        areas.forEach((area, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const rRadius = (area.valorLider / 5) * radius;
            const x = centerX + rRadius * Math.cos(angle);
            const y = centerY + rRadius * Math.sin(angle);
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        areas.forEach((area, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const labelRadius = radius + 40;
            const x = centerX + labelRadius * Math.cos(angle);
            const y = centerY + labelRadius * Math.sin(angle);
            ctx.fillStyle = '#1e293b';
            ctx.font = 'bold 14px Plus Jakarta Sans';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(area.label, x, y);
        });
    },

    calculateLiderArea(area) {
        const items = processedData?.avaliacao?.[area] || [];
        if(items.length === 0) return 0;
        const sum = items.reduce((acc, item) => acc + item.lider, 0);
        return (sum / items.length).toFixed(2);
    },

    renderAreaComparison() {
        const container = document.getElementById('area-comparison');
        if(!container) return;
        container.innerHTML = '';
        
        const areas = [
            { name: 'Comportamental', auto: processedData.comportamentalMedia, lider: this.calculateLiderArea('comportamental') },
            { name: 'Técnica', auto: processedData.tecnicaMedia, lider: this.calculateLiderArea('tecnica') },
            { name: 'Organizacional', auto: processedData.organizacionalMedia, lider: this.calculateLiderArea('organizacional') }
        ];
        
        const div = document.createElement('div');
        div.className = 'area-bars';
        
        areas.forEach(area => {
            const item = document.createElement('div');
            item.className = 'area-bar-item';
            item.innerHTML = `
                <div class="area-bar-label">
                    <span>${area.name}</span>
                    <span style="font-size: 0.875rem; color: var(--text-secondary)">Auto: ${area.auto} | Líder: ${area.lider}</span>
                </div>
                <div class="area-bar-track">
                    <div class="area-bar-fill auto" style="width: ${(area.auto / 5) * 100}%">${area.auto}</div>
                </div>
                <div class="area-bar-track" style="margin-top: 4px;">
                    <div class="area-bar-fill lider" style="width: ${(area.lider / 5) * 100}%">${area.lider}</div>
                </div>
            `;
            div.appendChild(item);
        });
        container.appendChild(div);
    },

    renderGapsList() {
        const container = document.getElementById('gaps-list');
        if(!container) return;
        container.innerHTML = '';
        
        const allItems = [
            ...(processedData?.avaliacao?.comportamental || []),
            ...(processedData?.avaliacao?.organizacional || []),
            ...(processedData?.avaliacao?.tecnica || [])
        ];
        
        const gaps = allItems.filter(item => Math.abs(item.gap) >= 1)
            .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap)).slice(0, 5);
        
        if(gaps.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Sem gaps significativos identificados</p>';
            return;
        }
        
        gaps.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gap-item';
            const gapColor = item.gap > 0 ? 'var(--success)' : 'var(--warning)';
            div.innerHTML = `
                <div class="gap-info">
                    <div class="gap-competencia">${item.competencia}</div>
                    <div class="gap-details">Você: ${item.auto} | Líder: ${item.lider}</div>
                </div>
                <div class="gap-value" style="color: ${gapColor}">${item.gap > 0 ? '+' : ''}${item.gap}</div>
            `;
            container.appendChild(div);
        });
    },

    renderAnalysis() {
        if(!processedData) return;
        
        const executiveSummary = document.getElementById('executive-summary');
        if(executiveSummary) {
            executiveSummary.innerHTML = `
                <p><strong>Laís,</strong> sua avaliação revela um perfil <span style="color: var(--success); font-weight: 600">sólido e técnico</span>. 
                Sua maior força reside na execução operacional e cumprimento de prazos. No entanto, identificamos um desalinhamento 
                importante na percepção de <strong>Ambição e Inovação</strong>.</p>
                <p style="margin-top:1rem">Enquanto você se vê proativa, sua liderança percebe espaço para maior iniciativa estratégica. 
                O foco para o próximo ciclo deve ser transformar sua competência técnica em liderança de processos.</p>
            `;
        }

        const renderList = (elementId, items) => {
            const el = document.getElementById(elementId);
            if(!el) return;
            el.innerHTML = '';
            items.forEach(i => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${i.competencia}</strong> - Nota ${i.media.toFixed(1)}`;
                el.appendChild(li);
            });
        };
        
        renderList('strengths-list', processedData.insights.strong);
        renderList('attention-list', processedData.insights.critical);

        const gapsContainer = document.getElementById('gaps-container');
        if(gapsContainer) {
            gapsContainer.innerHTML = '';
            processedData.insights.gaps.forEach(i => {
                const card = document.createElement('div');
                card.className = 'gap-card';
                const direction = i.gap > 0 ? "Você se avalia acima" : "Líder vê fragilidade";
                card.innerHTML = `<h4>${i.competencia}</h4><p>${direction} em relação à liderança (Diferença: ${Math.abs(i.gap)} pontos)</p>`;
                gapsContainer.appendChild(card);
            });
        }
        this.renderDetailedViews();
    },

    renderDetailedViews() {
        const renderContainer = (containerId, items, isAttention = false) => {
            const container = document.getElementById(containerId);
            if(!container) return;
            container.innerHTML = '';
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = `detail-card${isAttention ? ' attention' : ''}`;
                card.innerHTML = `
                    <div class="detail-icon"><i class="ph ph-${isAttention ? 'warning' : 'check'}"></i></div>
                    <div class="detail-content">
                        <h4>${item.competencia}</h4>
                        <p>${item.pergunta}</p>
                        <div class="detail-meta">
                            <span class="detail-score" style="color: ${isAttention ? 'var(--warning)' : 'var(--primary)'}">
                                <i class="ph ph-star"></i> Nota: ${item.media.toFixed(1)}
                            </span>
                            <span><i class="ph ph-user"></i> Auto: ${item.auto}</span>
                            <span><i class="ph ph-users"></i> Líder: ${item.lider}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        };
        
        renderContainer('strengths-detailed', processedData.insights.strong);
        renderContainer('attention-detailed', processedData.insights.critical, true);
    },

    renderMentorship() {
        if(!processedData) return;
        const critical = processedData.insights.critical[0];
        
        const plan30 = document.getElementById('plan-30');
        const plan60 = document.getElementById('plan-60');
        const plan90 = document.getElementById('plan-90');
        const mentorInsight = document.getElementById('mentor-insight');
        

        if(mentorInsight) mentorInsight.textContent = "Sua técnica é sólida, Laís. Nececssita desenvolver mais a parte de comunicação.";
    },

    // === ÁREAS DE INTERESSE ===
    
    renderInterests() {
        const grid = document.getElementById('interests-grid');
        if(!grid) return;
        grid.innerHTML = '';
        
        const areasInteresse = appData.areasInteresse || [];
        
        if(areasInteresse.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    <i class="ph ph-star" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <p>Nenhuma área de interesse cadastrada.<br>Adicione sua primeira área acima!</p>
                </div>
            `;
            return;
        }
        
        areasInteresse.forEach((area, index) => {
            const card = document.createElement('div');
            card.className = 'interest-card';
            const hasContents = area.conteudos && area.conteudos.trim() !== '';
            const isContentsCollapsed = area.contentsCollapsed !== false;
            
            card.innerHTML = `
                <div class="interest-card-header" onclick="UI.toggleAreaCard(${index})">
                    <div class="interest-card-header-left">
                        <h4>${area.nome}</h4>
                        <span class="interest-status ${hasContents ? 'has-contents' : 'no-contents'}">
                            <i class="ph ${hasContents ? 'ph-check-circle' : 'ph-warning'}"></i>
                            ${hasContents ? 'Conteúdos salvos' : 'Sem conteúdos'}
                        </span>
                    </div>
                    <button class="btn-delete-small" onclick="event.stopPropagation(); UI.removeInterest(${index})" title="Excluir área">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
                
                <div class="interest-card-body">
                    <div class="interest-input-section">
                        <label for="conteudos-${index}">
                            <i class="ph ph-books"></i>
                            Conteúdos que mais me interesso:
                        </label>
                        <textarea 
                            id="conteudos-${index}" 
                            placeholder="Ex: QGIS, ArcGIS, Sensoriamento Remoto, Python para GIS..."
                            rows="3"
                            onclick="event.stopPropagation()"
                        >${area.conteudos || ''}</textarea>
                        <button class="save-contents-btn" onclick="event.stopPropagation(); UI.saveInterestContents(${index})">
                            <i class="ph ph-floppy-disk"></i>
                            Salvar Conteúdos
                        </button>
                    </div>
                    
                    ${hasContents ? `
                    <div class="interest-contents-display">
                        <div class="contents-toggle-header" onclick="event.stopPropagation(); UI.toggleContents(${index})">
                            <div class="contents-header">
                                <i class="ph ph-check-circle"></i>
                                <strong>Conteúdos Salvos:</strong>
                            </div>
                            <i class="ph ph-caret-down contents-toggle-icon ${isContentsCollapsed ? 'collapsed' : ''}"></i>
                        </div>
                        <div class="contents-body ${isContentsCollapsed ? 'collapsed' : ''}">
                            <div class="contents-list">
                                ${this.parseContentsToList(area.conteudos)}
                            </div>
                            <div class="contents-footer">
                                <span class="last-update">
                                    <i class="ph ph-clock"></i>
                                    ${area.updatedAt ? new Date(area.updatedAt).toLocaleDateString('pt-BR') : 'Hoje'}
                                </span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
            grid.appendChild(card);
        });
        this.updateBadges();
    },

    toggleAreaCard(index) {
        // Opcional: implementar toggle do card inteiro se necessário
        console.log('Toggle area card:', index);
    },

    toggleContents(index) {
        if(appData.areasInteresse[index]) {
            appData.areasInteresse[index].contentsCollapsed = !appData.areasInteresse[index].contentsCollapsed;
            this.renderInterests();
        }
    },

    parseContentsToList(contents) {
        if(!contents) return '<p class="no-contents">Nenhum conteúdo cadastrado</p>';
        const items = contents.split(/[,\n]+/).map(item => item.trim()).filter(item => item !== '');
        if(items.length === 0) return '<p class="no-contents">Nenhum conteúdo cadastrado</p>';
        return items.map(item => `<span class="content-tag">${item}</span>`).join('');
    },

    async saveInterestContents(index) {
        const textarea = document.getElementById(`conteudos-${index}`);
        const saveBtn = textarea?.parentElement?.querySelector('.save-contents-btn');
        
        if(!textarea || !saveBtn) return;
        
        const contents = textarea.value.trim();
        
        if(contents === '') {
            if(FirebaseService?.showToast) FirebaseService.showToast('Por favor, digite pelo menos um conteúdo', 'error');
            textarea.focus();
            return;
        }
        
        if(!appData.areasInteresse?.[index]) {
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro: Área não encontrada', 'error');
            return;
        }
        
        appData.areasInteresse[index].conteudos = contents;
        appData.areasInteresse[index].updatedAt = Date.now();
        
        const originalBtnHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="ph ph-spinner-gap"></i> Salvando...';
        saveBtn.disabled = true;
        
        try {
            if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
            await FirebaseService?.saveData?.(appData);
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
            
            saveBtn.innerHTML = '<i class="ph ph-check-circle"></i> Salvo com sucesso!';
            saveBtn.style.background = 'var(--success)';
            saveBtn.style.color = 'white';
            if(FirebaseService?.showToast) FirebaseService.showToast(`Conteúdos de "${appData.areasInteresse[index].nome}" salvos! ✅`);
            
            setTimeout(() => {
                this.renderInterests();
            }, 1000);
            
        } catch (error) {
            console.error('Erro ao salvar:', error);
            saveBtn.innerHTML = '<i class="ph ph-warning-circle"></i> Erro ao salvar';
            saveBtn.style.background = 'var(--danger)';
            saveBtn.style.color = 'white';
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao salvar. Tente novamente.', 'error');
            
            setTimeout(() => {
                saveBtn.innerHTML = originalBtnHTML;
                saveBtn.disabled = false;
                saveBtn.style.background = '';
                saveBtn.style.color = '';
            }, 3000);
        }
    },

    async addInterestSuggestion(area) {
        if(!appData.areasInteresse.find(a => a.nome === area)) {
            appData.areasInteresse.push({ nome: area, conteudos: '', createdAt: Date.now(), contentsCollapsed: true });
            if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
            await FirebaseService?.saveData?.(appData);
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
            this.renderInterests();
            if(FirebaseService?.showToast) FirebaseService.showToast(`Área "${area}" adicionada! ☁️`);
        } else {
            if(FirebaseService?.showToast) FirebaseService.showToast('Esta área já está cadastrada!', 'error');
        }
    },

    async removeInterest(index) {
        if(!confirm('Deseja realmente remover esta área de interesse?')) return;
        
        const areaName = appData.areasInteresse[index]?.nome;
        appData.areasInteresse.splice(index, 1);
        
        try {
            if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
            await FirebaseService?.saveData?.(appData);
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
            this.renderInterests();
            if(FirebaseService?.showToast) FirebaseService.showToast(`Área "${areaName}" removida!`);
        } catch (error) {
            console.error('Erro ao excluir:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao excluir área', 'error');
        }
    },

    updateBadges() {
        if(!processedData?.insights) return;
        
        const badgeStrong = document.getElementById('badge-strong');
        const badgeAttention = document.getElementById('badge-attention');
        const countStrong = document.getElementById('count-strong');
        const countAttention = document.getElementById('count-attention');
        
        if(badgeStrong) badgeStrong.textContent = processedData.insights.strong.length;
        if(badgeAttention) badgeAttention.textContent = processedData.insights.critical.length;
        if(countStrong) countStrong.textContent = processedData.insights.strong.length;
        if(countAttention) countAttention.textContent = processedData.insights.critical.length;
    },

    // === PDI COM SUB-TAREFAS E METAS RECOLHÍVEIS ===
    
    toggleMeta(metaId) {
        this.expandedMetas[metaId] = !this.expandedMetas[metaId];
        this.renderPDIList();
    },

    calcularProgresso(meta) {
        if(!meta.acoes || meta.acoes.length === 0) {
            meta.progresso = 0;
            return;
        }
        
        const concluidas = meta.acoes.filter(a => a.concluida).length;
        meta.progresso = Math.round((concluidas / meta.acoes.length) * 100);
    },

    renderPDIList() {
        const container = document.getElementById('pdi-list');
        if(!container) return;
        container.innerHTML = '';
        const pdiList = appData.pdi || [];
        
        if(pdiList.length === 0) {
            container.innerHTML = '<div class="text-center" style="padding: 3rem; color: var(--text-muted);"><i class="ph ph-target" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i><p>Nenhuma meta cadastrada ainda.<br>Comece adicionando sua primeira meta!</p></div>';
            return;
        }

        pdiList.forEach((meta, index) => {
            this.calcularProgresso(meta);
            const isExpanded = this.expandedMetas[meta.id] || false;
            
            const div = document.createElement('div');
            div.className = 'pdi-item';
            
            const progressoCor = meta.progresso === 100 ? 'var(--success)' : meta.progresso >= 50 ? 'var(--warning)' : 'var(--primary)';
            
            let html = '<div class="pdi-item-header" onclick="UI.toggleMeta(\'' + meta.id + '\')">';
            html += '<div class="pdi-item-header-content">';
            html += '<h4>' + meta.goal + '</h4>';
            html += '<div class="pdi-item-header-top">';
            html += '<span class="pdi-tag ' + meta.priority + '">' + meta.priority + '</span>';
            html += '<span class="pdi-tag" style="background: #dbeafe; color: #1e40af;">' + meta.area + '</span>';
            html += '<i class="ph ' + (isExpanded ? 'ph-caret-down' : 'ph-caret-right') + '" style="color: var(--text-muted);"></i>';
            html += '</div></div>';
            
            html += '<div class="pdi-item-header-right">';
            html += '<span style="color: ' + progressoCor + '">' + meta.progresso + '% concluído</span>';
            html += '<button class="btn-delete" onclick="event.stopPropagation(); UI.deletePDI(' + index + ')" title="Excluir">';
            html += '<i class="ph ph-trash"></i></button></div></div>';
            
            if(!isExpanded) {
                html += '<div class="pdi-collapsed-info">';
                html += '<div class="pdi-collapsed-info-inner">';
                html += '<span><i class="ph ph-list-checks"></i> ' + (meta.acoes?.length || 0) + ' ações (' + (meta.acoes?.filter(a => a.concluida).length || 0) + ' concluídas)</span>';
                html += '<span><i class="ph ph-calendar"></i> ' + new Date(meta.deadline).toLocaleDateString('pt-BR') + '</span>';
                html += '</div></div>';
            } else {
                html += '<div class="pdi-item-content">';
                html += '<p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">' + (meta.actions || 'Nenhuma ação descrita') + '</p>';
                html += '<div class="pdi-progress-bar" style="margin-bottom: 1.5rem;"><div class="pdi-progress-fill" style="width: ' + meta.progresso + '%; background: ' + progressoCor + '"></div></div>';
                html += '<div class="pdi-acoes-section">';
                html += '<div class="pdi-acoes-header">';
                html += '<h5 style="font-size: 0.9rem; font-weight: 600; color: var(--text-main);"><i class="ph ph-check-square" style="color: var(--primary);"></i> Ações / Sub-tarefas</h5>';
                html += '<button class="btn-add-acao" onclick="event.stopPropagation(); UI.showAddAcaoModal(\'' + meta.id + '\')">';
                html += '<i class="ph ph-plus"></i> Adicionar Ação</button></div>';
                
                if(meta.acoes && meta.acoes.length > 0) {
                    html += '<div class="pdi-acoes-list" id="acoes-' + meta.id + '">';
                    meta.acoes.forEach(acao => {
                        html += '<div class="pdi-acao-item ' + (acao.concluida ? 'concluida' : '') + '" onclick="event.stopPropagation(); UI.toggleAcao(\'' + meta.id + '\', \'' + acao.id + '\')">';
                        html += '<i class="ph ' + (acao.concluida ? 'ph-check-circle' : 'ph-circle') + '"></i>';
                        html += '<span>' + acao.texto + '</span>';
                        html += '<button class="btn-delete-acao" onclick="event.stopPropagation(); UI.deleteAcao(\'' + meta.id + '\', \'' + acao.id + '\')">';
                        html += '<i class="ph ph-x"></i></button></div>';
                    });
                    html += '</div>';
                } else {
                    html += '<div class="pdi-acoes-list" id="acoes-' + meta.id + '">';
                    html += '<p style="color: var(--text-muted); font-size: 0.875rem; padding: 0.5rem 0;">Nenhuma ação cadastrada. Clique em "Adicionar Ação" para começar!</p></div>';
                }
                
                html += '<div class="pdi-add-acao-rapido" onclick="event.stopPropagation();">';
                html += '<input type="text" id="input-acao-' + meta.id + '" placeholder="Digite uma nova ação e pressione Enter..." onkeypress="if(event.key === \'Enter\') UI.addAcaoRapida(\'' + meta.id + '\')" />';
                html += '<button onclick="UI.addAcaoRapida(\'' + meta.id + '\')"><i class="ph ph-plus"></i></button></div></div>';
                
                html += '<div class="pdi-meta" style="margin-top: 1rem;">';
                html += '<span><i class="ph ph-calendar"></i> ' + new Date(meta.deadline).toLocaleDateString('pt-BR') + '</span>';
                html += '<span><i class="ph ph-check-circle"></i> ' + meta.status + '</span>';
                if(meta.indicator) {
                    html += '<span><i class="ph ph-flag"></i> ' + meta.indicator + '</span>';
                }
                html += '</div></div>';
            }
            
            div.innerHTML = html;
            container.appendChild(div);
        });
    },

    async addPDI(meta) {
        console.log('🎯 Adicionando PDI:', meta);
        
        const newMeta = { 
            ...meta, 
            id: Date.now().toString(), 
            createdAt: Date.now(),
            acoes: [],
            progresso: 0
        };
        appData.pdi = appData.pdi || [];
        appData.pdi.push(newMeta);
        
        try {
            if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
            await FirebaseService?.saveData?.(appData);
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
            
            this.renderPDIList();
            const pdiForm = document.getElementById('pdi-form');
            if(pdiForm) pdiForm.reset();
            
            const btn = document.getElementById('btn-add-pdi');
            if(btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="ph ph-check"></i> Adicionado!';
                btn.style.background = 'var(--success)';
                setTimeout(() => { btn.innerHTML = originalText; btn.style.background = ''; }, 2000);
            }
            if(FirebaseService?.showToast) FirebaseService.showToast('Meta adicionada ao plano! 🎯');
        } catch (error) {
            console.error('Erro ao adicionar PDI:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao adicionar meta', 'error');
        }
    },

    async addAcaoRapida(metaId) {
        const input = document.getElementById('input-acao-' + metaId);
        const texto = input?.value.trim();
        
        if(!texto) return;
        
        const meta = appData.pdi.find(m => m.id === metaId);
        if(!meta) return;
        
        const novaAcao = {
            id: Date.now().toString(),
            texto: texto,
            concluida: false,
            createdAt: Date.now()
        };
        
        meta.acoes.push(novaAcao);
        this.calcularProgresso(meta);
        
        try {
            await FirebaseService?.saveData?.(appData);
            this.renderPDIList();
            if(FirebaseService?.showToast) FirebaseService.showToast('Ação adicionada! ✅');
        } catch (error) {
            console.error('Erro ao adicionar ação:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao adicionar ação', 'error');
        }
    },

    async toggleAcao(metaId, acaoId) {
        const meta = appData.pdi.find(m => m.id === metaId);
        if(!meta) return;
        
        const acao = meta.acoes.find(a => a.id === acaoId);
        if(!acao) return;
        
        acao.concluida = !acao.concluida;
        this.calcularProgresso(meta);
        
        try {
            await FirebaseService?.saveData?.(appData);
            this.renderPDIList();
            
            if(acao.concluida && meta.progresso === 100) {
                if(FirebaseService?.showToast) FirebaseService.showToast('🎉 Parabéns! Meta concluída!', 'success');
            }
        } catch (error) {
            console.error('Erro ao alternar ação:', error);
        }
    },

    async deleteAcao(metaId, acaoId) {
        if(!confirm('Deseja remover esta ação?')) return;
        
        const meta = appData.pdi.find(m => m.id === metaId);
        if(!meta) return;
        
        meta.acoes = meta.acoes.filter(a => a.id !== acaoId);
        this.calcularProgresso(meta);
        
        try {
            await FirebaseService?.saveData?.(appData);
            this.renderPDIList();
            if(FirebaseService?.showToast) FirebaseService.showToast('Ação removida!');
        } catch (error) {
            console.error('Erro ao excluir ação:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao excluir ação', 'error');
        }
    },

    async deletePDI(index) {
        if(!confirm('Deseja realmente excluir esta meta?')) return;
        
        appData.pdi.splice(index, 1);
        
        try {
            if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
            await FirebaseService?.saveData?.(appData);
            if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
            this.renderPDIList();
            if(FirebaseService?.showToast) FirebaseService.showToast('Meta excluída!');
        } catch (error) {
            console.error('Erro ao excluir PDI:', error);
            if(FirebaseService?.showToast) FirebaseService.showToast('Erro ao excluir meta', 'error');
        }
    },

    setupEventListeners() {
        console.log('🔧 Configurando event listeners...');
        
        this.setupNavigation();

        const btnAddInterest = document.getElementById('btn-add-interest');
        const inputNewInterest = document.getElementById('new-interest');
        
        if(btnAddInterest && inputNewInterest) {
            btnAddInterest.addEventListener('click', async () => {
                const value = inputNewInterest.value.trim();
                
                if(value !== '') {
                    if(!appData.areasInteresse?.find(a => a.nome === value)) {
                        appData.areasInteresse.push({ nome: value, conteudos: '', createdAt: Date.now(), contentsCollapsed: true });
                        
                        if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
                        await FirebaseService?.saveData?.(appData);
                        if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
                        
                        this.renderInterests();
                        inputNewInterest.value = '';
                        if(FirebaseService?.showToast) FirebaseService.showToast('Área adicionada! ✨');
                    } else {
                        if(FirebaseService?.showToast) FirebaseService.showToast('Esta área já está cadastrada!', 'error');
                    }
                } else {
                    if(FirebaseService?.showToast) FirebaseService.showToast('Digite um nome para a área', 'error');
                }
            });
            
            inputNewInterest.addEventListener('keypress', (e) => {
                if(e.key === 'Enter') {
                    btnAddInterest.click();
                }
            });
        }

        const pdiForm = document.getElementById('pdi-form');
        if(pdiForm) {
            pdiForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newMeta = {
                    goal: document.getElementById('pdi-goal')?.value,
                    priority: document.getElementById('pdi-priority')?.value,
                    area: document.getElementById('pdi-area')?.value,
                    deadline: document.getElementById('pdi-deadline')?.value,
                    status: document.getElementById('pdi-status')?.value,
                    actions: document.getElementById('pdi-actions')?.value,
                    indicator: document.getElementById('pdi-indicator')?.value
                };
                await this.addPDI(newMeta);
            });
        }

        document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tabs .tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        const btnSync = document.getElementById('btn-sync');
        if(btnSync) {
            btnSync.addEventListener('click', async () => {
                if(FirebaseService?.updateSyncStatus) FirebaseService.updateSyncStatus('syncing');
                if(FirebaseService?.setLoading) FirebaseService.setLoading(true);
                try {
                    await FirebaseService?.saveData?.(appData);
                    await FirebaseService?.processSyncQueue?.();
                    if(FirebaseService?.updateSyncStatus) FirebaseService.updateSyncStatus('connected');
                    if(FirebaseService?.showToast) FirebaseService.showToast('Sincronização concluída! ☁️✅');
                } catch (error) {
                    if(FirebaseService?.updateSyncStatus) FirebaseService.updateSyncStatus('error');
                    if(FirebaseService?.showToast) FirebaseService.showToast('Erro na sincronização', 'error');
                } finally {
                    if(FirebaseService?.setLoading) FirebaseService.setLoading(false);
                }
            });
        }

        window.addEventListener('resize', () => {
            if(this.currentSection === 'dashboard') this.renderCharts();
        });
        
        console.log('✅ Event listeners configurados!');
    }
};

// Analytics
const Analytics = {
    process(data) {
        const areas = ['comportamental', 'organizacional', 'tecnica'];
        const processed = { ...data };
        let allItems = [];

        areas.forEach(area => {
            let areaSum = 0;
            processed.avaliacao[area] = (data.avaliacao?.[area] || []).map(item => {
                const media = (item.lider + item.auto) / 2;
                const gap = item.auto - item.lider;
                areaSum += media;
                return { ...item, media, gap, area };
            });
            const items = processed.avaliacao[area];
            processed[area + 'Media'] = items.length > 0 ? (areaSum / items.length).toFixed(2) : '0.00';
            allItems = [...allItems, ...items];
        });

        const totalSum = allItems.reduce((acc, item) => acc + item.media, 0);
        processed.mediaGeral = allItems.length > 0 ? (totalSum / allItems.length).toFixed(2) : '0.00';
        processed.insights = this.generateInsights(allItems, processed);
        return processed;
    },

    generateInsights(items, processed) {
        const sorted = [...items].sort((a, b) => a.media - b.media);
        const critical = sorted.filter(i => i.media <= 3.0);
        const strong = sorted.filter(i => i.media >= 4.5);
        const gaps = sorted.filter(i => Math.abs(i.gap) >= 1.0);
        const areas = {
            comportamental: parseFloat(processed.comportamentalMedia) || 0,
            organizacional: parseFloat(processed.organizacionalMedia) || 0,
            tecnica: parseFloat(processed.tecnicaMedia) || 0
        };
        const weakestArea = Object.keys(areas).reduce((a, b) => areas[a] < areas[b] ? a : b);
        return { critical, strong, gaps, weakestArea };
    }
};

// Torna UI globalmente acessível
window.UI = UI;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded - Iniciando aplicação...');
    UI.init();
});
