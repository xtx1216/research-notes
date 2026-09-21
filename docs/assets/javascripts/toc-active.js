(function () {
  function setupTocActive() {
    // Instant Navigation 切换页面后，先移除上一页的监听器。
    if (window.__xtxTocCleanup) {
      window.__xtxTocCleanup();
      window.__xtxTocCleanup = null;
    }

    const links = Array.from(
      document.querySelectorAll(
        '.md-sidebar--secondary .md-nav__link[href^="#"]'
      )
    );

    if (!links.length) return;

    const items = links
      .map((link) => {
        const href = link.getAttribute("href");
        if (!href || href === "#") return null;

        const id = decodeURIComponent(href.slice(1));
        const heading = document.getElementById(id);

        if (!heading) return null;

        return { link, heading };
      })
      .filter(Boolean);

    if (!items.length) return;

    let ticking = false;

    function getOffset() {
      const header = document.querySelector(".md-header");
      const headerHeight = header
        ? header.getBoundingClientRect().height
        : 0;

      // 标题进入 Header 下方约 20px 后，认为它是当前章节。
      return headerHeight + 20;
    }

    function updateActive() {
      ticking = false;

      const offset = getOffset();
      let current = items[0];

      for (const item of items) {
        const top = item.heading.getBoundingClientRect().top;

        if (top <= offset) {
          current = item;
        } else {
          break;
        }
      }

      for (const item of items) {
        item.link.classList.toggle("xtx-toc-active", item === current);
      }
    }

    function onScroll() {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(updateActive);
    }

    function onClick() {
      // 等浏览器完成 anchor 跳转后，再按正文位置重新判断。
      requestAnimationFrame(() => {
        requestAnimationFrame(updateActive);
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    links.forEach((link) => {
      link.addEventListener("click", onClick);
    });

    updateActive();

    window.__xtxTocCleanup = function () {
      window.removeEventListener("scroll", onScroll);

      links.forEach((link) => {
        link.removeEventListener("click", onClick);
      });
    };
  }

  // Material Instant Navigation 会在每次页面切换后触发 document$。
  if (typeof document$ !== "undefined") {
    document$.subscribe(setupTocActive);
  } else {
    document.addEventListener("DOMContentLoaded", setupTocActive);
  }
})();
