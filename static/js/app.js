// DOM Elements
const typeFilter = document.getElementById('typeFilter');
const lwcFilter = document.getElementById('lwcFilter');
const partnerFilterContainer = document.getElementById('partnerFilterContainer');
const partnerFilter = document.getElementById('partnerFilter');
const insulationFilter = document.getElementById('insulationFilter');
const lengthFilter = document.getElementById('lengthFilter');
const resultsContainer = document.getElementById('results-container');
const resetButton = document.getElementById('resetButton');

// Global Data
let localItems = [];

// --- Helpers ---
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

// --- Core Logic ---

const findAndDisplayResult = () => {
    const typeVal = typeFilter.value;
    const lwcVal = lwcFilter.value;
    const partnerVal = partnerFilter.value;
    const insVal = insulationFilter.value;
    const lenVal = lengthFilter.value;

    // Check if partner is visible (meaning it's required)
    const needsPartner = !partnerFilterContainer.classList.contains('hidden');

    // Validation: Ensure all visible fields are selected
    if (!typeVal || !lwcVal || !insVal || !lenVal || (needsPartner && !partnerVal)) {
        return; 
    }

    // Find exact match
    const result = localItems.find(item => 
        item.Type === typeVal && 
        item.lwc === lwcVal && 
        (item.partner === partnerVal) && // Matches empty string "" if single LWC
        item.insulation === insVal && 
        String(item.length) === lenVal
    );

    if (result) {
        // Use the Part Number from the JSON
        const partNum = result.partNumber || "N/A";
        
        resultsContainer.innerHTML = `
            <div class="w-full max-w-2xl mx-auto result-card fade-in-up">
                <div class="bg-amber-500 p-6 rounded-lg border border-amber-600 shadow-xl">
                    
                    <div class="text-center border-b border-black/10 pb-4 mb-6">
                        <p class="text-sm font-bold text-black/60 uppercase tracking-wider mb-1">Part Number</p>
                        <h3 class="text-5xl font-extrabold text-black tracking-tight">
                            ${partNum}
                        </h3>
                    </div>

                    <div class="grid grid-cols-2 gap-x-8 gap-y-4 text-xl text-black">
                        <div class="font-medium opacity-80">Blade Size:</div>
                        <div class="font-mono font-bold text-2xl">${result.bladeSize}</div>

                        <div class="font-medium opacity-80">Layers:</div>
                        <div class="font-mono font-bold text-2xl">${result.layers}</div>

                        <div class="font-medium opacity-80">Qty / Pallet:</div>
                        <div class="font-mono font-bold text-2xl">${result.qtyPerPallet}</div>

                        <div class="font-medium opacity-80">Box Pallet:</div>
                        <div class="font-mono font-bold text-2xl">${result.boxPallet}</div>
                    </div>
                </div>
            </div>`;
    } else {
        showMessage("No matching specification found.", true);
    }
};

const initializeApp = async () => {
    try {
        const response = await fetch('/api/products');
        const data = await response.json();
        
        // Check for items array
        if (data && data.items) {
            localItems = data.items;
        } else {
            throw new Error("Invalid JSON format");
        }

        // 1. Populate Type
        const types = [...new Set(localItems.map(i => i.Type))].sort();
        populateDropdown(typeFilter, types, "Choose Type");
        
        // Reset downstream
        resetDropdown(lwcFilter, "Select Type First");
        resetDropdown(partnerFilter, "Select LWC First");
        resetDropdown(insulationFilter, "Select LWC/Partner First");
        resetDropdown(lengthFilter, "Select Insulation First");
        partnerFilterContainer.classList.add('hidden');
        showMessage("Select options above to see results.");

        // --- Event Listeners ---

        // Type Change
        typeFilter.addEventListener('change', () => {
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
            partnerFilterContainer.classList.add('hidden'); // Default hide
            showMessage("Select options above.");

            if (selectedLwc) {
                // Filter items for this Type + LWC
                const potentialItems = localItems.filter(i => i.Type === selectedType && i.lwc === selectedLwc);
                
                // Check if ANY of these items have a "partner" value that isn't empty
                const hasPartners = potentialItems.some(i => i.partner && i.partner !== "");

                if (hasPartners) {
                    // Show Partner Dropdown
                    partnerFilterContainer.classList.remove('hidden');
                    const partners = [...new Set(potentialItems.map(i => i.partner))]
                        .filter(p => p !== "") // Exclude empty strings from the list
                        .sort((a, b) => parseFraction(a) - parseFraction(b));
                    
                    populateDropdown(partnerFilter, partners, "Choose Partner");
                    resetDropdown(insulationFilter, "Select Partner First");
                } else {
                    // No Partner needed, set value to "" and go straight to Insulation
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
            // If hidden, partner is "", otherwise use value
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

        // Length Change -> SHOW RESULT
        lengthFilter.addEventListener('change', findAndDisplayResult);
        
        // Reset
        resetButton.addEventListener('click', () => {
            typeFilter.value = "";
            typeFilter.dispatchEvent(new Event('change'));
        });

    } catch (err) {
        console.error(err);
        showMessage("Error loading product data. Please ensure products.json exists.", true);
    }
};

document.addEventListener('DOMContentLoaded', initializeApp);