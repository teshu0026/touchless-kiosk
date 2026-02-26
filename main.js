import { initKiosk } from "./kiosk-logic.js";

function handleTrigger(el) {
  if (el.classList.contains("active-click")) return;

  el.classList.add("active-click");
  setTimeout(() => el.classList.remove("active-click"), 200);

  const title = el.querySelector("h3").innerText;

  if (el.id === "card-menu") {
    window.showNotification(`Opening ${title}...`);
    window.location.href = 'menu.html';
  } else if (el.id === "card-order") {
    window.showNotification("You have not ordered anything yet");
  } else {
    window.showNotification(`Opened ${title}`);
  }
}

// Kickoff
initKiosk({
  onTrigger: handleTrigger
});
