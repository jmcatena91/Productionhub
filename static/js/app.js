// DOM Elements
const lwcFilter = document.getElementById('lwcFilter');
const secondLwcFilterContainer = document.getElementById('secondLwcFilterContainer');
const secondLwcFilter = document.getElementById('secondLwcFilter');
const insulationFilter = document.getElementById('insulationFilter');
const lengthFilter = document.getElementById('lengthFilter');
const resultsContainer = document.getElementById('results-container');
const resetButton = document.getElementById('resetButton'); // Added Reset Button

// Global variable for product items
let localItems = [];

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
            <p class="text-lg text-gray-500">Loading data...</p>
        </div>`;
};

// --- Show Error Message ---
const showErrorMessage = (message) => {
     resultsContainer.innerHTML = `<p class="text-xl font-semibold text-red-600 bg-red-50 p-4 rounded-md border border-red-200">${message}</p>`;
};

// --- Show Initial/Placeholder Message ---
const showInitialMessage = (message = "Select options above to see results.") => {
     resultsContainer.innerHTML = `<p class="text-lg text-gray-500">${message}</p>`;
     // Clear any potential result card styling if we go back to placeholder
     resultsContainer.querySelector('.result-card')?.remove();
};


// --- Populate dropdown options ---
const populateDropdown = (element, options) => {
    console.log(`Populating dropdown: ${element.id} with options:`, options);
    const currentVal = element.value;
    // --- More descriptive placeholders ---
    let defaultText = `-- Choose ${element.id.replace('Filter', '')} --`;
    if (element.id === 'lwcFilter') defaultText = '-- Choose LWC Type --';
    if (element.id === 'secondLwcFilter') defaultText = '-- Choose Partner LWC --';
    if (element.id === 'insulationFilter') defaultText = '-- Choose Insulation --';
    if (element.id === 'lengthFilter') defaultText = '-- Choose Length --';

    element.innerHTML = `<option value="">${defaultText}</option>`;
    if (!Array.isArray(options)) {
        console.error(`Error: Options for ${element.id} is not an array!`, options);
        element.disabled = true;
        // Apply disabled styles via CSS :disabled pseudo-class
        return;
    }
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = opt.textContent = option;
        element.appendChild(opt);
    });
    element.disabled = false;
    // --- Remove potential disabled styling (handled by :disabled CSS) ---

    if (options.map(String).includes(String(currentVal))) {
        element.value = currentVal;
    } else {
         element.value = "";
    }
    console.log(`Finished populating dropdown: ${element.id}`);
};

const resetDropdown = (element, defaultText) => {
    console.log(`Resetting dropdown: ${element.id}`);
    // --- More descriptive placeholders on reset ---
    let placeholder = `-- ${defaultText} --`;
    if (element.id === 'lwcFilter') placeholder = '-- Choose LWC Type --'; // Should not happen often
    if (element.id === 'secondLwcFilter') placeholder = '-- Choose Partner LWC --';
    if (element.id === 'insulationFilter') placeholder = '-- Choose Insulation --';
    if (element.id === 'lengthFilter') placeholder = '-- Choose Length --';

    element.innerHTML = `<option value="">${placeholder}</option>`;
    element.disabled = true;
    element.value = "";
    // --- Apply disabled styles via CSS :disabled pseudo-class ---
};

// --- Find and display the result ---
const findAndDisplayResult = () => {
    const lwcVal = lwcFilter.value;
    const secondLwcVal = secondLwcFilter.value;
    const insVal = insulationFilter.value;
    const lenVal = lengthFilter.value;

    console.log("Finding results for:", { lwcVal, secondLwcVal, insVal, lenVal });

    const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

     if (!lwcVal || !insVal || !lenVal || (requiresPartnerSelection && !secondLwcVal)) {
         if (lwcVal && (requiresPartnerSelection ? secondLwcVal : true) && insVal) {
              if (!resultsContainer.querySelector('.result-card')) { // Only show if no results card exists
                    showInitialMessage("Please select Length.");
              }
         } else {
             // If not even LWC/Partner/Insulation selected, show generic message
             if (!lwcVal) {
                 showInitialMessage("Select options above to see results.");
             } else if (requiresPartnerSelection && !secondLwcVal) {
                  showInitialMessage("Please select Partner LWC.");
             } else if (!insVal) {
                  showInitialMessage("Please select Insulation.");
             }
             // Otherwise, length is missing, handled above
         }
         console.log("Validation failed, not enough selections.");
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

    console.log("Result found:", result);
    displayResult(result);
};

// --- Display a single result card ---
const displayResult = (item) => {
    if (item) {
        // --- Refined title logic ---
        let title = `Specifications for ${item.lwc}`;
        if (item.partner) {
            const baseLwc = String(item.lwc).split(' ')[0];
            title = `Specifications for ${baseLwc} + ${item.partner}`;
        }

        resultsContainer.innerHTML = `
            <div class="w-full max-w-2xl mx-auto result-card">
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-lg">
                    <h3 class="text-2xl font-bold text-gray-800 mb-5">${title}</h3>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-lg">
                        <div class="font-medium text-gray-600">Diameter Blade Size:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.bladeSize ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600">Layers to Roll:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.layers ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600">QTY. per Pallet:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.qtyPerPallet ?? 'N/A'}</div>

                        <div class="font-medium text-gray-600">Box Pallet:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.boxPallet ?? 'N/A'}</div>
                    </div>
                </div>
            </div>`;
    } else {
        // Validation check happens in findAndDisplayResult, this means no match found
        showErrorMessage("No matching specification found for the selected combination.");
    }
};

// --- Reset All Filters ---
const resetFilters = () => {
    console.log("Resetting all filters...");
    lwcFilter.value = ""; // Clear selection
    // Trigger the change event on lwcFilter to reset downstream dropdowns correctly
    lwcFilter.dispatchEvent(new Event('change'));
    // Ensure the results area is cleared back to initial state
    showInitialMessage();
};


// --- Event Listeners and Initial Population ---
const initializeApp = async () => {
    console.log("Initializing app...");
    showLoading(); // Show loading indicator

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
        console.log("Fetched data:", data);

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

        resetDropdown(secondLwcFilter, 'Choose Partner LWC'); // More descriptive placeholder
        resetDropdown(insulationFilter, 'Choose LWC Type First');
        resetDropdown(lengthFilter, 'Choose Insulation First');
        secondLwcFilterContainer.classList.add('hidden');
        showInitialMessage(); // Show initial message now that data is loaded


        // --- Event Listeners ---
        lwcFilter.addEventListener('change', () => {
            console.log(`LWC filter changed to: ${lwcFilter.value}`);
            const selectedLwc = lwcFilter.value;
            // Reset downstream
            resetDropdown(secondLwcFilter, 'Choose Partner LWC');
            resetDropdown(insulationFilter, selectedLwc ? 'Choose Insulation' : 'Choose LWC Type First');
            resetDropdown(lengthFilter, 'Choose Insulation First');
            showInitialMessage(); // Clear results on LWC change

            const isCombo = localItems.some(item => item.lwc === selectedLwc && item.partner);
            console.log(`Selected LWC is combo: ${isCombo}`);

            if (isCombo) {
                const partnerOptions = [...new Set(localItems
                    .filter(item => item.lwc === selectedLwc && item.partner)
                    .map(item => item.partner))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(secondLwcFilter, partnerOptions);
                secondLwcFilterContainer.classList.remove('hidden');
                resetDropdown(insulationFilter, 'Choose Partner LWC First'); // Update placeholder
            } else {
                 secondLwcFilter.value = '';
                secondLwcFilterContainer.classList.add('hidden');
                if (selectedLwc) {
                    const insulationOptions = [...new Set(localItems
                        .filter(item => item.lwc === selectedLwc && !item.partner)
                        .map(item => item.insulation))]
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    populateDropdown(insulationFilter, insulationOptions);
                    // Placeholder already set above
                }
                // else: LWC deselected, placeholders already reset
            }
        });

        secondLwcFilter.addEventListener('change', () => {
             console.log(`Partner filter changed to: ${secondLwcFilter.value}`);
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            // Reset downstream
            resetDropdown(insulationFilter, selectedPartner ? 'Choose Insulation' : 'Choose Partner LWC First');
            resetDropdown(lengthFilter, 'Choose Insulation First');
            showInitialMessage();

            if (selectedLwc && selectedPartner) {
                const insulationOptions = [...new Set(localItems
                    .filter(item => item.lwc === selectedLwc && item.partner === selectedPartner)
                    .map(item => item.insulation))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(insulationFilter, insulationOptions);
                // Placeholder already set
            }
            // else: Partner deselected, placeholders already reset
        });

        insulationFilter.addEventListener('change', () => {
             console.log(`Insulation filter changed to: ${insulationFilter.value}`);
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            const selectedInsulation = insulationFilter.value;
            // Reset only length
            resetDropdown(lengthFilter, selectedInsulation ? 'Choose Length' : 'Choose Insulation First');
            // Don't clear results here - findAndDisplayResult will handle it

            if (selectedInsulation) {
                let relevantItems;
                const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

                if(requiresPartnerSelection) {
                    if (!selectedPartner) {
                        console.warn("Insulation changed, but partner required and not selected.");
                        // Keep length disabled with appropriate message
                        resetDropdown(lengthFilter, 'Choose Partner LWC First');
                        return;
                    }
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.partner === selectedPartner && item.insulation === selectedInsulation);
                } else {
                    // Requires LWC to be selected
                    if (!selectedLwc) {
                         console.warn("Insulation changed, but LWC not selected.");
                         resetDropdown(lengthFilter, 'Choose LWC Type First');
                         return;
                    }
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.insulation === selectedInsulation && !item.partner);
                }
                 console.log("Relevant items for length:", relevantItems);

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
            // else: Insulation deselected, placeholders already reset

            findAndDisplayResult(); // Update results display or show relevant "Please select..." message
        });

        lengthFilter.addEventListener('change', () => {
            console.log(`Length filter changed to: ${lengthFilter.value}`);
            findAndDisplayResult();
        });

        // --- Reset Button Listener ---
        resetButton.addEventListener('click', resetFilters);

        console.log("Initialization complete, event listeners added.");

    } catch (error) {
        console.error('Initialization failed:', error);
        // --- Display user-friendly error in results area ---
        showErrorMessage(`Error loading application data: ${error.message}. Please check console or try refreshing.`);
         // Disable all filters on critical error
         [lwcFilter, secondLwcFilter, insulationFilter, lengthFilter].forEach(el => {
             el.innerHTML = '<option value="">Error</option>';
             el.disabled = true;
         });
    }
};

// --- Initial Call ---
document.addEventListener('DOMContentLoaded', initializeApp);