const menuIcone = document.getElementById("menu-icone");
const navMenu = document.getElementById("nav-menu");
const linksMenu = document.querySelectorAll(".nav-section");

menuIcone.addEventListener("click", () => {
  navMenu.classList.toggle("active");
  menuIcone.classList.toggle("open");

  const menuEstaAberto = navMenu.classList.contains("active");
  menuIcone.setAttribute("aria-expanded", menuEstaAberto);
});

linksMenu.forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
    menuIcone.classList.remove("open");
    menuIcone.setAttribute("aria-expanded", "false");
  });
});
