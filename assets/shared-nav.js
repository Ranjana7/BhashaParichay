(function initSharedNavigation() {
  function normalizePath(pathname) {
    return String(pathname || "/").replace(/\/+/g, "/");
  }

  function legacyRedirectTarget(pathname, search, hash) {
    const path = normalizePath(pathname);
    const map = {
      "/sanskrit-home.html": "/sanskritparichay/",
      "/alphabet-forest.html": "/sanskritparichay/alphabet-forest.html",
      "/learning-world.html": "/sanskritparichay/learning-world.html",
      "/explore-worlds.html": "/sanskritparichay/explore-worlds.html",
      "/my-progress.html": "/sanskritparichay/my-progress.html",
      "/spanish-home.html": "/spanishparichay/",
      "/portuguese-home.html": "/portugueseparichay/"
    };
    const targetPath = map[path];
    if (!targetPath) return "";
    return targetPath + (search || "") + (hash || "");
  }

  function maybeRedirectLegacyRoute() {
    const target = legacyRedirectTarget(window.location.pathname, window.location.search, window.location.hash);
    if (!target) return false;
    window.location.replace(target);
    return true;
  }

  if (maybeRedirectLegacyRoute()) return;

  const nav = document.querySelector(".main-nav");
  if (!nav) return;

  function getPageContext() {
    const path = normalizePath(window.location.pathname);
    const isRootHome = path === "/" || /\/index\.html$/i.test(path) && !/\/(sanskritparichay|spanishparichay|portugueseparichay)\//i.test(path);
    const isRootAbout = /\/about\.html$/i.test(path) && !/\/sanskritparichay\//i.test(path);

    const languageMatch = path.match(/\/(sanskritparichay|spanishparichay|portugueseparichay)(?:\/|$)/i);
    const languagePath = languageMatch ? languageMatch[1].toLowerCase() : "";
    const isLanguageHome = Boolean(languagePath) && (path.endsWith("/" + languagePath + "/") || path.endsWith("/" + languagePath + "/index.html"));
    const isLanguageWorld = Boolean(languagePath) && !isLanguageHome && !path.endsWith("/about.html");
    return {
      path: path,
      languagePath: languagePath,
      isRootHome: isRootHome,
      isRootAbout: isRootAbout,
      isLanguageHome: isLanguageHome,
      isLanguageWorld: isLanguageWorld
    };
  }

  function worldTitleFromPath(context) {
    if (!context.isLanguageWorld) return "";
    if (context.languagePath === "sanskritparichay") {
      const marked = document.querySelector("[data-current-world]");
      if (marked && marked.textContent.trim()) return marked.textContent.trim();
      const params = new URLSearchParams(window.location.search);
      const key = params.get("world") || "alphabet";
      const map = {
        alphabet: "Alphabet Forest",
        animals: "Animal Jungle",
        numbers: "Number Galaxy",
        colours: "Colour Kingdom",
        words: "Word Wonderland",
        sentences: "Sentence Castle",
        stories: "Story Island",
        culture: "Sanskrit and Culture"
      };
      return map[key] || "Learning World";
    }
    const params = new URLSearchParams(window.location.search);
    const worldKey = params.get("world");
    const all = window.BHASHA_LANGUAGES || {};
    const languageKey = context.languagePath === "spanishparichay" ? "spanish" : "portuguese";
    const language = all[languageKey];
    if (language && Array.isArray(language.worlds)) {
      const world = language.worlds.find(function (entry) { return entry.key === worldKey; }) || language.worlds[0];
      if (world && world.title) return world.title;
    }
    return "Learning World";
  }

  function createLink(href, text, current) {
    const link = document.createElement("a");
    link.href = href;
    link.textContent = text;
    link.setAttribute("data-seamless-nav", "");
    if (current) link.setAttribute("aria-current", "page");
    return link;
  }

  const context = getPageContext();
  const rootPathPrefix = context.languagePath ? "../" : "";
  const bhashaHomeHref = rootPathPrefix + "index.html";
  const aboutHref = rootPathPrefix + "about.html";
  const languageHomeHref = "index.html";

  nav.innerHTML = "";

  if (context.isRootHome || context.isRootAbout) {
    nav.appendChild(createLink("index.html", "Bhasha Home", context.isRootHome));
    nav.appendChild(createLink("about.html", "About", context.isRootAbout));
    return;
  }

  if (context.languagePath) {
    nav.appendChild(createLink(bhashaHomeHref, "Bhasha Home", false));
    nav.appendChild(createLink(languageHomeHref, "Home", context.isLanguageHome));
    nav.appendChild(createLink(aboutHref, "About", /\/about\.html$/i.test(context.path) && context.languagePath !== ""));
    if (context.isLanguageWorld) {
      const worldTitle = worldTitleFromPath(context);
      const worldLink = createLink(window.location.pathname.split("/").pop() + window.location.search + window.location.hash, worldTitle, true);
      worldLink.setAttribute("data-current-world", "");
      nav.appendChild(worldLink);
    }
  }
})();
