// mobile menu
//from DOM
const burgerIcon = document.querySelector("#burger");
const navbarMenu = document.querySelector("#nav-links");

burgerIcon.addEventListener("click", () => {
  navbarMenu.classList.toggle("is-active");
});
