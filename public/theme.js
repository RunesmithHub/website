try {
  var stored = localStorage.getItem("hub-theme");
  document.documentElement.dataset.theme =
    stored === "light" || stored === "dark" ? stored : matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}
