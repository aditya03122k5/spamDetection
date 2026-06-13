// ==========================================================================
// CLIENT-SIDE NLTK STOPWORDS & PORTER STEMMER
// ==========================================================================

const STOPWORDS = new Set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your", "yours", "yourself", "yourselves",
    "he", "him", "his", "himself", "she", "her", "hers", "herself", "it", "its", "itself", "they", "them", "their",
    "theirs", "themselves", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "a", "an",
    "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up",
    "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when",
    "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor",
    "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
]);

// Porter Stemmer implementation in Javascript
function stem(word) {
    let w = word.toLowerCase();
    if (w.length < 3) return w;

    const step1a = (str) => {
        if (str.endsWith('sses')) return str.slice(0, -2);
        if (str.endsWith('ies')) return str.slice(0, -2) + 'i';
        if (str.endsWith('ss')) return str;
        if (str.endsWith('s') && !str.endsWith('us') && !str.endsWith('as') && !str.endsWith('is')) return str.slice(0, -1);
        return str;
    };

    const isConsonant = (str, i) => {
        let c = str[i];
        if ('aeiou'.includes(c)) return false;
        if (c === 'y') {
            if (i === 0) return true;
            return !isConsonant(str, i - 1);
        }
        return true;
    };

    const getM = (str) => {
        let count = 0;
        let form = '';
        for (let i = 0; i < str.length; i++) {
            form += isConsonant(str, i) ? 'c' : 'v';
        }
        let compressed = '';
        for (let i = 0; i < form.length; i++) {
            if (i === 0 || form[i] !== form[i-1]) {
                compressed += form[i];
            }
        }
        for (let i = 0; i < compressed.length - 1; i++) {
            if (compressed[i] === 'v' && compressed[i+1] === 'c') {
                count++;
            }
        }
        return count;
    };

    const hasVowel = (str) => {
        for (let i = 0; i < str.length; i++) {
            if (!isConsonant(str, i)) return true;
        }
        return false;
    };

    const endsWithDoubleConsonant = (str) => {
        if (str.length < 2) return false;
        let c1 = str[str.length - 1];
        let c2 = str[str.length - 2];
        if (c1 !== c2) return false;
        return isConsonant(str, str.length - 1);
    };

    const endsWithCvc = (str) => {
        if (str.length < 3) return false;
        let c1 = str[str.length - 1];
        let v = str[str.length - 2];
        let c2 = str[str.length - 3];
        if (isConsonant(str, str.length-1) && !isConsonant(str, str.length-2) && isConsonant(str, str.length-3)) {
            if (!'wxy'.includes(c1)) return true;
        }
        return false;
    };

    w = step1a(w);

    let step1b_done = false;
    if (w.endsWith('eed')) {
        let stem = w.slice(0, -3);
        if (getM(stem) > 0) w = stem + 'ee';
    } else if (w.endsWith('ed')) {
        let stem = w.slice(0, -2);
        if (hasVowel(stem)) {
            w = stem;
            step1b_done = true;
        }
    } else if (w.endsWith('ing')) {
        let stem = w.slice(0, -3);
        if (hasVowel(stem)) {
            w = stem;
            step1b_done = true;
        }
    }

    if (step1b_done) {
        if (w.endsWith('at') || w.endsWith('bl') || w.endsWith('iz')) {
            w += 'e';
        } else if (endsWithDoubleConsonant(w) && !w.endsWith('l') && !w.endsWith('s') && !w.endsWith('z')) {
            w = w.slice(0, -1);
        } else if (getM(w) === 1 && endsWithCvc(w)) {
            w += 'e';
        }
    }

    if (w.endsWith('y') && hasVowel(w.slice(0, -1))) {
        w = w.slice(0, -1) + 'i';
    }

    const step2_replacements = {
        'ational': 'ate', 'tional': 'tion', 'enci': 'ence', 'anci': 'ance',
        'izer': 'ize', 'abli': 'able', 'alli': 'al', 'entli': 'ent',
        'eli': 'e', 'ousli': 'ous', 'ization': 'ize', 'ation': 'ate',
        'ator': 'ate', 'alism': 'al', 'iveness': 'ive', 'fulness': 'ful',
        'ousness': 'ous', 'aliti': 'al', 'iviti': 'ive', 'biliti': 'ble'
    };
    for (let suffix in step2_replacements) {
        if (w.endsWith(suffix)) {
            let stem = w.slice(0, -suffix.length);
            if (getM(stem) > 0) {
                w = stem + step2_replacements[suffix];
                break;
            }
        }
    }

    const step3_replacements = {
        'icate': 'ic', 'ative': '', 'alize': 'al', 'iciti': 'ic',
        'ical': 'ic', 'ful': '', 'ness': ''
    };
    for (let suffix in step3_replacements) {
        if (w.endsWith(suffix)) {
            let stem = w.slice(0, -suffix.length);
            if (getM(stem) > 0) {
                w = stem + step3_replacements[suffix];
                break;
            }
        }
    }

    const step4_suffixes = [
        'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement',
        'ment', 'ent', 'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize'
    ];
    let step4_done = false;
    for (let suffix of step4_suffixes) {
        if (w.endsWith(suffix)) {
            let stem = w.slice(0, -suffix.length);
            if (getM(stem) > 1) {
                w = stem;
                step4_done = true;
            }
            break;
        }
    }
    if (!step4_done) {
        if (w.endsWith('ion')) {
            let stem = w.slice(0, -3);
            let last = stem[stem.length - 1];
            if (getM(stem) > 1 && (last === 's' || last === 't')) {
                w = stem;
            }
        }
    }

    if (w.endsWith('e')) {
        let stem = w.slice(0, -1);
        let m = getM(stem);
        if (m > 1 || (m === 1 && !endsWithCvc(stem))) {
            w = stem;
        }
    }

    if (w.endsWith('l') && endsWithDoubleConsonant(w) && getM(w) > 1) {
        w = w.slice(0, -1);
    }

    return w;
}

function cleanText(text) {
    if (typeof text !== 'string') return '';
    let cleaned = text.toLowerCase();
    cleaned = cleaned.replace(/<.*?>/g, ''); // HTML tags
    cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, ''); // URLs
    cleaned = cleaned.replace(/\S+@\S+/g, ''); // Emails
    cleaned = cleaned.replace(/[^a-zA-Z\s]/g, ' '); // Letters only
    let words = cleaned.split(/\s+/);
    let resultWords = [];
    for (let word of words) {
        if (word.length > 1 && !STOPWORDS.has(word)) {
            resultWords.push(stem(word));
        }
    }
    return resultWords.join(' ');
}

// ==========================================================================
// TF-IDF VECTORIZER IMPLEMENTATION
// ==========================================================================

class TfidfVectorizer {
    constructor(maxFeatures = 3000) {
        this.maxFeatures = maxFeatures;
        this.vocabulary = {};
        this.vocabList = [];
        this.idf = [];
    }
    
    fit(documents) {
        const df = {};
        documents.forEach(doc => {
            const words = doc.split(/\s+/).filter(w => w.length > 0);
            const unique = new Set(words);
            unique.forEach(w => {
                df[w] = (df[w] || 0) + 1;
            });
        });
        
        // Sort vocabulary by DF descending, then alphabetically ascending
        const sortedWords = Object.keys(df).sort((a, b) => {
            if (df[b] !== df[a]) {
                return df[b] - df[a];
            }
            return a.localeCompare(b);
        }).slice(0, this.maxFeatures);
        
        this.vocabList = sortedWords;
        this.vocabulary = {};
        sortedWords.forEach((word, index) => {
            this.vocabulary[word] = index;
        });
        
        // Compute IDF using Scikit-Learn smooth formula
        const n = documents.length;
        this.idf = new Array(sortedWords.length);
        sortedWords.forEach((word, index) => {
            const documentFrequency = df[word];
            this.idf[index] = Math.log((1 + n) / (1 + documentFrequency)) + 1;
        });
    }
    
    transform(docText) {
        const words = docText.split(/\s+/).filter(w => w.length > 0);
        const tf = {};
        words.forEach(w => {
            if (this.vocabulary[w] !== undefined) {
                tf[w] = (tf[w] || 0) + 1;
            }
        });
        
        const vector = new Array(this.vocabList.length).fill(0);
        let sqSum = 0;
        
        this.vocabList.forEach((word, index) => {
            const termFreq = tf[word] || 0;
            if (termFreq > 0) {
                const tfidfValue = termFreq * this.idf[index];
                vector[index] = tfidfValue;
                sqSum += tfidfValue * tfidfValue;
            }
        });
        
        // L2 normalization
        if (sqSum > 0) {
            const norm = Math.sqrt(sqSum);
            for (let i = 0; i < vector.length; i++) {
                vector[i] = vector[i] / norm;
            }
        }
        
        return vector;
    }
}

// ==========================================================================
// MULTINOMIAL NAIVE BAYES IMPLEMENTATION
// ==========================================================================

class MultinomialNB {
    constructor(alpha = 1.0) {
        this.alpha = alpha;
        this.classLogPrior = [0, 0]; // [ham, spam]
        this.featureLogProb = []; // [2, vocab_size]
        this.vocabSize = 0;
    }
    
    fit(X_vectorized, y) {
        const nSamples = X_vectorized.length;
        this.vocabSize = X_vectorized[0].length;
        
        let hamCount = 0;
        let spamCount = 0;
        const featureSums = [
            new Array(this.vocabSize).fill(0),
            new Array(this.vocabSize).fill(0)
        ];
        
        for (let i = 0; i < nSamples; i++) {
            const label = y[i];
            const vector = X_vectorized[i];
            if (label === 0) hamCount++; else spamCount++;
            
            for (let j = 0; j < this.vocabSize; j++) {
                featureSums[label][j] += vector[j];
            }
        }
        
        this.classLogPrior[0] = Math.log(hamCount / nSamples);
        this.classLogPrior[1] = Math.log(spamCount / nSamples);
        
        const classFeatureSums = [
            featureSums[0].reduce((a, b) => a + b, 0),
            featureSums[1].reduce((a, b) => a + b, 0)
        ];
        
        this.featureLogProb = [
            new Array(this.vocabSize),
            new Array(this.vocabSize)
        ];
        
        for (let label = 0; label < 2; label++) {
            const denominator = classFeatureSums[label] + this.alpha * this.vocabSize;
            for (let j = 0; j < this.vocabSize; j++) {
                const numerator = featureSums[label][j] + this.alpha;
                this.featureLogProb[label][j] = Math.log(numerator / denominator);
            }
        }
    }
    
    predictLogProbs(vector) {
        const logProbs = [this.classLogPrior[0], this.classLogPrior[1]];
        for (let label = 0; label < 2; label++) {
            for (let j = 0; j < this.vocabSize; j++) {
                if (vector[j] > 0) {
                    logProbs[label] += vector[j] * this.featureLogProb[label][j];
                }
            }
        }
        return logProbs;
    }
    
    predictProba(vector) {
        const logProbs = this.predictLogProbs(vector);
        const maxLog = Math.max(logProbs[0], logProbs[1]);
        const expHam = Math.exp(logProbs[0] - maxLog);
        const expSpam = Math.exp(logProbs[1] - maxLog);
        const total = expHam + expSpam;
        return [expHam / total, expSpam / total];
    }
    
    predict(vector) {
        const logProbs = this.predictLogProbs(vector);
        return logProbs[1] > logProbs[0] ? 1 : 0;
    }
}

// ==========================================================================
// SEEDED RANDOM & SHUFFLE FOR TRAINING CONSISTENCY
// ==========================================================================

class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

function seededShuffle(array, seed) {
    const rng = new SeededRandom(seed);
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng.next() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function stratifiedSplit(data, testRatio, seed) {
    const hams = data.filter(d => d.label === 'ham');
    const spams = data.filter(d => d.label === 'spam');
    
    const shuffledHams = seededShuffle(hams, seed);
    const shuffledSpams = seededShuffle(spams, seed);
    
    const hamTestCount = Math.floor(shuffledHams.length * testRatio);
    const spamTestCount = Math.floor(shuffledSpams.length * testRatio);
    
    const testSet = [
        ...shuffledHams.slice(0, hamTestCount),
        ...shuffledSpams.slice(0, spamTestCount)
    ];
    
    const trainSet = [
        ...shuffledHams.slice(hamTestCount),
        ...shuffledSpams.slice(spamTestCount)
    ];
    
    return {
        train: seededShuffle(trainSet, seed),
        test: seededShuffle(testSet, seed)
    };
}

// ==========================================================================
// DATASET LOADING (GITHUB PAGES COMPATIBLE)
// ==========================================================================

/**
 * Loads the SMS Spam Collection dataset.
 * On GitHub Pages: fetches from the raw GitHub content URL.
 * On local Flask server: falls back to /data/SMSSpamCollection.
 */
async function loadDatasetFromGithub() {
    // Primary URL: raw GitHub content (works on GitHub Pages)
    const GITHUB_RAW_URL = "https://raw.githubusercontent.com/aditya03122k5/spamDetection/main/data/SMSSpamCollection";
    // Fallback URL: local Flask server
    const LOCAL_URL = "/data/SMSSpamCollection";

    let text = null;

    // Try primary URL first
    try {
        const resp = await fetch(GITHUB_RAW_URL);
        if (resp.ok) {
            text = await resp.text();
        }
    } catch (e) {
        console.warn("GitHub raw fetch failed, trying local fallback.", e);
    }

    // If primary failed, try local fallback
    if (!text) {
        const resp = await fetch(LOCAL_URL);
        if (!resp.ok) throw new Error(`Failed to load dataset: HTTP ${resp.status}`);
        text = await resp.text();
    }

    // Parse TSV format: label\tmessage
    const lines = text.trim().split('\n');
    const parsed = [];
    for (const line of lines) {
        const tab = line.indexOf('\t');
        if (tab === -1) continue;
        const label = line.slice(0, tab).trim().toLowerCase();
        const message = line.slice(tab + 1).trim();
        if ((label === 'ham' || label === 'spam') && message.length > 0) {
            parsed.push({ label, message });
        }
    }

    if (parsed.length === 0) throw new Error("Dataset parsed but no valid rows found.");
    return parsed;
}

// ==========================================================================
// GLOBAL APPLICATION STATE (IN-BROWSER WORKSPACE)
// ==========================================================================

let currentTab = 'overview';
let charts = {};

let raw_data = null;
let cleaned_data = null;
let trained_model = null;
let vectorizer = null;
let metrics = null;
let model_name = null;

// Initialize app elements
document.addEventListener("DOMContentLoaded", () => {
    setupNavigation();
    setupEventListeners();
    syncLocalWorkspaceStatus();
});

// ==========================================================================
// TABS CONTROLS
// ==========================================================================

function setupNavigation() {
    document.querySelectorAll(".nav-item").forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = item.getAttribute("data-tab");
            navigateToTab(tabId);
        });
    });
}

function navigateToTab(tabId) {
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
    
    const selectedNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`tab-${tabId}`);
    
    if (selectedNavItem && selectedPane) {
        selectedNavItem.classList.add("active");
        selectedPane.classList.add("active");
        currentTab = tabId;
        
        updateHeaderInfo(tabId);
        
        if (tabId === 'insights' && cleaned_data) {
            renderInsightsTab();
        } else if (tabId === 'overview') {
            syncLocalWorkspaceStatus();
        }
    }
}

function updateHeaderInfo(tabId) {
    const titleEl = document.getElementById("page-title");
    const subtitleEl = document.getElementById("page-subtitle");
    
    const meta = {
        'overview': {
            title: "Workspace Overview",
            subtitle: "Configure, train, and test spam classification models client-side."
        },
        'data-center': {
            title: "Data Ingestion & Cleaning",
            subtitle: "Load the UCI SMS dataset and pre-process texts locally."
        },
        'insights': {
            title: "Exploratory Insights (EDA)",
            subtitle: "View distribution donut charts, histograms, and styled word clouds."
        },
        'model-lab': {
            title: "Model Training Lab",
            subtitle: "Train a Multinomial Naive Bayes classifier and evaluate performance."
        },
        'playground': {
            title: "SMS Predictor Playground",
            subtitle: "Execute live predictions in our interactive browser-sandbox."
        }
    };
    
    if (meta[tabId]) {
        titleEl.textContent = meta[tabId].title;
        subtitleEl.textContent = meta[tabId].subtitle;
    }
}

// ==========================================================================
// STATE MANAGEMENT & CACHING (LOCALSTORAGE)
// ==========================================================================

function syncLocalWorkspaceStatus() {
    const status = {
        raw_data_loaded: raw_data !== null,
        raw_data_size: raw_data ? raw_data.length : 0,
        cleaned_data_loaded: cleaned_data !== null,
        model_trained: trained_model !== null,
        model_name: model_name,
        metrics: metrics,
        saved_models: getLocalStorageSavedModels()
    };
    
    updateStateBadges(status);
    updateOverviewStatusCard(status);
    syncTabsAccess(status);
}

function getLocalStorageSavedModels() {
    const saved = [];
    if (localStorage.getItem("spam_model_naive_bayes")) {
        saved.push("naive_bayes");
    }
    return saved;
}

function saveModelToLocalStorage(model, vectorizer, modelType, evalMetrics) {
    try {
        const payload = {
            model_name: modelType,
            vocabList: vectorizer.vocabList,
            vocabulary: vectorizer.vocabulary,
            idf: vectorizer.idf,
            classLogPrior: model.classLogPrior,
            featureLogProb: model.featureLogProb,
            metrics: evalMetrics
        };
        localStorage.setItem(`spam_model_${modelType}`, JSON.stringify(payload));
        localStorage.setItem("spam_active_model_type", modelType);
    } catch (err) {
        console.error("Local storage error:", err);
    }
}

function loadModelFromLocalStorage(modelType) {
    try {
        const item = localStorage.getItem(`spam_model_${modelType}`);
        if (!item) return false;
        
        const payload = JSON.parse(item);
        
        vectorizer = new TfidfVectorizer(payload.vocabList.length);
        vectorizer.vocabList = payload.vocabList;
        vectorizer.vocabulary = payload.vocabulary;
        vectorizer.idf = payload.idf;
        
        trained_model = new MultinomialNB();
        trained_model.vocabSize = payload.vocabList.length;
        trained_model.classLogPrior = payload.classLogPrior;
        trained_model.featureLogProb = payload.featureLogProb;
        
        model_name = payload.model_name;
        metrics = payload.metrics;
        
        return true;
    } catch (err) {
        console.error("Failed to restore cached model:", err);
        return false;
    }
}

// ==========================================================================
// OVERVIEW RENDERERS
// ==========================================================================

function updateStateBadges(status) {
    const badgeData = document.getElementById("badge-data");
    const badgeModel = document.getElementById("badge-model");
    
    if (status.raw_data_loaded) {
        badgeData.innerHTML = `<i class="fa-solid fa-database text-blue"></i> <span>Data: ${status.raw_data_size} rows</span>`;
        badgeData.classList.add("active");
    } else {
        badgeData.innerHTML = `<i class="fa-solid fa-database"></i> <span>Data: Empty</span>`;
        badgeData.classList.remove("active");
    }
    
    if (status.model_trained) {
        badgeModel.innerHTML = `<i class="fa-solid fa-microchip text-blue"></i> <span>Model: Naive Bayes</span>`;
        badgeModel.classList.add("active");
    } else {
        badgeModel.innerHTML = `<i class="fa-solid fa-microchip"></i> <span>Model: Untrained</span>`;
        badgeModel.classList.remove("active");
    }
}

function updateOverviewStatusCard(status) {
    // Dataset loaded item
    const dataItem = document.getElementById("status-data-loaded");
    if (status.raw_data_loaded) {
        dataItem.querySelector("i").className = "fa-solid fa-circle-check green-icon";
        dataItem.querySelector(".sub-text").textContent = `Loaded (${status.raw_data_size} samples)`;
        dataItem.querySelector("button").textContent = "View Data";
    } else {
        dataItem.querySelector("i").className = "fa-solid fa-circle-xmark red-icon";
        dataItem.querySelector(".sub-text").textContent = "Not Loaded into Memory";
        dataItem.querySelector("button").textContent = "Go to Load";
    }
    
    // Preprocessed item
    const prepItem = document.getElementById("status-text-preprocessed");
    if (status.cleaned_data_loaded) {
        prepItem.querySelector("i").className = "fa-solid fa-circle-check green-icon";
        prepItem.querySelector(".sub-text").textContent = "Text cleaning pipeline complete";
        prepItem.querySelector("button").textContent = "View Preview";
    } else {
        prepItem.querySelector("i").className = "fa-solid fa-circle-xmark red-icon";
        prepItem.querySelector(".sub-text").textContent = "Dataset Not Cleaned";
        prepItem.querySelector("button").textContent = "Go to Clean";
    }
    
    // Model trained item
    const modelItem = document.getElementById("status-model-trained");
    if (status.model_trained) {
        modelItem.querySelector("i").className = "fa-solid fa-circle-check green-icon";
        modelItem.querySelector(".sub-text").textContent = "Active model: Multinomial Naive Bayes";
        modelItem.querySelector("button").textContent = "View Model";
    } else {
        modelItem.querySelector("i").className = "fa-solid fa-circle-xmark red-icon";
        modelItem.querySelector(".sub-text").textContent = "No Model Cached";
        modelItem.querySelector("button").textContent = "Go to Lab";
    }
    
    // LocalStorage saved models
    const savedBox = document.getElementById("saved-models-box");
    const savedList = document.getElementById("saved-models-list");
    
    if (status.saved_models && status.saved_models.length > 0) {
        savedBox.style.display = "block";
        savedList.innerHTML = "";
        
        status.saved_models.forEach(mType => {
            const div = document.createElement("div");
            div.className = "saved-model-item";
            div.innerHTML = `
                <span><strong>Naive Bayes</strong> (Cached)</span>
                <button class="btn btn-secondary btn-sm" onclick="retrieveCachedModel('${mType}')">Retrieve</button>
            `;
            savedList.appendChild(div);
        });
    } else {
        savedBox.style.display = "none";
    }
}

function retrieveCachedModel(modelType) {
    if (loadModelFromLocalStorage(modelType)) {
        showToast("Model restored from browser cache!");
        syncLocalWorkspaceStatus();
    } else {
        showToast("Failed to retrieve cached model.", true);
    }
}

function syncTabsAccess(status) {
    // 1. Data Center elements
    const btnClean = document.getElementById("btn-clean-dataset");
    btnClean.style.display = status.raw_data_loaded ? "inline-flex" : "none";
    
    // 2. Insights locking
    document.getElementById("eda-placeholder").style.display = status.cleaned_data_loaded ? "none" : "block";
    document.getElementById("eda-content").style.display = status.cleaned_data_loaded ? "block" : "none";
    
    // 3. Model Lab locking
    document.getElementById("model-loader-warning").style.display = status.cleaned_data_loaded ? "none" : "block";
    document.getElementById("model-lab-content").style.display = status.cleaned_data_loaded ? "grid" : "none";
    
    // 4. Playground locking
    document.getElementById("playground-warning").style.display = status.model_trained ? "none" : "block";
    document.getElementById("playground-content").style.display = status.model_trained ? "grid" : "none";
    
    // Auto restore layouts if we have active metrics
    if (status.model_trained && status.metrics && document.getElementById("model-metrics-row").style.display === "none") {
        renderModelResults(status.metrics);
    }
}

// ==========================================================================
// TOASTS & LOADING INDICATORS
// ==========================================================================

function showToast(message, isError = false) {
    const toast = document.getElementById("toast");
    const toastMsg = document.getElementById("toast-message");
    
    toastMsg.textContent = message;
    
    if (isError) {
        toast.classList.add("toast-error");
        toast.querySelector("i").className = "fa-solid fa-circle-exclamation";
    } else {
        toast.classList.remove("toast-error");
        toast.querySelector("i").className = "fa-solid fa-circle-check";
    }
    
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 4000);
}

function showLoading(elementId, text = "Loading...") {
    const el = document.getElementById(elementId);
    el.innerHTML = `
        <div class="spinner-wrapper">
            <div class="spinner"></div>
            <p class="text-muted font-bold">${text}</p>
        </div>
    `;
    el.style.display = "block";
}

// ==========================================================================
// EVENT LISTENERS & INGESTION
// ==========================================================================

function setupEventListeners() {
    // 1. Download & Ingest Dataset
    document.getElementById("btn-load-dataset").addEventListener("click", async () => {
        showLoading("data-loader-placeholder", "Downloading dataset file from repository...");
        document.getElementById("data-preview-container").style.display = "none";
        
        try {
            raw_data = await loadDatasetFromGithub();
            renderRawTable(raw_data.slice(0, 10));
            showToast("Raw SMS dataset loaded successfully!");
            syncLocalWorkspaceStatus();
        } catch (err) {
            console.error(err);
            showToast("Failed to fetch dataset. Make sure data/SMSSpamCollection exists.", true);
            document.getElementById("data-loader-placeholder").style.display = "none";
        }
    });
    
    // 2. Clean Dataset
    document.getElementById("btn-clean-dataset").addEventListener("click", () => {
        if (!raw_data) return;
        
        const statusMsg = document.getElementById("clean-status-message");
        statusMsg.textContent = "Stemming and cleaning SMS documents...";
        statusMsg.style.display = "block";
        
        showLoading("clean-loader-placeholder", "Executing preprocessor pipeline...");
        document.getElementById("cleaned-preview-container").style.display = "none";
        
        // Use settimeout to avoid freezing UI thread
        setTimeout(() => {
            try {
                cleaned_data = raw_data.map(row => {
                    return {
                        label: row.label,
                        message: row.message,
                        cleaned_message: cleanText(row.message)
                    };
                });
                
                statusMsg.textContent = "Data preprocessing complete!";
                renderCleanedTable(cleaned_data.slice(0, 5));
                showToast("All text cleaned and stemmed!");
                syncLocalWorkspaceStatus();
            } catch (err) {
                console.error(err);
                showToast("Error during dataset cleaning.", true);
                statusMsg.style.display = "none";
                document.getElementById("clean-loader-placeholder").style.display = "none";
            }
        }, 100);
    });
    
    // 3. Regex Sandbox Demo
    const sandboxInput = document.getElementById("sandbox-input");
    sandboxInput.addEventListener("input", () => {
        const text = sandboxInput.value;
        document.getElementById("sandbox-output").textContent = cleanText(text);
    });
    
    // Hyperparameter sync
    const featsRange = document.getElementById("range-features");
    const splitRange = document.getElementById("range-split");
    
    featsRange.addEventListener("input", () => {
        document.getElementById("label-features").textContent = featsRange.value;
    });
    splitRange.addEventListener("input", () => {
        document.getElementById("label-split").textContent = splitRange.value;
    });
    
    // 4. Model Training Lab
    document.getElementById("btn-train-model").addEventListener("click", () => {
        if (!cleaned_data) return;
        
        const mType = document.getElementById("select-model").value;
        if (mType !== 'naive_bayes') {
            showToast("Running Naive Bayes (Logistic Regression/Random Forest require Python server).");
        }
        
        const maxFeatures = parseInt(featsRange.value);
        const splitRatio = parseFloat(splitRange.value) / 100.0;
        
        const loader = document.getElementById("model-metrics-row");
        loader.innerHTML = `
            <div class="glass-card spinner-wrapper" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p class="text-muted font-bold">Training Multinomial Naive Bayes classifier in-browser...</p>
            </div>
        `;
        loader.style.display = "grid";
        document.getElementById("model-charts-row").style.display = "none";
        document.getElementById("classification-report-card").style.display = "none";
        
        setTimeout(() => {
            try {
                // Seeded Split
                const split = stratifiedSplit(cleaned_data, splitRatio, 42);
                
                // Fit TF-IDF Vectorizer
                vectorizer = new TfidfVectorizer(maxFeatures);
                vectorizer.fit(split.train.map(d => d.cleaned_message));
                
                // Vectorize split
                const X_train = split.train.map(d => vectorizer.transform(d.cleaned_message));
                const y_train = split.train.map(d => d.label === 'spam' ? 1 : 0);
                
                // Train NB
                trained_model = new MultinomialNB();
                trained_model.fit(X_train, y_train);
                
                // Evaluate
                metrics = evaluateModel(trained_model, vectorizer, split.test);
                model_name = 'naive_bayes';
                
                // Save locally
                saveModelToLocalStorage(trained_model, vectorizer, model_name, metrics);
                
                showToast("Classifier training and caching complete!");
                renderModelResults(metrics);
                syncLocalWorkspaceStatus();
            } catch (err) {
                console.error(err);
                showToast("Model training failed.", true);
                loader.style.display = "none";
            }
        }, 100);
    });
    
    // 5. Prediction
    document.getElementById("btn-predict").addEventListener("click", runLivePrediction);
    
    // Preset Buttons
    document.getElementById("preset-ham").addEventListener("click", () => {
        loadPresetText("Hey buddy, are we still meeting for lunch today at 1 PM? Let me know.");
    });
    document.getElementById("preset-spam").addEventListener("click", () => {
        loadPresetText("URGENT! Your mobile number has won a £2,000 prize! To claim text CLAIM to 81010. Terms apply. Free msg.");
    });
    document.getElementById("preset-phish").addEventListener("click", () => {
        loadPresetText("Dear customer, your Bank account has been locked due to suspicious activity. Visit https://secure-bank-login.com to unlock.");
    });
}

function renderRawTable(preview) {
    document.getElementById("data-loader-placeholder").style.display = "none";
    const tbody = document.getElementById("table-raw-preview").querySelector("tbody");
    tbody.innerHTML = "";
    
    preview.forEach(row => {
        const tr = document.createElement("tr");
        const badgeClass = row.label === 'spam' ? 'label-cell-spam' : 'label-cell-ham';
        tr.innerHTML = `
            <td><span class="${badgeClass}">${row.label.toUpperCase()}</span></td>
            <td>${escapeHtml(row.message)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById("data-preview-container").style.display = "block";
}

function renderCleanedTable(preview) {
    document.getElementById("clean-loader-placeholder").style.display = "none";
    const tbody = document.getElementById("table-cleaned-preview").querySelector("tbody");
    tbody.innerHTML = "";
    
    preview.forEach(row => {
        const tr = document.createElement("tr");
        const badgeClass = row.label === 'spam' ? 'label-cell-spam' : 'label-cell-ham';
        tr.innerHTML = `
            <td><span class="${badgeClass}">${row.label.toUpperCase()}</span></td>
            <td>${escapeHtml(row.message)}</td>
            <td class="code-text" style="background: none; border: none; padding: 0.9rem 1.2rem;">${escapeHtml(row.cleaned_message)}</td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById("cleaned-preview-container").style.display = "block";
}

// ==========================================================================
// TAB 3: INSIGHTS (EDA)
// ==========================================================================

function renderInsightsTab() {
    if (!cleaned_data) return;
    
    // In-memory calculations
    const hamMsgs = cleaned_data.filter(d => d.label === 'ham');
    const spamMsgs = cleaned_data.filter(d => d.label === 'spam');
    
    const hamCount = hamMsgs.length;
    const spamCount = spamMsgs.length;
    const total = hamCount + spamCount;
    
    const hamPct = Math.round((hamCount / total) * 100);
    const spamPct = Math.round((spamCount / total) * 100);
    
    const avgHamLen = hamMsgs.reduce((sum, d) => sum + d.message.length, 0) / hamCount;
    const avgSpamLen = spamMsgs.reduce((sum, d) => sum + d.message.length, 0) / spamCount;
    
    document.getElementById("eda-ham-count").textContent = hamCount.toLocaleString();
    document.getElementById("eda-ham-pct").textContent = `${hamPct}%`;
    document.getElementById("eda-spam-count").textContent = spamCount.toLocaleString();
    document.getElementById("eda-spam-pct").textContent = `${spamPct}%`;
    document.getElementById("eda-ham-len").textContent = `${avgHamLen.toFixed(1)} ch`;
    document.getElementById("eda-spam-len").textContent = `${avgSpamLen.toFixed(1)} ch`;
    
    // Top Words calculations
    const spamWords = [];
    spamMsgs.forEach(d => { if (d.cleaned_message) spamWords.push(...d.cleaned_message.split(" ")); });
    const hamWords = [];
    hamMsgs.forEach(d => { if (d.cleaned_message) hamWords.push(...d.cleaned_message.split(" ")); });
    
    const topSpamWords = getWordFrequencies(spamWords, 15);
    const topHamWords = getWordFrequencies(hamWords, 15);
    
    // Plot Charts
    renderClassRatioChart(hamCount, spamCount);
    renderLengthHistogram(hamMsgs.map(d => d.message.length), spamMsgs.map(d => d.message.length));
    renderWordsBarChart('spam', topSpamWords);
    renderWordsBarChart('ham', topHamWords);
    
    // Render dynamic JS WordClouds
    renderClientWordCloud("div-spam-wordcloud", getWordFrequencies(spamWords, 40), "spam");
    renderClientWordCloud("div-ham-wordcloud", getWordFrequencies(hamWords, 40), "ham");
}

function getWordFrequencies(wordsArray, limit = 15) {
    const counts = {};
    wordsArray.forEach(w => {
        if (w.trim()) counts[w] = (counts[w] || 0) + 1;
    });
    return Object.keys(counts)
        .map(w => [w, counts[w]])
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);
}

function destroyChart(id) {
    if (charts[id]) charts[id].destroy();
}

function renderClassRatioChart(ham, spam) {
    destroyChart('class-ratio');
    const ctx = document.getElementById("chart-class-distribution").getContext("2d");
    charts['class-ratio'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ham (Legitimate)', 'Spam (Scam)'],
            datasets: [{
                data: [ham, spam],
                backgroundColor: ['#10b981', '#f43f5e'],
                borderColor: '#0f111a',
                borderWidth: 3,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f3f4f6', font: { family: 'Inter', weight: 500 } }
                }
            }
        }
    });
}

function renderLengthHistogram(hamLengths, spamLengths) {
    destroyChart('length-dist');
    const binSize = 10;
    const maxVal = 200;
    const binsCount = maxVal / binSize;
    const labels = [];
    for (let i = 0; i < binsCount; i++) {
        labels.push(`${i * binSize}-${(i + 1) * binSize}`);
    }
    labels.push("200+");
    
    const hamBins = new Array(binsCount + 1).fill(0);
    const spamBins = new Array(binsCount + 1).fill(0);
    
    hamLengths.forEach(len => {
        const idx = Math.floor(len / binSize);
        if (idx >= binsCount) hamBins[binsCount]++; else hamBins[idx]++;
    });
    spamLengths.forEach(len => {
        const idx = Math.floor(len / binSize);
        if (idx >= binsCount) spamBins[binsCount]++; else spamBins[idx]++;
    });
    
    const ctx = document.getElementById("chart-length-distribution").getContext("2d");
    charts['length-dist'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Ham Lengths', data: hamBins, backgroundColor: 'rgba(16, 185, 129, 0.65)', borderColor: '#10b981', borderWidth: 1 },
                { label: 'Spam Lengths', data: spamBins, backgroundColor: 'rgba(244, 63, 94, 0.65)', borderColor: '#f43f5e', borderWidth: 1 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false }, ticks: { color: '#9ca3af' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } }
            },
            plugins: { legend: { position: 'top', labels: { color: '#f3f4f6' } } }
        }
    });
}

function renderWordsBarChart(label, wordCounts) {
    const chartId = `top-words-${label}`;
    destroyChart(chartId);
    
    const words = wordCounts.map(item => item[0]);
    const counts = wordCounts.map(item => item[1]);
    const color = label === 'spam' ? '#f43f5e' : '#10b981';
    
    const ctx = document.getElementById(`chart-top-${label}-words`).getContext("2d");
    charts[chartId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: words,
            datasets: [{ label: 'Occurrences', data: counts, backgroundColor: color, borderRadius: 5, borderWidth: 0 }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af' } },
                y: { grid: { display: false }, ticks: { color: '#f3f4f6', font: { weight: 500 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderClientWordCloud(containerId, wordCounts, labelType) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    
    // Setup flex wrap wrapping
    container.style.display = "flex";
    container.style.flexWrap = "wrap";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.gap = "8px 12px";
    
    const topWords = wordCounts.slice(0, 35);
    const shuffled = [...topWords].sort(() => Math.random() - 0.5);
    
    const maxCount = Math.max(...topWords.map(w => w[1]));
    const minCount = Math.min(...topWords.map(w => w[1])) || 1;
    
    shuffled.forEach(item => {
        const word = item[0];
        const count = item[1];
        
        const norm = maxCount === minCount ? 1 : (count - minCount) / (maxCount - minCount);
        const fontSize = 0.85 + norm * 1.5; // rem (0.85rem to 2.35rem)
        
        const span = document.createElement("span");
        const opacity = 0.5 + norm * 0.5; // 0.5 to 1.0
        
        span.style.fontSize = `${fontSize}rem`;
        span.style.fontWeight = norm > 0.6 ? "700" : (norm > 0.3 ? "600" : "400");
        span.style.opacity = opacity;
        
        if (labelType === 'spam') {
            span.style.color = `rgba(244, 63, 94, ${opacity})`;
            span.style.textShadow = `0 2px 8px rgba(244, 63, 94, ${0.15 * norm})`;
        } else {
            span.style.color = `rgba(16, 185, 129, ${opacity})`;
            span.style.textShadow = `0 2px 8px rgba(16, 185, 129, ${0.15 * norm})`;
        }
        
        span.style.transition = "transform 0.2s ease";
        span.style.cursor = "pointer";
        span.textContent = word;
        span.title = `Count: ${count}`;
        
        // Micro animation on hover
        span.addEventListener("mouseenter", () => { span.style.transform = "scale(1.15)"; });
        span.addEventListener("mouseleave", () => { span.style.transform = "scale(1.0)"; });
        
        container.appendChild(span);
    });
}

// ==========================================================================
// TAB 4: MODEL EVALUATION (evaluateModel + renderers)
// ==========================================================================

/**
 * Evaluates a trained Naive Bayes model on a test set.
 * Returns metrics object consumed by renderModelResults().
 */
function evaluateModel(model, vectorizer, testSet) {
    let TP = 0, FP = 0, TN = 0, FN = 0;

    // Collect (label, score) pairs for ROC curve generation
    const scores = []; // { label: 0|1, score: P(spam) }

    for (const row of testSet) {
        const vector = vectorizer.transform(row.cleaned_message);
        const trueLabel = row.label === 'spam' ? 1 : 0;
        const proba = model.predictProba(vector);
        const spamProb = proba[1];
        const predicted = spamProb >= 0.5 ? 1 : 0;

        scores.push({ label: trueLabel, score: spamProb });

        if (trueLabel === 1 && predicted === 1) TP++;
        else if (trueLabel === 0 && predicted === 1) FP++;
        else if (trueLabel === 0 && predicted === 0) TN++;
        else if (trueLabel === 1 && predicted === 0) FN++;
    }

    const total = TP + FP + TN + FN;
    const accuracy  = (TP + TN) / total;
    const precision = TP + FP > 0 ? TP / (TP + FP) : 0;
    const recall    = TP + FN > 0 ? TP / (TP + FN) : 0;
    const f1_score  = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

    // Per-class metrics
    const hamPrecision = TN + FN > 0 ? TN / (TN + FN) : 0;
    const hamRecall    = TN + FP > 0 ? TN / (TN + FP) : 0;
    const hamF1        = hamPrecision + hamRecall > 0 ? 2 * hamPrecision * hamRecall / (hamPrecision + hamRecall) : 0;
    const hamSupport   = TN + FP;
    const spamSupport  = TP + FN;

    const classification_report = {
        ham: { precision: hamPrecision, recall: hamRecall, f1_score: hamF1, support: hamSupport },
        spam: { precision, recall, f1_score, support: spamSupport },
        accuracy: accuracy,
        'macro avg': {
            precision: (hamPrecision + precision) / 2,
            recall: (hamRecall + recall) / 2,
            f1_score: (hamF1 + f1_score) / 2,
            support: total
        },
        'weighted avg': {
            precision: (hamPrecision * hamSupport + precision * spamSupport) / total,
            recall: (hamRecall * hamSupport + recall * spamSupport) / total,
            f1_score: (hamF1 * hamSupport + f1_score * spamSupport) / total,
            support: total
        }
    };

    // ROC Curve: sort by descending spam probability, sweep thresholds
    scores.sort((a, b) => b.score - a.score);
    const totalPos = scores.filter(s => s.label === 1).length;
    const totalNeg = scores.filter(s => s.label === 0).length;

    const fpr_arr = [0];
    const tpr_arr = [0];
    let cumTP = 0, cumFP = 0;

    for (let i = 0; i < scores.length; i++) {
        if (scores[i].label === 1) cumTP++;
        else cumFP++;

        // Only add a point when score changes or at end
        const nextScore = i < scores.length - 1 ? scores[i + 1].score : -1;
        if (scores[i].score !== nextScore) {
            fpr_arr.push(totalNeg > 0 ? cumFP / totalNeg : 0);
            tpr_arr.push(totalPos > 0 ? cumTP / totalPos : 0);
        }
    }
    fpr_arr.push(1);
    tpr_arr.push(1);

    // AUC via trapezoidal rule
    let auc = 0;
    for (let i = 1; i < fpr_arr.length; i++) {
        auc += (fpr_arr[i] - fpr_arr[i - 1]) * (tpr_arr[i] + tpr_arr[i - 1]) / 2;
    }

    return {
        accuracy,
        precision,
        recall,
        f1_score,
        confusion_matrix: [[TN, FP], [FN, TP]],
        classification_report,
        roc_curve: { fpr: fpr_arr, tpr: tpr_arr, auc }
    };
}


function renderModelResults(m) {
    const metricsRow = document.getElementById("model-metrics-row");
    metricsRow.innerHTML = `
        <div class="glass-card metric-item text-center">
            <span class="metric-label">Accuracy</span>
            <span class="metric-val text-blue" id="metric-accuracy">0.00%</span>
        </div>
        <div class="glass-card metric-item text-center">
            <span class="metric-label">Precision (Spam)</span>
            <span class="metric-val text-blue" id="metric-precision">0.00%</span>
        </div>
        <div class="glass-card metric-item text-center">
            <span class="metric-label">Recall (Spam)</span>
            <span class="metric-val text-blue" id="metric-recall">0.00%</span>
        </div>
        <div class="glass-card metric-item text-center">
            <span class="metric-label">F1-Score</span>
            <span class="metric-val text-blue" id="metric-f1">0.00%</span>
        </div>
    `;
    
    document.getElementById("metric-accuracy").textContent = `${(m.accuracy * 100).toFixed(2)}%`;
    document.getElementById("metric-precision").textContent = `${(m.precision * 100).toFixed(2)}%`;
    document.getElementById("metric-recall").textContent = `${(m.recall * 100).toFixed(2)}%`;
    document.getElementById("metric-f1").textContent = `${(m.f1_score * 100).toFixed(2)}%`;
    
    document.getElementById("cm-th-ph").textContent = m.confusion_matrix[0][0]; // TN
    document.getElementById("cm-th-ps").textContent = m.confusion_matrix[0][1]; // FP
    document.getElementById("cm-ts-ph").textContent = m.confusion_matrix[1][0]; // FN
    document.getElementById("cm-ts-ps").textContent = m.confusion_matrix[1][1]; // TP
    
    // Report Table
    const tbody = document.getElementById("table-class-report").querySelector("tbody");
    tbody.innerHTML = "";
    
    const report = m.classification_report;
    const classes = ['ham', 'spam', 'accuracy', 'macro avg', 'weighted avg'];
    
    classes.forEach(c => {
        if (!report[c]) return;
        const tr = document.createElement("tr");
        if (c === 'accuracy') {
            tr.innerHTML = `
                <td class="font-bold">Accuracy</td>
                <td></td>
                <td></td>
                <td class="text-blue font-bold">${(report[c] * 100).toFixed(2)}%</td>
                <td>${report['macro avg'].support}</td>
            `;
        } else {
            let labelStr = c.charAt(0).toUpperCase() + c.slice(1);
            tr.innerHTML = `
                <td class="font-bold">${labelStr}</td>
                <td>${(report[c].precision * 100).toFixed(2)}%</td>
                <td>${(report[c].recall * 100).toFixed(2)}%</td>
                <td>${(report[c].f1_score * 100).toFixed(2)}%</td>
                <td>${report[c].support}</td>
            `;
        }
        tbody.appendChild(tr);
    });
    
    renderROCCurveChart(m.roc_curve);
    
    metricsRow.style.display = "grid";
    document.getElementById("model-charts-row").style.display = "grid";
    document.getElementById("classification-report-card").style.display = "block";
}

function renderROCCurveChart(roc) {
    destroyChart('roc-curve');
    
    // Subsample ROC points for clean line graph
    const limit = 50;
    const step = Math.max(1, Math.floor(roc.fpr.length / limit));
    const fprPoints = [];
    const tprPoints = [];
    for (let i = 0; i < roc.fpr.length; i += step) {
        fprPoints.push(roc.fpr[i]);
        tprPoints.push(roc.tpr[i]);
    }
    if (fprPoints[fprPoints.length - 1] !== 1.0) {
        fprPoints.push(1.0);
        tprPoints.push(1.0);
    }
    
    const ctx = document.getElementById("chart-roc-curve").getContext("2d");
    charts['roc-curve'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: fprPoints,
            datasets: [
                {
                    label: `ROC Curve (AUC = ${roc.auc.toFixed(4)})`,
                    data: tprPoints,
                    borderColor: '#f43f5e',
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    fill: false,
                    tension: 0.1
                },
                {
                    label: 'Random Chance',
                    data: fprPoints,
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    grid: { display: false },
                    ticks: {
                        color: '#9ca3af',
                        callback: function(val, index) { return Number(fprPoints[index]).toFixed(2); }
                    },
                    title: { display: true, text: 'False Positive Rate', color: '#f3f4f6' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' },
                    title: { display: true, text: 'True Positive Rate', color: '#f3f4f6' }
                }
            },
            plugins: { legend: { position: 'bottom', labels: { color: '#f3f4f6' } } }
        }
    });
}

// ==========================================================================
// TAB 5: PLAYGROUND INFERENCE
// ==========================================================================

function runLivePrediction() {
    if (!trained_model || !vectorizer) return;
    
    const message = document.getElementById("predict-input").value;
    if (!message.trim()) {
        showToast("Please enter SMS message text to classify.", true);
        return;
    }
    
    const cleaned = cleanText(message);
    const vector = vectorizer.transform(cleaned);
    
    const predClass = trained_model.predict(vector);
    const probs = trained_model.predictProba(vector);
    const hamProb = probs[0];
    const spamProb = probs[1];
    
    const banner = document.getElementById("result-banner");
    const labelEl = document.getElementById("result-label");
    const confEl = document.getElementById("result-confidence");
    
    if (predClass === 1) {
        banner.className = "banner banner-spam mb-4";
        labelEl.textContent = "🛡️ CLASSIFIED AS SPAM (WARNING)";
        confEl.textContent = `${(spamProb * 100).toFixed(2)}%`;
    } else {
        banner.className = "banner banner-ham mb-4";
        labelEl.textContent = "✅ CLASSIFIED AS HAM (LEGITIMATE)";
        confEl.textContent = `${(hamProb * 100).toFixed(2)}%`;
    }
    
    // Render vocabulary word tags
    const vocab = vectorizer.vocabulary;
    const words = cleaned.split(" ").filter(w => w.length > 0);
    const wordsIn = words.filter(w => vocab[w] !== undefined);
    const wordsOut = words.filter(w => vocab[w] === undefined);
    
    renderKeywordsTags(wordsIn, wordsOut);
    document.getElementById("predict-cleaned-msg").textContent = cleaned || "(Empty after processing)";
    
    // Render prediction chart
    renderPredictionProbabilities(hamProb, spamProb);
    
    document.getElementById("predict-result-card").style.display = "block";
    document.getElementById("predict-keywords-card").style.display = "block";
    
    showToast("Classification prediction complete!");
}

function renderKeywordsTags(wordsIn, wordsOut) {
    const inBox = document.getElementById("predict-tags-in");
    const outBox = document.getElementById("predict-tags-out");
    inBox.innerHTML = "";
    outBox.innerHTML = "";
    
    if (wordsIn.length === 0) {
        inBox.innerHTML = '<span class="text-muted sub-text">None</span>';
    } else {
        [...new Set(wordsIn)].forEach(w => {
            const span = document.createElement("span");
            span.className = "tag tag-active";
            span.textContent = w;
            inBox.appendChild(span);
        });
    }
    
    if (wordsOut.length === 0) {
        outBox.innerHTML = '<span class="text-muted sub-text">None</span>';
    } else {
        [...new Set(wordsOut)].forEach(w => {
            const span = document.createElement("span");
            span.className = "tag";
            span.textContent = w;
            outBox.appendChild(span);
        });
    }
}

function renderPredictionProbabilities(hamProb, spamProb) {
    destroyChart('predict-prob');
    const ctx = document.getElementById("chart-prediction-prob").getContext("2d");
    charts['predict-prob'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ham (Legitimate)', 'Spam (Scam)'],
            datasets: [{
                data: [hamProb * 100, spamProb * 100],
                backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(244, 63, 94, 0.8)'],
                borderColor: ['#10b981', '#f43f5e'],
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { min: 0, max: 100, grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#9ca3af', callback: val => `${val}%` } },
                y: { grid: { display: false }, ticks: { color: '#f3f4f6', font: { weight: 600 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function loadPresetText(text) {
    document.getElementById("predict-input").value = text;
    runLivePrediction();
}

// ==========================================================================
// STRING ESCAPING UTILITY
// ==========================================================================

function escapeHtml(str) {
    if (!str) return '';
    return str
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
