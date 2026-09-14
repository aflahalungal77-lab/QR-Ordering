let menu = [];
let cart = [];


// ======================================
// URL
// ======================================

const params =
  new URLSearchParams(
    window.location.search
  );

let table =
  params.get("table");


// ======================================
// TOAST
// ======================================

function toast(message) {

  const element =
    document.getElementById("toast");

  element.textContent =
    message;

  element.style.display =
    "block";

  setTimeout(() => {

    element.style.display =
      "none";

  }, 2200);
}


// ======================================
// LOAD MENU
// ======================================

async function loadMenu() {

  try {

    const response =
      await fetch("/api/menu");

    if (!response.ok) {
      throw new Error("Failed to load menu");
    }

    menu =
      await response.json();


    // TABLE

    if (table) {

      document.getElementById(
        "tableLabel"
      ).textContent =
        `Table ${table}`;

      document.getElementById(
        "headerTable"
      ).textContent =
        `Table ${table}`;

      document.getElementById(
        "tableStatus"
      ).textContent =
        "QR detected";

    } else {

      document.getElementById(
        "tableLabel"
      ).textContent =
        "Demo mode";

      document.getElementById(
        "headerTable"
      ).textContent =
        "Demo mode";
    }


    renderMenu();

    renderCart();

  } catch (error) {

    console.error(
      "Menu error:",
      error
    );

    toast(
      "Failed to load menu"
    );
  }
}


// ======================================
// RENDER MENU
// ======================================

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


// ======================================
// ADD TO CART
// ======================================

function addToCart(id) {

  const existing =
    cart.find(
      item => item.id === id
    );


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


// ======================================
// CHANGE QUANTITY
// ======================================

function changeQuantity(
  id,
  amount
) {

  const item =
    cart.find(
      item => item.id === id
    );

  if (!item) return;


  item.quantity += amount;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        item => item.id !== id
      );

  }


  renderCart();
}


// ======================================
// RENDER CART
// ======================================

function renderCart() {

  const cartElement =
    document.getElementById(
      "cartItems"
    );

  const totalElement =
    document.getElementById(
      "total"
    );

  const countElement =
    document.getElementById(
      "floatingCartCount"
    );


  if (!cart.length) {

    cartElement.textContent =
      "Your cart is empty.";

    totalElement.textContent =
      "0";

    countElement.textContent =
      "0";

    return;
  }


  let total = 0;

  let count = 0;


  cartElement.innerHTML =
    cart.map(item => {

      const product =
        menu.find(
          product =>
            product.id === item.id
        );


      if (!product) return "";


      const subtotal =
        product.price *
        item.quantity;


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


  totalElement.textContent =
    total;

  countElement.textContent =
    count;
}


// ======================================
// OPEN CART
// ======================================

function openCart() {

  document
    .getElementById("cartOverlay")
    .classList.add("open");

  document.body.style.overflow =
    "hidden";
}


// ======================================
// CLOSE CART
// ======================================

function closeCart() {

  document
    .getElementById("cartOverlay")
    .classList.remove("open");

  document.body.style.overflow =
    "";
}


// ======================================
// CLOSE OVERLAY
// ======================================

function closeCartOnOverlay(event) {

  if (
    event.target.id ===
    "cartOverlay"
  ) {

    closeCart();

  }
}


// ======================================
// PLACE ORDER
// ======================================

async function placeOrder() {

  if (!cart.length) {

    return toast(
      "Add food first"
    );

  }


  // Demo mode without QR

  if (!table) {

    const enteredTable =
      prompt(
        "Enter table number for demo:"
      );

    if (!enteredTable) {
      return;
    }

    table =
      enteredTable.trim();


    history.replaceState(
      null,
      "",
      `?table=${encodeURIComponent(
        table
      )}`
    );


    document.getElementById(
      "tableLabel"
    ).textContent =
      `Table ${table}`;


    document.getElementById(
      "headerTable"
    ).textContent =
      `Table ${table}`;


    document.getElementById(
      "tableStatus"
    ).textContent =
      "Table selected";
  }


  const note =
    document.getElementById(
      "note"
    ).value;


  try {

    const response =
      await fetch(
        "/api/orders",
        {
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
        }
      );


    const order =
      await response.json();


    if (!response.ok) {

      return toast(
        order.error ||
        "Order failed"
      );

    }


    // SUCCESS

    closeCart();


    document.getElementById(
      "successOrderId"
    ).textContent =
      `#${order.id}`;


    document
      .getElementById(
        "successOverlay"
      )
      .classList.add("open");


    cart = [];


    document.getElementById(
      "note"
    ).value = "";


    renderCart();

  } catch (error) {

    console.error(
      "Order error:",
      error
    );

    toast(
      "Unable to send order"
    );
  }
}


// ======================================
// CLOSE SUCCESS
// ======================================

function closeSuccess() {

  document
    .getElementById(
      "successOverlay"
    )
    .classList.remove("open");
}


// ======================================
// ADMIN ROUTING
// ======================================

function isAdminPage() {

  return (
    window.location.pathname ===
    "/admin"
  );

}


// ======================================
// SHOW ADMIN
// ======================================

function showAdmin() {

  document
    .getElementById("customer")
    .classList.add("hidden");


  document
    .getElementById("admin")
    .classList.remove("hidden");


  document
    .getElementById("cartButton")
    .classList.add("hidden");


  if (
    !window.location.pathname.includes(
      "/admin"
    )
  ) {

    history.replaceState(
      null,
      "",
      "/admin"
    );

  }


  showAdminKitchen();
}


// ======================================
// ADMIN KITCHEN
// ======================================

function showAdminKitchen() {

  document
    .getElementById("adminKitchen")
    .classList.remove("hidden");


  document
    .getElementById("adminQR")
    .classList.add("hidden");


  loadOrders();
}


// ======================================
// ADMIN QR
// ======================================

function showAdminQR() {

  document
    .getElementById("adminKitchen")
    .classList.add("hidden");


  document
    .getElementById("adminQR")
    .classList.remove("hidden");


  generateQRs();
}


// ======================================
// LOAD ORDERS
// ======================================

async function loadOrders() {

  try {

    const response =
      await fetch(
        "/api/orders"
      );


    if (!response.ok) {
      throw new Error(
        "Failed to load orders"
      );
    }


    const orders =
      await response.json();


    const ordersElement =
      document.getElementById(
        "orders"
      );


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
                  ${escapeHTML(
                    order.note
                  )}
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

  } catch (error) {

    console.error(
      "Orders error:",
      error
    );

    document.getElementById(
      "orders"
    ).innerHTML =
      "<p>Failed to load orders.</p>";
  }
}


// ======================================
// UPDATE STATUS
// ======================================

async function updateOrderStatus(
  id,
  status
) {

  try {

    const response =
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


    if (!response.ok) {

      const data =
        await response.json();

      return toast(
        data.error ||
        "Failed to update order"
      );
    }


    loadOrders();

  } catch (error) {

    console.error(
      "Status error:",
      error
    );

    toast(
      "Failed to update status"
    );
  }
}


// ======================================
// ESCAPE HTML
// ======================================

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


// ======================================
// GENERATE QR
// ======================================

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
          `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
            orderURL
          )}`;


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


// ======================================
// INITIALIZE
// ======================================

if (isAdminPage()) {

  showAdmin();

} else {

  loadMenu();

}


// ======================================
// AUTO REFRESH ADMIN
// ======================================

setInterval(() => {

  if (
    isAdminPage() &&
    !document
      .getElementById("adminKitchen")
      .classList.contains("hidden")
  ) {

    loadOrders();

  }

}, 3000);