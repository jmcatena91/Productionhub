// DOM Elements
const lwcFilter = document.getElementById('lwcFilter');
const secondLwcFilterContainer = document.getElementById('secondLwcFilterContainer');
const secondLwcFilter = document.getElementById('secondLwcFilter');
const insulationFilter = document.getElementById('insulationFilter');
const lengthFilter = document.getElementById('lengthFilter');
const resultsContainer = document.getElementById('results-container');
const resetButton = document.getElementById('resetButton');

// Global variable for product items
let localItems = [];

console.log("app.js loaded");

// --- Helper function to parse fraction strings ---
const parseFraction = (str) => {
    if (!str) return 0;
    const fractionalPart = String(str).split(' ')[0];
    const parts = fractionalPart.split('/');
    if (parts.length === 2) {
        const num = parseInt(parts[0], 10);
        const den = parseInt(parts[1], 10);
        if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
    }
    const floatVal = parseFloat(str);
    return isNaN(floatVal) ? 0 : floatVal;
};

// --- Show Loading Indicator ---
const showLoading = () => {
    resultsContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center">
            <div class="loader mb-3"></div>
            <p class="text-lg text-gray-500 dark:text-gray-400">Loading data...</p>
        </div>`;
};

// --- Show Error Message ---
const showErrorMessage = (message) => {
     resultsContainer.innerHTML = `<p class="text-xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-gray-700 p-4 rounded-md border border-red-200 dark:border-red-500">${message}</p>`;
};

// --- Show Initial/Placeholder Message ---
const showInitialMessage = (message = "Select options above to see results.") => {
     const existingCard = resultsContainer.querySelector('.result-card');
     if (existingCard) existingCard.remove();
     resultsContainer.innerHTML = `<p class="text-lg text-gray-500 dark:text-gray-400">${message}</p>`;
};


// --- Populate dropdown options ---
const populateDropdown = (element, options) => {
    const currentVal = element.value;
    let defaultText = `-- Choose ${element.id.replace('Filter', '')} --`;
    if (element.id === 'lwcFilter') defaultText = '-- Choose LWC Type --';
    if (element.id === 'secondLwcFilter') defaultText = '-- Choose Partner LWC --';
    if (element.id === 'insulationFilter') defaultText = '-- Choose Insulation --';
    if (element.id === 'lengthFilter') defaultText = '-- Choose Length --';

    element.innerHTML = `<option value="">${defaultText}</option>`;
    if (!Array.isArray(options)) {
        console.error(`Error: Options for ${element.id} is not an array!`, options);
        element.disabled = true;
        return;
    }
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = option;
        opt.classList.add('bg-gray-50', 'dark:bg-gray-700', 'text-gray-900', 'dark:text-white');
        element.appendChild(opt);
    });
    element.disabled = false;

    if (options.map(String).includes(String(currentVal))) {
        element.value = currentVal;
    } else {
         element.value = "";
    }
};

const resetDropdown = (element, defaultText) => {
    let placeholder = `-- ${defaultText} --`;
    if (element.id === 'lwcFilter') placeholder = '-- Choose LWC Type --';
    if (element.id === 'secondLwcFilter') placeholder = '-- Choose Partner LWC --';
    if (element.id === 'insulationFilter') placeholder = '-- Choose Insulation --';
    if (element.id === 'lengthFilter') placeholder = '-- Choose Length --';

    element.innerHTML = `<option value="">${placeholder}</option>`;
    element.disabled = true;
    element.value = "";
};

// --- Find and display the result ---
const findAndDisplayResult = () => {
    const lwcVal = lwcFilter.value;
    const secondLwcVal = secondLwcFilter.value;
    const insVal = insulationFilter.value;
    const lenVal = lengthFilter.value;

    const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

     if (!lwcVal || !insVal || !lenVal || (requiresPartnerSelection && !secondLwcVal)) {
         if (lwcVal && (requiresPartnerSelection ? secondLwcVal : true) && insVal) {
              if (!resultsContainer.querySelector('.result-card')) {
                    showInitialMessage("Please select Length.");
              }
         } else {
             if (!lwcVal) { showInitialMessage("Select options above to see results."); }
             else if (requiresPartnerSelection && !secondLwcVal) { showInitialMessage("Please select Partner LWC."); }
             else if (!insVal) { showInitialMessage("Please select Insulation."); }
         }
        return;
    }

    let result;
    if (requiresPartnerSelection) {
         result = localItems.find(item =>
            item.lwc === lwcVal && item.partner === secondLwcVal &&
            item.insulation === insVal && String(item.length) === lenVal
        );
    } else {
        result = localItems.find(item =>
            item.lwc === lwcVal && item.insulation === insVal &&
            String(item.length) === lenVal && !item.partner
        );
    }
    displayResult(result);
};

// --- Display a single result card ---
const displayResult = (item) => {
    if (item) {
        let title = `Specifications for ${item.lwc}`;
        if (item.partner) {
            const baseLwc = String(item.lwc).split(' ')[0];
            title = `Specifications for ${baseLwc} + ${item.partner}`;
        }

        resultsContainer.innerHTML = `
            <div class="w-full max-w-2xl mx-auto result-card">
                <div class="bg-blue-50 dark:bg-gray-700 p-6 rounded-lg border border-blue-200 dark:border-gray-600 shadow-lg">
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-5">${title}</h3>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-lg">
                        <div class="font-medium text-gray-600 dark:text-gray-300">Diameter Blade Size:</div>
                        <div class="font-mono text-gray-900 dark:text-gray-100 font-semibold">${item.bladeSize ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600 dark:text-gray-300">Layers to Roll:</div>
                        <div class="font-mono text-gray-900 dark:text-gray-100 font-semibold">${item.layers ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600 dark:text-gray-300">QTY. per Pallet:</div>
                        <div class="font-mono text-gray-900 dark:text-gray-100 font-semibold">${item.qtyPerPallet ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600 dark:text-gray-300">Box Pallet:</div>
                        <div class="font-mono text-gray-900 dark:text-gray-100 font-semibold">${item.boxPallet ?? 'N/A'}</div>
                    </div>
                </div>
            </div>`;
    } else {
        showErrorMessage("No matching specification found for the selected combination.");
    }
};

// --- Reset All Filters ---
const resetFilters = () => {
    console.log("Resetting all filters...");
    lwcFilter.value = "";
    lwcFilter.dispatchEvent(new Event('change'));
    showInitialMessage();
};

// --- Initialize Filters and Load Data ---
const initializeApp = async () => {
    console.log("Initializing app...");
    showLoading();

    try {
        console.log("Fetching /api/products...");
        const response = await fetch('/api/products');
        console.log("Fetch response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Fetch failed response text:", errorText);
            throw new Error(`Failed to load product data (Status: ${response.status}). Please try refreshing.`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data.items)) {
             console.error("Fetched data is missing 'items' array or is invalid:", data);
             throw new Error("Received invalid data format from server.");
        }

        localItems = data.items;
        console.log(`Loaded ${localItems.length} items.`);

        // --- Initial Population ---
        const lwcOptions = [...new Set(localItems.map(item => item.lwc))];
        lwcOptions.sort((a, b) => parseFraction(a) - parseFraction(b));
        populateDropdown(lwcFilter, lwcOptions);

        resetDropdown(secondLwcFilter, 'Choose Partner LWC');
        resetDropdown(insulationFilter, 'Choose LWC Type First');
        resetDropdown(lengthFilter, 'Choose Insulation First');
        secondLwcFilterContainer.classList.add('hidden');
        showInitialMessage();


        // --- Event Listeners (Filters) ---
        lwcFilter.addEventListener('change', () => {
            const selectedLwc = lwcFilter.value;
            resetDropdown(secondLwcFilter, 'Choose Partner LWC');
            resetDropdown(insulationFilter, selectedLwc ? 'Choose Insulation' : 'Choose LWC Type First');
            resetDropdown(lengthFilter, 'Choose Insulation First');
            showInitialMessage();

            const isCombo = localItems.some(item => item.lwc === selectedLwc && item.partner);

            if (isCombo) {
                const partnerOptions = [...new Set(localItems
                    .filter(item => item.lwc === selectedLwc && item.partner)
                    .map(item => item.partner))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(secondLwcFilter, partnerOptions);
                secondLwcFilterContainer.classList.remove('hidden');
                resetDropdown(insulationFilter, 'Choose Partner LWC First');
            } else {
                 secondLwcFilter.value = '';
                secondLwcFilterContainer.classList.add('hidden');
                if (selectedLwc) {
                    const insulationOptions = [...new Set(localItems
                        .filter(item => item.lwc === selectedLwc && !item.partner)
                        .map(item => item.insulation))]
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    populateDropdown(insulationFilter, insulationOptions);
                }
            }
        });

        secondLwcFilter.addEventListener('change', () => {
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            resetDropdown(insulationFilter, selectedPartner ? 'Choose Insulation' : 'Choose Partner LWC First');
            resetDropdown(lengthFilter, 'Choose Insulation First');
            showInitialMessage();

            if (selectedLwc && selectedPartner) {
                const insulationOptions = [...new Set(localItems
                    .filter(item => item.lwc === selectedLwc && item.partner === selectedPartner)
                    .map(item => item.insulation))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(insulationFilter, insulationOptions);
            }
        });

        insulationFilter.addEventListener('change', () => {
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            const selectedInsulation = insulationFilter.value;
            resetDropdown(lengthFilter, selectedInsulation ? 'Choose Length' : 'Choose Insulation First');

            if (selectedInsulation) {
                let relevantItems;
                const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

                if(requiresPartnerSelection) {
                    if (!selectedPartner) {
                        console.warn("Insulation changed, but partner required and not selected.");
                        resetDropdown(lengthFilter, 'Choose Partner LWC First');
                        findAndDisplayResult(); return;
                    }
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.partner === selectedPartner && item.insulation === selectedInsulation);
                } else {
                    if (!selectedLwc) {
                         console.warn("Insulation changed, but LWC not selected.");
                         resetDropdown(lengthFilter, 'Choose LWC Type First');
                         findAndDisplayResult(); return;
                    }
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.insulation === selectedInsulation && !item.partner);
                }

                const lengthOptions = [...new Set(relevantItems.map(item => item.length))]
                   .map(String)
                   .sort((a, b) => {
                    const aStr = a.split('/')[0].split('-')[0];
                    const bStr = b.split('/')[0].split('-')[0];
                    const aNum = parseFloat(aStr);
                    const bNum = parseFloat(bStr);
                    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
                    return a.localeCompare(b);
                });
                populateDropdown(lengthFilter, lengthOptions);
            }
            findAndDisplayResult();
        });

        lengthFilter.addEventListener('change', () => {
            findAndDisplayResult();
        });

        // --- Reset Button Listener ---
        if (resetButton) {
            resetButton.addEventListener('click', resetFilters);
        } else {
            console.error("Reset button not found!");
        }

        console.log("Initialization complete, event listeners added.");

    } catch (error) {
        console.error('Initialization failed:', error);
        showErrorMessage(`Error loading application data: ${error.message}. Please check console or try refreshing.`);
         [lwcFilter, secondLwcFilter, insulationFilter, lengthFilter].forEach(el => {
             if (el) {
                 el.innerHTML = '<option value="">Error</option>';
                 el.disabled = true;
             }
         });
    }
};

// --- Initial Calls (AFTER DOM is ready) ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApp(); // Initialize the main app filters and data
    // Theme toggle setup removed
});