// index.js
// 初始化下拉菜单为隐藏状态
document.querySelectorAll('.dropdown-menu').forEach(menu => {
  menu.style.display = 'none';
});

// 下拉菜单切换功能 - 绑定所有下拉菜单
document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
  toggle.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    const dropdownMenu = this.nextElementSibling;
    const sidebar = document.querySelector('.sidebar');
    const isOpen = dropdownMenu.style.display === 'block';

    // 关闭所有其他下拉菜单
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
      if (menu !== dropdownMenu) {
        menu.style.display = 'none';
      }
    });

    // 切换当前下拉菜单的显示状态
    dropdownMenu.style.display = isOpen ? 'none' : 'block';

    // 如果是展开状态，调整 sidebar 的滚动位置
    if (!isOpen) {
      // 计算 toggle 元素相对于 sidebar 的位置
      const togglePosition = toggle.getBoundingClientRect().top;
      const sidebarPosition = sidebar.getBoundingClientRect().top;
      const offset = togglePosition - sidebarPosition;

      // 将 sidebar 滚动到 toggle 的位置
      sidebar.scrollTo({
        top: offset,
        behavior: 'smooth' // 平滑滚动，可改为 'auto' 以立即滚动
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