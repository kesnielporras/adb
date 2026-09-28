// ==========================================
// ⚙️ CONFIGURACIÓN DE SUPABASE - ASÍ DE BOLAS
// ==========================================
const SUPABASE_URL = 'https://ojzgsbahvlseeddlbjqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qemdzYmFodmxzZWVkZGxianFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzODE0NTEsImV4cCI6MjEwNTk1NzQ1MX0.to0eeEKDXFNDHa26cNbpAgoxC90P0dfK8Snkgwj0f3Y';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SITE_URL = 'https://asi-de-bolas-deportes.netlify.app/';
const BUCKET = 'asi-de-bolas-media';
const AVATAR_BUCKET = 'avatars';

// ==========================================
// 1. ESTADO
// ==========================================
let articlesDB = [];
let currentUser = null;
let currentUserProfile = null;
let savedArticleIds = [];
let isRegisterMode = false;
let editingArticleId = null;
let currentReadingArticle = null;
let currentTab = 'articles';
let uploadedImageUrl = null;
let uploadedVideoUrl = null;
let uploadedAvatarUrl = null;
let tinyEditor = null;

const categoryMap = {
    'futbol': { name: 'Fútbol' },
    'basquetbol': { name: 'Básquetbol' },
    'beisbol': { name: 'Béisbol' },
    'boxeo': { name: 'Boxeo' },
    'futbol-americano': { name: 'Fútbol Americano' },
    'tenis': { name: 'Tenis' },
    'atletismo': { name: 'Atletismo' },
    'otros': { name: 'Otros Deportes' }
};

const mainCategories = [
    { id: 'futbol', name: 'Fútbol' },
    { id: 'basquetbol', name: 'Básquetbol' },
    { id: 'beisbol', name: 'Béisbol' },
    { id: 'boxeo', name: 'Boxeo' },
    { id: 'futbol-americano', name: 'Fútbol Americano' },
    { id: 'tenis', name: 'Tenis' },
    { id: 'atletismo', name: 'Atletismo' },
    { id: 'otros', name: 'Otros Deportes' }
];

// ==========================================
// 2. CARGA DE DATOS
// ==========================================
// ==========================================
// 2. CARGA DE DATOS
// ==========================================
async function loadState() {
    // ⭐ SIEMPRE cargar los artículos, sin importar si hay sesión o no
    try {
        const { data: articles, error } = await supabaseClient
            .from('articles').select('*').order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando artículos:', error);
            articlesDB = [];
        } else if (articles) {
            articlesDB = articles.map(a => ({
                id: a.id,
                title: a.title,
                summary: a.summary,
                content: a.content,
                category: a.category,
                catName: a.cat_name,
                author: a.author,
                author_id: a.author_id,
                image: a.image,
                video_url: a.video_url,
                content_type: a.content_type || 'article',
                pages: a.pages,
                reads: a.reads,
                created_at: a.created_at
            }));
            console.log('✅ Artículos cargados:', articlesDB.length);
        }
    } catch (e) {
        console.error('Error crítico cargando artículos:', e);
        articlesDB = [];
    }
    
    // ⭐ Verificar sesión activa (por separado)
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            await loadCurrentUserProfile(session.user);
            await loadSavedArticles();
        }
    } catch (e) {
        console.error('Error verificando sesión:', e);
    }
}

async function loadCurrentUserProfile(user) {
    const { data: profile } = await supabaseClient
        .from('profiles').select('*').eq('id', user.id).single();
    
    currentUserProfile = profile || null;
    currentUser = {
        id: user.id,
        email: user.email,
        name: profile?.username || user.user_metadata?.username || user.email.split('@')[0],
        avatar_url: profile?.avatar_url || null,
        can_publish: profile?.can_publish || false,
        role: profile?.role || 'reader'
    };
}

async function loadSavedArticles() {
    if (!currentUser) return;
    try {
        const stored = localStorage.getItem('adb_saved_' + currentUser.id);
        savedArticleIds = stored ? JSON.parse(stored) : [];
    } catch (e) { savedArticleIds = []; }
}

function persistSavedArticles() {
    if (!currentUser) return;
    localStorage.setItem('adb_saved_' + currentUser.id, JSON.stringify(savedArticleIds));
}

// ==========================================
// 3. DOM
// ==========================================
const sectionsContainer = document.getElementById('sectionsContainer');
const singleViewContainer = document.getElementById('singleViewContainer');
const singleSectionTitle = document.getElementById('singleSectionTitle');
const singleArticlesGrid = document.getElementById('singleArticlesGrid');
const categoryLinks = document.querySelectorAll('#categoryList a[data-category]');
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');
const backToSectionsBtn = document.getElementById('backToSectionsBtn');
const exploreBtn = document.getElementById('exploreBtn');
const libraryBtn = document.getElementById('libraryBtn');
const myArticlesBtn = document.getElementById('myArticlesBtn');
const logoHome = document.getElementById('logoHome');
const themeToggle = document.getElementById('themeToggle');
const welcomeBanner = document.getElementById('welcomeBanner');
const welcomeName = document.getElementById('welcomeName');
const welcomeProfile = document.getElementById('welcomeProfile');
const welcomeMyArticles = document.getElementById('welcomeMyArticles');
const closeWelcome = document.getElementById('closeWelcome');
const contentTabs = document.getElementById('contentTabs');
const tabButtons = document.querySelectorAll('.tab-btn');

const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModal = document.getElementById('closeModal');
const uploadForm = document.getElementById('uploadForm');
const cmsTitle = document.getElementById('cmsTitle');
const submitBtn = document.getElementById('submitBtn');
const editingArticleIdInput = document.getElementById('editingArticleId');
const artContent = document.getElementById('artContent');
const artImage = document.getElementById('artImage');
const artVideo = document.getElementById('artVideo');
const artSummary = document.getElementById('artSummary');
const videoSection = document.getElementById('videoSection');
const contentTypesBtns = document.querySelectorAll('.content-type-btn');
const contentTypeInput = document.getElementById('contentType');

const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const closeLogin = document.getElementById('closeLogin');
const loginForm = document.getElementById('loginForm');
const loginTitle = document.getElementById('loginTitle');
const loginSubmitBtn = document.getElementById('loginSubmitBtn');
const switchMode = document.getElementById('switchMode');
const switchText = document.getElementById('switchText');
const userNameContainer = document.getElementById('userNameContainer');
const userNameSpan = document.getElementById('userName');
const userAvatarMini = document.getElementById('userAvatarMini');
const usernameField = document.getElementById('usernameField');
const usernameInput = document.getElementById('username');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const duplicateError = document.getElementById('duplicateError');

const readingModal = document.getElementById('readingModal');
const readingTitle = document.getElementById('readingTitle');
const readingMeta = document.getElementById('readingMeta');
const readingBody = document.getElementById('readingBody');
const closeReading = document.getElementById('closeReading');
const shareBtn = document.getElementById('shareBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');

const profileModal = document.getElementById('profileModal');
const closeProfile = document.getElementById('closeProfile');
const profileAvatar = document.getElementById('profileAvatar');
const profileUsername = document.getElementById('profileUsername');
const profileBio = document.getElementById('profileBio');
const profileSocials = document.getElementById('profileSocials');
const profileArticleCount = document.getElementById('profileArticleCount');
const profileVideoCount = document.getElementById('profileVideoCount');
const profileArticlesContainer = document.getElementById('profileArticlesContainer');
const profileVideosContainer = document.getElementById('profileVideosContainer');
const profilePhotosContainer = document.getElementById('profilePhotosContainer');
const profilePhotoCount = document.getElementById('profilePhotoCount');
const editProfileBtn = document.getElementById('editProfileBtn');

const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfile = document.getElementById('closeEditProfile');
const editProfileForm = document.getElementById('editProfileForm');
const editAvatarFile = document.getElementById('editAvatarFile');
const editAvatarPreview = document.getElementById('editAvatarPreview');
const editBio = document.getElementById('editBio');
const editTwitter = document.getElementById('editTwitter');
const editInstagram = document.getElementById('editInstagram');
const editYoutube = document.getElementById('editYoutube');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const confirmModal = document.getElementById('confirmModal');
const confirmIcon = document.getElementById('confirmIcon');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmCancel = document.getElementById('confirmCancel');
const confirmOk = document.getElementById('confirmOk');

const toastContainer = document.getElementById('toastContainer');

// ==========================================
// 4. TOASTS Y CONFIRMACIÓN
// ==========================================
function showToast(message, type = 'info', title = null) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '✅', error: '⚠️', info: 'ℹ️' };
    const titles = { success: 'Éxito', error: 'Atención', info: 'Información' };
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-title ${type}">${title || titles[type]}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function showConfirm(message, onConfirm, options = {}) {
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    confirmIcon.textContent = options.icon || '⚠️';
    confirmTitle.textContent = options.title || 'Confirmar acción';
    confirmMessage.textContent = message;
    okBtn.textContent = options.confirmText || 'Confirmar';
    cancelBtn.textContent = options.cancelText || 'Cancelar';
    confirmModal.classList.add('active');
    document.body.classList.add('modal-open');
    
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    
    newOk.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        if (onConfirm) onConfirm();
    });
    newCancel.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    });
}

// ==========================================
// 5. TINYMCE
// ==========================================
function initTinyMCE() {
    if (tinyEditor) return;
    if (typeof tinymce === 'undefined') { console.error('TinyMCE no cargado'); return; }
    
    tinymce.init({
        selector: '#artContent',
        height: 300,
        menubar: true,
        plugins: ['advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                  'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                  'insertdatetime', 'media', 'table', 'help', 'wordcount'],
        toolbar: 'undo redo | blocks | bold italic backcolor | alignleft aligncenter ' +
                 'alignright alignjustify | bullist numlist outdent indent | ' +
                 'removeformat | link image media table | code fullscreen',
        block_formats: 'Párrafo=p; Encabezado 1=h1; Encabezado 2=h2; Encabezado 3=h3; Encabezado 4=h4; Con formato previo=pre; Cita=blockquote',
        content_style: 'body { font-family: Inter, Arial, sans-serif; font-size: 15px; line-height: 1.6; } h1,h2,h3 { font-family: Oswald, sans-serif; color: #E63946; } blockquote { border-left: 4px solid #E63946; padding-left: 15px; font-style: italic; }',
        skin: 'oxide',
        branding: false,
        promotion: false,
        language: 'es',
        zindex: 3000,
        images_upload_handler: async function (blobInfo, progress) {
            return new Promise(async (resolve, reject) => {
                if (!currentUser) { reject('Debes iniciar sesión.'); return; }
                const file = blobInfo.blob();
                const fileExt = file.name ? file.name.split('.').pop() : 'png';
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${currentUser.id}/${fileName}`;
                try {
                    const { error } = await supabaseClient.storage.from(BUCKET).upload(filePath, file, { upsert: false });
                    if (error) { reject('Error: ' + error.message); return; }
                    const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(filePath);
                    resolve(urlData.publicUrl);
                } catch (e) { reject('Error: ' + e.message); }
            });
        },
        setup: function (editor) {
            editor.on('change keyup', function () { editor.save(); });
        }
    }).then(function (editors) { tinyEditor = editors[0]; });
}

function getEditorContent() {
    if (tinyEditor) return tinyEditor.getContent();
    return document.getElementById('artContent').value || '';
}

function setEditorContent(html) {
    if (tinyEditor) tinyEditor.setContent(html || '');
    else {
        const el = document.getElementById('artContent');
        if (el) el.value = html || '';
    }
}

// ==========================================
// 6. SUBIDA DE ARCHIVOS
// ==========================================
async function uploadFileToSupabase(file, type, bucketName = BUCKET) {
    if (!file) return null;
    
    if (type === 'image' && !file.type.startsWith('image/')) {
        showToast('Solo se permiten imágenes.', 'error'); return null;
    }
    if (type === 'video' && !file.type.startsWith('video/')) {
        showToast('Solo se permiten videos.', 'error'); return null;
    }
    if (file.size > 100 * 1024 * 1024) {
        showToast('El archivo supera los 100 MB.', 'error'); return null;
    }
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;
        
        showToast(`Subiendo ${type === 'image' ? 'imagen' : 'video'}...`, 'info', 'Espera');
        
        const { error } = await supabaseClient.storage.from(bucketName).upload(filePath, file, { upsert: false });
        if (error) { showToast('Error: ' + error.message, 'error'); return null; }
        
        const { data: urlData } = supabaseClient.storage.from(bucketName).getPublicUrl(filePath);
        showToast('Subido correctamente.', 'success');
        return urlData.publicUrl;
    } catch (e) {
        showToast('Error inesperado.', 'error'); return null;
    }
}
// ==========================================
// 7. RENDERIZADO
// ==========================================
function createCard(article, isMyArticle = false) {
    const card = document.createElement('div');
    card.className = 'doc-card';
    const isSaved = savedArticleIds.includes(article.id);
    const isOwner = currentUser && article.author_id === currentUser.id;
    const isVideo = article.content_type === 'video';
    
    const authorAvatar = article.author_avatar || null;
    
    card.innerHTML = `
        <button class="save-btn ${isSaved ? 'saved' : ''}" data-id="${article.id}">
            ${isSaved ? '♥' : '♡'}
        </button>
        <div class="doc-thumbnail">
            <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80'">
            ${isVideo ? '<span class="video-badge">▶ VIDEO</span>' : ''}
        </div>
        <div class="doc-info">
            <div class="doc-category-tag">${article.catName}</div>
            <div class="doc-title">${article.title}</div>
            <div class="doc-summary">${article.summary || ''}</div>
            <div class="doc-author" data-author="${article.author}">
                ${authorAvatar ? `<img class="doc-author-avatar" src="${authorAvatar}" alt="">` : ''}
                Por ${article.author}
            </div>
            <div class="doc-stats">
                <span>${article.pages} min</span>
                <span>${article.reads} lecturas</span>
            </div>
        </div>
    `;
    
        if (isMyArticle && isOwner) {
        const isPhoto = article.content_type === 'photo';
        const actions = document.createElement('div');
        actions.className = 'doc-actions';
        actions.innerHTML = `
            ${isPhoto ? '' : '<button class="btn-edit">✎ Editar</button>'}
            <button class="btn-delete">🗑 Eliminar</button>
        `;
        card.appendChild(actions);
        
        const editBtn = actions.querySelector('.btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation(); openEditArticle(article);
            });
        }
        
        actions.querySelector('.btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            if (isPhoto) {
                showConfirm(`¿Eliminar la foto "${article.title}"?`, () => deletePhoto(article.id), 
                    { title: 'Eliminar foto', icon: '🗑️', confirmText: 'Eliminar' });
            } else {
                showConfirm(`¿Eliminar "${article.title}"?`, () => deleteArticle(article.id), 
                    { title: 'Eliminar', icon: '🗑️', confirmText: 'Eliminar' });
            }
        });
    }
    
    card.addEventListener('click', (e) => {
        if (e.target.closest('.save-btn') || e.target.closest('.doc-actions') || e.target.closest('.doc-author')) return;
        openReadingModal(article);
    });
    
    card.querySelector('.doc-author').addEventListener('click', (e) => {
        e.stopPropagation();
        showAuthorProfile(article.author);
    });
    
    const saveBtn = card.querySelector('.save-btn');
    saveBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSaveArticle(article.id);
    });
    
    return card;
}

function createVideoCardMultimedia(article, isFeatured = false) {
    const card = document.createElement('div');
    card.className = 'video-card-multimedia' + (isFeatured ? ' featured' : '');
    
    const date = article.created_at ? new Date(article.created_at) : new Date();
    const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const authorAvatar = article.author_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(article.author) + '&background=E63946&color=fff&size=64';
    
    card.innerHTML = `
        <div class="video-multimedia-thumb">
            <img src="${article.image}" alt="${article.title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80'">
            <span class="video-multimedia-category-badge">${article.catName}</span>
            <div class="video-play-overlay">
                <div class="video-play-btn"></div>
            </div>
        </div>
        <div class="video-multimedia-info">
            <div class="video-multimedia-title">${article.title}</div>
            <div class="video-multimedia-desc">${article.summary || ''}</div>
            <div class="video-multimedia-meta">
                <div class="video-multimedia-author" data-author="${article.author}">
                    <img src="${authorAvatar}" alt="">
                    <span>${article.author}</span>
                </div>
                <div class="video-multimedia-date">${dateStr}</div>
            </div>
        </div>
    `;
    
    card.querySelector('.video-multimedia-author').addEventListener('click', (e) => {
        e.stopPropagation();
        showAuthorProfile(article.author);
    });
    
    card.addEventListener('click', () => {
        openReadingModal(article);
    });
    
    return card;
}

function toggleSaveArticle(articleId) {
    if (!currentUser) {
        showToast('Debes iniciar sesión.', 'error', 'Acceso');
        openLoginModal(); return;
    }
    const index = savedArticleIds.indexOf(articleId);
    const article = articlesDB.find(a => a.id === articleId);
    if (index === -1) {
        savedArticleIds.push(articleId);
        showToast(`"${article.title}" guardado.`, 'success');
    } else {
        savedArticleIds.splice(index, 1);
        showToast(`"${article.title}" eliminado.`, 'info');
    }
    persistSavedArticles();
    updateCategoryCounts();
    renderCurrentView();
}

function updateCategoryCounts() {
    const counts = { all: articlesDB.length };
    mainCategories.forEach(c => { counts[c.id] = articlesDB.filter(a => a.category === c.id).length; });
    Object.keys(counts).forEach(key => {
        const el = document.getElementById(`count-${key}`);
        if (el) el.textContent = counts[key];
    });
}

function getFilteredByTab() {
    if (currentTab === 'videos') return articlesDB.filter(a => a.content_type === 'video');
    return articlesDB.filter(a => a.content_type !== 'video');
}

function renderSections() {
    singleViewContainer.style.display = 'none';
    sectionsContainer.style.display = 'block';
    sectionsContainer.innerHTML = '';
    
    contentTabs.style.display = 'block';

    const filtered = getFilteredByTab();

    if (filtered.length === 0) {
        const icon = currentTab === 'videos' ? '🎬' : '⚽';
        const msg = currentTab === 'videos' ? 'Aún no hay videos publicados' : 'Aún no hay artículos publicados';
        sectionsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <strong>${msg}</strong>
                <span>Sé el primero en compartir tu pasión deportiva.</span>
            </div>
        `;
        updateCategoryCounts();
        return;
    }

    // ==========================================
    // VISTA DE VIDEOS (formato multimedia)
    // ==========================================
    if (currentTab === 'videos') {
        // Cabecera multimedia
        const header = document.createElement('div');
        header.className = 'multimedia-header';
        header.innerHTML = `
            <h2>🎬 Multimedia</h2>
            <p>Videos, entrevistas y análisis en profundidad</p>
        `;
        sectionsContainer.appendChild(header);

        // Grid de videos
        const videoGrid = document.createElement('div');
        videoGrid.className = 'video-multimedia-grid';
        
        filtered.forEach((article, index) => {
            const card = createVideoCardMultimedia(article, index === 0);
            videoGrid.appendChild(card);
        });
        
        sectionsContainer.appendChild(videoGrid);
        updateCategoryCounts();
        return;
    }

    // ==========================================
    // VISTA DE ARTÍCULOS (formato por categorías, como antes)
    // ==========================================
    mainCategories.forEach(cat => {
        const catArticles = filtered.filter(a => a.category === cat.id);
        if (catArticles.length === 0) return;

        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'category-section';
        sectionDiv.innerHTML = `
            <div class="section-header">
                <h2 class="section-title">${cat.name}</h2>
                <a class="section-link" data-category="${cat.id}">Ver todo &rarr;</a>
            </div>
            <div class="doc-grid" id="grid-${cat.id}"></div>
        `;
        sectionsContainer.appendChild(sectionDiv);
        const grid = document.getElementById(`grid-${cat.id}`);
        catArticles.slice(0, 4).forEach(article => grid.appendChild(createCard(article)));
        sectionDiv.querySelector('.section-link').addEventListener('click', () => showSingleCategory(cat.id));
    });
    updateCategoryCounts();
}

function showSingleCategory(categoryId, searchTerm = '') {
    sectionsContainer.style.display = 'none';
    singleViewContainer.style.display = 'block';
    singleArticlesGrid.innerHTML = '';

    let filteredArticles = currentTab === 'videos' 
        ? articlesDB.filter(a => a.content_type === 'video')
        : articlesDB.filter(a => a.content_type !== 'video');
    
    let title = '';

    if (categoryId !== 'all') {
        filteredArticles = filteredArticles.filter(a => a.category === categoryId);
        const catInfo = mainCategories.find(c => c.id === categoryId);
        title = catInfo ? catInfo.name : 'Categoría';
    } else {
        title = currentTab === 'videos' ? 'Todos los Videos' : 'Todos los Artículos';
    }

    if (searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        filteredArticles = filteredArticles.filter(a => 
            a.title.toLowerCase().includes(term) || 
            a.author.toLowerCase().includes(term) ||
            a.catName.toLowerCase().includes(term)
        );
        title = `Resultados: "${searchTerm}"`;
    }

    singleSectionTitle.textContent = title;
    
    if (filteredArticles.length === 0) {
        singleArticlesGrid.innerHTML = `<div class="empty-state">🔍 No se encontraron resultados.</div>`;
        return;
    }
    
    if (currentTab === 'videos') {
        const videoGrid = document.createElement('div');
        videoGrid.className = 'video-multimedia-grid';
        filteredArticles.forEach((article, index) => {
            videoGrid.appendChild(createVideoCardMultimedia(article, index === 0 && filteredArticles.length > 2));
        });
        singleArticlesGrid.appendChild(videoGrid);
    } else {
        filteredArticles.forEach(article => singleArticlesGrid.appendChild(createCard(article)));
    }
    
    updateCategoryCounts();
}

function renderLibrary() {
    sectionsContainer.style.display = 'none';
    singleViewContainer.style.display = 'block';
    singleSectionTitle.textContent = 'Mi biblioteca';
    singleArticlesGrid.innerHTML = '';
    if (!currentUser) {
        singleArticlesGrid.innerHTML = `<div class="empty-state">🔒 Inicia sesión para ver tu biblioteca.</div>`;
        return;
    }
    const myArticles = articlesDB.filter(a => savedArticleIds.includes(a.id));
    if (myArticles.length === 0) {
        singleArticlesGrid.innerHTML = `<div class="empty-state">📚 No has guardado contenido.<br><span>Explora y guarda tus favoritos con ♡.</span></div>`;
        return;
    }
    myArticles.forEach(article => singleArticlesGrid.appendChild(createCard(article)));
}

function renderMyArticles() {
    sectionsContainer.style.display = 'none';
    singleViewContainer.style.display = 'block';
    singleSectionTitle.textContent = 'Mis publicaciones';
    singleArticlesGrid.innerHTML = '';
    
    if (!currentUser) {
        singleArticlesGrid.innerHTML = `<div class="empty-state">🔒 Inicia sesión para administrar tus publicaciones.</div>`;
        return;
    }
    
    if (!currentUser.can_publish) {
        singleArticlesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔒</div>
                <strong>Cuenta sin autorización para publicar</strong>
                <span>Tu cuenta actual tiene acceso de solo lectura. Si deseas publicar artículos o videos, contacta al administrador para solicitar autorización.</span>
            </div>
        `;
        return;
    }
    
    // Artículos/videos del usuario
    const myArticles = articlesDB.filter(a => a.author_id === currentUser.id);
    
    // Fotos del usuario (adaptadas al formato de artículo para createCard)
    const myPhotos = galleryDB
        .filter(p => p.author_id === currentUser.id)
        .map(p => ({
            id: p.id,
            title: p.title,
            summary: p.description,
            content: '',
            category: p.category,
            catName: p.catName,
            author: p.author,
            author_id: p.author_id,
            image: p.image_url,
            video_url: null,
            content_type: 'photo',
            pages: 1,
            reads: p.reads,
            created_at: p.created_at
        }));
    
    const combined = [...myArticles, ...myPhotos];
    
    if (combined.length === 0) {
        singleArticlesGrid.innerHTML = `<div class="empty-state">✍️ Aún no has publicado nada.<br><span>Haz clic en "Publicar" para empezar.</span></div>`;
        return;
    }
    
    combined.forEach(item => singleArticlesGrid.appendChild(createCard(item, true)));
}

async function deleteArticle(articleId) {
    const { error } = await supabaseClient.from('articles').delete().eq('id', articleId);
    if (error) { showToast('Error al eliminar: ' + error.message, 'error'); return; }
    await loadState();
    showToast('Publicación eliminada.', 'success');
    renderMyArticles();
    updateCategoryCounts();
}

async function deletePhoto(photoId) {
    const { error } = await supabaseClient.from('gallery').delete().eq('id', photoId);
    if (error) { showToast('Error al eliminar: ' + error.message, 'error'); return; }
    await loadGallery();
    showToast('Foto eliminada.', 'success');
    renderMyArticles();
    if (currentTab === 'gallery') renderGallery();
}

function renderCurrentView() {
    if (singleViewContainer.style.display === 'block') {
        const title = singleSectionTitle.textContent;
        if (title === 'Mi biblioteca') renderLibrary();
        else if (title === 'Mis publicaciones') renderMyArticles();
        else if (title.startsWith('Artículos de')) showAuthorProfile(title.replace('Artículos de ', ''));
        else if (title.startsWith('Resultados')) showSingleCategory('all', searchInput.value);
        else {
            const catId = mainCategories.find(c => c.name === title)?.id || 'all';
            showSingleCategory(catId);
        }
    } else {
        renderSections();
    }
}

function openReadingModal(article) {
    currentReadingArticle = article;
    readingTitle.textContent = article.title;
    readingMeta.textContent = `${article.catName} · Por ${article.author}`;
    
    const newUrl = `${SITE_URL}?article=${article.id}`;
    window.history.pushState({ articleId: article.id }, '', newUrl);
    
    let contentHTML = '';
    
    // ⭐ Imagen de portada al inicio del artículo
    if (article.image) {
        contentHTML += `
            <div style="margin: -40px -40px 30px -40px;">
                <img src="${article.image}" alt="${article.title}" style="width: 100%; height: auto; max-height: 400px; object-fit: cover; display: block; border-radius: 12px 12px 0 0;">
            </div>
        `;
    }
    
    // ⭐ Video (si existe)
    if (article.video_url) {
        let videoHTML = '';
        if (article.video_url.includes('youtube.com') || article.video_url.includes('youtu.be')) {
            const videoId = article.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (videoId) {
                videoHTML = `<div style="margin: 20px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"><iframe src="https://www.youtube.com/embed/${videoId[1]}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe></div>`;
            }
        } else if (article.video_url.includes('vimeo.com')) {
            const vimeoId = article.video_url.match(/vimeo\.com\/(\d+)/);
            if (vimeoId) {
                videoHTML = `<div style="margin: 20px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"><iframe src="https://player.vimeo.com/video/${vimeoId[1]}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe></div>`;
            }
        } else {
            videoHTML = `<video src="${article.video_url}" controls style="max-width: 100%; border-radius: 8px; margin: 20px 0;"></video>`;
        }
        contentHTML += videoHTML;
    }
    
    // ⭐ Sumario en caja destacada
    if (article.summary) {
        contentHTML += `
            <div style="background: #F1FAEE; border-left: 4px solid #E63946; padding: 15px 20px; margin: 0 0 25px 0; border-radius: 4px; font-style: italic; color: #444; font-size: 15px;">
                ${article.summary}
            </div>
        `;
    }
    
    // ⭐ Contenido principal
    let mainContent = '';
    if (article.content && article.content.includes('<')) {
        mainContent = article.content;
    } else {
        const paragraphs = (article.content || '').split('\n').filter(p => p.trim() !== '');
        paragraphs.forEach(p => { mainContent += `<p>${p}</p>`; });
    }
    contentHTML += mainContent;
    
    contentHTML += `<hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;"><p style="font-size: 13px; color: #999; font-style: italic;">Contenido publicado en Así de Bolas.</p>`;
    
    readingBody.innerHTML = contentHTML;
    readingModal.classList.add('active');
    document.body.classList.add('modal-open');
}

// ==========================================
// 8. PERFIL DE AUTOR
// ==========================================
async function showAuthorProfile(authorName) {
    try {
        const { data: profile } = await supabaseClient
            .from('profiles').select('*').eq('username', authorName).single();
        
        const authorArticles = articlesDB.filter(a => a.author === authorName);
        const articlesOnly = authorArticles.filter(a => a.content_type !== 'video');
        const videosOnly = authorArticles.filter(a => a.content_type === 'video');
        
        // ⭐ Fotos del autor
        const photosOnly = galleryDB.filter(p => p.author === authorName);
        
        profileAvatar.src = profile?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName) + '&background=E63946&color=fff&size=200';
        profileUsername.textContent = authorName;
        profileArticleCount.textContent = articlesOnly.length;
        profileVideoCount.textContent = videosOnly.length;
        profilePhotoCount.textContent = photosOnly.length;
        
        if (profile?.bio) {
            profileBio.textContent = profile.bio;
            profileBio.classList.remove('empty');
        } else {
            profileBio.textContent = 'Sin biografía aún.';
            profileBio.classList.add('empty');
        }
        
        let socialsHTML = '';
        if (profile?.social_twitter) socialsHTML += `<a class="social-link" href="https://twitter.com/${profile.social_twitter}" target="_blank">𝕏 @${profile.social_twitter}</a>`;
        if (profile?.social_instagram) socialsHTML += `<a class="social-link" href="https://instagram.com/${profile.social_instagram}" target="_blank">📷 @${profile.social_instagram}</a>`;
        if (profile?.social_youtube) socialsHTML += `<a class="social-link" href="https://youtube.com/${profile.social_youtube}" target="_blank">▶ ${profile.social_youtube}</a>`;
        profileSocials.innerHTML = socialsHTML;
        
        if (currentUser && currentUser.name === authorName) {
            editProfileBtn.style.display = 'block';
        } else {
            editProfileBtn.style.display = 'none';
        }
        
        // ============ ARTÍCULOS ============
        if (articlesOnly.length > 0) {
            profileArticlesContainer.innerHTML = '<div class="profile-content-grid"></div>';
            const grid = profileArticlesContainer.querySelector('.profile-content-grid');
            articlesOnly.forEach(a => {
                const item = document.createElement('div');
                item.className = 'profile-content-item';
                item.innerHTML = `
                    <img src="${a.image}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80'">
                    <div class="title">${a.title}</div>
                `;
                item.addEventListener('click', () => {
                    profileModal.classList.remove('active');
                    openReadingModal(a);
                });
                grid.appendChild(item);
            });
        } else {
            profileArticlesContainer.innerHTML = '<p style="color:#999;font-style:italic;">No hay artículos.</p>';
        }
        
        // ============ VIDEOS ============
        if (videosOnly.length > 0) {
            profileVideosContainer.innerHTML = '<div class="profile-content-grid"></div>';
            const grid = profileVideosContainer.querySelector('.profile-content-grid');
            videosOnly.forEach(a => {
                const item = document.createElement('div');
                item.className = 'profile-content-item';
                item.innerHTML = `
                    <img src="${a.image}" alt="${a.title}" onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80'">
                    <div class="title">🎬 ${a.title}</div>
                `;
                item.addEventListener('click', () => {
                    profileModal.classList.remove('active');
                    openReadingModal(a);
                });
                grid.appendChild(item);
            });
        } else {
            profileVideosContainer.innerHTML = '<p style="color:#999;font-style:italic;">No hay videos.</p>';
        }
        
        // ============ FOTOS ============
        if (photosOnly.length > 0) {
            profilePhotosContainer.innerHTML = '<div class="profile-content-grid"></div>';
            const grid = profilePhotosContainer.querySelector('.profile-content-grid');
            photosOnly.forEach(p => {
                const item = document.createElement('div');
                item.className = 'profile-content-item';
                item.innerHTML = `
                    <img src="${p.image_url}" alt="${p.title}" onerror="this.src='https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&q=80'">
                    <div class="title">📸 ${p.title}</div>
                `;
                item.addEventListener('click', () => {
                    profileModal.classList.remove('active');
                    openPhotoViewer(p);
                });
                grid.appendChild(item);
            });
        } else {
            profilePhotosContainer.innerHTML = '<p style="color:#999;font-style:italic;">No hay fotos.</p>';
        }
        
        profileModal.classList.add('active');
        document.body.classList.add('modal-open');
    } catch (e) {
        console.error('Error mostrando perfil:', e);
        showToast('Error al cargar el perfil.', 'error');
    }
}

// ==========================================
// 9. EDITAR PERFIL
// ==========================================
function openEditProfileModal() {
    if (!currentUserProfile) {
        showToast('No se encontró tu perfil.', 'error');
        return;
    }
    
    editAvatarPreview.src = currentUserProfile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=E63946&color=fff&size=200';
    editBio.value = currentUserProfile.bio || '';
    editTwitter.value = currentUserProfile.social_twitter || '';
    editInstagram.value = currentUserProfile.social_instagram || '';
    editYoutube.value = currentUserProfile.social_youtube || '';
    uploadedAvatarUrl = currentUserProfile.avatar_url || null;
    
    editProfileModal.classList.add('active');
    document.body.classList.add('modal-open');
}

editAvatarFile?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => { editAvatarPreview.src = event.target.result; };
    reader.readAsDataURL(file);
    
    const url = await uploadFileToSupabase(file, 'image', AVATAR_BUCKET);
    if (url) uploadedAvatarUrl = url;
});

editProfileForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    
    saveProfileBtn.disabled = true;
    saveProfileBtn.textContent = 'Guardando...';
    
    const updates = {
        bio: editBio.value.trim(),
        social_twitter: editTwitter.value.trim() || null,
        social_instagram: editInstagram.value.trim() || null,
        social_youtube: editYoutube.value.trim() || null,
        avatar_url: uploadedAvatarUrl || null
    };
    
    const { error } = await supabaseClient
        .from('profiles').update(updates).eq('id', currentUser.id);
    
    if (error) {
        showToast('Error al guardar: ' + error.message, 'error');
        saveProfileBtn.disabled = false;
        saveProfileBtn.textContent = 'Guardar cambios';
        return;
    }
    
    currentUserProfile = { ...currentUserProfile, ...updates };
    if (updates.avatar_url) {
        currentUser.avatar_url = updates.avatar_url;
        updateAuthUI();
    }
    
    editProfileModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    showToast('Perfil actualizado correctamente.', 'success', '¡Listo!');
    saveProfileBtn.disabled = false;
    saveProfileBtn.textContent = 'Guardar cambios';
});

// ==========================================
// 10. DESCARGAR PDF
// ==========================================
async function downloadPDF(article) {
    if (!article) return;
    showToast('Generando PDF...', 'info', 'Espera');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);
    const lineHeight = 6;
    let yPos = margin;

    // ⭐ CABECERA CON FONDO AZUL MARINO
    doc.setFillColor(27, 42, 65);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(241, 250, 238);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ASÍ DE BOLAS | CONTENIDO DEPORTIVO', margin, 15);
    
    doc.setFontSize(9);
    doc.setTextColor(230, 200, 200);
    doc.text(article.catName.toUpperCase(), margin, 22);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    const titleLines = doc.splitTextToSize(article.title, maxWidth);
    doc.text(titleLines, margin, 35);

    yPos = 65;

    // ⭐ AUTOR Y METADATOS
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Por ${article.author}`, margin, yPos);
    yPos += 6;
    doc.text(`${article.pages} min  ·  ${article.reads} lecturas  ·  ${new Date().toLocaleDateString('es-ES')}`, margin, yPos);
    yPos += 10;

    doc.setDrawColor(230, 57, 70);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 12;

    // ⭐ IMAGEN DE PORTADA EN EL PDF
    if (article.image) {
        try {
            const img = await loadImageFromUrl(article.image);
            if (img) {
                // Calcular dimensiones manteniendo aspecto
                const imgAspect = img.width / img.height;
                let imgWidth = maxWidth;
                let imgHeight = imgWidth / imgAspect;
                
                // Si la imagen es muy alta, ajustar por altura máxima
                const maxImgHeight = 100; // mm
                if (imgHeight > maxImgHeight) {
                    imgHeight = maxImgHeight;
                    imgWidth = imgHeight * imgAspect;
                }
                
                // Centrar la imagen
                const imgX = margin + (maxWidth - imgWidth) / 2;
                
                // Verificar si cabe en la página, si no, nueva página
                if (yPos + imgHeight > pageHeight - 30) {
                    doc.addPage();
                    yPos = 25;
                }
                
                doc.addImage(img, 'JPEG', imgX, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 10;
            }
        } catch (e) {
            console.error('Error cargando la imagen para el PDF:', e);
        }
    }

    // ⭐ SUMARIO EN CAJA DESTACADA
    if (article.summary) {
        const summaryLines = doc.splitTextToSize(article.summary, maxWidth - 10);
        const boxHeight = (summaryLines.length * 5) + 10;
        
        if (yPos + boxHeight > pageHeight - 30) {
            doc.addPage();
            yPos = 25;
        }
        
        doc.setFillColor(241, 250, 238);
        doc.rect(margin, yPos - 4, maxWidth, boxHeight, 'F');
        doc.setDrawColor(230, 57, 70);
        doc.setLineWidth(1);
        doc.line(margin, yPos - 4, margin, yPos - 4 + boxHeight);
        
        doc.setTextColor(80, 80, 80);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.text(summaryLines, margin + 8, yPos + 4);
        yPos += boxHeight + 8;
    }

    // ⭐ FUNCIÓN AUXILIAR PARA SALTOS DE PÁGINA
    function checkPageBreak(neededHeight = 15) {
        if (yPos + neededHeight > pageHeight - 20) {
            doc.addPage();
            yPos = margin;
            doc.setFillColor(27, 42, 65);
            doc.rect(0, 0, pageWidth, 15, 'F');
            doc.setTextColor(241, 250, 238);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text('ASÍ DE BOLAS', margin, 10);
            doc.text(article.title.substring(0, 60), pageWidth - margin, 10, { align: 'right' });
            yPos = 25;
        }
    }

    // ⭐ PROCESAR CONTENIDO
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = article.content;
    const contentElements = Array.from(tempDiv.childNodes);

    function processNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach(line => {
                    checkPageBreak(lineHeight);
                    doc.setTextColor(30, 30, 30);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.text(line, margin, yPos);
                    yPos += lineHeight;
                });
            }
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const tag = node.tagName.toLowerCase();
        
        if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
            checkPageBreak(20);
            yPos += 5;
            const text = node.textContent.trim();
            if (text) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(15);
                doc.setTextColor(230, 57, 70);
                const lines = doc.splitTextToSize(text.toUpperCase(), maxWidth);
                lines.forEach(line => {
                    checkPageBreak(10);
                    doc.text(line, margin, yPos);
                    yPos += 8;
                });
                yPos += 3;
            }
        } else if (tag === 'blockquote') {
            const text = node.textContent.trim();
            if (text) {
                const lines = doc.splitTextToSize(text, maxWidth - 15);
                const boxHeight = (lines.length * 5.5) + 8;
                checkPageBreak(boxHeight + 5);
                doc.setFillColor(250, 245, 235);
                doc.rect(margin, yPos - 4, maxWidth, boxHeight, 'F');
                doc.setDrawColor(230, 57, 70);
                doc.setLineWidth(1);
                doc.line(margin, yPos - 4, margin, yPos - 4 + boxHeight);
                doc.setTextColor(80, 80, 80);
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(11);
                lines.forEach((line, i) => {
                    doc.text(line, margin + 8, yPos + 3 + (i * 5.5));
                });
                yPos += boxHeight + 6;
            }
        } else if (tag === 'ul' || tag === 'ol') {
            const items = Array.from(node.children);
            items.forEach((li, index) => {
                const text = li.textContent.trim();
                if (!text) return;
                const prefix = tag === 'ul' ? '• ' : `${index + 1}. `;
                const lines = doc.splitTextToSize(prefix + text, maxWidth - 8);
                lines.forEach((line, i) => {
                    checkPageBreak(lineHeight);
                    doc.setTextColor(30, 30, 30);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.text(line, margin + (i === 0 ? 5 : 10), yPos);
                    yPos += lineHeight;
                });
                yPos += 1;
            });
            yPos += 3;
        } else if (tag === 'br') {
            yPos += 3;
        } else if (tag === 'strong' || tag === 'b') {
            const text = node.textContent.trim();
            if (text) {
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach(line => {
                    checkPageBreak(lineHeight);
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.setTextColor(30, 30, 30);
                    doc.text(line, margin, yPos);
                    yPos += lineHeight;
                });
                yPos += 2;
            }
        } else {
            const text = node.textContent.trim();
            if (text && node.children.length === 0) {
                const lines = doc.splitTextToSize(text, maxWidth);
                lines.forEach(line => {
                    checkPageBreak(lineHeight);
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.setTextColor(30, 30, 30);
                    doc.text(line, margin, yPos);
                    yPos += lineHeight;
                });
                yPos += 3;
            } else {
                Array.from(node.childNodes).forEach(child => processNode(child));
                yPos += 3;
            }
        }
    }
    
    contentElements.forEach(node => processNode(node));

    // ⭐ PIE DE PÁGINA
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'normal');
        doc.text('Así de Bolas · Contenido Deportivo', margin, pageHeight - 9);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
    }

    // ⭐ GUARDAR
    const filename = article.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50) + '.pdf';
    doc.save(filename);
    showToast('PDF descargado.', 'success');
}

// ⭐ FUNCIÓN AUXILIAR para cargar la imagen desde una URL
function loadImageFromUrl(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

// ==========================================
// 11. COMPARTIR
// ==========================================
function shareArticle() {
    if (!currentReadingArticle) return;
    const article = currentReadingArticle;
    const shareUrl = `${SITE_URL}?article=${article.id}`;
    const shareText = `Te comparto de Así de Bolas: "${article.title}" de ${article.author}`;
    
    if (navigator.share) {
        navigator.share({ title: article.title, text: shareText, url: shareUrl })
            .then(() => showToast('Compartido.', 'success'))
            .catch(() => {});
    } else {
        navigator.clipboard.writeText(`${shareText}\n\n🔗 ${shareUrl}`).then(() => {
            showToast('Enlace copiado.', 'success');
        }).catch(() => prompt('Copia este enlace:', shareUrl));
    }
}

// ==========================================
// 12. VERIFICAR URL
// ==========================================
async function checkUrlForArticle() {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('article');
    if (articleId) {
        const article = articlesDB.find(a => String(a.id) === String(articleId));
        if (article) openReadingModal(article);
    }
}

// ==========================================
// 13. CMS
// ==========================================
function setContentType(type) {
    contentTypeInput.value = type;
    contentTypesBtns.forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.type === type);
    });
    
    const videoSec = document.getElementById('videoSection');
    const videoDescSec = document.getElementById('videoDescriptionSection');
    const articleSec = document.getElementById('articleContentSection');
    const photoSec = document.getElementById('photoSection');
    const imageSec = document.getElementById('imageSection');
    
    // Ocultar todo primero
    if (videoSec) videoSec.style.display = 'none';
    if (videoDescSec) videoDescSec.style.display = 'none';
    if (articleSec) articleSec.style.display = 'none';
    if (photoSec) photoSec.style.display = 'none';
    if (imageSec) imageSec.style.display = 'none';
    
    if (type === 'video') {
        if (videoSec) videoSec.style.display = 'block';
        if (videoDescSec) videoDescSec.style.display = 'block';
        // imageSection queda oculta (el video no necesita imagen de portada)
    } else if (type === 'photo') {
        if (photoSec) photoSec.style.display = 'block';
        // imageSection queda oculta (la foto usa su propio campo artPhoto)
    } else {
        // article (por defecto)
        if (articleSec) articleSec.style.display = 'block';
        if (imageSec) imageSec.style.display = 'block';
    }
}

// Función que llaman los botones del HTML con onclick
function selectContentType(type) {
    setContentType(type);
}

function resetCMS() {
    cmsTitle.textContent = 'Publicar nuevo contenido';
    submitBtn.textContent = 'Publicar';
    editingArticleIdInput.value = '';
    document.getElementById('artTitle').value = '';
    artSummary.value = '';
    document.getElementById('artCategory').value = 'futbol';
    document.getElementById('artAuthor').value = currentUser ? currentUser.name : '';
    artImage.value = '';
    artVideo.value = '';
    editingArticleId = null;
    uploadedImageUrl = null;
    uploadedVideoUrl = null;
    setContentType('article');
    
    const imageInput = document.getElementById('artImageFile');
    if (imageInput) imageInput.value = '';
    const imagePreview = document.getElementById('imagePreviewContainer');
    if (imagePreview) imagePreview.style.display = 'none';
    const imagePreviewImg = document.getElementById('imagePreview');
    if (imagePreviewImg) imagePreviewImg.src = '';
    
    const videoInput = document.getElementById('artVideoFile');
    if (videoInput) videoInput.value = '';
    const videoPreview = document.getElementById('videoPreviewContainer');
    if (videoPreview) videoPreview.style.display = 'none';
    const videoPreviewEl = document.getElementById('videoPreview');
    if (videoPreviewEl) videoPreviewEl.src = '';
    const videoDescInput = document.getElementById('artVideoDescription');
if (videoDescInput) videoDescInput.value = '';

    // ⭐ Limpiar fotos
    uploadedPhotoUrls = [];
    const photoInput = document.getElementById('artPhotoFile');
    if (photoInput) photoInput.value = '';
    const photoPreviewContainer = document.getElementById('photoPreviewContainer');
    if (photoPreviewContainer) {
        photoPreviewContainer.innerHTML = '';
        photoPreviewContainer.style.display = 'none';
    }
    const artPhotoInput = document.getElementById('artPhoto');
    if (artPhotoInput) artPhotoInput.value = '';

    setTimeout(() => {
        initTinyMCE();
        setEditorContent('');
    }, 300);
}

function openEditArticle(article) {
    cmsTitle.textContent = 'Editar contenido';
    submitBtn.textContent = 'Guardar cambios';
    editingArticleIdInput.value = article.id;
    document.getElementById('artTitle').value = article.title;
    artSummary.value = article.summary || '';
    document.getElementById('artCategory').value = article.category;
    document.getElementById('artAuthor').value = article.author;
    artImage.value = article.image || '';
    artVideo.value = article.video_url || '';
    editingArticleId = article.id;
    
    setContentType(article.content_type || 'article');
    
    if (article.image) {
        const previewContainer = document.getElementById('imagePreviewContainer');
        const previewImg = document.getElementById('imagePreview');
        if (previewContainer && previewImg) {
            previewImg.src = article.image;
            previewContainer.style.display = 'block';
        }
        uploadedImageUrl = article.image;
    }
    
    if (article.video_url) uploadedVideoUrl = article.video_url;
    
    uploadModal.classList.add('active');
    document.body.classList.add('modal-open');
if (article.content_type === 'video') {
    const videoDescInput = document.getElementById('artVideoDescription');
    if (videoDescInput) {
        // Si el contenido es un <p>...</p>, extraer el texto plano
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = article.content || '';
        videoDescInput.value = tempDiv.textContent || '';
    }
}
    
    setTimeout(() => {
        initTinyMCE();
        setEditorContent(article.content || '');
    }, 300);
}

// ==========================================
// 14. LOGIN
// ==========================================
function openLoginModal() { loginModal.classList.add('active'); document.body.classList.add('modal-open'); }

function closeLoginModal() {
    loginModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    loginForm.reset();
    isRegisterMode = false;
    loginTitle.textContent = 'Iniciar Sesión';
    loginSubmitBtn.textContent = 'Entrar';
    switchText.textContent = '¿No tienes cuenta?';
    switchMode.textContent = 'Regístrate';
    usernameField.style.display = 'none';
    usernameInput.required = false;
    emailError.classList.remove('active');
    passwordError.classList.remove('active');
    duplicateError.classList.remove('active');
}

function updateAuthUI() {
    if (currentUser) {
        loginBtn.style.display = 'none';
        userNameContainer.style.display = 'flex';
        userNameSpan.textContent = currentUser.name;
        
        if (currentUser.avatar_url) {
            userAvatarMini.src = currentUser.avatar_url;
        } else {
            userAvatarMini.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.name) + '&background=E63946&color=fff&size=64';
        }
        userAvatarMini.style.display = 'block';
        
        welcomeName.textContent = currentUser.name;
        welcomeBanner.classList.add('active');
        
        // ⭐ Ajustar el botón "Publicar" según autorización
        if (currentUser.can_publish) {
            uploadBtn.style.display = 'inline-block';
            uploadBtn.textContent = 'Publicar';
            uploadBtn.style.opacity = '1';
            uploadBtn.style.cursor = 'pointer';
        } else {
            uploadBtn.style.display = 'inline-block';
            uploadBtn.textContent = 'Publicar';
            uploadBtn.style.opacity = '0.5';
            uploadBtn.style.cursor = 'not-allowed';
        }
    } else {
        loginBtn.style.display = 'inline-block';
        userNameContainer.style.display = 'none';
        welcomeBanner.classList.remove('active');
        
        // ⭐ Cuando no hay sesión, el botón Publicar se ve pero invita a iniciar sesión
        uploadBtn.style.display = 'inline-block';
        uploadBtn.textContent = 'Publicar';
        uploadBtn.style.opacity = '1';
        uploadBtn.style.cursor = 'pointer';
    }
}

function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

// ==========================================
// 15. EVENTOS
// ==========================================
tabButtons.forEach(btn => {
    btn.addEventListener('click', async () => {   // ← async aquí
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTab = btn.dataset.tab;
        
        if (currentTab === 'gallery') {
            await loadGallery();
            renderGallery();
        } else {
            renderSections();
        }
    });
});

categoryLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        categoryLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        const category = link.getAttribute('data-category');
        searchInput.value = '';
        searchSuggestions.classList.remove('active');
        if (category === 'all') renderSections();
        else showSingleCategory(category);
    });
});

searchInput.addEventListener('input', (e) => {
    const term = e.target.value.trim();
    if (term.length > 1) {
        const matches = articlesDB.filter(a => a.title.toLowerCase().includes(term.toLowerCase())).slice(0, 5);
        if (matches.length > 0) {
            searchSuggestions.innerHTML = matches.map(a => `<div class="suggestion-item" data-id="${a.id}">${a.title}</div>`).join('');
            searchSuggestions.classList.add('active');
        } else searchSuggestions.classList.remove('active');
    } else searchSuggestions.classList.remove('active');
    
    categoryLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('#categoryList a[data-category="all"]').classList.add('active');
    showSingleCategory('all', term);
});

searchSuggestions.addEventListener('click', (e) => {
    const item = e.target.closest('.suggestion-item');
    if (!item) return;
    const article = articlesDB.find(a => a.id === parseInt(item.dataset.id));
    searchSuggestions.classList.remove('active');
    searchInput.value = '';
    openReadingModal(article);
});

document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar')) searchSuggestions.classList.remove('active');
});

backToSectionsBtn.addEventListener('click', () => {
    categoryLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('#categoryList a[data-category="all"]').classList.add('active');
    searchInput.value = '';
    renderSections();
});

exploreBtn.addEventListener('click', () => {
    categoryLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('#categoryList a[data-category="all"]').classList.add('active');
    searchInput.value = '';
    renderSections();
});

libraryBtn.addEventListener('click', () => {
    categoryLinks.forEach(l => l.classList.remove('active'));
    renderLibrary();
});

myArticlesBtn.addEventListener('click', () => {
    categoryLinks.forEach(l => l.classList.remove('active'));
    renderMyArticles();
});

logoHome.addEventListener('click', () => {
    categoryLinks.forEach(l => l.classList.remove('active'));
    document.querySelector('#categoryList a[data-category="all"]').classList.add('active');
    searchInput.value = '';
    renderSections();
});

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.textContent = isLight ? '☀️' : '🌙';
    localStorage.setItem('adb_theme', isLight ? 'light' : 'dark');
});

closeWelcome.addEventListener('click', () => welcomeBanner.classList.remove('active'));
welcomeProfile.addEventListener('click', () => { showAuthorProfile(currentUser.name); welcomeBanner.classList.remove('active'); });
welcomeMyArticles.addEventListener('click', () => { renderMyArticles(); welcomeBanner.classList.remove('active'); });

uploadBtn.addEventListener('click', () => {
    if (!currentUser) {
        showToast('Debes iniciar sesión.', 'error', 'Acceso');
        openLoginModal(); return;
    }
    
    // ⭐ Verificar autorización para publicar
    if (!currentUser.can_publish) {
        showToast(
            'Tu cuenta aún no ha sido autorizada para publicar. Contacta al administrador.',
            'error',
            'Acceso restringido'
        );
        return;
    }
    
    resetCMS();
    uploadModal.classList.add('active');
    document.body.classList.add('modal-open');
});

closeModal.addEventListener('click', () => { uploadModal.classList.remove('active'); document.body.classList.remove('modal-open'); });
uploadModal.addEventListener('click', (e) => { if (e.target === uploadModal) { uploadModal.classList.remove('active'); document.body.classList.remove('modal-open'); } });

document.getElementById('artImageFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        document.getElementById('imagePreview').src = event.target.result;
        document.getElementById('imagePreviewContainer').style.display = 'block';
    };
    reader.readAsDataURL(file);
    const url = await uploadFileToSupabase(file, 'image');
    if (url) { uploadedImageUrl = url; artImage.value = url; }
});

document.getElementById('clearImageBtn').addEventListener('click', () => {
    document.getElementById('artImageFile').value = '';
    document.getElementById('artImage').value = '';
    document.getElementById('imagePreviewContainer').style.display = 'none';
    document.getElementById('imagePreview').src = '';
    uploadedImageUrl = null;
});

document.getElementById('artVideoFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const videoPreview = document.getElementById('videoPreview');
    const previewContainer = document.getElementById('videoPreviewContainer');
    videoPreview.src = URL.createObjectURL(file);
    previewContainer.style.display = 'block';
    const url = await uploadFileToSupabase(file, 'video');
    if (url) { uploadedVideoUrl = url; artVideo.value = url; }
});

document.getElementById('clearVideoBtn').addEventListener('click', () => {
    document.getElementById('artVideoFile').value = '';
    document.getElementById('artVideo').value = '';
    document.getElementById('videoPreviewContainer').style.display = 'none';
    document.getElementById('videoPreview').src = '';
    uploadedVideoUrl = null;
});

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('artTitle').value.trim();
    const summary = artSummary.value.trim();
    const category = document.getElementById('artCategory').value;
    const author = document.getElementById('artAuthor').value.trim();
    const imageUrl = artImage.value.trim();
    const videoUrl = artVideo.value.trim();
    const contentType = contentTypeInput.value;
    
    const catInfo = categoryMap[category];
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Guardando...';
    
    // ==========================================
    // CASO 1: FOTO (va a la tabla gallery)
    // ==========================================
        if (contentType === 'photo') {
        // ⭐ Recolectar URLs: las subidas + la del campo URL manual (si hay)
        const manualUrl = document.getElementById('artPhoto').value.trim();
        let photoUrls = [...uploadedPhotoUrls];
        if (manualUrl && !photoUrls.includes(manualUrl)) photoUrls.push(manualUrl);
        
        if (photoUrls.length === 0) {
            showToast('Debes subir al menos una foto o pegar una URL.', 'error', 'Campo requerido');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publicar';
            return;
        }
        
        // ⭐ Insertar UNA fila por cada foto
        const rows = photoUrls.map(url => ({
            title,
            description: summary,
            category,
            cat_name: catInfo.name,
            author,
            author_id: currentUser.id,
            image_url: url,
            reads: 'Nuevo'
        }));
        
        const { error } = await supabaseClient.from('gallery').insert(rows);
        if (error) {
            showToast('Error: ' + error.message, 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Publicar';
            return;
        }
        
        showToast(`${rows.length} foto(s) publicada(s) en la galería.`, 'success', '¡Listo!');
        
        await loadGallery();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Publicar';
        uploadModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        resetCMS();
        
        if (currentTab === 'gallery') renderGallery();
        else renderSections();
        return;
    }
    
    // ==========================================
    // CASO 2 y 3: ARTÍCULO o VIDEO (van a articles)
    // ==========================================
    let contentHTML = '';

    if (contentType === 'video') {
        const desc = document.getElementById('artVideoDescription').value.trim();
        contentHTML = desc ? `<p>${desc}</p>` : '';
        
        if (!uploadedVideoUrl && !artVideo.value.trim()) {
            showToast('Debes subir un video o pegar una URL.', 'error', 'Campo requerido');
            submitBtn.disabled = false; submitBtn.textContent = 'Publicar';
            return;
        }
    } else {
        contentHTML = getEditorContent();
        const tempText = contentHTML.replace(/<[^>]*>/g, '').trim();
        if (!tempText) {
            showToast('El contenido del artículo no puede estar vacío.', 'error', 'Campo requerido');
            submitBtn.disabled = false; submitBtn.textContent = 'Publicar';
            return;
        }
    }
    
    const finalImage = uploadedImageUrl || imageUrl || 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80';
    const finalVideo = uploadedVideoUrl || videoUrl || null;
    
    if (editingArticleId) {
        const { error } = await supabaseClient.from('articles').update({
            title, summary, category, cat_name: catInfo.name,
            author, image: finalImage, video_url: finalVideo,
            content: contentHTML, content_type: contentType
        }).eq('id', editingArticleId);
        if (error) {
            showToast('Error: ' + error.message, 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Guardar cambios';
            return;
        }
        showToast(`"${title}" actualizado.`, 'success');
    } else {
        const { error } = await supabaseClient.from('articles').insert({
            title, summary, category, cat_name: catInfo.name,
            author, author_id: currentUser.id,
            image: finalImage, video_url: finalVideo,
            content: contentHTML, content_type: contentType,
            pages: Math.floor(Math.random() * 10) + 1,
            reads: 'Nuevo'
        });
        if (error) {
            showToast('Error: ' + error.message, 'error');
            submitBtn.disabled = false; submitBtn.textContent = 'Publicar';
            return;
        }
        showToast(`"${title}" publicado.`, 'success', '¡Listo!');
    }
    
    await loadState();
    submitBtn.disabled = false;
    submitBtn.textContent = 'Publicar';
    uploadModal.classList.remove('active');
    document.body.classList.remove('modal-open');
    resetCMS();
    
    if (singleSectionTitle.textContent === 'Mis publicaciones') renderMyArticles();
    else {
        categoryLinks.forEach(l => l.classList.remove('active'));
        document.querySelector('#categoryList a[data-category="all"]').classList.add('active');
        searchInput.value = '';
        renderSections();
    }
    updateCategoryCounts();
});

loginBtn.addEventListener('click', openLoginModal);
closeLogin.addEventListener('click', closeLoginModal);
loginModal.addEventListener('click', (e) => { if (e.target === loginModal) closeLoginModal(); });

switchMode.addEventListener('click', () => {
    isRegisterMode = !isRegisterMode;
    if (isRegisterMode) {
        loginTitle.textContent = 'Crear cuenta';
        loginSubmitBtn.textContent = 'Registrarse';
        switchText.textContent = '¿Ya tienes cuenta?';
        switchMode.textContent = 'Inicia sesión';
        usernameField.style.display = 'block';
        usernameInput.required = true;
    } else {
        loginTitle.textContent = 'Iniciar Sesión';
        loginSubmitBtn.textContent = 'Entrar';
        switchText.textContent = '¿No tienes cuenta?';
        switchMode.textContent = 'Regístrate';
        usernameField.style.display = 'none';
        usernameInput.required = false;
    }
    emailError.classList.remove('active');
    passwordError.classList.remove('active');
    duplicateError.classList.remove('active');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    
    emailError.classList.remove('active');
    passwordError.classList.remove('active');
    duplicateError.classList.remove('active');
    
    if (!isValidEmail(email)) { emailError.classList.add('active'); return; }
    if (password.length < 6) { passwordError.classList.add('active'); return; }
    
    loginSubmitBtn.disabled = true;
    loginSubmitBtn.textContent = 'Cargando...';
    
    if (isRegisterMode) {
        const name = usernameInput.value.trim();
        if (!name) {
            showToast('Ingresa un nombre de usuario.', 'error');
            loginSubmitBtn.disabled = false; loginSubmitBtn.textContent = 'Registrarse';
            return;
        }
        
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { 
                data: { username: name },
                emailRedirectTo: SITE_URL
            }
        });
        
        if (error) {
            if (error.message.includes('already registered')) duplicateError.classList.add('active');
            else showToast(error.message, 'error');
            loginSubmitBtn.disabled = false; loginSubmitBtn.textContent = 'Registrarse';
            return;
        }
        
        if (data.user) {
            const { error: profileError } = await supabaseClient.from('profiles').insert({
                id: data.user.id, username: name, email: email
            });
            if (profileError) console.error('Error creando perfil:', profileError);
        }
        
        closeLoginModal();
        showToast('¡Cuenta creada! Inicia sesión.', 'success', 'Registro exitoso');
    } else {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            showToast('Correo o contraseña incorrectos.', 'error');
            loginSubmitBtn.disabled = false; loginSubmitBtn.textContent = 'Entrar';
            return;
        }
        
        await loadCurrentUserProfile(data.user);
        await loadSavedArticles();
        await loadState();
        closeLoginModal();
        updateAuthUI();
        showToast(`¡Bienvenido/a, ${currentUser.name}!`, 'success');
        renderCurrentView();
    }
    
    loginSubmitBtn.disabled = false;
    loginSubmitBtn.textContent = isRegisterMode ? 'Registrarse' : 'Entrar';
});

// Clic en el NOMBRE → Ver perfil
userNameSpan.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) showAuthorProfile(currentUser.name);
});

// El avatar (foto pequeña) cierra sesión
userAvatarMini.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) showLogoutConfirm();
});

closeProfile.addEventListener('click', () => { profileModal.classList.remove('active'); document.body.classList.remove('modal-open'); });
profileModal.addEventListener('click', (e) => { if (e.target === profileModal) { profileModal.classList.remove('active'); document.body.classList.remove('modal-open'); } });

editProfileBtn?.addEventListener('click', openEditProfileModal);
closeEditProfile?.addEventListener('click', () => { editProfileModal.classList.remove('active'); document.body.classList.remove('modal-open'); });
editProfileModal.addEventListener('click', (e) => { if (e.target === editProfileModal) { editProfileModal.classList.remove('active'); document.body.classList.remove('modal-open'); } });

closeReading.addEventListener('click', () => { 
    readingModal.classList.remove('active'); 
    document.body.classList.remove('modal-open');
    window.history.pushState({}, '', SITE_URL);
});

readingModal.addEventListener('click', (e) => { 
    if (e.target === readingModal) { 
        readingModal.classList.remove('active'); 
        document.body.classList.remove('modal-open');
        window.history.pushState({}, '', SITE_URL);
    } 
});

shareBtn.addEventListener('click', shareArticle);
downloadPdfBtn.addEventListener('click', () => { if (currentReadingArticle) downloadPDF(currentReadingArticle); });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
        document.body.classList.remove('modal-open');
        window.history.pushState({}, '', SITE_URL);
    }
});

confirmModal.addEventListener('click', (e) => { 
    if (e.target === confirmModal) {
        confirmModal.classList.remove('active'); 
        document.body.classList.remove('modal-open');
    }
});


// ==========================================
// 16. INICIALIZACIÓN
// ==========================================
document.addEventListener// ==========================================
// CONFIRMACIÓN ESPECÍFICA PARA CERRAR SESIÓN
// ==========================================
function showLogoutConfirm() {
    // ⭐ OBTENER BOTONES FRESCOS DEL DOM
    const okBtn = document.getElementById('confirmOk');
    const cancelBtn = document.getElementById('confirmCancel');
    
    confirmIcon.textContent = '👋';
    confirmTitle.textContent = 'Cerrar sesión';
    confirmMessage.textContent = '¿Quieres cerrar la sesión actual?';
    okBtn.textContent = 'CERRAR SESIÓN';
    cancelBtn.textContent = 'CANCELAR';
    confirmModal.classList.add('active');
    document.body.classList.add('modal-open');
    
    // Clonar botones frescos para eliminar listeners previos
    const newOk = okBtn.cloneNode(true);
    const newCancel = cancelBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    
    newOk.addEventListener('click', async () => {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open');
        
        try {
            await supabaseClient.auth.signOut();
            currentUser = null;
            currentUserProfile = null;
            savedArticleIds = [];
            updateAuthUI();
            renderSections();
            showToast('Has cerrado sesión.', 'info', 'Sesión cerrada');
        } catch (err) {
            console.error('Error al cerrar sesión:', err);
            showToast('Error al cerrar sesión.', 'error');
        }
    });
    
    newCancel.addEventListener('click', () => {
        confirmModal.classList.remove('active');
        document.body.classList.remove('modal-open');
    });
}
    
// ==========================================
// 17. GALERÍA DE FOTOS
// ==========================================
let galleryDB = [];
let currentAlbum = null;
let uploadedPhotoUrls = [];   // ⭐ ahora es un array

async function loadGallery() {
    try {
        const { data: photos, error } = await supabaseClient
            .from('gallery').select('*').order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error cargando galería:', error);
            galleryDB = [];
            return;
        }
        
        if (photos) {
            galleryDB = photos.map(p => ({
                id: p.id,
                title: p.title,
                description: p.description,
                category: p.category,
                catName: p.cat_name,
                author: p.author,
                author_id: p.author_id,
                image_url: p.image_url,
                reads: p.reads,
                created_at: p.created_at
            }));
            console.log('✅ Fotos cargadas:', galleryDB.length);
        }
    } catch (e) {
        console.error('Error crítico cargando galería:', e);
        galleryDB = [];
    }
}

function renderGallery() {
    sectionsContainer.style.display = 'none';
    singleViewContainer.style.display = 'block';
    singleSectionTitle.textContent = '📸 Galería de Fotos';
    singleArticlesGrid.innerHTML = '';
    
    if (galleryDB.length === 0) {
        singleArticlesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📸</div>
                <strong>Aún no hay fotos en la galería</strong>
                <span>Sé el primero en compartir tu mejor fotografía deportiva.</span>
            </div>
        `;
        return;
    }
    
    const albumsByCategory = {};
    galleryDB.forEach(photo => {
        if (!albumsByCategory[photo.category]) {
            albumsByCategory[photo.category] = [];
        }
        albumsByCategory[photo.category].push(photo);
    });
    
    const albumsGrid = document.createElement('div');
    albumsGrid.className = 'gallery-albums-grid';
    
    mainCategories.forEach(cat => {
        const photosInCat = albumsByCategory[cat.id];
        if (!photosInCat || photosInCat.length === 0) return;
        
        const coverPhoto = photosInCat[0];
        
        const albumCard = document.createElement('div');
        albumCard.className = 'album-card';
        albumCard.innerHTML = `
            <div class="album-card-cover" style="background-image: url('${coverPhoto.image_url}');"></div>
            <div class="album-card-overlay">
                <h3 class="album-card-title">${cat.name}</h3>
                <div class="album-card-count">${photosInCat.length} ${photosInCat.length === 1 ? 'foto' : 'fotos'}</div>
            </div>
        `;
        
        albumCard.addEventListener('click', () => openAlbum(cat.id, cat.name));
        albumsGrid.appendChild(albumCard);
    });
    
    singleArticlesGrid.appendChild(albumsGrid);
}

function openAlbum(categoryId, categoryName) {
    currentAlbum = categoryId;
    const albumPhotos = galleryDB.filter(p => p.category === categoryId);
    
    document.getElementById('albumTitle').textContent = categoryName;
    document.getElementById('albumCount').textContent = `${albumPhotos.length} ${albumPhotos.length === 1 ? 'foto' : 'fotos'}`;
    
    const albumGrid = document.getElementById('albumPhotoGrid');
    albumGrid.innerHTML = '';
    
    albumPhotos.forEach(photo => {
        const photoCard = document.createElement('div');
        photoCard.className = 'photo-card';
        photoCard.innerHTML = `
            <img src="${photo.image_url}" alt="${photo.title}" loading="lazy">
            <div class="photo-card-info">
                <div class="photo-card-title">${photo.title}</div>
                <div class="photo-card-author">Por ${photo.author}</div>
            </div>
        `;
        photoCard.addEventListener('click', () => openPhotoViewer(photo));
        albumGrid.appendChild(photoCard);
    });
    
    document.getElementById('albumModal').classList.add('active');
    document.body.classList.add('modal-open');
}

function openPhotoViewer(photo) {
    document.getElementById('photoViewerImage').src = photo.image_url;
    document.getElementById('photoViewerTitle').textContent = photo.title;
    document.getElementById('photoViewerDescription').textContent = photo.description || '';
    document.getElementById('photoViewerAuthor').textContent = `Por ${photo.author}`;
    document.getElementById('photoViewerCategory').textContent = photo.catName;
    
    document.getElementById('photoViewerModal').classList.add('active');
}

async function uploadPhotoToSupabase(file) {
    if (!file) return null;
    if (!file.type.startsWith('image/')) {
        showToast('Solo se permiten imágenes.', 'error');
        return null;
    }
    if (file.size > 100 * 1024 * 1024) {
        showToast('La imagen supera los 100 MB.', 'error');
        return null;
    }
    
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${currentUser.id}/gallery/${fileName}`;
        
        showToast('Subiendo foto...', 'info', 'Espera');
        
        const { error } = await supabaseClient.storage.from(BUCKET).upload(filePath, file, { upsert: false });
        if (error) { 
            showToast('Error: ' + error.message, 'error'); 
            return null; 
        }
        
        const { data: urlData } = supabaseClient.storage.from(BUCKET).getPublicUrl(filePath);
        showToast('Foto subida correctamente.', 'success');
        return urlData.publicUrl;
    } catch (e) {
        showToast('Error inesperado.', 'error'); 
        return null;
    }
}

// Cerrar modales de galería
document.getElementById('closeAlbum')?.addEventListener('click', () => {
    document.getElementById('albumModal').classList.remove('active');
    document.body.classList.remove('modal-open');
});

document.getElementById('albumModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('albumModal')) {
        document.getElementById('albumModal').classList.remove('active');
        document.body.classList.remove('modal-open');
    }
});

document.getElementById('closePhotoViewer')?.addEventListener('click', () => {
    document.getElementById('photoViewerModal').classList.remove('active');
});

document.getElementById('photoViewerModal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('photoViewerModal')) {
        document.getElementById('photoViewerModal').classList.remove('active');
    }
});

// Subida de foto desde el CMS
// Subida de MÚLTIPLES fotos desde el CMS
document.getElementById('artPhotoFile')?.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    const previewContainer = document.getElementById('photoPreviewContainer');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'grid';
    uploadedPhotoUrls = [];
    
    for (const file of files) {
        // Preview local
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            img.style.cssText = 'width: 100%; height: 120px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 6px rgba(0,0,0,0.2);';
            previewContainer.appendChild(img);
        };
        reader.readAsDataURL(file);
        
        // Subir a Supabase
        const url = await uploadPhotoToSupabase(file);
        if (url) uploadedPhotoUrls.push(url);
    }
    
    if (uploadedPhotoUrls.length > 0) {
        document.getElementById('artPhoto').value = uploadedPhotoUrls[0]; // por si acaso
        showToast(`${uploadedPhotoUrls.length} foto(s) subida(s).`, 'success');
    }
});

document.getElementById('clearPhotoBtn')?.addEventListener('click', () => {
    document.getElementById('artPhotoFile').value = '';
    document.getElementById('artPhoto').value = '';
    const previewContainer = document.getElementById('photoPreviewContainer');
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
    uploadedPhotoUrls = [];
});

// ==========================================
// 18. INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    const storedTheme = localStorage.getItem('adb_theme');
    if (storedTheme === 'light') document.body.classList.add('light-theme');
    themeToggle.textContent = document.body.classList.contains('light-theme') ? '☀️' : '🌙';
    
    await loadState();
    await loadGallery();
    updateAuthUI();
    renderSections();
    await checkUrlForArticle();
})