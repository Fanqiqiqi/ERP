document.addEventListener('DOMContentLoaded', function() {
    // Ocultar menús desplegables al inicio
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

    // Función toggle para menús desplegables
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopImmediatePropagation();
            const dropdownMenu = this.nextElementSibling;
            const sidebar = document.querySelector('.sidebar');
            const isOpen = dropdownMenu.style.display === 'block';

            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.style.display = 'none';
                }
            });

            dropdownMenu.style.display = isOpen ? 'none' : 'block';

            if (!isOpen) {
                const togglePosition = toggle.getBoundingClientRect().top;
                const sidebarPosition = sidebar.getBoundingClientRect().top;
                const offset = togglePosition - sidebarPosition;
                sidebar.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Click en ítems del menú para cambiar contenido o redirigir
    document.querySelectorAll('.sidebar a').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.classList.contains('dropdown-toggle')) return;
            e.preventDefault();
            const page = this.getAttribute('data-page');
            if (page) {
                window.location.href = page;
            } else {
                const section = this.textContent;
                const content = document.querySelector('.content');
                content.innerHTML = `
                    <h2>${section}</h2>
                    <p>Aquí está el área de contenido de ${section}.</p>
                `;
            }
        });
    });

    // Click en título superior para ir a inicio
    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    // Mostrar modal al hacer click en botón "Datos Empresa"
    const companyProfileBtn = document.querySelector('.company-profile-btn');
    const companyProfileModal = document.getElementById('companyProfileModal');
    const closeBtn = document.querySelector('#companyProfileModal .close-btn');

    if (companyProfileBtn && companyProfileModal && closeBtn) {
        companyProfileBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'block';
            initModalContent();
        });

        closeBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'none';
        });

        companyProfileModal.addEventListener('click', function(e) {
            if (e.target === companyProfileModal) {
                companyProfileModal.style.display = 'none';
            }
        });

        bindModalEvents();
    } else {
        console.error('Botón o modal de datos empresa no encontrado');
    }
});

// 初始化模态框内容
function initModalContent() {
    const modalContent = document.querySelector('#companyProfileModal .modal-content');
    modalContent.innerHTML = `
        <span class="close-btn">×</span>
        <div class="modal-page" id="page0">
            <div class="upload-manual-container">
                <div class="upload-section">
                    <div class="plus-icon">+</div>
                    <p>Por favor, sube el 036/037</p>
                </div>
                <div class="manual-section">
                    <button class="manual-btn">Entrada Manual</button>
                </div>
            </div>
        </div>
    `;
    bindModalEvents();
}

// 绑定模态框事件
function bindModalEvents() {
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) {
        uploadSection.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.jpg,.png';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) console.log('Archivo subido:', file.name);
            };
            input.click();
        });
    }

    const manualBtn = document.querySelector('.manual-btn');
    if (manualBtn) {
        manualBtn.addEventListener('click', () => {
            updateManualModalContent();
        });
    }
}

// 更新手动填写模态框内容
function updateManualModalContent() {
    const modalContent = document.querySelector('#companyProfileModal .modal-content');
    modalContent.classList.add('wide-modal');
    modalContent.innerHTML = `
        <span class="close-btn">×</span>
        <div class="modal-page-container">
            <!-- Page 1: Región y Tipo Empresa -->
            <div class="modal-page active" id="manualPage1">
                <h3>Datos Empresa</h3>
                <div class="form-container">
                    <div class="form-group">
                        <label for="regionSelect">Seleccione su región</label>
                        <div class="custom-dropdown">
                            <input type="text" id="regionSelect" class="dropdown-input" placeholder="Seleccione su región">
                            <div class="dropdown-content" id="regionDropdown"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="companyTypeSelect">Seleccione el tipo de empresa</label>
                        <div class="custom-dropdown">
                            <input type="text" id="companyTypeSelect" class="dropdown-input" placeholder="Seleccione el tipo de empresa" readonly>
                            <div class="dropdown-content" id="companyTypeDropdown">
                                <div class="dropdown-option" data-value="company" data-tooltip="Entidad con personalidad jurídica">Empresa<span class="info-icon">i</span></div>
                                <div class="dropdown-option" data-value="individual" data-tooltip="Persona física que trabaja por cuenta propia">Autónomo<span class="info-icon">i</span></div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="next-btn">Siguiente</button>
            </div>
            <!-- Page 2: Régimen IVA y Actividad -->
            <div class="modal-page slide-in" id="manualPage2">
                <h3>Datos Empresa</h3>
                <div class="form-container">
                    <div class="form-group">
                        <label for="taxRegimeSelect">Selecciona su Régimen de IVA</label>
                        <div class="custom-dropdown">
                            <input type="text" id="taxRegimeSelect" class="dropdown-input" placeholder="Selecciona su Régimen de IVA" readonly>
                            <div class="dropdown-content" id="taxRegimeDropdown">
                                <div class="dropdown-option" data-value="general" data-tooltip="Régimen estándar de IVA para empresas">Régimen general<span class="info-icon">i</span></div>
                                <div class="dropdown-option" data-value="cash" data-tooltip="IVA se paga al cobrar facturas">Régimen de criterio de caja<span class="info-icon">i</span></div>
                                <div class="dropdown-option" data-value="simplified" data-tooltip="Régimen simplificado para autónomos (módulos)">Régimen de IVA simplificado (Módulos)<span class="info-icon">i</span></div>
                                <div class="dropdown-option" data-value="surcharge" data-tooltip="IVA con recargo para pequeños comercios">Régimen de recargo de equivalencia<span class="info-icon">i</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="businessScope">Actividad de la Empresa</label>
                        <div class="custom-dropdown">
                            <input type="text" id="businessScope" class="dropdown-input" placeholder="Ejemplo: Comercio al por menor">
                            <div class="dropdown-content" id="businessScopeDropdown"></div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="businessCode">Epígrafe</label>
                        <input type="text" id="businessCode" class="dropdown-input" placeholder="Ejemplo: 659.9">
                    </div>
                </div>
                <button class="prev-btn">Anterior</button>
                <button class="next-btn">Siguiente</button>
            </div>
            <!-- Page 3: Detalles Empresa -->
            <div class="modal-page slide-in" id="manualPage3">
                <!-- Existing Page 3 content remains unchanged -->
            </div>
        </div>
    `;
    bindManualModalEvents();
}

// 绑定手动填写模态框事件
function bindManualModalEvents() {
    const companyProfileModal = document.getElementById('companyProfileModal');
    const closeBtn = document.querySelector('#companyProfileModal .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => companyProfileModal.style.display = 'none');
    }

    // 下拉菜单逻辑
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const input = dropdown.querySelector('.dropdown-input');
        const content = dropdown.querySelector('.dropdown-content');

        if (input.id === 'regionSelect') {
            input.addEventListener('input', (e) => {
                const filter = e.target.value;
                populateRegionDropdown(filter);
                content.classList.add('show');
            });
            input.addEventListener('focus', () => {
                populateRegionDropdown(input.value);
                content.classList.add('show');
            });
        } else {
            input.addEventListener('click', () => {
                content.classList.toggle('show');
            });
        }

        content.addEventListener('click', (e) => {
            const option = e.target.closest('.dropdown-option');
            if (option) {
                input.value = option.childNodes[0].textContent;
                content.classList.remove('show');
            }
        });
    });

    window.addEventListener('click', (e) => {
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const content = dropdown.querySelector('.dropdown-content');
            if (!dropdown.contains(e.target)) {
                content.classList.remove('show');
            }
        });
    });

    // 页面切换逻辑
    const nextBtnPage1 = document.querySelector('#manualPage1 .next-btn');
    if (nextBtnPage1) {
        nextBtnPage1.addEventListener('click', () => {
            const currentPage = document.querySelector('#manualPage1');
            const nextPage = document.querySelector('#manualPage2');
            if (currentPage && nextPage) {
                currentPage.classList.remove('active');
                currentPage.classList.add('slide-out');
                nextPage.classList.remove('slide-in');
                nextPage.classList.add('active');
            }
        });
    }

    const nextBtnPage2 = document.querySelector('#manualPage2 .next-btn');
    if (nextBtnPage2) {
        nextBtnPage2.addEventListener('click', () => {
            const currentPage = document.querySelector('#manualPage2');
            const nextPage = document.querySelector('#manualPage3');
            if (currentPage && nextPage) {
                currentPage.classList.remove('active');
                currentPage.classList.add('slide-out');
                nextPage.classList.remove('slide-in');
                nextPage.classList.add('active');
            }
        });
    }

    const prevBtnPage2 = document.querySelector('#manualPage2 .prev-btn');
    if (prevBtnPage2) {
        prevBtnPage2.addEventListener('click', () => {
            const currentPage = document.querySelector('#manualPage2');
            const prevPage = document.querySelector('#manualPage1');
            if (currentPage && prevPage) {
                currentPage.classList.remove('active');
                currentPage.classList.add('slide-in');
                prevPage.classList.remove('slide-out');
                prevPage.classList.add('active');
            }
        });
    }

    const prevBtnPage3 = document.querySelector('#manualPage3 .prev-btn');
    if (prevBtnPage3) {
        prevBtnPage3.addEventListener('click', () => {
            const currentPage = document.querySelector('#manualPage3');
            const prevPage = document.querySelector('#manualPage2');
            if (currentPage && prevPage) {
                currentPage.classList.remove('active');
                currentPage.classList.add('slide-in');
                prevPage.classList.remove('slide-out');
                prevPage.classList.add('active');
            }
        });
    }

    // 保存逻辑
    const saveBtn = document.querySelector('#manualPage3 .save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const formData = {
                companyName: document.getElementById('companyName').value,
                taxNumber: document.getElementById('taxNumber').value,
                streetType: document.getElementById('streetType').value,
                streetName: document.getElementById('streetName').value,
                streetNumber: document.getElementById('streetNumber').value,
                floor: document.getElementById('floor').value,
                door: document.getElementById('door').value,
                postalCode: document.getElementById('postalCode').value,
                city: document.getElementById('city').value,
                address: document.getElementById('address').value,
                phone: document.getElementById('phone').value,
                companyEmail: document.getElementById('companyEmail').value,
                region: document.getElementById('regionSelect').value,
                companyType: document.getElementById('companyTypeSelect').value,
                taxRegime: document.getElementById('taxRegimeSelect').value,
                businessScope: document.getElementById('businessScope').value,
                businessCode: document.getElementById('businessCode').value
            };
            localStorage.setItem('companyProfileData', JSON.stringify(formData));
            console.log('Datos empresa guardados:', formData);
            companyProfileModal.style.display = 'none';
        });
    }

    // 加载保存的数据
    const savedData = JSON.parse(localStorage.getItem('companyProfileData')) || {};
    for (const [key, value] of Object.entries(savedData)) {
        const input = document.querySelector(`#companyProfileModal [id="${key}"]`);
        if (input) {
            input.value = value;
        }
    }

    // Tooltip logic for info-icon
    document.querySelectorAll('.info-icon').forEach(icon => {
        icon.addEventListener('mouseenter', (e) => {
            const option = icon.closest('.dropdown-option');
            const tooltipText = option.getAttribute('data-tooltip');
            if (!tooltipText) return;

            const tooltip = document.createElement('div');
            tooltip.classList.add('tooltip');
            tooltip.textContent = tooltipText;

            // Position the tooltip relative to the modal
            const modal = document.querySelector('#companyProfileModal');
            modal.appendChild(tooltip);

            const iconRect = icon.getBoundingClientRect();
            const modalRect = modal.getBoundingClientRect();
            tooltip.style.left = `${iconRect.right - modalRect.left + 10}px`; // 10px gap to the right
            tooltip.style.top = `${iconRect.top - modalRect.top + (iconRect.height / 2) - (tooltip.offsetHeight / 2)}px`; // Vertically centered
        });

        icon.addEventListener('mouseleave', () => {
            const tooltip = document.querySelector('.tooltip');
            if (tooltip) tooltip.remove();
        });
    });
}

// 填充地区下拉菜单
function populateRegionDropdown(filter) {
    const regionDropdown = document.getElementById('regionDropdown');
    if (!regionDropdown) return;
    regionDropdown.innerHTML = '';
    const provinces = [
        "A Coruña", "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Baleares",
        "Barcelona", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba",
        "Cuenca", "Girona", "Granada", "Guadalajara", "Guipúzcoa", "Huelva", "Huesca", "Jaén", "La Rioja",
        "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense",
        "Palencia", "Pontevedra", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria",
        "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza",
        "Ceuta", "Melilla"
    ];
    const filteredProvinces = provinces.filter(province => 
        province.toLowerCase().startsWith(filter.toLowerCase())
    );
    filteredProvinces.forEach(province => {
        const option = document.createElement('div');
        option.classList.add('dropdown-option');
        option.setAttribute('data-value', province);
        option.textContent = province;
        regionDropdown.appendChild(option);
    });
}