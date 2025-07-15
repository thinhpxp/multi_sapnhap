document.addEventListener('DOMContentLoaded', () => {
    // === KHÓA API (CHỈ DÀNH CHO MYSTERY BOX) ===
    const UNSPLASH_ACCESS_KEY = 'Ln1_SF9l3ee_fsc320rUZjfB5fgSVCZlMg2JbSdh_XY';

    // === DOM Elements ===
    const lookupBtn = document.getElementById('lookup-btn');
    const resultContainer = document.getElementById('result-container');
    const oldAddressDisplay = document.getElementById('old-address-display');
    const newAddressDisplay = document.getElementById('new-address-display');
    const notificationArea = document.getElementById('notification-area');
    const mysteryBox = document.getElementById('mystery-box');
    const spinner = mysteryBox.querySelector('.loading-spinner');
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

    // === CÁC HÀM KHỞI TẠO & GIAO DIỆN ===
    function initialize() {
        const choicesConfig = { searchEnabled: true, searchPlaceholderValue: "Nhập để tìm kiếm...", itemSelectText: 'Chọn', removeItemButton: true, allowHTML: false };

        provinceChoices = new Choices(provinceSelectEl, { ...choicesConfig, searchPlaceholderValue: "Tìm tỉnh thành..." });
        districtChoices = new Choices(districtSelectEl, { ...choicesConfig, searchPlaceholderValue: "Tìm quận huyện..." });
        communeChoices = new Choices(communeSelectEl, { ...choicesConfig, searchPlaceholderValue: "Tìm phường xã..." });
        newProvinceChoices = new Choices(newProvinceSelectEl, { ...choicesConfig, searchPlaceholderValue: "Tìm tỉnh thành mới..." });
        newCommuneChoices = new Choices(newCommuneSelectEl, { ...choicesConfig, searchPlaceholderValue: "Tìm phường xã mới..." });

        if (window.allProvincesData && window.allProvincesData.length > 0) {
            window.allProvincesData.sort((a, b) => a.code - b.code);
            updateChoices(provinceChoices, 'Vui lòng chọn Tỉnh/Thành', window.allProvincesData);
        } else {
            showNotification("Lỗi: Không thể tải dữ liệu địa chỉ cũ.", "error");
        }

        resetChoice(districtChoices, 'Vui lòng chọn Quận/Huyện');
        resetChoice(communeChoices, 'Vui lòng chọn Phường/Xã');
        resetChoice(newCommuneChoices, 'Vui lòng chọn Tỉnh/Thành trước');

        addEventListeners();
        loadNewProvincesDropdown(); // Tải dữ liệu cho dropdown mới
    }

    async function loadNewProvincesDropdown() {
        resetChoice(newProvinceChoices, 'Đang tải danh sách tỉnh mới...');
        try {
            const response = await fetch('/api/get-new-provinces');
            if(!response.ok) throw new Error('Không thể tải danh sách tỉnh mới từ server.');
            const data = await response.json();
            updateChoices(newProvinceChoices, 'Vui lòng chọn Tỉnh/Thành mới', data, 'province_code', 'name');
            newProvinceChoices.enable();
        } catch (error) {
            console.error(error);
            resetChoice(newProvinceChoices, 'Lỗi khi tải danh sách tỉnh');
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
            ? "Chọn địa chỉ mới để tìm các đơn vị hành chính cũ tương ứng."
            : "Chọn địa chỉ cũ để tìm thông tin đơn vị hành chính mới tương ứng.";
    }

    // === LẮNG NGHE SỰ KIỆN ===
    function addEventListeners() {
        modeToggle.addEventListener('change', toggleLookupUI);
        lookupBtn.addEventListener('click', () => {
            if (isReverseMode) {
                handleReverseLookup();
            } else {
                handleForwardLookup();
            }
        });
        if (mysteryBox) mysteryBox.addEventListener('click', fetchRandomImage);
        resultContainer.addEventListener('click', handleCopy);

        // --- Sự kiện cho tra cứu XUÔI ---
        provinceSelectEl.addEventListener('choice', (event) => {
            resetChoice(districtChoices, 'Vui lòng chọn Quận/Huyện');
            resetChoice(communeChoices, 'Vui lòng chọn Phường/Xã');
            lookupBtn.disabled = true;
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            districtChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            if (selectedProvince && selectedProvince.districts) {
                updateChoices(districtChoices, 'Vui lòng chọn Quận/Huyện', selectedProvince.districts);
            }
        });
        districtSelectEl.addEventListener('choice', (event) => {
            resetChoice(communeChoices, 'Vui lòng chọn Phường/Xã');
            lookupBtn.disabled = true;
            const districtCode = event.detail.value;
            const provinceCode = provinceChoices.getValue(true);
            if (!districtCode || !provinceCode) return;
            communeChoices.enable();
            const selectedProvince = window.allProvincesData.find(p => p.code == provinceCode);
            const selectedDistrict = selectedProvince?.districts.find(d => d.code == districtCode);
            if (selectedDistrict && selectedDistrict.wards) {
                updateChoices(communeChoices, 'Vui lòng chọn Phường/Xã', selectedDistrict.wards);
            }
        });
        communeSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });

        // --- Sự kiện cho tra cứu NGƯỢC ---
        newProvinceSelectEl.addEventListener('choice', async (event) => {
            const provinceCode = event.detail.value;
            if (!provinceCode) return;
            resetChoice(newCommuneChoices, 'Đang tải danh sách xã...');
            lookupBtn.disabled = true;
            try {
                const response = await fetch(`/api/get-new-wards?province_code=${provinceCode}`);
                if(!response.ok) throw new Error('Không thể tải danh sách xã/phường.');
                const data = await response.json();
                updateChoices(newCommuneChoices, 'Vui lòng chọn Phường/Xã mới', data, 'ward_code', 'name');
                newCommuneChoices.enable();
            } catch (error) {
                console.error(error);
                resetChoice(newCommuneChoices, 'Lỗi khi tải danh sách xã');
                showNotification(error.message, 'error');
            }
        });
        newCommuneSelectEl.addEventListener('choice', (event) => {
            lookupBtn.disabled = !event.detail.value;
        });
    }

   // =================================================================
    // === LOGIC TRA CỨU CHÍNH - ĐÃ KẾT NỐI VỚI API BACK-END ===
    // =================================================================
    async function handleForwardLookup() {
        console.log("============== BẮT ĐẦU TRA CỨU XUÔI (API) ==============");
        const selectedCommune = communeChoices.getValue();
        if (!selectedCommune || !selectedCommune.value) {
            alert('Vui lòng chọn một Phường/Xã.');
            return;
        }

        const oldWardCode = selectedCommune.value;
        const fullOldAddress = `${selectedCommune.label}, ${districtChoices.getValue().label}, ${provinceChoices.getValue().label}`;

        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">Địa chỉ cũ:</span> ${fullOldAddress}</p></div>`;
        newAddressDisplay.innerHTML = `<p>Đang tra cứu, vui lòng chờ...</p>`;
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/lookup-forward?code=${oldWardCode}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi không xác định từ máy chủ.');
            }

            if (data.changed === false) {
                newAddressDisplay.innerHTML = `<p class="no-change">Địa chỉ này không có thông tin sáp nhập.</p>`;
            } else {
                // --- THAY ĐỔI: Thêm mã code vào kết quả ---
                const newAddressForDisplay = `${data.new_ward_name} <span class="unit-code">(Code: ${data.new_ward_code})</span>, ${data.new_province_name} <span class="unit-code">(Code: ${data.new_province_code})</span>`;
                const newAddressForCopy = `${data.new_ward_name} (Code: ${data.new_ward_code}), ${data.new_province_name} (Code: ${data.new_province_code})`;
                let resultsHtml = `<div class="address-line"><p><span class="label">Đã sáp nhập thành:</span> ${newAddressForDisplay}</p><button class="copy-btn" title="Copy địa chỉ mới" data-copy-text="${newAddressForCopy}">${copyIconSvg}</button></div>`;
                newAddressDisplay.innerHTML = resultsHtml;
            }
        } catch (error) {
            console.error('Lỗi khi tra cứu xuôi:', error);
            newAddressDisplay.innerHTML = `<p class="error">Đã xảy ra lỗi: ${error.message}</p>`;
        }

    }

    async function handleReverseLookup() {
        console.log("============== BẮT ĐẦU TRA CỨU NGƯỢC (API) ==============");
        const selectedNewCommune = newCommuneChoices.getValue();
        if (!selectedNewCommune || !selectedNewCommune.value) {
             alert('Vui lòng chọn một Phường/Xã mới từ danh sách.');
            return;
        }

        const newWardCode = selectedNewCommune.value;
        const fullNewAddress = `${selectedNewCommune.label}, ${newProvinceChoices.getValue().label}`;

        oldAddressDisplay.innerHTML = `<div class="address-line"><p><span class="label">Địa chỉ mới:</span> ${fullNewAddress}</p></div>`;
        newAddressDisplay.innerHTML = `<p>Đang tra cứu, vui lòng chờ...</p>`;
        resultContainer.classList.remove('hidden');

        try {
            const response = await fetch(`/api/lookup-reverse?code=${newWardCode}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Lỗi không xác định từ máy chủ.');
            }

            if (data.length > 0) {
                 // --- THAY ĐỔI: Thêm mã code vào kết quả ---
                 const oldUnitsFullAddresses = data.map(record => {
                    // Lưu ý: Mã quận/huyện và tỉnh cũ không có sẵn trong bảng mapping, chúng ta chỉ hiển thị những gì có.
                    return `<li>${record.old_ward_name} <span class="unit-code">(Code: ${record.old_ward_code})</span>, ${record.old_district_name}, ${record.old_province_name}</li>`;
                }).join('');
                newAddressDisplay.innerHTML = `<p class="label" style="text-align:left; margin-bottom:5px;">Các đơn vị cũ hợp thành:</p><ul class="old-units-list">${oldUnitsFullAddresses}</ul>`;
            } else {
                newAddressDisplay.innerHTML = `<p class="no-change">Địa chỉ này là một đơn vị hành chính mới và không có dữ liệu về các đơn vị cũ đã hợp thành.</p>`;
            }
        } catch (error) {
             console.error('Lỗi khi tra cứu ngược:', error);
            newAddressDisplay.innerHTML = `<p class="error">Đã xảy ra lỗi: ${error.message}</p>`;
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
        }).catch(err => {
            console.error('Lỗi khi copy: ', err);
            alert('Không thể sao chép.');
        });
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
            if (!response.ok) throw new Error(`Lỗi từ Unsplash: ${response.statusText}`);
            const data = await response.json();
            const newImage = new Image();
            newImage.src = data.urls.regular;
            newImage.alt = data.alt_description || "Ảnh ngẫu nhiên từ Unsplash";
            newImage.style.opacity = '0';
            newImage.onload = () => {
                mysteryBox.innerHTML = '';
                mysteryBox.appendChild(newImage);
                setTimeout(() => { newImage.style.opacity = '1'; }, 50);
                mysteryBox.classList.remove('loading-state');
            };
            newImage.onerror = () => { throw new Error("Không thể tải được tệp ảnh từ Unsplash."); }
        } catch (error) {
            console.error("Lỗi khi lấy ảnh:", error);
            mysteryBox.innerHTML = `<p style="color: red; font-size: 0.9em;">Không thể tải ảnh. Có thể đã hết lượt yêu cầu API. Vui lòng thử lại sau.</p>`;
            mysteryBox.classList.remove('loading-state');
        }
    }

    // --- KHỞI CHẠY ỨNG DỤNG ---
    initialize();
});