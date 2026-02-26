import { initKiosk } from "./kiosk-logic.js";
import { CartLogic } from "./cart-logic.js";

const updateOrdersUI = () => {
  const ordersList = document.getElementById('orders-list');
  if (!ordersList) return;

  const orders = CartLogic.getOrders();
  if (orders.length === 0) {
    ordersList.innerHTML = '<div class="empty-state">No orders yet. Start by exploring the menu!</div>';
    return;
  }

  ordersList.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-meta">
        <span>ID: ${order.id}</span>
        <span>${order.date}</span>
      </div>
      <div class="order-status">${order.status}</div>
      <div style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
        ${order.items.map(item => `<div style="font-size: 0.9rem; margin: 0.2rem 0;">${item.icon} ${item.name}</div>`).join('')}
      </div>
      <div style="text-align: right; font-weight: 700; color: var(--accent); margin-top: 0.5rem;">
        Total: $${order.total}
      </div>
    </div>
  `).join('');
};

function handleTrigger(el) {
  if (!el) return;
  if (el.classList.contains("active-click")) return;

  el.classList.add("active-click");
  setTimeout(() => el.classList.remove("active-click"), 200);

  const titleEl = el.querySelector("h3");
  const title = titleEl ? titleEl.innerText : "";

  if (el.id === "card-menu") {
    window.showNotification(`Opening ${title}...`);
    window.location.href = 'menu.html';
  } else if (el.id === "card-order") {
    const modal = document.getElementById('orders-modal');
    if (modal) modal.classList.add('active');
    updateOrdersUI();
    window.showNotification("Opening Order History");
  } else if (el.id === "btn-close-orders") {
    const modal = document.getElementById('orders-modal');
    if (modal) modal.classList.remove('active');
  } else if (el.id === "btn-clear-orders") {
    localStorage.removeItem('kiosk_orders');
    updateOrdersUI();
    window.showNotification("History Cleared");
  } else {
    window.showNotification(`Opened ${title}`);
  }
}

// Initial UI sync
try {
  updateOrdersUI();
} catch (e) {
  console.error("Failed to update orders UI", e);
}

// Kickoff
initKiosk({
  onTrigger: handleTrigger
});
