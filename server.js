const express = require("express");
const path = require("path");

const app = express();

// ========================================
// MIDDLEWARE
// ========================================

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// ========================================
// ORDER STORAGE
// ========================================

// DEMO ONLY
// Orders are stored in memory.
// They can disappear when the serverless
// instance restarts/redeploys.

let orders = [];

let nextOrderId = 1001;


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


    // ------------------------------------
    // Validate table
    // ------------------------------------

    if (
      table === undefined ||
      table === null ||
      String(table).trim() === ""
    ) {
      return res.status(400).json({
        error: "Table number is required"
      });
    }


    // ------------------------------------
    // Validate items
    // ------------------------------------

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        error: "Order must contain items"
      });
    }


    // ------------------------------------
    // Clean items using server-side menu
    // ------------------------------------

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


    // ------------------------------------
    // Make sure valid items exist
    // ------------------------------------

    if (!cleanItems.length) {
      return res.status(400).json({
        error: "No valid items"
      });
    }


    // ------------------------------------
    // Calculate total on SERVER
    // ------------------------------------

    const total =
      cleanItems.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    // ------------------------------------
    // Create order
    // ------------------------------------

    const now =
      new Date().toISOString();


    const order = {
      id: nextOrderId++,

      table:
        String(table).trim(),

      items:
        cleanItems,

      total,

      note:
        String(note || "")
          .trim()
          .slice(0, 500),

      status:
        "NEW",

      createdAt:
        now,

      updatedAt:
        now
    };


    // ------------------------------------
    // Add newest order first
    // ------------------------------------

    orders.unshift(order);


    console.log(
      `New order #${order.id} - Table ${order.table}`
    );


    // ------------------------------------
    // Send response
    // ------------------------------------

    return res.status(201).json(order);

  } catch (error) {

    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
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


      // ----------------------------------
      // Validate ID
      // ----------------------------------

      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid order ID"
        });

      }


      // ----------------------------------
      // Find order
      // ----------------------------------

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


      // ----------------------------------
      // Allowed statuses
      // ----------------------------------

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


      // ----------------------------------
      // Update status
      // ----------------------------------

      order.status =
        status;

      order.updatedAt =
        new Date().toISOString();


      console.log(
        `Order #${order.id} → ${status}`
      );


      return res.json(order);

    } catch (error) {

      console.error(
        "Update order error:",
        error
      );

      return res.status(500).json({
        error: "Failed to update order"
      });

    }

  }
);


// ========================================
// FRONTEND
// ========================================

// ========================================
// FRONTEND
// ========================================

app.get("/{*splat}", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "public",
      "index.html"
    )
  );

});


// ========================================
// VERCEL EXPORT
// ========================================

module.exports = app;