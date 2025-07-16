document.addEventListener('DOMContentLoaded', () => {
    // === Lấy bản dịch hoặc một đối tượng rỗng nếu không có ===
    const translations = window.translations || {};

    // === Hàm tiện ích để lấy bản dịch một cách an toàn ===
    // Cung cấp một giá trị dự phòng nếu khóa không tồn tại
    const t = (key, fallback = '') => translations[key] || fallback;

    // === KHÓA API (CHỈ DÀNH CHO MYSTERY BOX) ===
    const UNSPLASH_ACCESS_KEY = 'Ln1_SF9l3ee_fsc320rUZjfB5fgSVCZlMg2JbSdh_XY';

    // === DOM Elements ===
    const lookupBtn = document.getElementById('lookup-btn');
    const resultContainer = document.getElementById('result-container');
    const oldAddressDisplay = document.getElementById('old-address-display');
    const newAddressDisplay = document.getElementById('new-address-display');
    const notificationArea = document.getElementById('notification-area');
    const mysteryBox = document.getElementById('mystery-box');
    const spinner = mysteryBox ? mysteryBox.querySelector('.loading-spinner') : null;
    const modeToggle = document.getElementById('mode-toggle');
    const lookupDescription = document.getElementById('lookup-description');
    const forwardControls = document.getElementById('forward-controls');
    const reverseControls = document.getElementById('reverse-controls');
    const provinceSelectEl = document.getElementById('province-select');
    const districtSelectEl = document.getElementById('district-select');
    const communeSelectEl = document.getElementById('commune-select');
    const newProvinceSelectEl = document.getElementById('new-province-select');
    const newCommuneSelectEl = document.getElementById('new-commune-select');

    // === BIỂU TƯỢNG SVG ===
    const copyIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16"><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;
    const copiedIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard-check" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z"/><path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/><path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/></svg>`;

    // === QUẢN LÝ TRẠNG THÁI ===
    let isReverseMode = false;
    let provinceChoices, districtChoices, communeChoices;
    let newProvinceChoices, newCommuneChoices;

    // === CÁC HÀM TIỆN ÍCH ===
    function showNotification(message, type = 'loading') { notificationArea.textContent = message; notificationArea.className = type; notificationArea.classList.remove('hidden'); }
    function hideNotification() { notificationArea.classList.add('hidden'); notificationArea.textContent = ''; }
    function updateChoices(choicesInstance, placeholder, data, valueKey = 'code', labelKey = 'name') {
        choicesInstance.clearStore();
        choicesInstance.setChoices(
            [{ value: '', label: placeholder, selected: true, disabled: true }, ...data.map(item => ({ value: item[valueKey], label: item[labelKey] }))],
            'value', 'label', false
        );
    }
    function resetChoice(choicesInstance, placeholder) {
        choicesInstance.clearStore();
        choicesInstance.setChoices([{ value: '', label: placeholder, selected: true, disabled: true }], 'value', 'label', false);
        choicesInstance.disable();
    }

    // === HÀM DỊCH THUẬT ===
    function applyTranslations() {
        document.querySelectorAll('[data-i18n-key]').forEach(el => {
            const key = el.getAttribute('data-i18n-key');
            el.innerHTML = t(key, el.innerHTML); // Dùng text cũ làm fallback
        });

        document.title = t('pageTitle', "Tra Cứu Sáp Nhập");
        const descEl = document.querySelector('meta[name="description"]');
        const ogTitleEl = document.querySelector('meta[property="og:title"]');
        const ogDescEl = document.querySelector('meta[property="og:description"]');

        if (descEl) descEl.setAttribute('content', t('pageDescription'));
        if (ogTitleEl) ogTitleEl.setAttribute('content', t('ogTitle'));
        if (ogDescEl) ogDescEl.setAttribute('content', t('ogDescription'));
    }

    // === CÁC HÀM KHỞI TẠO & GIAO DIỆN ===
    function initialize() {
        applyTranslations();

        const choicesConfig = { searchEnabled: true, itemSelectText: t('selectChoice', 'Chọn'), removeItemButton: true, searchPlaceholderValue: "..." };

        provinceChoices = new Choices(provinceSelectEl, { ...choicesConfig });
        districtChoices = new Choices(districtSelectEl, { ...choicesConfig });
        communeChoices = new Choices(communeSelectEl, { ...choicesConfig });
        newProvinceChoices = new Choices(newProvinceSelectEl, { ...choicesConfig });
        newCommuneChoices = new Choices(newCommuneSelectEl, { ...choicesConfig });

        if (window.allProvincesData && window.allProvincesData.length > 0) {
            window.allProvincesData.sort((a, b) => a.code - b.code);
            updateChoices(provinceChoices, t('oldProvincePlaceholder'), window.allProvincesData);
        } else {
            showNotification(t('errorLoadOldData', "Lỗi: Không thể tải dữ liệu địa chỉ cũ."), "error");
        }

        resetChoice(districtChoices, t('oldDistrictPlaceholder'));
        resetChoice(communeChoices, t('oldCommunePlaceholder'));
        resetChoice(newCommuneChoices, t('newCommunePlaceholder'));

        addEventListeners();
        loadNewProvincesDropdown();
    }

    async function loadNewProvincesDropdown() {
        resetChoice(newProvinceChoices, t('newProvinceLoading'));
        try {
            const response = await fetch('/api/get-new-provinces');
            if(!response.ok) throw new Error(t('errorFetchNewProvinces', 'Không thể tải danh sách tỉnh mới từ server.'));
            const data = await response.json();
            updateChoices(newProvinceChoices, t('newProvincePlaceholder'), data, 'province_code', 'name');
            newProvinceChoices.enable();
        } catch (error) {
            console.error(error);
            resetChoice(newProvinceChoices, t('newProvinceError'));
            showNotification(error.message, 'error');
        }
    }

    function toggleLookupUI() {
        isReverseMode = modeToggle.checked;
        forwardControls.classList.toggle('hidden', isReverseMode);
        reverseControls.classList.toggle('hidden', !isReverseMode);
        resultContainer.classList.add('hidden');
        lookupBtn.disabled = true;
        lookupDescription.textContent = isReverseMode
            ? t('lookupDescriptionNewToOld')
            : t('lookupDescriptionOldToNew');
    }

    // === LẮNG NGHE SỰ KIỆN ===
    function addEventListeners() {
        if(modeToggle) modeToggle.addEventListener('change', toggleLookupUI);
        if(lookupBtn) lookupBtn.addEventListener('click', () => {
            if (isReverseMode) handleReverseLookup();
            else handleForwardLookup();
        });
        if (mysteryBox) mysteryBox.addEventListener('click', fetchRandomImage);
        if(resultContainer) resultContainer.addEventListener('click', handleCopy);

        // --- Sự kiện cho tra cứu XUÔI ---
        if(provinceSelectEl) provinceSelectEl.addEventListener('choice', (event) => {
            resetChoice(districtChoices, t('oldDistrictPlaceholder'));
            resetChoice(communeChoices, t('oldCommunePlaceholder'));
            lookupBtn.disabled = true;
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            districtChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            if (selectedProvince && selectedProvince.districts) {
                updateChoices(districtChoices, t('oldDistrictPlaceholder'), selectedProvince.districts);
            }
        });
        if(districtSelectEl) districtSelectEl.addEventListener('choice', (event) => {
            resetChoice(communeChoices, t('oldCommunePlaceholder'));
            lookupBtn.disabled = true;
            const districtCode = event.detail.value;
            const provinceCode = provinceChoices.getValue(true);
            if (!districtCode || !provinceCode) return;
            communeChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            const selectedDistrict = selectedProvince?.districts.find(d => d.code == districtCode);
            if (selectedDistrict && selectedDistrict.wards) {
                updateChoices(communeChoices, t('oldCommunePlaceholder'), selectedDistrict.wards);
            }
        });
        if(communeSelectEl) communeSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });

        // --- Sự kiện cho tra cứu NGƯỢC ---
        if(newProvinceSelectEl) newProvinceSelectEl.addEventListener('choice', async (event) => {
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            resetChoice(newCommuneChoices, t('newCommuneLoading'));
            lookupBtn.disabled = true;
            try {
                const response = await fetch(`/api/get-new-wards?province_code=${provinceCode}`);
                if(!response.ok) throw new Error(t('newCommuneError'));
                const data = await response.json();
                updateChoices(newCommuneChoices, t('newCommunePlaceholder'), data, 'ward_code', 'name');
                newCommuneChoices.enable();
            } catch (error) {
                console.error(error);
                resetChoice(newCommuneChoices, t('newCommuneError'));
                showNotification(error.message, 'error');
            }
        });
        if(newCommuneSelectEl) newCommuneSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });
    }

    // =================================================================
    // === LOGIC TRA CỨU CHÍNH - ĐÃ KẾT NỐI VỚI API BACK-END ===
    // =================================================================
    async function handleForwardLookup() {
        const selectedCommune = communeChoices.getValue();
        if (!selectedCommune || !selectedCommune.value) {
            alert(t('alertSelectOldCommune'));
            return;
        }

        const oldWardCode = selectedCommune.value;
        const fullOldAddress = `${selectedCommune.label}, ${districtChoices.getValue().label}, ${provinceChoices.getValue().label}`;

        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('oldAddressLabel')}</span> ${fullOldAddress}</p></div>`;
        newAddressDisplay.innerHTML = `<p>${t('lookingUp')}</p>`;
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/lookup-forward?code=${oldWardCode}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error');

            if (data.changed === false) {
                newAddressDisplay.innerHTML = `<p class="no-change">${t('noChangeMessage')}</p>`;
            } else {
                const newAddressForDisplay = `${data.new_ward_name}, ${data.new_province_name}`;
                let resultsHtml = `<div class="address-line"><p><span class="label">${t('newAddressLabel')}</span> ${newAddressForDisplay}</p><button class="copy-btn" title="Copy" data-copy-text="${newAddressForDisplay}">${copyIconSvg}</button></div>`;
                newAddressDisplay.innerHTML = resultsHtml;
            }
        } catch (error) {
            console.error('Lỗi khi tra cứu xuôi:', error);
            newAddressDisplay.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    async function handleReverseLookup() {
        const selectedNewCommune = newCommuneChoices.getValue();
        if (!selectedNewCommune || !selectedNewCommune.value) {
             alert(t('alertSelectNewCommune'));
            return;
        }

        const newWardCode = selectedNewCommune.value;
        const fullNewAddress = `${selectedNewCommune.label}, ${newProvinceChoices.getValue().label}`;

        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">${t('newAddressLabel').replace(':', '')}</span> ${fullNewAddress}</p></div>`;
        newAddressDisplay.innerHTML = `<p>${t('lookingUp')}</p>`;
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/lookup-reverse?code=${newWardCode}`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Server error');

            if (data.length > 0) {
                 const oldUnitsFullAddresses = data.map(record => {
                    return `<li>${record.old_ward_name}, ${record.old_district_name}, ${record.old_province_name}</li>`;
                }).join('');
                newAddressDisplay.innerHTML = `<p class="label">${t('mergedFromLabel')}</p><ul class="old-units-list">${oldUnitsFullAddresses}</ul>`;
            } else {
                newAddressDisplay.innerHTML = `<p class="no-change">${t('noDataFoundMessage')}</p>`;
            }
        } catch (error) {
             console.error('Lỗi khi tra cứu ngược:', error);
            newAddressDisplay.innerHTML = `<p class="error">${error.message}</p>`;
        }
    }

    // === HÀM PHỤ TRỢ KHÁC ===
    function handleCopy(event) {
        const button = event.target.closest('.copy-btn');
        if (!button) return;
        const textToCopy = button.dataset.copyText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            button.innerHTML = copiedIconSvg;
            button.classList.add('copied');
            button.disabled = true;
            setTimeout(() => {
                button.innerHTML = copyIconSvg;
                button.classList.remove('copied');
                button.disabled = false;
            }, 2000);
        }).catch(err => { console.error('Lỗi khi copy: ', err); });
    }

    async function fetchRandomImage() {
        if (!mysteryBox || !spinner) return;
        spinner.classList.remove('hidden');
        mysteryBox.classList.add('loading-state');
        const oldImg = mysteryBox.querySelector('img');
        if (oldImg) oldImg.style.opacity = '0.3';

        const apiUrl = `https://api.unsplash.com/photos/random?client_id=${UNSPLASH_ACCESS_KEY}&query=vietnam&orientation=portrait`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Unsplash API error');
            const data = await response.json();
            const newImage = new Image();
            newImage.src = data.urls.regular;
            newImage.alt = data.alt_description || "Random image from Unsplash";
            newImage.style.opacity = '0';
            newImage.onload = () => {
                mysteryBox.innerHTML = '';
                mysteryBox.appendChild(newImage);
                setTimeout(() => { newImage.style.opacity = '1'; }, 50);
                mysteryBox.classList.remove('loading-state');
            };
            newImage.onerror = () => { throw new Error("Could not load image file."); }
        } catch (error) {
            console.error("Error fetching image:", error);
            mysteryBox.innerHTML = `<p style="color: red; font-size: 0.9em;">Could not load image.</p>`;
            mysteryBox.classList.remove('loading-state');
        }
    }

    // --- KHỞI CHẠY ỨNG DỤNG ---
    initialize();
});