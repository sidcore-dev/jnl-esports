(function () {
  const { org, games, teams, matches, announcements, staff, resources } = window.JL;
  const $ = (sel, root = document) => root.querySelector(sel);

  // The form posts to the Vercel API. On other hosts (cPanel) use it cross-origin.
  const onVercel = /(^|\.)vercel\.app$/.test(location.hostname) || location.hostname === "localhost";
  const API_BASE = onVercel ? "" : "https://jl-esports.vercel.app";

  // Build DOM with textContent so data can never inject markup.
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    Object.entries(props).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    });
    children.forEach((c) => node.append(c));
    return node;
  }

  const notice = (title, text) =>
    el("div", { class: "notice" }, [el("strong", { text: title }), document.createTextNode(text)]);
  const row = (cells, cellTag = "td") => el("tr", {}, cells.map((c) => (c instanceof Node ? c : el(cellTag, { text: c }))));
  const activeGames = games.filter((g) => g.status === "active");
  let selected = activeGames[0] ? activeGames[0].id : null;

  function fmtDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function renderTabs() {
    const host = $("#game-tabs");
    if (!host) return;
    host.replaceChildren(
      ...games.map((g) => {
        const active = g.status === "active";
        const tab = el("button", {
          class: "tab",
          role: "tab",
          type: "button",
          "aria-selected": String(g.id === selected),
          "aria-disabled": String(!active),
        }, [el("span", { text: g.short })]);
        if (!active) tab.firstChild.append(el("i", { class: "tag", text: "Soon" }));
        tab.addEventListener("click", () => {
          if (!active) return;
          selected = g.id;
          renderTabs();
          renderRoster();
        });
        return tab;
      })
    );
  }

  function playerRow(p, i) {
    const tbd = p.handle === "Soon";
    return el("tr", {}, [
      el("td", { text: String(i + 1).padStart(2, "0") }),
      tbd ? el("td", { class: "tbd" }, [el("span", { class: "soon-chip", text: "Soon" })]) : el("td", { class: "handle", text: p.handle }),
      el("td", { text: p.role }),
      el("td", { class: "designation", text: p.designation || "" }),
    ]);
  }

  function renderRoster() {
    const panel = $("#roster-panel");
    if (!panel) return;
    const team = teams[selected];
    const game = games.find((g) => g.id === selected);
    if (!team) return panel.replaceChildren(notice("Soon", "Roster details will be published here."));
    const head = el("div", { class: "team-head" }, [
      el("h2", { text: team.name }),
      el("span", { class: "team-meta", text: `${game.name} / ${team.region}` }),
    ]);
    const table = el("table", { class: "roster" }, [
      el("thead", {}, [row(["#", "Player", "Role", "Designation"], "th")]),
      el("tbody", {}, team.players.map(playerRow)),
    ]);
    panel.replaceChildren(head, table);
  }

  function renderMatches() {
    const host = $("#match-list");
    if (!host) return;
    if (!matches.length) return host.replaceChildren(notice("Soon", "Fixtures and results will be published here."));
    const body = matches.map((m) => row([m.date, `JNL vs ${m.opponent}`, m.event, el("td", { class: `result ${m.result}`, text: m.result })]));
    host.replaceChildren(
      el("table", { class: "match-table" }, [el("thead", {}, [row(["Date", "Match", "Event", "Result"], "th")]), el("tbody", {}, body)])
    );
  }

  const announceItem = (a) =>
    el("article", { class: "announce" }, [
      el("time", { datetime: a.date, text: fmtDate(a.date) }),
      el("div", {}, [el("h3", { text: a.title }), el("p", { text: a.body })]),
    ]);

  function renderAnnouncements() {
    const host = $("#announce-list");
    if (host) {
      host.replaceChildren(...(announcements.length ? announcements.map(announceItem) : [notice("No announcements", "Team news will be posted here.")]));
    }
    const latest = $("#latest-news");
    if (latest) {
      latest.replaceChildren(...(announcements.length ? [announceItem(announcements[0])] : [notice("No announcements", "Team news will be posted here.")]));
    }
  }

  function renderStaff() {
    const host = $("#staff-list");
    if (!host) return;
    host.replaceChildren(
      ...staff.map((s) => el("li", {}, [el("strong", { text: s.name }), el("span", { text: s.role }), el("span", { class: "muted", text: s.contact || "" })]))
    );
  }

  function renderResources() {
    const host = $("#resource-list");
    if (!host) return;
    host.replaceChildren(
      ...resources.map((r) => {
        const live = Boolean(r.href);
        return el(live ? "a" : "div", live ? { class: "resource", href: r.href, rel: "noopener" } : { class: "resource off" }, [
          el("strong", { text: r.title }),
          live ? el("span", { text: r.description }) : el("span", {}, [document.createTextNode(`${r.description} `), el("span", { class: "soon-chip", text: "Soon" })]),
        ]);
      })
    );
  }

  function renderStatic() {
    const tag = $('[data-bind="tagline"]');
    if (tag) tag.textContent = org.tagline;
    const lead = teams[activeGames[0] && activeGames[0].id];
    const region = $('[data-bind="region"]');
    const size = $('[data-bind="rosterSize"]');
    if (lead && region) region.textContent = lead.region === "North America" ? "NA" : lead.region;
    if (lead && size) size.textContent = String(lead.players.length);
    const socials = $("#socials");
    if (socials) {
      socials.replaceChildren(
        ...org.socials.map((s) =>
          s.href
            ? el("a", { href: s.href, rel: "noopener", text: s.label })
            : el("span", { class: "off" }, [document.createTextNode(`${s.label} `), el("span", { class: "soon-chip", text: "Soon" })])
        )
      );
    }
    const gameSelect = $("#join-game");
    if (gameSelect) gameSelect.replaceChildren(...activeGames.map((g) => el("option", { value: g.id, text: g.name })));
  }

  // Posts the application to /api/apply, which forwards it to Discord.
  function setupForm() {
    const form = $("#join-form");
    if (!form) return;
    const note = $("#form-note");
    const submit = $("button[type=submit]", form);
    const REQUIRED = ["handle", "discord", "age", "timezone", "platform", "role", "rank", "experience", "availability", "motivation"];

    const show = (message, isError) => {
      note.className = isError ? "form-note error" : "form-note";
      note.textContent = message;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const missing = REQUIRED.filter((n) => !String(data[n] || "").trim());
      const age = Number(data.age);
      const badAge = !missing.includes("age") && (!Number.isInteger(age) || age < 16 || age > 99);
      [...REQUIRED, "tracker"].forEach((n) => form.elements[n].classList.remove("invalid"));
      missing.forEach((n) => form.elements[n].classList.add("invalid"));
      if (badAge) form.elements.age.classList.add("invalid");

      if (missing.length) return show("Please complete all required fields.", true);
      if (badAge) return show("Applicants must be 16 years of age or older.", true);
      if (data.tracker && !/^https?:\/\//i.test(data.tracker.trim())) {
        form.elements.tracker.classList.add("invalid");
        return show("The profile link must start with http:// or https://.", true);
      }
      if (!data.confirm) return show("Please confirm your age and the accuracy of your information.", true);

      submit.disabled = true;
      show("Submitting...", false);
      try {
        const res = await fetch(`${API_BASE}/api/apply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.ok) throw new Error(result.error || "Something went wrong. Please try again.");
        form.reset();
        show("Application received. We will contact you on Discord.", false);
      } catch (error) {
        show(error.message, true);
      } finally {
        submit.disabled = false;
      }
    });
  }

  renderStatic();
  renderTabs();
  renderRoster();
  renderMatches();
  renderAnnouncements();
  renderStaff();
  renderResources();
  setupForm();
})();
