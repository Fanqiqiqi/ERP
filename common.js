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

    // 模态框相关逻辑
    const companyProfileBtn = document.querySelector('.company-profile-btn');
    const companyProfileModal = document.getElementById('companyProfileModal');
    const closeBtn = document.querySelector('#companyProfileModal .close-btn');
    const companyProfileForm = document.getElementById('companyProfileForm');
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const loginCloseBtn = document.querySelector('#loginModal .close-btn');
    const registerCloseBtn = document.querySelector('#registerModal .close-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // 显示/隐藏模态框
    if (companyProfileBtn && companyProfileModal && closeBtn) {
        companyProfileBtn.addEventListener('click', function() {
            companyProfileModal.style.display = 'flex';
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

    if (registerBtn && registerModal && registerCloseBtn) {
        registerBtn.addEventListener('click', function() {
            registerModal.style.display = 'flex';
        });

        registerCloseBtn.addEventListener('click', function() {
            registerModal.style.display = 'none';
        });

        registerModal.addEventListener('click', function(e) {
            if (e.target === registerModal) {
                registerModal.style.display = 'none';
            }
        });
    }

    if (loginBtn && loginModal && loginCloseBtn) {
        loginBtn.addEventListener('click', function() {
            loginModal.style.display = 'flex';
        });

        loginCloseBtn.addEventListener('click', function() {
            loginModal.style.display = 'none';
        });

        loginModal.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                loginModal.style.display = 'none';
            }
        });
    }

    // Firebase 注册逻辑
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('registerEmail').value;
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // 保存用户名到 Firestore
                    return db.collection('users').doc(userCredential.user.uid).set({
                        username: username,
                        email: email,
                        createdAt: new Date()
                    });
                })
                .then(() => {
                    alert('注册成功！');
                    registerModal.style.display = 'none';
                    // 自动登录
                    return auth.signInWithEmailAndPassword(email, password);
                })
                .then(() => {
                    window.location.reload(); // 刷新页面以更新状态
                })
                .catch((error) => {
                    alert('注册失败：' + error.message);
                });
        });
    }

    // Firebase 登录逻辑
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const identifier = document.getElementById('loginIdentifier').value;
            const password = document.getElementById('loginPassword').value;

            // 假设 identifier 可以是邮箱或用户名，但目前只支持邮箱
            auth.signInWithEmailAndPassword(identifier, password)
                .then((userCredential) => {
                    alert('登录成功！');
                    loginModal.style.display = 'none';
                    window.location.reload(); // 刷新页面以更新状态
                })
                .catch((error) => {
                    alert('登录失败：' + error.message);
                });
        });
    }

    // Firebase 保存公司资料
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

    // 监听用户登录状态
    auth.onAuthStateChanged((user) => {
        if (user) {
            // 用户已登录，加载公司资料
            db.collection('users').doc(user.uid).collection('companyProfile').doc('profile').get()
                .then((doc) => {
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
                });
        }
    });
});