(function () {
  let cleanup = null;

  function setupTocActive() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }

    // 等 Material 完成当前页面 DOM 更新
    requestAnimationFrame(() => {
      const links = Array.from(
        document.querySelectorAll(
          ".md-sidebar--secondary .md-nav__link"
        )
      );

      const items = links
        .map((link) => {
          let url;

          try {
            url = new URL(link.href, window.location.href);
          } catch {
            return null;
          }

          // 只处理当前页面的锚点
          if (!url.hash) return null;

          const id = decodeURIComponent(
            url.hash.substring(1)
          );

          const heading = document.getElementById(id);

          if (!heading) return null;

          return {
            link,
            heading,
            id
          };
        })
        .filter(Boolean);

      if (!items.length) return;

      let ticking = false;

      function getHeaderOffset() {
        const header =
          document.querySelector(".md-header");

        const height = header
          ? header.getBoundingClientRect().height
          : 0;

        return height + 24;
      }

      function setActive(current) {
        items.forEach((item) => {
          item.link.classList.toggle(
            "xtx-toc-active",
            item === current
          );
        });
      }

      function updateFromScroll() {
        ticking = false;

        const offset =
          window.scrollY + getHeaderOffset();

        let current = items[0];

        for (const item of items) {
          const top =
            item.heading.getBoundingClientRect().top +
            window.scrollY;

          if (top <= offset) {
            current = item;
          } else {
            break;
          }
        }

        /*
         * 到页面底部时，强制选最后一个章节。
         * 否则最后一个标题可能永远到不了判定线。
         */
        const nearBottom =
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 4;

        if (nearBottom) {
          current = items[items.length - 1];
        }

        setActive(current);
      }

      function onScroll() {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(updateFromScroll);
      }

      function onClick(event) {
        const clicked = items.find(
          (item) => item.link === event.currentTarget
        );

        if (clicked) {
          // 点击后立即高亮，不等待 scroll spy
          setActive(clicked);
        }

        // 浏览器完成锚点滚动后重新校准
        requestAnimationFrame(() => {
          requestAnimationFrame(updateFromScroll);
        });
      }

      items.forEach((item) => {
        item.link.addEventListener(
          "click",
          onClick
        );
      });

      window.addEventListener(
        "scroll",
        onScroll,
        { passive: true }
      );

      updateFromScroll();

      cleanup = function () {
        window.removeEventListener(
          "scroll",
          onScroll
        );

        items.forEach((item) => {
          item.link.removeEventListener(
            "click",
            onClick
          );
        });
      };
    });
  }

  /*
   * navigation.instant 开启时，
   * Material 每次页面切换都会触发 document$
   */
  if (typeof document$ !== "undefined") {
    document$.subscribe(setupTocActive);
  } else {
    document.addEventListener(
      "DOMContentLoaded",
      setupTocActive
    );
  }
})();