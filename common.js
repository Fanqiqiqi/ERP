// common.js
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
                                <div class="dropdown-option" data-value="company">Empresa</div>
                                <div class="dropdown-option" data-value="individual">Autónomo</div>
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
                                <div class="dropdown-option" data-value="general">Régimen general</div>
                                <div class="dropdown-option" data-value="cash">Régimen de criterio de caja</div>
                                <div class="dropdown-option" data-value="simplified">Régimen de IVA simplificado (Módulos)</div>
                                <div class="dropdown-option" data-value="surcharge">Régimen de recargo de equivalencia</div>
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
            <!-- Page 3: Detalles Empresa (缩小字体并优化按钮可见性) -->
            <div class="modal-page slide-in" id="manualPage3">
                <h3>Datos Empresa</h3>
                <div class="form-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 0.8rem; max-height: 400px; overflow-y: auto;">
                    <div class="form-group">
                        <label for="companyName" style="font-size: 0.9rem;">Nombre de la Empresa</label>
                        <input type="text" id="companyName" class="dropdown-input" placeholder="Ingrese el nombre" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="taxNumber" style="font-size: 0.9rem;">Número de Identificación Fiscal (NIF)</label>
                        <input type="text" id="taxNumber" class="dropdown-input" placeholder="Ejemplo: A12345678" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="streetType" style="font-size: 0.9rem;">Tipo de Calle</label>
                        <div class="custom-dropdown">
                            <input type="text" id="streetType" class="dropdown-input" placeholder="Seleccione tipo" readonly style="font-size: 0.9rem;">
                            <div class="dropdown-content" id="streetTypeDropdown">
                                <div class="dropdown-option" data-value="Calle">Calle</div>
                                <div class="dropdown-option" data-value="Avenida">Avenida</div>
                                <div class="dropdown-option" data-value="Plaza">Plaza</div>
                                <div class="dropdown-option" data-value="Paseo">Paseo</div>
                                <div class="dropdown-option" data-value="Carretera">Carretera</div>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="streetName" style="font-size: 0.9rem;">Nombre de la Calle</label>
                        <input type="text" id="streetName" class="dropdown-input" placeholder="Ejemplo: Gran Vía" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="streetNumber" style="font-size: 0.9rem;">Número</label>
                        <input type="text" id="streetNumber" class="dropdown-input" placeholder="Ejemplo: 12" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="floor" style="font-size: 0.9rem;">Piso</label>
                        <input type="text" id="floor" class="dropdown-input" placeholder="Ejemplo: 3º" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="door" style="font-size: 0.9rem;">Puerta</label>
                        <input type="text" id="door" class="dropdown-input" placeholder="Ejemplo: A" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="postalCode" style="font-size: 0.9rem;">Código Postal</label>
                        <input type="text" id="postalCode" class="dropdown-input" placeholder="Ejemplo: 28001" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="city" style="font-size: 0.9rem;">Ciudad</label>
                        <input type="text" id="city" class="dropdown-input" placeholder="Ejemplo: Madrid" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="address" style="font-size: 0.9rem;">Dirección Completa</label>
                        <input type="text" id="address" class="dropdown-input" placeholder="Dirección completa" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="phone" style="font-size: 0.9rem;">Teléfono</label>
                        <input type="text" id="phone" class="dropdown-input" placeholder="Ejemplo: +34 912 345 678" style="font-size: 0.9rem;">
                    </div>
                    <div class="form-group">
                        <label for="companyEmail" style="font-size: 0.9rem;">Correo</label>
                        <input type="email" id="companyEmail" class="dropdown-input" placeholder="Ejemplo: contacto@empresa.com" style="font-size: 0.9rem;">
                    </div>
                </div>
                <button class="prev-btn">Anterior</button>
                <button class="save-btn">Guardar</button>
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