(function () {
  const $ = (sel) => document.querySelector(sel);

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

  const ERRORS = {
    not_configured: "Sign-in is not set up yet. Please check back soon.",
    denied: "Sign-in was cancelled.",
    state: "The sign-in session expired. Please try again.",
    token: "Discord could not verify the sign-in. Please try again.",
    not_member: "Your Discord account is not in the JNL Esports server.",
    no_role: "Your Discord account does not have the member role. Contact team leadership.",
    member_check: "Could not verify your server membership. Please try again.",
    server: "Something went wrong. Please try again.",
  };

  const notice = (title, text, action) =>
    el("div", { class: "notice-body" }, [
      el("strong", { text: title }),
      el("p", { text }),
      ...(action ? [action] : []),
    ]);

  function showGate(title, text, withButton) {
    const gate = $("#gate");
    const action = withButton ? el("a", { class: "btn", href: "/api/auth/login", text: "Sign in with Discord" }) : null;
    gate.replaceChildren(notice(title, text, action));
    gate.hidden = false;
    $("#members-content").hidden = true;
  }

  function empty(host, message) {
    host.replaceChildren(el("div", { class: "notice" }, [document.createTextNode(message)]));
  }

  function fmtDate(iso) {
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d) ? iso : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function render(data) {
    $("#member-name").textContent = data.name;

    const rows = (data.schedule || []).map((s) =>
      el("tr", {}, [el("td", { text: s.day }), el("td", { text: s.time }), el("td", { text: s.activity })])
    );
    const sched = $("#schedule");
    if (rows.length) {
      sched.replaceChildren(
        el("table", { class: "match-table" }, [
          el("thead", {}, [el("tr", {}, ["Day", "Time", "Activity"].map((t) => el("th", { text: t })))]),
          el("tbody", {}, rows),
        ])
      );
    } else empty(sched, "No schedule has been posted.");

    const ann = $("#m-announce");
    if ((data.announcements || []).length) {
      ann.replaceChildren(
        ...data.announcements.map((a) =>
          el("article", { class: "announce" }, [
            el("time", { datetime: a.date, text: fmtDate(a.date) }),
            el("div", {}, [el("h3", { text: a.title }), el("p", { text: a.body })]),
          ])
        )
      );
    } else empty(ann, "No member announcements.");

    const res = $("#m-resources");
    if ((data.resources || []).length) {
      res.replaceChildren(
        ...data.resources.map((r) =>
          el("a", { class: "resource", href: r.href, rel: "noopener" }, [
            el("strong", { text: r.title }),
            el("span", { text: r.description }),
          ])
        )
      );
    } else empty(res, "No resources have been added.");

    $("#gate").hidden = true;
    $("#members-content").hidden = false;
  }

  async function init() {
    if (!window.JL.features.members) {
      showGate("Coming soon", "The members area will include practice schedules, team announcements and private resources. Check back soon.", false);
      return;
    }
    const err = new URLSearchParams(location.search).get("error");
    if (err) {
      history.replaceState(null, "", location.pathname);
      showGate("Unable to sign in", ERRORS[err] || ERRORS.server, err !== "not_configured");
      return;
    }
    try {
      const res = await fetch("/api/members", { credentials: "same-origin" });
      if (res.status === 401) return showGate("Members only", "Sign in with your Discord account to view the team schedule and private resources.", true);
      if (!res.ok) return showGate("Unavailable", ERRORS.not_configured, false);
      render(await res.json());
    } catch (e) {
      showGate("Unavailable", "Could not load the members area. Please try again.", false);
    }
  }

  $("#signout").addEventListener("click", async () => {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) { /* ignore */ }
    location.reload();
  });

  init();
})();
