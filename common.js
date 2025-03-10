document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

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

            if (!isOpen && sidebar) {
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
                if (content) {
                    content.innerHTML = `
                        <h2>${section}</h2>
                        <p>这里是${section}的内容区域。</p>
                    `;
                }
            }
        });
    });

    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    const companyProfileBtn = document.querySelector('.company-profile-btn');
    const companyProfileModal = document.getElementById('companyProfileModal');
    const closeBtn = document.querySelector('#companyProfileModal .close-btn');
    const companyProfileForm = document.getElementById('companyProfileForm');

    if (companyProfileBtn && companyProfileModal && closeBtn) {
        companyProfileBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'flex';
            loadCompanyProfile();
        });

        closeBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'none';
        });

        companyProfileModal.addEventListener('click', function(e) {
            if (e.target === companyProfileModal) {
                companyProfileModal.style.display = 'none';
            }
        });
    }

    if (companyProfileForm) {
        companyProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = auth.currentUser;
            if (!user) {
                alert('请先登录！');
                return;
            }

            const companyData = {
                companyName: document.getElementById('companyName').value,
                taxNumber: document.getElementById('taxNumber').value,
                companyAddress: document.getElementById('companyAddress').value,
                city: document.getElementById('city').value,
                province: document.getElementById('province').value,
                country: document.getElementById('country').value,
                postalCode: document.getElementById('postalCode').value,
                companyPhone: document.getElementById('companyPhone').value,
                companyEmail: document.getElementById('companyEmail').value,
                updatedAt: new Date()
            };

            db.collection('users').doc(user.uid).collection('companyProfile').doc('profile')
                .set(companyData, { merge: true })
                .then(() => {
                    alert('公司资料保存成功！');
                    companyProfileModal.style.display = 'none';
                })
                .catch((error) => {
                    alert('保存失败：' + error.message);
                });
        });
    }

    function loadCompanyProfile() {
        const user = auth.currentUser;
        if (user) {
            // 优化：添加加载中提示
            const modalContent = document.querySelector('#companyProfileModal .modal-content');
            const originalContent = modalContent.innerHTML;
            modalContent.innerHTML = '<h3>加载中...</h3>';

            db.collection('users').doc(user.uid).collection('companyProfile').doc('profile').get()
                .then((doc) => {
                    modalContent.innerHTML = originalContent; // 恢复原始内容
                    if (doc.exists) {
                        const data = doc.data();
                        document.getElementById('companyName').value = data.companyName || '';
                        document.getElementById('taxNumber').value = data.taxNumber || '';
                        document.getElementById('companyAddress').value = data.companyAddress || '';
                        document.getElementById('city').value = data.city || '';
                        document.getElementById('province').value = data.province || '';
                        document.getElementById('country').value = data.country || '';
                        document.getElementById('postalCode').value = data.postalCode || '';
                        document.getElementById('companyPhone').value = data.companyPhone || '';
                        document.getElementById('companyEmail').value = data.companyEmail || '';
                    }
                })
                .catch((error) => {
                    console.error('加载公司资料失败：', error);
                    modalContent.innerHTML = originalContent; // 恢复原始内容
                    alert('加载公司资料失败：' + error.message); // 优化：用户提示
                });
        }
    }
});