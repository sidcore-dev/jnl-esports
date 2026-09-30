// Shared behavior for every page: theme toggle, mobile nav, footer year.
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  function setupTheme() {
    const root = document.documentElement;
    const btn = $(".theme-toggle");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!btn) return;
    const apply = (theme) => {
      root.setAttribute("data-theme", theme);
      btn.setAttribute("aria-label", theme === "dark" ? "Switch to light theme" : "Switch to dark theme");
      if (meta) meta.setAttribute("content", theme === "dark" ? "#0b0d10" : "#ffffff");
    };
    apply(root.getAttribute("data-theme") === "light" ? "light" : "dark");
    btn.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      apply(next);
      try { localStorage.setItem("jl-theme", next); } catch (e) { /* storage unavailable */ }
    });
  }

  function setupNav() {
    const toggle = $(".nav-toggle");
    const links = $(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
  setupTheme();
  setupNav();
})();
