const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 3000;


// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ========================================
// ORDER STORAGE
// ========================================

const ordersFile = path.join(
  __dirname,
  "orders.json"
);


// Create orders.json if it doesn't exist
function createOrdersFile() {
  if (!fs.existsSync(ordersFile)) {
    fs.writeFileSync(
      ordersFile,
      "[]",
      "utf8"
    );

    console.log("Created orders.json");
  }
}


// Load orders from file
function loadOrders() {
  try {
    createOrdersFile();

    const data = fs.readFileSync(
      ordersFile,
      "utf8"
    );

    const parsed = JSON.parse(data);

    if (!Array.isArray(parsed)) {
      console.error(
        "orders.json is invalid. Starting with empty orders."
      );

      return [];
    }

    return parsed;

  } catch (error) {

    console.error(
      "Failed to load orders:",
      error
    );

    return [];
  }
}


// Save orders to file
function saveOrders() {
  try {

    fs.writeFileSync(
      ordersFile,
      JSON.stringify(orders, null, 2),
      "utf8"
    );

  } catch (error) {

    console.error(
      "Failed to save orders:",
      error
    );

    throw error;
  }
}


// Load existing orders when server starts
let orders = loadOrders();


// Calculate next order ID
let nextOrderId =
  orders.length > 0
    ? Math.max(
        ...orders.map(
          (order) => Number(order.id) || 0
        )
      ) + 1
    : 1001;


console.log(
  `Loaded ${orders.length} existing order(s)`
);

console.log(
  `Next order ID: ${nextOrderId}`
);


// ========================================
// MENU
// ========================================

const menu = [
  {
    id: 1,
    name: "Chicken Biriyani",
    price: 160,
    category: "Main Course",
    image: "/images/biriyani.jpg",
    description:
      "Fragrant basmati rice with tender chicken"
  },

  {
    id: 2,
    name: "Porotta",
    price: 15,
    category: "Bread",
    image: "/images/porotta.jpg",
    description:
      "Soft and layered Kerala porotta"
  },

  {
    id: 3,
    name: "Chicken Curry",
    price: 140,
    category: "Main Course",
    image: "/images/chicken-curry.jpg",
    description:
      "Rich Kerala-style chicken curry"
  },

  {
    id: 4,
    name: "Beef Fry",
    price: 180,
    category: "Main Course",
    image: "/images/beef-fry.jpg",
    description:
      "Spicy Kerala-style beef fry"
  },

  {
    id: 5,
    name: "Fresh Lime",
    price: 50,
    category: "Drinks",
    image: "/images/fresh-lime.jpg",
    description:
      "Refreshing fresh lime drink"
  },

  {
    id: 6,
    name: "Tea",
    price: 20,
    category: "Drinks",
    image: "/images/tea.jpg",
    description:
      "Hot Kerala tea"
  }
];


// ========================================
// GET MENU
// ========================================

app.get("/api/menu", (req, res) => {

  res.json(menu);

});


// ========================================
// GET ORDERS
// ========================================

app.get("/api/orders", (req, res) => {

  res.json(orders);

});


// ========================================
// CREATE ORDER
// ========================================

app.post("/api/orders", (req, res) => {

  try {

    const {
      table,
      items,
      note = ""
    } = req.body;


    // Validate table
    if (
      table === undefined ||
      table === null ||
      String(table).trim() === ""
    ) {

      return res.status(400).json({
        error: "Table number is required"
      });

    }


    // Validate items
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {

      return res.status(400).json({
        error: "Order must contain items"
      });

    }


    // Clean items using server-side menu
    const cleanItems = items
      .map((item) => {

        const product = menu.find(
          (product) =>
            product.id === Number(item.id)
        );


        // Ignore invalid product
        if (!product) {
          return null;
        }


        const quantity =
          Math.floor(
            Number(item.quantity)
          );


        // Prevent invalid quantities
        if (
          !Number.isFinite(quantity) ||
          quantity < 1
        ) {
          return null;
        }


        // Maximum quantity protection
        if (quantity > 100) {
          return null;
        }


        return {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity
        };

      })
      .filter(Boolean);


    // No valid items
    if (!cleanItems.length) {

      return res.status(400).json({
        error: "No valid items"
      });

    }


    // Calculate total on SERVER
    const total =
      cleanItems.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    // Create order
    const order = {

      id: nextOrderId++,

      table:
        String(table).trim(),

      items: cleanItems,

      total,

      note:
        String(note || "")
          .trim()
          .slice(0, 500),

      status: "NEW",

      createdAt:
        new Date().toISOString(),

      updatedAt:
        new Date().toISOString()

    };


    // Add newest order first
    orders.unshift(order);


    // SAVE TO DISK
    saveOrders();


    console.log(
      `New order #${order.id} - Table ${order.table}`
    );


    res.status(201).json(order);


  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      error: "Failed to create order"
    });

  }

});


// ========================================
// UPDATE ORDER STATUS
// ========================================

app.patch(
  "/api/orders/:id",
  (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid order ID"
        });

      }


      const order =
        orders.find(
          (order) =>
            order.id === id
        );


      if (!order) {

        return res.status(404).json({
          error: "Order not found"
        });

      }


      const allowedStatuses = [
        "NEW",
        "PREPARING",
        "READY",
        "SERVED",
        "CANCELLED"
      ];


      const status =
        req.body.status;


      if (
        !allowedStatuses.includes(status)
      ) {

        return res.status(400).json({
          error: "Invalid status"
        });

      }


      order.status = status;

      order.updatedAt =
        new Date().toISOString();


      // SAVE STATUS CHANGE
      saveOrders();


      console.log(
        `Order #${order.id} → ${status}`
      );


      res.json(order);


    } catch (error) {

      console.error(
        "Update order error:",
        error
      );

      res.status(500).json({
        error: "Failed to update order"
      });

    }

  }
);


// ========================================
// FRONTEND
// ========================================

app.get("*", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


// ========================================
// START SERVER
// ========================================

app.listen(
  PORT,
  () => {

    console.log(
      `QR Food running at http://localhost:${PORT}`
    );

  }
);