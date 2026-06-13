// ==========================================================================
// APP STATE & GLOBALS
// ==========================================================================
let currentTab = 'overview';
let charts = {}; // Store Chart.js instances to destroy them before re-drawing

// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Set up navigation
    setupNavigation();
    
    // Initial workspace status check
    fetchStatus();
    
    // Bind Event Listeners
    setupEventListeners();
});

// ==========================================================================
// NAVIGATION HANDLERS
// ==========================================================================
function setupNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const tabId = item.getAttribute("data-tab");
            navigateToTab(tabId);
        });
    });
}

function navigateToTab(tabId) {
    // Remove active class from menu items & panes
    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(el => el.classList.remove("active"));
    
    // Add active class
    const selectedNavItem = document.querySelector(`.nav-item[data-tab="${tabId}"]`);
    const selectedPane = document.getElementById(`tab-${tabId}`);
    
    if (selectedNavItem && selectedPane) {
        selectedNavItem.classList.add("active");
        selectedPane.classList.add("active");
        currentTab = tabId;
        
        // Update headers
        updateHeaderInfo(tabId);
        
        // Refresh tab-specific data if needed
        if (tabId === 'insights') {
            fetchInsights();
        } else if (tabId === 'overview') {
            fetchStatus();
        }
    }
}

function updateHeaderInfo(tabId) {
    const titleEl = document.getElementById("page-title");
    const subtitleEl = document.getElementById("page-subtitle");
    
    const meta = {
        'overview': {
            title: "Workspace Overview",
            subtitle: "Configure, train, and test spam classification models in real time."
        },
        'data-center': {
            title: "Data Ingestion & Cleaning",
            subtitle: "Download the UCI dataset and preprocess raw text labels."
        },
        'insights': {
            title: "Exploratory Insights (EDA)",
            subtitle: "Statistical distributions and term frequencies of the dataset."
        },
        'model-lab': {
            title: "Model Training Lab",
            subtitle: "Tune classifier hyperparameters, evaluate precision/recall, and analyze ROC curves."
        },
        'playground': {
            title: "SMS Predictor Playground",
            subtitle: "Type custom messages or test presets with live ML inference."
        }
    };
    
    if (meta[tabId]) {
        titleEl.textContent = meta[tabId].title;
        subtitleEl.textContent = meta[tabId].subtitle;
    }
}

// ==========================================================================
// UI HELPER FUNCTIONS: TOASTS & SPINNERS
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
    
    setTimeout(() => {
        toast.classList.remove("show");
    }, 4000);
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
// API CALLS: STATUS & STATE SYNC
// ==========================================================================
async function fetchStatus() {
    try {
        const res = await fetch("/api/status");
        const status = await res.json();
        
        updateStateBadges(status);
        updateOverviewStatusCard(status);
        syncTabsAccess(status);
    } catch (err) {
        console.error("Failed to fetch status:", err);
        showToast("Error connecting to backend server.", true);
    }
}

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
        let displayName = status.model_name === 'naive_bayes' ? 'Naive Bayes' : 
                          (status.model_name === 'logistic_regression' ? 'Logistic Reg.' : 'Random Forest');
        badgeModel.innerHTML = `<i class="fa-solid fa-microchip text-blue"></i> <span>Model: ${displayName}</span>`;
        badgeModel.classList.add("active");
    } else {
        badgeModel.innerHTML = `<i class="fa-solid fa-microchip"></i> <span>Model: Untrained</span>`;
        badgeModel.classList.remove("active");
    }
}

function updateOverviewStatusCard(status) {
    // Data loaded item
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
        let displayName = status.model_name === 'naive_bayes' ? 'Multinomial Naive Bayes' : 
                          (status.model_name === 'logistic_regression' ? 'Logistic Regression' : 'Random Forest');
        modelItem.querySelector("i").className = "fa-solid fa-circle-check green-icon";
        modelItem.querySelector(".sub-text").textContent = `Active model: ${displayName}`;
        modelItem.querySelector("button").textContent = "View Model";
    } else {
        modelItem.querySelector("i").className = "fa-solid fa-circle-xmark red-icon";
        modelItem.querySelector(".sub-text").textContent = "No Model Cached";
        modelItem.querySelector("button").textContent = "Go to Lab";
    }
    
    // Saved models block
    const savedBox = document.getElementById("saved-models-box");
    const savedList = document.getElementById("saved-models-list");
    
    if (status.saved_models && status.saved_models.length > 0) {
        savedBox.style.display = "block";
        savedList.innerHTML = "";
        
        status.saved_models.forEach(mType => {
            let displayName = mType === 'naive_bayes' ? 'Naive Bayes' : 
                              (mType === 'logistic_regression' ? 'Logistic Regression' : 'Random Forest');
            
            const div = document.createElement("div");
            div.className = "saved-model-item";
            div.innerHTML = `
                <span><strong>${displayName}</strong> (.pkl)</span>
                <button class="btn btn-secondary btn-sm" onclick="loadSavedModel('${mType}')">Retrieve</button>
            `;
            savedList.appendChild(div);
        });
    } else {
        savedBox.style.display = "none";
    }
}

function syncTabsAccess(status) {
    // 1. Data Center elements
    const btnClean = document.getElementById("btn-clean-dataset");
    if (status.raw_data_loaded) {
        btnClean.style.display = "inline-flex";
    } else {
        btnClean.style.display = "none";
    }
    
    // 2. Insights (EDA) locking
    const edaPlaceholder = document.getElementById("eda-placeholder");
    const edaContent = document.getElementById("eda-content");
    if (status.cleaned_data_loaded) {
        edaPlaceholder.style.display = "none";
        edaContent.style.display = "block";
    } else {
        edaPlaceholder.style.display = "block";
        edaContent.style.display = "none";
    }
    
    // 3. Model Lab locking
    const modelWarning = document.getElementById("model-loader-warning");
    const modelContent = document.getElementById("model-lab-content");
    if (status.cleaned_data_loaded) {
        modelWarning.style.display = "none";
        modelContent.style.display = "grid";
    } else {
        modelWarning.style.display = "block";
        modelContent.style.display = "none";
    }
    
    // 4. Playground locking
    const playWarning = document.getElementById("playground-warning");
    const playContent = document.getElementById("playground-content");
    if (status.model_trained) {
        playWarning.style.display = "none";
        playContent.style.display = "grid";
        
        // Show live prediction panel details
        document.getElementById("predict-result-card").style.display = "none";
        document.getElementById("predict-keywords-card").style.display = "none";
    } else {
        playWarning.style.display = "block";
        playContent.style.display = "none";
    }
    
    // Auto-load previews if loaded
    if (status.raw_data_loaded && document.getElementById("table-raw-preview").querySelector("tbody").children.length === 0) {
        // We will make a simple fetch call or trigger load
        triggerSilentReloadData();
    }
}

async function triggerSilentReloadData() {
    try {
        const res = await fetch("/api/load_data", { method: 'POST' });
        const data = await res.json();
        if (data.status === 'success') {
            renderRawTable(data.preview);
        }
    } catch(err) {
        console.error(err);
    }
}

// Helper to trigger load model from disk
async function loadSavedModel(modelType) {
    try {
        const res = await fetch("/api/load_saved_model", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model_type: modelType })
        });
        const result = await res.json();
        if (result.status === 'success') {
            showToast(`Loaded ${modelType} classifier from disk!`);
            fetchStatus();
        } else {
            showToast(result.message, true);
        }
    } catch (err) {
        console.error(err);
        showToast("Error fetching saved model artifacts.", true);
    }
}

// ==========================================================================
// TAB 2: DATA CENTER OPERATIONS
// ==========================================================================
function setupEventListeners() {
    // Download Dataset
    document.getElementById("btn-load-dataset").addEventListener("click", async () => {
        showLoading("data-loader-placeholder", "Downloading and unpacking dataset...");
        document.getElementById("data-preview-container").style.display = "none";
        try {
            const res = await fetch("/api/load_data", { method: 'POST' });
            const result = await res.json();
            if (result.status === 'success') {
                renderRawTable(result.preview);
                showToast("Dataset loaded successfully!");
                fetchStatus();
            } else {
                showToast(result.message, true);
                document.getElementById("data-loader-placeholder").style.display = "none";
            }
        } catch (err) {
            console.error(err);
            showToast("Server error downloading dataset.", true);
            document.getElementById("data-loader-placeholder").style.display = "none";
        }
    });
    
    // Clean Dataset
    document.getElementById("btn-clean-dataset").addEventListener("click", async () => {
        const statusMsg = document.getElementById("clean-status-message");
        statusMsg.textContent = "Processing SMS corpora (stemming and filtering stopwords)...";
        statusMsg.style.display = "block";
        showLoading("clean-loader-placeholder", "Running cleaning algorithms...");
        document.getElementById("cleaned-preview-container").style.display = "none";
        
        try {
            const res = await fetch("/api/clean_data", { method: 'POST' });
            const result = await res.json();
            if (result.status === 'success') {
                statusMsg.textContent = "Preprocessing pipeline execution complete!";
                renderCleanedTable(result.preview);
                showToast("Data preprocessing completed!");
                fetchStatus();
            } else {
                showToast(result.message, true);
                statusMsg.style.display = "none";
                document.getElementById("clean-loader-placeholder").style.display = "none";
            }
        } catch (err) {
            console.error(err);
            showToast("Server error preprocessing data.", true);
            statusMsg.style.display = "none";
            document.getElementById("clean-loader-placeholder").style.display = "none";
        }
    });
    
    // Sandbox Live Preprocessor Demo (Debounced)
    const sandboxInput = document.getElementById("sandbox-input");
    let sandboxTimeout = null;
    sandboxInput.addEventListener("input", () => {
        clearTimeout(sandboxTimeout);
        sandboxTimeout = setTimeout(async () => {
            const text = sandboxInput.value;
            if (!text.trim()) {
                document.getElementById("sandbox-output").textContent = "";
                return;
            }
            try {
                const res = await fetch("/api/preprocess_demo", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                const result = await res.json();
                if (result.cleaned) {
                    document.getElementById("sandbox-output").textContent = result.cleaned;
                }
            } catch (err) {
                console.error(err);
            }
        }, 300);
    });
    
    // Hyperparameter configuration display syncs
    const featsRange = document.getElementById("range-features");
    const splitRange = document.getElementById("range-split");
    
    featsRange.addEventListener("input", () => {
        document.getElementById("label-features").textContent = featsRange.value;
    });
    splitRange.addEventListener("input", () => {
        document.getElementById("label-split").textContent = splitRange.value;
    });
    
    // Model training
    document.getElementById("btn-train-model").addEventListener("click", async () => {
        const modelType = document.getElementById("select-model").value;
        const maxFeatures = featsRange.value;
        const testSplit = splitRange.value;
        
        const loader = document.getElementById("model-metrics-row");
        loader.innerHTML = `
            <div class="glass-card spinner-wrapper" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p class="text-muted font-bold">Training ${modelType.toUpperCase()} classifier...</p>
            </div>
        `;
        loader.style.display = "grid";
        document.getElementById("model-charts-row").style.display = "none";
        document.getElementById("classification-report-card").style.display = "none";
        
        try {
            const res = await fetch("/api/train", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_type: modelType,
                    max_features: maxFeatures,
                    test_split: testSplit
                })
            });
            const result = await res.json();
            if (result.status === 'success') {
                showToast("Classifier training and serialization complete!");
                // Redraw UI with training results
                renderModelResults(result.metrics);
                fetchStatus();
            } else {
                showToast(result.message, true);
                loader.style.display = "none";
            }
        } catch (err) {
            console.error(err);
            showToast("Server error during training.", true);
            loader.style.display = "none";
        }
    });
    
    // Playground SMS Classification
    document.getElementById("btn-predict").addEventListener("click", runPrediction);
    
    // Presets in playground
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
    const container = document.getElementById("data-preview-container");
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
    
    container.style.display = "block";
}

function renderCleanedTable(preview) {
    document.getElementById("clean-loader-placeholder").style.display = "none";
    const container = document.getElementById("cleaned-preview-container");
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
    
    container.style.display = "block";
}

// ==========================================================================
// TAB 3: EDA INSIGHTS & CHART RENDERING
// ==========================================================================
async function fetchInsights() {
    try {
        const res = await fetch("/api/insights");
        if (res.status === 400) {
            // Locked
            return;
        }
        const data = await res.json();
        
        // Populate stats
        const total = data.ham_count + data.spam_count;
        const hamPct = Math.round((data.ham_count / total) * 100);
        const spamPct = Math.round((data.spam_count / total) * 100);
        
        document.getElementById("eda-ham-count").textContent = data.ham_count.toLocaleString();
        document.getElementById("eda-ham-pct").textContent = `${hamPct}%`;
        document.getElementById("eda-spam-count").textContent = data.spam_count.toLocaleString();
        document.getElementById("eda-spam-pct").textContent = `${spamPct}%`;
        
        document.getElementById("eda-ham-len").textContent = `${data.avg_ham_len} ch`;
        document.getElementById("eda-spam-len").textContent = `${data.avg_spam_len} ch`;
        
        // Word Clouds Source Update (Cache Buster)
        const t = Date.now();
        document.getElementById("img-spam-wordcloud").src = `/api/wordcloud/spam?t=${t}`;
        document.getElementById("img-ham-wordcloud").src = `/api/wordcloud/ham?t=${t}`;
        
        // Plot Charts
        renderClassRatioChart(data.ham_count, data.spam_count);
        renderLengthHistogram(data.ham_lengths, data.spam_lengths);
        renderWordsBarChart('spam', data.top_spam_words);
        renderWordsBarChart('ham', data.top_ham_words);
        
    } catch (err) {
        console.error("Failed to load insights:", err);
    }
}

function destroyChart(id) {
    if (charts[id]) {
        charts[id].destroy();
    }
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
    
    // Create bins from 0 to 200, steps of 10
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
        const binIndex = Math.floor(len / binSize);
        if (binIndex >= binsCount) hamBins[binsCount]++;
        else hamBins[binIndex]++;
    });
    
    spamLengths.forEach(len => {
        const binIndex = Math.floor(len / binSize);
        if (binIndex >= binsCount) spamBins[binsCount]++;
        else spamBins[binIndex]++;
    });
    
    const ctx = document.getElementById("chart-length-distribution").getContext("2d");
    charts['length-dist'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ham Lengths',
                    data: hamBins,
                    backgroundColor: 'rgba(16, 185, 129, 0.65)',
                    borderColor: '#10b981',
                    borderWidth: 1
                },
                {
                    label: 'Spam Lengths',
                    data: spamBins,
                    backgroundColor: 'rgba(244, 63, 94, 0.65)',
                    borderColor: '#f43f5e',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#f3f4f6' }
                }
            }
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
            datasets: [{
                label: 'Occurrences',
                data: counts,
                backgroundColor: color,
                borderRadius: 5,
                borderWidth: 0
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#f3f4f6', font: { weight: 500 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// ==========================================================================
// TAB 4: MODEL LAB RESULTS
// ==========================================================================
function renderModelResults(m) {
    // Restore raw layout structure for metrics
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
    
    // Fill Cards
    document.getElementById("metric-accuracy").textContent = `${(m.accuracy * 100).toFixed(2)}%`;
    document.getElementById("metric-precision").textContent = `${(m.precision * 100).toFixed(2)}%`;
    document.getElementById("metric-recall").textContent = `${(m.recall * 100).toFixed(2)}%`;
    document.getElementById("metric-f1").textContent = `${(m.f1_score * 100).toFixed(2)}%`;
    
    // Confusion Matrix Cells
    document.getElementById("cm-th-ph").textContent = m.confusion_matrix[0][0]; // True Ham
    document.getElementById("cm-th-ps").textContent = m.confusion_matrix[0][1]; // False Spam (False Positive)
    document.getElementById("cm-ts-ph").textContent = m.confusion_matrix[1][0]; // False Ham (False Negative)
    document.getElementById("cm-ts-ps").textContent = m.confusion_matrix[1][1]; // True Spam
    
    // Classification Report Table
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
            let rowLabel = c.charAt(0).toUpperCase() + c.slice(1);
            tr.innerHTML = `
                <td class="font-bold">${rowLabel}</td>
                <td>${(report[c].precision * 100).toFixed(2)}%</td>
                <td>${(report[c].recall * 100).toFixed(2)}%</td>
                <td>${(report[c].f1_score * 100).toFixed(2)}%</td>
                <td>${report[c].support}</td>
            `;
        }
        tbody.appendChild(tr);
    });
    
    // ROC Curve Chart
    renderROCCurve(m.roc_curve);
    
    // Unhide panels
    metricsRow.style.display = "grid";
    document.getElementById("model-charts-row").style.display = "grid";
    document.getElementById("classification-report-card").style.display = "block";
}

function renderROCCurve(roc) {
    destroyChart('roc-curve');
    
    // Filter down points to ~50 for performance and smooth line drawing
    const limit = 50;
    const step = Math.max(1, Math.floor(roc.fpr.length / limit));
    const fprPoints = [];
    const tprPoints = [];
    
    for (let i = 0; i < roc.fpr.length; i += step) {
        fprPoints.push(roc.fpr[i]);
        tprPoints.push(roc.tpr[i]);
    }
    // Ensure final point (1.0, 1.0) is included
    if (fprPoints[fprPoints.length - 1] !== 1) {
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
                    data: fprPoints, // Y = X diagonal line
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
                        callback: function(val, index) {
                            return Number(fprPoints[index]).toFixed(2);
                        }
                    },
                    title: { display: true, text: 'False Positive Rate', color: '#f3f4f6' }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af' },
                    title: { display: true, text: 'True Positive Rate', color: '#f3f4f6' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#f3f4f6' }
                }
            }
        }
    });
}

// ==========================================================================
// TAB 5: PLAYGROUND INFRENCE
// ==========================================================================
async function runPrediction() {
    const message = document.getElementById("predict-input").value;
    if (!message.trim()) {
        showToast("Please enter SMS message text to classify.", true);
        return;
    }
    
    try {
        const res = await fetch("/api/predict", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        const data = await res.json();
        
        if (data.status === 'error') {
            showToast(data.message, true);
            return;
        }
        
        // Render Output Banner
        const resultBanner = document.getElementById("result-banner");
        const labelEl = document.getElementById("result-label");
        const confEl = document.getElementById("result-confidence");
        
        if (data.label === 'spam') {
            resultBanner.className = "banner banner-spam mb-4";
            labelEl.textContent = "🛡️ CLASSIFIED AS SPAM (WARNING)";
            confEl.textContent = `${(data.spam_probability * 100).toFixed(2)}%`;
        } else {
            resultBanner.className = "banner banner-ham mb-4";
            labelEl.textContent = "✅ CLASSIFIED AS HAM (LEGITIMATE)";
            confEl.textContent = `${(data.ham_probability * 100).toFixed(2)}%`;
        }
        
        // Render Tags
        renderKeywordsTags(data.words_in_vocab, data.words_not_in_vocab);
        document.getElementById("predict-cleaned-msg").textContent = data.cleaned_msg || "...";
        
        // Render Probability Chart
        renderPredictionProbabilities(data.ham_probability, data.spam_probability);
        
        // Show Panels
        document.getElementById("predict-result-card").style.display = "block";
        document.getElementById("predict-keywords-card").style.display = "block";
        
        showToast("Classification inference executed!");
    } catch(err) {
        console.error(err);
        showToast("Server error during inference prediction.", true);
    }
}

function renderKeywordsTags(wordsIn, wordsOut) {
    const inBox = document.getElementById("predict-tags-in");
    const outBox = document.getElementById("predict-tags-out");
    
    inBox.innerHTML = "";
    outBox.innerHTML = "";
    
    if (wordsIn.length === 0) {
        inBox.innerHTML = '<span class="text-muted sub-text">None</span>';
    } else {
        // Remove duplicates for tag lists
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
                x: {
                    min: 0,
                    max: 100,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#9ca3af', callback: val => `${val}%` }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: '#f3f4f6', font: { weight: 600 } }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function loadPresetText(text) {
    document.getElementById("predict-input").value = text;
    runPrediction();
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
