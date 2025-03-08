// common.js
document.addEventListener('DOMContentLoaded', function() {
    // 初始化下拉菜单为隐藏状态
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });

    // 下拉菜单切换功能
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

    // 点击菜单项跳转或切换内容
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
                    <p>这里是${section}的内容区域。</p>
                `;
            }
        });
    });

    // 点击顶部标题跳转到主页
    document.querySelector('.top-bar h1').addEventListener('click', function() {
        window.location.href = 'index.html';
    });

    // 点击“公司资料”按钮显示模态框
    const companyProfileBtn = document.querySelector('.company-profile-btn');
    const companyProfileModal = document.getElementById('companyProfileModal');
    const closeBtn = document.querySelector('#companyProfileModal .close-btn');
    const companyProfileForm = document.getElementById('companyProfileForm');

    if (companyProfileBtn && companyProfileModal && closeBtn) {
        companyProfileBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'none';
        });

        // 点击模态框外部关闭
        companyProfileModal.addEventListener('click', function(e) {
            if (e.target === companyProfileModal) {
                companyProfileModal.style.display = 'none';
            }
        });

        // 新增：加载保存的公司资料
        if (companyProfileForm) {
            // 从 localStorage 恢复数据
            const savedData = JSON.parse(localStorage.getItem('companyProfileData')) || {};
            for (const [key, value] of Object.entries(savedData)) {
                const input = companyProfileForm.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = value;
                }
            }

            // 保存公司资料到 localStorage 并关闭模态框
            companyProfileForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const companyData = {};
                formData.forEach((value, key) => {
                    companyData[key] = value;
                });
                // 保存到 localStorage
                localStorage.setItem('companyProfileData', JSON.stringify(companyData));
                console.log('保存的公司资料:', companyData); // 调试用，可移除
                companyProfileModal.style.display = 'none'; // 关闭模态框
            });
        }
    } else {
        console.error('公司资料按钮或模态框未找到');
    }
});