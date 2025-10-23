// DOM Elements
const lwcFilter = document.getElementById('lwcFilter');
const secondLwcFilterContainer = document.getElementById('secondLwcFilterContainer');
const secondLwcFilter = document.getElementById('secondLwcFilter');
const insulationFilter = document.getElementById('insulationFilter');
const lengthFilter = document.getElementById('lengthFilter');
const resultsContainer = document.getElementById('results-container');

// Global variable for product items
let localItems = [];

console.log("app.js loaded"); // Check if script runs at all

// --- Helper function to parse fraction strings ---
const parseFraction = (str) => {
    // Handle null or undefined strings
    if (!str) return 0;
    // Find the first part of the string (e.g., "1/4" from "1/4 B-M")
    const fractionalPart = String(str).split(' ')[0]; // Ensure str is treated as string
    const parts = fractionalPart.split('/');
    // Check if it's a valid fraction
    if (parts.length === 2) {
        const num = parseInt(parts[0], 10);
        const den = parseInt(parts[1], 10);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
            return num / den;
        }
    }
    // Handle non-fractional numbers like "11" or invalid fractions
    const floatVal = parseFloat(str);
    return isNaN(floatVal) ? 0 : floatVal;
};

// --- Populate dropdown options ---
const populateDropdown = (element, options) => {
    console.log(`Populating dropdown: ${element.id} with options:`, options); // Log population attempt
    const currentVal = element.value;
    let defaultText = `-- Select ${element.id.replace('Filter', '')} --`;
    if (element.id === 'secondLwcFilter') defaultText = '-- Select Partner LWC --';
    element.innerHTML = `<option value="">${defaultText}</option>`; // Start fresh
    if (!Array.isArray(options)) {
        console.error(`Error: Options for ${element.id} is not an array!`, options);
        element.disabled = true; // Disable if options are bad
        return; // Stop population
    }
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option; // Use the actual value for the option value
        opt.textContent = option; // Use the actual value for the text content
        element.appendChild(opt);
    });
    element.disabled = false;
    // Restore previous value if it's still in the list
    if (options.map(String).includes(String(currentVal))) { // Compare as strings
        element.value = currentVal;
    } else {
         element.value = ""; // Reset if previous value is no longer valid
    }
    console.log(`Finished populating dropdown: ${element.id}`);
};

const resetDropdown = (element, defaultText) => {
    console.log(`Resetting dropdown: ${element.id}`); // Log reset attempt
    element.innerHTML = `<option value="">-- ${defaultText} --</option>`;
    element.disabled = true;
     element.value = ""; // Ensure value is reset
};

// --- Find and display the result ---
const findAndDisplayResult = () => {
    const lwcVal = lwcFilter.value;
    const secondLwcVal = secondLwcFilter.value;
    const insVal = insulationFilter.value;
    const lenVal = lengthFilter.value;

    console.log("Finding results for:", { lwcVal, secondLwcVal, insVal, lenVal }); // Log current selections

    const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

     if (!lwcVal || !insVal || !lenVal || (requiresPartnerSelection && !secondLwcVal)) {
         if (lwcVal && (requiresPartnerSelection ? secondLwcVal : true) && insVal) {
              if (!resultsContainer.querySelector('.result-card')) {
                    resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Please select Length.</p>';
              }
         } else {
             resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Please make all selections.</p>';
         }
         console.log("Validation failed, not enough selections.");
        return;
    }


    let result;
    if (requiresPartnerSelection) {
         result = localItems.find(item =>
            item.lwc === lwcVal &&
            item.partner === secondLwcVal &&
            item.insulation === insVal &&
            String(item.length) === lenVal
        );
    } else {
        result = localItems.find(item =>
            item.lwc === lwcVal &&
            item.insulation === insVal &&
            String(item.length) === lenVal &&
            !item.partner
        );
    }

    console.log("Result found:", result); // Log the found result
    displayResult(result);
};

// --- Display a single result card ---
const displayResult = (item) => {
    if (item) {
        let title = `Result for ${item.lwc}`;
        if (item.partner) {
            const baseLwc = String(item.lwc).split(' ')[0];
            title = `Result for ${baseLwc} + ${item.partner}`;
        }

        resultsContainer.innerHTML = `
            <div class="w-full max-w-2xl mx-auto transform transition-all duration-300 result-card">
                <div class="bg-blue-50 p-6 rounded-lg border border-blue-200 shadow-lg">
                    <h3 class="text-2xl font-bold text-gray-800 mb-4">${title}</h3>
                    <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-lg">
                        <div class="font-semibold text-gray-600">Diameter Blade Size (MM):</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.bladeSize !== undefined && item.bladeSize !== null ? item.bladeSize : 'N/A'}</div>

                        <div class="font-semibold text-gray-600">Layers to Roll:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.layers !== undefined && item.layers !== null ? item.layers : 'N/A'}</div>

                        <div class="font-semibold text-gray-600">New QTY. per Pallet:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.qtyPerPallet !== undefined && item.qtyPerPallet !== null ? item.qtyPerPallet : 'N/A'}</div>

                        <div class="font-semibold text-gray-600">Box Pallet:</div>
                        <div class="font-mono text-gray-900 font-semibold">${item.boxPallet !== undefined && item.boxPallet !== null ? item.boxPallet : 'N/A'}</div>
                    </div>
                </div>
            </div>`;
    } else {
        // Only show "No matching specification" if all filters were actually selected
        const lwcVal = lwcFilter.value;
        const secondLwcVal = secondLwcFilter.value;
        const insVal = insulationFilter.value;
        const lenVal = lengthFilter.value;
        const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');
        if (lwcVal && insVal && lenVal && (!requiresPartnerSelection || secondLwcVal)) {
             resultsContainer.innerHTML = '<p class="text-xl font-semibold text-red-500">No matching specification found.</p>';
        } else {
            // Keep the "Please make selections" message if not all filters are selected yet
             resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Please make all selections.</p>';
        }

    }
};


// --- Event Listeners and Initial Population ---
const initializeApp = async () => {
    console.log("Initializing app..."); // Log start of initialization
    try {
        console.log("Fetching /api/products..."); // Log before fetch
        const response = await fetch('/api/products');
        console.log("Fetch response status:", response.status); // Log response status

        if (!response.ok) {
            // Log the response text even if it's not ok, might contain error details
            const errorText = await response.text();
            console.error("Fetch failed response text:", errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Log the raw fetched data

        // **CRITICAL CHECK**: Ensure data.items exists and is an array
        if (!data || !Array.isArray(data.items)) {
             console.error("Fetched data is missing 'items' array or is invalid:", data);
             localItems = []; // Set to empty array to prevent further errors
             resultsContainer.innerHTML = '<p class="text-xl font-semibold text-red-500">Error: Invalid data format received from server.</p>';
              // Disable filters as data is bad
             [lwcFilter, secondLwcFilter, insulationFilter, lengthFilter].forEach(el => el.disabled = true);
             return; // Stop initialization
        }

        localItems = data.items;
        console.log(`Loaded ${localItems.length} items.`); // Log how many items were loaded


        // Populate LWC filter initially
        const lwcOptions = [...new Set(localItems.map(item => item.lwc))];
        lwcOptions.sort((a, b) => parseFraction(a) - parseFraction(b));
        populateDropdown(lwcFilter, lwcOptions); // This will now log inside populateDropdown

        // Reset dependent dropdowns
        resetDropdown(secondLwcFilter, 'Select Partner LWC');
        resetDropdown(insulationFilter, 'Select LWC first');
        resetDropdown(lengthFilter, 'Select Insulation first');
        secondLwcFilterContainer.classList.add('hidden'); // Ensure it's hidden initially
        resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Your results will appear here.</p>'; // Initial message


        // --- Event Listeners ---
        lwcFilter.addEventListener('change', () => {
            console.log(`LWC filter changed to: ${lwcFilter.value}`); // Log change
            const selectedLwc = lwcFilter.value;
            // Reset downstream filters
            resetDropdown(secondLwcFilter, 'Select Partner LWC');
            resetDropdown(insulationFilter, 'Select LWC');
            resetDropdown(lengthFilter, 'Select Insulation');
            resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Your results will appear here.</p>'; // Clear results on LWC change

            const isCombo = localItems.some(item => item.lwc === selectedLwc && item.partner);
            console.log(`Selected LWC is combo: ${isCombo}`); // Log if it's a combo

            if (isCombo) {
                const partnerOptions =
                    [...new Set(localItems
                        .filter(item => item.lwc === selectedLwc && item.partner)
                        .map(item => item.partner))]
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(secondLwcFilter, partnerOptions);
                secondLwcFilterContainer.classList.remove('hidden');
                resetDropdown(insulationFilter, 'Select Partner LWC'); // Insulation depends on partner now
            } else {
                 secondLwcFilter.value = '';
                secondLwcFilterContainer.classList.add('hidden');
                if (selectedLwc) {
                    const insulationOptions = [...new Set(localItems
                        .filter(item => item.lwc === selectedLwc && !item.partner)
                        .map(item => item.insulation))]
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    populateDropdown(insulationFilter, insulationOptions);
                     resetDropdown(lengthFilter, 'Select Insulation'); // Length depends on insulation
                } else {
                     // LWC deselected
                     resetDropdown(insulationFilter, 'Select LWC first');
                     resetDropdown(lengthFilter, 'Select Insulation first');
                }
            }
            // No need to call findAndDisplayResult here, wait for more selections
        });

        secondLwcFilter.addEventListener('change', () => {
             console.log(`Partner filter changed to: ${secondLwcFilter.value}`); // Log change
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            // Reset downstream
            resetDropdown(insulationFilter, 'Select Insulation');
            resetDropdown(lengthFilter, 'Select Insulation');
            resultsContainer.innerHTML = '<p class="text-xl text-gray-500">Your results will appear here.</p>'; // Clear results

            if (selectedLwc && selectedPartner) {
                const insulationOptions = [...new Set(localItems
                    .filter(item => item.lwc === selectedLwc && item.partner === selectedPartner)
                    .map(item => item.insulation))]
                    .sort((a, b) => parseFraction(a) - parseFraction(b));
                populateDropdown(insulationFilter, insulationOptions);
                resetDropdown(lengthFilter, 'Select Insulation'); // Length depends on insulation
            } else if (selectedLwc && !selectedPartner) {
                 resetDropdown(insulationFilter, 'Select Partner LWC'); // Reset insulation if partner deselected
            }
             // No need to call findAndDisplayResult here
        });

        insulationFilter.addEventListener('change', () => {
             console.log(`Insulation filter changed to: ${insulationFilter.value}`); // Log change
            const selectedLwc = lwcFilter.value;
            const selectedPartner = secondLwcFilter.value;
            const selectedInsulation = insulationFilter.value;
            // Reset only length
            resetDropdown(lengthFilter, 'Select Length');
            // Don't clear results here - findAndDisplayResult will handle it

            if (selectedInsulation) {
                let relevantItems;
                const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');

                if(requiresPartnerSelection) {
                    if (!selectedPartner) {
                        console.warn("Insulation changed, but partner required and not selected.");
                        resetDropdown(lengthFilter, 'Select Partner LWC');
                        return;
                    }
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.partner === selectedPartner && item.insulation === selectedInsulation);
                } else {
                    relevantItems = localItems.filter(item => item.lwc === selectedLwc && item.insulation === selectedInsulation && !item.partner);
                }
                 console.log("Relevant items for length:", relevantItems); // Log items used for length options

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
            } else {
                 console.log("Insulation deselected."); // Log deselection
                 const requiresPartnerSelection = !secondLwcFilterContainer.classList.contains('hidden');
                 resetDropdown(lengthFilter, requiresPartnerSelection ? 'Select Partner LWC' : 'Select Insulation first');
            }
            // Update results display or show "Please select Length"
             findAndDisplayResult();
        });

        lengthFilter.addEventListener('change', () => {
            console.log(`Length filter changed to: ${lengthFilter.value}`); // Log change
            findAndDisplayResult(); // Final step, display the result
        });

        console.log("Initialization complete, event listeners added."); // Log success

    } catch (error) {
        console.error('Initialization failed:', error); // Log the specific error
        resultsContainer.innerHTML = `<p class="text-xl font-semibold text-red-500">Error loading application data: ${error.message}. Check console for details.</p>`;
         // Disable filters on error
         [lwcFilter, secondLwcFilter, insulationFilter, lengthFilter].forEach(el => {
             el.innerHTML = '<option value="">Error</option>'; // Show error state in dropdowns
             el.disabled = true;
         });
    }
};

// --- Initial Call ---
document.addEventListener('DOMContentLoaded', initializeApp);