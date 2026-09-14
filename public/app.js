let menu = [];
let cart = [];


// GET TABLE FROM QR URL

const params = new URLSearchParams(
  window.location.search
);

let table = params.get("table");


// TOAST

function toast(message) {
  const element =
    document.getElementById("toast");

  element.textContent = message;

  element.style.display = "block";

  setTimeout(() => {
    element.style.display = "none";
  }, 2200);
}


// LOAD MENU

async function loadMenu() {

  const response =
    await fetch("/api/menu");

  menu = await response.json();


  // QR DETECTED

  if (table) {

    document.getElementById(
      "tableLabel"
    ).textContent = `Table ${table}`;

    document.getElementById(
      "tableStatus"
    ).textContent = "QR detected";

  } else {

    document.getElementById(
      "tableLabel"
    ).textContent = "Demo mode";

  }


  renderMenu();

  renderCart();
}


// RENDER MENU

// RENDER MENU

function renderMenu() {

  const menuElement =
    document.getElementById("menu");

  menuElement.innerHTML =
    menu.map(product => `

      <article class="food">

        <img
          class="food-image"
          src="${product.image}"
          alt="${product.name}"
        >

        <div class="food-content">

          <span class="category">
            ${product.category || "Food"}
          </span>

          <h3>
            ${product.name}
          </h3>

          <p>
            ${product.description}
          </p>

          <div class="food-bottom">

            <strong>
              ₹${product.price}
            </strong>

            <button
              onclick="addToCart(${product.id})"
            >
              Add
            </button>

          </div>

        </div>

      </article>

    `).join("");
}
// ADD TO CART

function addToCart(id) {

  const existing =
    cart.find(item => item.id === id);


  if (existing) {

    existing.quantity++;

  } else {

    cart.push({
      id,
      quantity: 1
    });

  }

  renderCart();

  toast("Added to order");
}


// CHANGE QUANTITY

function changeQuantity(id, amount) {

  const item =
    cart.find(item => item.id === id);

  if (!item) return;


  item.quantity += amount;


  if (item.quantity <= 0) {

    cart =
      cart.filter(item => item.id !== id);

  }


  renderCart();
}


// RENDER CART

function renderCart() {

  const cartElement =
    document.getElementById("cartItems");

  const totalElement =
    document.getElementById("total");

  const countElement =
    document.getElementById("cartCount");


  if (!cart.length) {

    cartElement.textContent =
      "Your cart is empty.";

    totalElement.textContent = "0";

    countElement.textContent =
      "0 items";

    return;
  }


  let total = 0;

  let count = 0;


  cartElement.innerHTML =
    cart.map(item => {

      const product =
        menu.find(
          product => product.id === item.id
        );

      const subtotal =
        product.price * item.quantity;


      total += subtotal;

      count += item.quantity;


      return `

        <div class="cart-row">

          <span>
            ${product.name}
            × ${item.quantity}
          </span>

          <span>

            ₹${subtotal}

            <span class="qty">

              <button
                onclick="changeQuantity(
                  ${item.id},
                  -1
                )"
              >
                −
              </button>

              <button
                onclick="changeQuantity(
                  ${item.id},
                  1
                )"
              >
                +
              </button>

            </span>

          </span>

        </div>

      `;

    }).join("");


  totalElement.textContent = total;

  countElement.textContent =
    `${count} item${count === 1 ? "" : "s"}`;
}


// PLACE ORDER

async function placeOrder() {

  if (!cart.length) {

    return toast(
      "Add food first"
    );

  }


  // If user didn't come through QR

  if (!table) {

    const enteredTable =
      prompt(
        "Enter table number for demo:"
      );

    if (!enteredTable) return;

    table = enteredTable;

    history.replaceState(
      null,
      "",
      `?table=${encodeURIComponent(table)}`
    );

  }


  const note =
    document.getElementById(
      "note"
    ).value;


  const response =
    await fetch("/api/orders", {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        table,
        items: cart,
        note
      })

    });


  const order =
    await response.json();


  if (!response.ok) {

    return toast(
      order.error ||
      "Order failed"
    );

  }


  toast(
    `Order #${order.id} sent to kitchen`
  );


  cart = [];

  document.getElementById(
    "note"
  ).value = "";


  renderCart();
}


// LOAD KITCHEN ORDERS

async function loadOrders() {

  const response =
    await fetch("/api/orders");

  const orders =
    await response.json();


  const ordersElement =
    document.getElementById("orders");


  if (!orders.length) {

    ordersElement.innerHTML =
      "<p>No orders yet.</p>";

    return;

  }


  ordersElement.innerHTML =
    orders.map(order => `

      <article class="order">

        <div class="order-head">

          <div>

            <strong>
              #${order.id}
            </strong>

            <div>
              Table ${order.table}
            </div>

          </div>

          <span class="status">
            ${order.status}
          </span>

        </div>


        <ul>

          ${order.items.map(item => `

            <li>
              ${item.name}
              × ${item.quantity}
              — ₹${item.price * item.quantity}
            </li>

          `).join("")}

        </ul>


        ${
          order.note
            ? `<p>
                <b>Note:</b>
                ${escapeHTML(order.note)}
               </p>`
            : ""
        }


        <div class="order-total">
          Total ₹${order.total}
        </div>


        <div class="status-buttons">

          ${[
            "NEW",
            "PREPARING",
            "READY",
            "SERVED",
            "CANCELLED"
          ].map(status => `

            <button
              onclick="
                updateOrderStatus(
                  ${order.id},
                  '${status}'
                )
              "
            >
              ${status}
            </button>

          `).join("")}

        </div>

      </article>

    `).join("");
}


// UPDATE STATUS

async function updateOrderStatus(
  id,
  status
) {

  await fetch(
    `/api/orders/${id}`,

    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json"
      },

      body: JSON.stringify({
        status
      })
    }
  );


  loadOrders();
}


// ESCAPE HTML

function escapeHTML(value) {

  return value.replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );

}


// CUSTOMER

function showCustomer() {

  document
    .getElementById("customer")
    .classList.remove("hidden");


  document
    .getElementById("dashboard")
    .classList.add("hidden");


  document
    .getElementById("qr")
    .classList.add("hidden");
}


// KITCHEN

function showDashboard() {

  document
    .getElementById("customer")
    .classList.add("hidden");


  document
    .getElementById("dashboard")
    .classList.remove("hidden");


  document
    .getElementById("qr")
    .classList.add("hidden");


  loadOrders();
}


// QR PAGE

function showQR() {

  document
    .getElementById("customer")
    .classList.add("hidden");


  document
    .getElementById("dashboard")
    .classList.add("hidden");


  document
    .getElementById("qr")
    .classList.remove("hidden");


  generateQRs();
}


// GENERATE QR CODES

function generateQRs() {

  const grid =
    document.getElementById(
      "qrGrid"
    );


  const baseURL =
    window.location.origin;


  grid.innerHTML =
    Array.from(
      { length: 12 },
      (_, index) => {

        const tableNumber =
          index + 1;


        const orderURL =
          `${baseURL}/?table=${tableNumber}`;


        const qrURL =
          `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(orderURL)}`;


        return `

          <article class="qr-card">

            <div class="pill">
              TABLE ${tableNumber}
            </div>

            <h2>
              Scan to order
            </h2>

            <img
              src="${qrURL}"
              alt="QR code for table ${tableNumber}"
            >

            <p>
              ${orderURL}
            </p>

          </article>

        `;

      }
    ).join("");
}


// INITIALIZE

loadMenu();


// REFRESH KITCHEN EVERY 3 SEC

setInterval(() => {

  const dashboard =
    document.getElementById(
      "dashboard"
    );


  if (
    !dashboard.classList.contains(
      "hidden"
    )
  ) {

    loadOrders();

  }

}, 3000);