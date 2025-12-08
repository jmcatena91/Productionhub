// DOM Elements
const typeFilter = document.getElementById('typeFilter');
const lwcFilter = document.getElementById('lwcFilter');
const partnerFilterContainer = document.getElementById('partnerFilterContainer');
const partnerFilter = document.getElementById('partnerFilter');
const insulationFilter = document.getElementById('insulationFilter');
const lengthFilter = document.getElementById('lengthFilter');
const resultsContainer = document.getElementById('results-container');
const resetButton = document.getElementById('resetButton');
const searchInput = document.getElementById('searchInput');
const searchResultsList = document.getElementById('searchResultsList');

// Global Data
let localItems = [];

// --- Helpers ---
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const parseFraction = (str) => {
    if (!str) return 0;
    const cleanStr = String(str).trim();
    if (cleanStr.includes('/')) {
        const parts = cleanStr.split('/');
        return parseInt(parts[0], 10) / parseInt(parts[1], 10);
    }
    return parseFloat(cleanStr) || 0;
};

const populateDropdown = (element, options, defaultText) => {
    element.innerHTML = `<option value="">-- ${defaultText} --</option>`;
    element.disabled = false;
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        element.appendChild(option);
    });
};

const resetDropdown = (element, defaultText) => {
    element.innerHTML = `<option value="">-- ${defaultText} --</option>`;
    element.disabled = true;
    element.value = "";
};

const showMessage = (msg, isError = false) => {
    const colorClass = isError ? "text-red-500 bg-red-50 border-red-200" : "text-gray-500";
    resultsContainer.innerHTML = `
        <div class="w-full max-w-2xl mx-auto p-4 rounded-lg border ${isError ? 'border-red-200' : 'border-transparent'}">
            <p class="text-center text-xl ${colorClass}">${msg}</p>
        </div>`;
};

// --- Display Logic ---

const displayResult = (item) => {
    if (!item) return;

    const partNum = item.partNumber || "N/A";
    const partnerDisplay = item.partner ? ` + ${item.partner}` : '';

    // Hide the search list if we are displaying a final card
    searchResultsList.classList.add('hidden');
    searchResultsList.innerHTML = '';

    resultsContainer.innerHTML = `
        <div class="w-full max-w-2xl mx-auto result-card">
            <div class="bg-amber-500 p-6 rounded-lg border border-amber-600 shadow-xl">
                
                <div class="text-center border-b border-black/10 pb-4 mb-6">
                    <p class="text-sm font-bold text-black/60 uppercase tracking-wider mb-1">Part Number</p>
                    <h3 class="text-5xl font-extrabold text-black tracking-tight">${partNum}</h3>
                    <p class="text-md font-medium text-black/70 mt-2">
                        ${item.Type} | LWC: ${item.lwc}${partnerDisplay} | Ins: ${item.insulation}" | Len: ${item.length}'
                    </p>
                </div>

                <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-xl text-black">
                    <div class="font-medium opacity-80">Blade Size:</div>
                    <div class="font-mono font-bold text-2xl">${item.bladeSize}</div>

                    <div class="font-medium opacity-80">Layers:</div>
                    <div class="font-mono font-bold text-2xl">${item.layers}</div>

                    <div class="font-medium opacity-80">Qty / Pallet:</div>
                    <div class="font-mono font-bold text-2xl">${item.qtyPerPallet}</div>

                    <div class="font-medium opacity-80">Box Pallet:</div>
                    <div class="font-mono font-bold text-2xl">${item.boxPallet}</div>
                </div>
            </div>
        </div>`;
};

const renderMatchList = (matches) => {
    if (matches.length === 0) {
        searchResultsList.innerHTML = `<div class="p-4 text-center text-gray-400">No matches found.</div>`;
        searchResultsList.classList.remove('hidden');
        resultsContainer.innerHTML = ''; // Clear main container
        return;
    }

    // Limit results to 50
    const limitedMatches = matches.slice(0, 50);
    const hasMore = matches.length > 50;

    // Generate HTML for list
    let listHtml = limitedMatches.map(item => {
        const partnerText = item.partner ? ` + ${item.partner}` : '';
        return `
        <div class="search-item p-4 border-b border-gray-700 hover:bg-gray-700 cursor-pointer transition flex justify-between items-center group" 
             onclick="selectSearchItem('${item.partNumber}')">
            <div>
                <div class="font-bold text-amber-500 text-lg group-hover:text-amber-400">${item.partNumber || 'No Part #'}</div>
                <div class="text-sm text-gray-400">
                    Type ${item.Type} • ${item.lwc}${partnerText} • ${item.insulation}" • ${item.length}'
                </div>
            </div>
            <div class="text-gray-500 group-hover:text-white">
                Select →
            </div>
        </div>
        `;
    }).join('');

    if (hasMore) {
        listHtml += `
            <div class="p-3 text-center text-xs text-gray-500 italic border-t border-gray-700">
                Showing top 50 matches. Keep typing to narrow down...
            </div>
        `;
    }

    searchResultsList.innerHTML = listHtml;
    searchResultsList.classList.remove('hidden');
    resultsContainer.innerHTML = '<p class="text-lg text-gray-500">Keep typing to narrow down...</p>';
};

// Global function for onclick event in HTML string
window.selectSearchItem = (partNum) => {
    const item = localItems.find(i => i.partNumber === partNum);
    if (item) {
        displayResult(item);
        searchInput.value = partNum; // Fill input with selection
    }
};

// --- Search Logic ---

const handleSearch = (e) => {
    const query = e.target.value.toLowerCase().trim();

    // Clear Dropdowns when searching to avoid confusion
    if (query.length > 0) {
        resetDropdown(lwcFilter, "Search Active");
        resetDropdown(partnerFilter, "Search Active");
        resetDropdown(insulationFilter, "Search Active");
        resetDropdown(lengthFilter, "Search Active");
        typeFilter.value = "";
        partnerFilterContainer.classList.add('hidden');
    }

    if (query.length === 0) {
        searchResultsList.classList.add('hidden');
        resetButton.click(); // Restore default state
        return;
    }

    const matches = localItems.filter(item => {
        // Use pre-computed search string
        return item.searchString.includes(query);
    });

    if (matches.length === 1) {
        // Exact match found - Show the card immediately
        displayResult(matches[0]);
    } else {
        // Show list of candidates
        renderMatchList(matches);
    }
};

// --- Dropdown Logic (Existing) ---

const findAndDisplayResult = () => {
    const typeVal = typeFilter.value;
    const lwcVal = lwcFilter.value;
    const partnerVal = partnerFilter.value;
    const insVal = insulationFilter.value;
    const lenVal = lengthFilter.value;

    const needsPartner = !partnerFilterContainer.classList.contains('hidden');

    if (!typeVal || !lwcVal || !insVal || !lenVal || (needsPartner && !partnerVal)) {
        return;
    }

    const result = localItems.find(item =>
        item.Type === typeVal &&
        item.lwc === lwcVal &&
        (item.partner === partnerVal) &&
        item.insulation === insVal &&
        String(item.length) === lenVal
    );

    if (result) {
        displayResult(result);
    } else {
        showMessage("No matching specification found.", true);
    }
};

const initializeApp = async () => {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();

        if (data && data.items) {
            localItems = data.items;

            // Pre-compute search strings
            localItems.forEach(item => {
                item.searchString = `${item.partNumber} ${item.Type} ${item.lwc} ${item.partner || ''} ${item.insulation} ${item.length}`.toLowerCase();
            });

        } else {
            throw new Error("Invalid JSON format");
        }

        // 1. Populate Type
        const types = [...new Set(localItems.map(i => i.Type))].sort();
        populateDropdown(typeFilter, types, "Choose Type");

        // Reset downstream
        resetDropdown(lwcFilter, "Select Type First");
        resetDropdown(partnerFilter, "Select LWC First");
        resetDropdown(insulationFilter, "Select Prev First");
        resetDropdown(lengthFilter, "Select Prev First");
        partnerFilterContainer.classList.add('hidden');
        showMessage("Select options above or use Search.");

        // --- Event Listeners ---

        // NEW: Search Listener with Debounce
        searchInput.addEventListener('input', debounce(handleSearch, 300));

        // Type Change
        typeFilter.addEventListener('change', () => {
            searchInput.value = ""; // Clear search if using dropdowns
            searchResultsList.classList.add('hidden');

            const selectedType = typeFilter.value;
            resetDropdown(lwcFilter, selectedType ? "Choose LWC" : "Select Type First");
            resetDropdown(partnerFilter, "Select LWC First");
            resetDropdown(insulationFilter, "Select Prev First");
            resetDropdown(lengthFilter, "Select Prev First");
            partnerFilterContainer.classList.add('hidden');
            showMessage("Select options above.");

            if (selectedType) {
                const lwcs = [...new Set(localItems
                    .filter(i => i.Type === selectedType)
                    .map(i => i.lwc))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(lwcFilter, lwcs, "Choose LWC");
            }
        });

        // LWC Change
        lwcFilter.addEventListener('change', () => {
            const selectedType = typeFilter.value;
            const selectedLwc = lwcFilter.value;

            resetDropdown(partnerFilter, "Select LWC First");
            resetDropdown(insulationFilter, "Select Prev First");
            resetDropdown(lengthFilter, "Select Prev First");
            partnerFilterContainer.classList.add('hidden');
            showMessage("Select options above.");

            if (selectedLwc) {
                const potentialItems = localItems.filter(i => i.Type === selectedType && i.lwc === selectedLwc);
                const hasPartners = potentialItems.some(i => i.partner && i.partner !== "");

                if (hasPartners) {
                    partnerFilterContainer.classList.remove('hidden');
                    const partners = [...new Set(potentialItems.map(i => i.partner))]
                        .filter(p => p !== "")
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    populateDropdown(partnerFilter, partners, "Choose Partner");
                    resetDropdown(insulationFilter, "Select Partner First");
                } else {
                    partnerFilter.value = "";
                    const insulations = [...new Set(potentialItems.map(i => i.insulation))]
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    populateDropdown(insulationFilter, insulations, "Choose Insulation");
                }
            }
        });

        // Partner Change
        partnerFilter.addEventListener('change', () => {
            const selectedType = typeFilter.value;
            const selectedLwc = lwcFilter.value;
            const selectedPartner = partnerFilter.value;

            resetDropdown(insulationFilter, selectedPartner ? "Choose Insulation" : "Select Partner First");
            resetDropdown(lengthFilter, "Select Insulation First");
            showMessage("Select options above.");

            if (selectedPartner) {
                const insulations = [...new Set(localItems
                    .filter(i => i.Type === selectedType && i.lwc === selectedLwc && i.partner === selectedPartner)
                    .map(i => i.insulation))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(insulationFilter, insulations, "Choose Insulation");
            }
        });

        // Insulation Change
        insulationFilter.addEventListener('change', () => {
            const selectedType = typeFilter.value;
            const selectedLwc = lwcFilter.value;
            const selectedPartner = !partnerFilterContainer.classList.contains('hidden') ? partnerFilter.value : "";
            const selectedIns = insulationFilter.value;

            resetDropdown(lengthFilter, selectedIns ? "Choose Length" : "Select Insulation First");
            showMessage("Select options above.");

            if (selectedIns) {
                const lengths = [...new Set(localItems
                    .filter(i =>
                        i.Type === selectedType &&
                        i.lwc === selectedLwc &&
                        i.partner === selectedPartner &&
                        i.insulation === selectedIns
                    )
                    .map(i => i.length))]
                    .map(String)
                    .sort((a, b) => parseFloat(a) - parseFloat(b));
                populateDropdown(lengthFilter, lengths, "Choose Length");
            }
        });

        // Length Change
        lengthFilter.addEventListener('change', findAndDisplayResult);

        // Reset
        resetButton.addEventListener('click', () => {
            searchInput.value = "";
            searchResultsList.classList.add('hidden');
            typeFilter.value = "";
            typeFilter.dispatchEvent(new Event('change'));
            showMessage("Select options above or type to search.");
        });

    } catch (err) {
        console.error(err);
        showMessage("Error loading product data.", true);
    }
};

document.addEventListener('DOMContentLoaded', initializeApp);