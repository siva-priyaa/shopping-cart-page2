/* ==================================================
   ShopEase - Express + MongoDB Backend Server
   Handles: Authentication (Register / Login / Logout)
   Database: MongoDB via Mongoose
================================================== */

const path     = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express  = require("express");
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const cors     = require("cors");

const app = express();

/* ── Config ── */
const PORT       = process.env.PORT || 3000;
// 🔴 Replace this with your MongoDB Atlas URI if not using .env:
// Example: "mongodb+srv://sivapriya:45680@cluster0.ulwtlid.mongodb.net/shoppingCartDB?retryWrites=true&w=majority"
const MONGO_URI  = process.env.MONGO_URI || "mongodb+srv://sivapriya:45680@cluster0.ulwtlid.mongodb.net/shoppingCartDB?retryWrites=true&w=majority";
const JWT_SECRET = process.env.JWT_SECRET || "shopease_super_secret_key_2026";
const JWT_EXPIRES = "7d";

/* ── Middleware ── */
app.use(cors());
app.use(express.json());

/* ── Landing Page: Start at Login Page ── */
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.use(express.static(path.join(__dirname)));

/* ── MongoDB Connection ── */
mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected:", MONGO_URI.includes("@") ? "Atlas Cloud" : MONGO_URI);
    })
    .catch((err) => {
        console.error("\n❌ MongoDB connection FAILED!");
        console.error("   Reason:", err.message);
        console.error("\n👉 To fix this, do ONE of the following:");
        console.error("   1. Install MongoDB locally: https://www.mongodb.com/try/download/community");
        console.error("   2. Use MongoDB Atlas (free cloud): https://cloud.mongodb.com");
        console.error("      Then set MONGO_URI in server.js line 19\n");
    });

/* ── User Schema ── */
const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: ["customer", "seller", "admin"],
            default: "customer",
        },
        storeName: {
            type: String,
            default: "",
            trim: true,
        },
        phone: {
            type: String,
            default: "",
            trim: true,
        },
        wishlist: [
            {
                type: mongoose.Schema.Types.Mixed,
            },
        ],
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema, "users");

/* ── Order Schema ── */
const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        customer: {
            type: String,
            default: "Shopper",
        },
        customerEmail: {
            type: String,
            default: "",
        },
        items: [
            {
                productId: mongoose.Schema.Types.Mixed,
                id: mongoose.Schema.Types.Mixed,
                name: String,
                price: Number,
                quantity: Number,
                image: String,
            },
        ],
        subtotal: Number,
        discount: Number,
        total: Number,
        status: {
            type: String,
            enum: ["Placed", "Confirmed", "Processing", "Shipped", "Out for Delivery", "Delivered", "Cancelled"],
            default: "Placed",
        },
        carrier: {
            type: String,
            default: "ShopEase Express",
        },
        trackingNumber: String,
        estimatedDelivery: String,
        shippingAddress: {
            type: String,
            default: "Standard Delivery Address",
        },
        deliveryAddress: {
            fullName: String,
            phone: String,
            street: String,
            city: String,
            state: String,
            pincode: String,
        },
        paymentMethod: {
            type: String,
            default: "Cash on Delivery",
        },
        paymentStatus: {
            type: String,
            default: "Pending COD",
        },
        timeline: [
            {
                status: String,
                time: String,
                note: String,
            },
        ],
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

/* ── Product Schema (Meesho & Flipkart Style) ── */
const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        originalPrice: {
            type: Number,
            default: 0,
        },
        category: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        image: {
            type: String,
            required: true,
        },
        rating: {
            type: Number,
            default: 4.3,
        },
        reviewsCount: {
            type: Number,
            default: 215,
        },
        badge: {
            type: String,
            default: "Assured",
        },
        freeDelivery: {
            type: Boolean,
            default: true,
        },
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },
        sellerEmail: {
            type: String,
            default: "",
        },
        sellerName: {
            type: String,
            default: "Verified ShopEase Partner",
        },
        stock: {
            type: Number,
            default: 50,
        },
        addedBy: {
            type: String,
            default: "Authorized Seller",
        },
        reviews: [
            {
                userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
                userName: { type: String, default: "Customer" },
                userEmail: { type: String, default: "" },
                rating: { type: Number, required: true, min: 1, max: 5 },
                comment: { type: String, required: true, trim: true },
                date: { type: String },
                isVerifiedPurchase: { type: Boolean, default: false },
            },
        ],
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema, "products");

/* ── Middleware: Verify JWT ── */
function verifyToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "No token provided. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid or expired token." });
    }
}

/* ── Middleware: Role-Based Authorization ── */
function requireRole(...allowedRoles) {
    const flatRoles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user || !flatRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Requires one of: [${flatRoles.join(", ")}]. Your role: ${req.user ? req.user.role : "none"}.`,
            });
        }
        next();
    };
}

/* ── ROUTE: Register ── */
app.post("/api/auth/register", async (req, res) => {
    try {
        const { name, email, password, role: requestedRole, sellerPasskey, adminKey } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please fill all fields (name, email, password)." });
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            return res.status(400).json({ error: "Please enter a valid email address." });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        const existing = await User.findOne({ email: trimmedEmail });
        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        // Security check: NEVER allow public self-assignment to admin
        let assignedRole = "customer";
        const expectedAdminKey = process.env.ADMIN_KEY || "ADMIN_SECRET_KEY_2026";
        const expectedSellerKey = process.env.SELLER_PASSKEY || "SELLER2026";

        if (requestedRole === "admin") {
            if (adminKey && adminKey.trim() === expectedAdminKey) {
                assignedRole = "admin";
            } else {
                return res.status(403).json({ error: "Unauthorized: Invalid admin secret key." });
            }
        } else if (requestedRole === "seller") {
            if (sellerPasskey && sellerPasskey.trim() === expectedSellerKey) {
                assignedRole = "seller";
            } else {
                return res.status(403).json({ error: "Unauthorized: Invalid seller passkey." });
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: trimmedName,
            email: trimmedEmail,
            password: hashedPassword,
            role: assignedRole,
            wishlist: [],
        });

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        console.log(`✅ New user registered: ${user.name} (${user.email}) - Role: [${user.role}]`);

        return res.status(201).json({
            message: "Account created successfully!",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error("Register error:", err.message);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
});

/* ── ROUTE: Login ── */
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide both email and password." });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const userRole = user.role || "customer";

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: userRole },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        console.log(`✅ User logged in: ${user.name} (${user.email}) - Role: [${userRole}]`);

        return res.status(200).json({
            message: "Login successful!",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: userRole, storeName: user.storeName || "" },
        });
    } catch (err) {
        console.error("Login error:", err.message);
        return res.status(500).json({ error: "Server error. Please try again." });
    }
});

/* ── ROUTE: Dedicated Seller Login ── */
app.post("/api/auth/seller/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please enter your seller email and password." });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });
        if (!user) {
            return res.status(401).json({ error: "No seller account found with this email." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password for seller account." });
        }

        // Strict role verification: Customers cannot use the seller portal!
        if (user.role !== "seller" && user.role !== "admin") {
            return res.status(403).json({
                error: "⛔ Access Denied: This account is registered as a customer. The Seller Hub is strictly for authorized sellers.",
            });
        }

        const token = jwt.sign(
            { id: user._id, name: user.name, email: user.email, role: user.role, storeName: user.storeName || user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        console.log(`🏪 Seller logged in: ${user.name} (${user.email}) - Store: [${user.storeName || "My Store"}]`);

        return res.status(200).json({
            message: "Welcome to ShopEase Seller Hub!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                storeName: user.storeName || user.name,
                phone: user.phone || "",
            },
        });
    } catch (err) {
        console.error("Seller login error:", err.message);
        return res.status(500).json({ error: "Server error during seller login." });
    }
});

/* ── ROUTE: Dedicated Seller Registration ── */
app.post("/api/auth/seller/register", async (req, res) => {
    try {
        const { name, storeName, email, phone, password, sellerPasskey } = req.body;

        if (!name || !storeName || !email || !password) {
            return res.status(400).json({ error: "Please fill in all required seller details." });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const expectedSellerKey = process.env.SELLER_PASSKEY || "SELLER2026";

        if (!sellerPasskey || sellerPasskey.trim() !== expectedSellerKey) {
            return res.status(403).json({
                error: "🔒 Security Verification Failed: Invalid Seller Passkey. Please enter 'SELLER2026'.",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: "Password must be at least 6 characters." });
        }

        const existing = await User.findOne({ email: trimmedEmail });
        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newSeller = await User.create({
            name: name.trim(),
            storeName: storeName.trim(),
            email: trimmedEmail,
            phone: phone ? phone.trim() : "",
            password: hashedPassword,
            role: "seller",
            wishlist: [],
        });

        const token = jwt.sign(
            { id: newSeller._id, name: newSeller.name, email: newSeller.email, role: newSeller.role, storeName: newSeller.storeName },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES }
        );

        console.log(`🏪 New seller registered: ${newSeller.name} - Store: [${newSeller.storeName}] (${newSeller.email})`);

        return res.status(201).json({
            message: "🎉 Seller account created successfully!",
            token,
            user: {
                id: newSeller._id,
                name: newSeller.name,
                email: newSeller.email,
                role: newSeller.role,
                storeName: newSeller.storeName,
                phone: newSeller.phone,
            },
        });
    } catch (err) {
        console.error("Seller register error:", err.message);
        return res.status(500).json({ error: "Server error during seller registration." });
    }
});

/* ── ROUTE: Get Current User ── */
app.get("/api/auth/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }
        return res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || "customer",
                wishlist: user.wishlist || [],
            },
        });
    } catch (err) {
        return res.status(500).json({ error: "Server error." });
    }
});

/* ── ROUTE: Logout ── */
app.post("/api/auth/logout", verifyToken, (req, res) => {
    return res.json({ message: "Logged out successfully." });
});

/* ── ROUTE: Validate Cart Stock (Live Check from MongoDB) ── */
app.post("/api/cart/validate-stock", async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: "Cart items array required." });
        }

        const validationResults = [];
        let allValid = true;

        if (mongoose.connection.readyState === 1) {
            for (const item of items) {
                const pid = item.productId || item.id;
                const query = [];
                if (pid && mongoose.isValidObjectId(pid)) query.push({ _id: pid });
                if (item.name) query.push({ name: item.name });

                const prod = query.length ? await Product.findOne({ $or: query }) : null;
                const currentStock = prod ? (typeof prod.stock === "number" ? prod.stock : 10) : 10;
                const available = currentStock >= item.quantity;

                if (!available) allValid = false;

                validationResults.push({
                    productId: pid,
                    name: item.name,
                    requestedQuantity: item.quantity,
                    availableStock: currentStock,
                    available,
                });
            }
        }

        return res.json({ valid: allValid, items: validationResults });
    } catch (err) {
        return res.status(500).json({ error: "Stock check failed: " + err.message });
    }
});

/* ── ROUTE: Create Order (With Stock Validation & Deduction) ── */
app.post("/api/orders", async (req, res) => {
    try {
        const {
            orderId,
            customer,
            customerEmail,
            items,
            subtotal,
            discount,
            total,
            status,
            carrier,
            trackingNumber,
            estimatedDelivery,
            shippingAddress,
            deliveryAddress,
            paymentMethod,
            paymentStatus,
            paymentDetails,
        } = req.body;

        if (!items || !items.length) {
            return res.status(400).json({ error: "Order must contain at least one product." });
        }

        if (!shippingAddress && (!deliveryAddress || !deliveryAddress.street)) {
            return res.status(400).json({ error: "Delivery address is required." });
        }

        // Extract user from JWT
        let userId = null;
        let customerName = customer || "Shopper";
        let userEmail = customerEmail || "";
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                if (!customer) customerName = decoded.name;
                if (!customerEmail) userEmail = decoded.email;
            } catch (_) {}
        }

        const chosenPayment = paymentMethod || "Cash on Delivery";
        let resolvedPaymentStatus = paymentStatus;
        if (!resolvedPaymentStatus) {
            resolvedPaymentStatus =
                chosenPayment === "Cash on Delivery"
                    ? "Pending (Pay on Delivery)"
                    : "Simulated Paid (" + chosenPayment + ")";
        }

        // Live Stock Validation & Safe Atomic Deduction in MongoDB
        if (mongoose.connection.readyState === 1) {
            // Prevent duplicate orders submitted within 10 seconds
            if (userId) {
                const recentDuplicate = await Order.findOne({
                    userId,
                    total: Number(total) || 0,
                    createdAt: { $gte: new Date(Date.now() - 10000) },
                });
                if (recentDuplicate) {
                    return res.status(409).json({
                        error: "Duplicate order submission detected. Your order is already being processed.",
                        orderId: recentDuplicate.orderId,
                    });
                }
            }

            // Verify stock for every item before deducting
            for (const item of items) {
                const pid = item.productId || item.id;
                const query = [];
                if (pid && mongoose.isValidObjectId(pid)) query.push({ _id: pid });
                if (item.name) query.push({ name: item.name });

                const prod = query.length ? await Product.findOne({ $or: query }) : null;
                if (prod && typeof prod.stock === "number") {
                    if (prod.stock < item.quantity) {
                        return res.status(400).json({
                            error: `Insufficient stock for "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}. Please adjust quantity.`,
                        });
                    }
                }
            }

            // Deduct stock safely
            for (const item of items) {
                const pid = item.productId || item.id;
                const query = [];
                if (pid && mongoose.isValidObjectId(pid)) query.push({ _id: pid });
                if (item.name) query.push({ name: item.name });

                if (query.length) {
                    await Product.updateOne(
                        { $or: query, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } }
                    );
                }
            }
        }

        // Snapshot of product items
        const itemSnapshots = items.map(item => ({
            productId: item.productId || item.id || null,
            name: item.name,
            price: Number(item.price) || 0,
            quantity: Number(item.quantity) || 1,
            image: item.image || "",
        }));

        const finalOrderId = orderId || "ORD" + Date.now();
        const finalTracking = trackingNumber || "TRK-" + Math.floor(100000 + Math.random() * 900000);
        const orderDateStr = new Date().toLocaleString();

        const newOrderData = {
            orderId: finalOrderId,
            userId,
            customer: customerName,
            customerEmail: userEmail,
            items: itemSnapshots,
            subtotal: Number(subtotal) || 0,
            discount: Number(discount) || 0,
            total: Number(total) || 0,
            status: status || "Placed",
            carrier: carrier || "ShopEase Express",
            trackingNumber: finalTracking,
            estimatedDelivery:
                estimatedDelivery ||
                new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                }),
            shippingAddress:
                shippingAddress ||
                (deliveryAddress
                    ? `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.pincode}`
                    : "Standard Delivery Address"),
            deliveryAddress: deliveryAddress || {},
            paymentMethod: chosenPayment,
            paymentStatus: resolvedPaymentStatus,
            paymentDetails: paymentDetails || {},
            timeline: [
                {
                    status: "Placed",
                    time: orderDateStr,
                    note: `Order placed via ${chosenPayment}. Stock safely allocated.`,
                },
            ],
        };

        if (mongoose.connection.readyState === 1) {
            const saved = await Order.create(newOrderData);
            console.log(`📦 Order created: #${saved.orderId} for ${saved.customer} (Total: ₹${saved.total})`);
            return res.status(201).json({ message: "Order placed successfully!", order: saved });
        }

        return res.status(201).json({
            message: "Order placed successfully (saved locally)!",
            order: newOrderData,
        });
    } catch (err) {
        console.error("Create order error:", err.message);
        return res.status(500).json({ error: "Could not create order: " + err.message });
    }
});

/* ── ROUTE: Get Orders (Customer sees only own orders, Admin sees all) ── */
app.get("/api/orders", async (req, res) => {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        let userId = null;
        let role = "customer";

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                role = decoded.role || "customer";
            } catch (_) {}
        }

        if (mongoose.connection.readyState === 1) {
            // Admins can view all orders; customers only their own
            let query = {};
            if (role !== "admin") {
                if (userId) {
                    query = { userId };
                } else {
                    return res.json({ orders: [] });
                }
            }
            const orders = await Order.find(query).sort({ createdAt: -1 });
            return res.json({ orders });
        }

        return res.json({ orders: [] });
    } catch (err) {
        console.error("Get orders error:", err.message);
        return res.status(500).json({ error: "Could not fetch orders." });
    }
});

/* ── ROUTE: Cancel Order (Eligible only if Placed/Confirmed, Restores Stock) ── */
app.post("/api/orders/:orderId/cancel", async (req, res) => {
    try {
        const { orderId } = req.params;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        let userId = null;
        let userRole = "customer";

        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                userRole = decoded.role || "customer";
            } catch (_) {}
        }

        if (mongoose.connection.readyState === 1) {
            const order = await Order.findOne({
                $or: [{ orderId }, { _id: mongoose.isValidObjectId(orderId) ? orderId : null }],
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found." });
            }

            // Customer access check
            if (userRole !== "admin" && userId && String(order.userId) !== String(userId)) {
                return res.status(403).json({ error: "Access denied. You can only cancel your own orders." });
            }

            // Eligibility check
            const nonCancellable = ["Shipped", "Out for Delivery", "Delivered", "Cancelled"];
            if (nonCancellable.includes(order.status)) {
                return res.status(400).json({
                    error: `Order cannot be cancelled. Current status is already "${order.status}".`,
                });
            }

            // Restore product stock safely in MongoDB
            for (const item of order.items) {
                const pid = item.productId || item.id;
                const query = [];
                if (pid && mongoose.isValidObjectId(pid)) query.push({ _id: pid });
                if (item.name) query.push({ name: item.name });

                if (query.length) {
                    await Product.updateOne({ $or: query }, { $inc: { stock: item.quantity } });
                }
            }

            order.status = "Cancelled";
            order.timeline.push({
                status: "Cancelled",
                time: new Date().toLocaleString(),
                note: "Order cancelled by customer. Product stock safely restored to inventory.",
            });
            await order.save();

            console.log(`❌ Order cancelled & stock restored for order #${order.orderId}`);
            return res.json({ message: "Order cancelled successfully and stock restored!", order });
        }

        return res.json({ message: "Order cancelled locally.", orderId });
    } catch (err) {
        return res.status(500).json({ error: "Cancellation failed: " + err.message });
    }
});

/* ── ROUTE: Track Order by ID (Safe Lookup) ── */
app.get("/api/orders/track/:orderId", async (req, res) => {
    try {
        const { orderId } = req.params;

        if (mongoose.connection.readyState === 1) {
            const order = await Order.findOne({
                $or: [{ orderId }, { trackingNumber: orderId }],
            });

            if (!order) {
                return res.status(404).json({ error: "Order not found with that ID or tracking number." });
            }

            return res.json({ order });
        }

        return res.status(404).json({ error: "Order tracker database offline." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Update Order Status (Admin / Simulator) ── */
app.patch("/api/orders/:orderId/status", async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, note } = req.body;

        const validStatuses = [
            "Placed",
            "Confirmed",
            "Processing",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Invalid status: " + status });
        }

        if (mongoose.connection.readyState === 1) {
            const order = await Order.findOne({
                $or: [{ orderId }, { _id: mongoose.isValidObjectId(orderId) ? orderId : null }],
            });
            if (!order) {
                return res.status(404).json({ error: "Order not found." });
            }

            // If transitioning to Cancelled, restore stock
            if (status === "Cancelled" && order.status !== "Cancelled") {
                for (const item of order.items) {
                    const pid = item.productId || item.id;
                    const query = [];
                    if (pid && mongoose.isValidObjectId(pid)) query.push({ _id: pid });
                    if (item.name) query.push({ name: item.name });
                    if (query.length) {
                        await Product.updateOne({ $or: query }, { $inc: { stock: item.quantity } });
                    }
                }
            }

            order.status = status;
            order.timeline.push({
                status,
                time: new Date().toLocaleString(),
                note: note || `Order updated to ${status}.`,
            });
            await order.save();

            return res.json({ message: "Status updated!", order });
        }

        return res.json({ message: "Updated locally", status });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Wishlist Endpoints (MongoDB Persisted for Users) ── */
app.get("/api/wishlist", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found." });

        const wishIds = user.wishlist || [];
        let populatedProducts = [];

        if (mongoose.connection.readyState === 1 && wishIds.length > 0) {
            const validObjIds = wishIds.filter(id => mongoose.isValidObjectId(id));
            populatedProducts = await Product.find({
                $or: [
                    { _id: { $in: validObjIds } },
                    { id: { $in: wishIds } },
                    { name: { $in: wishIds } },
                ],
            });
        }

        return res.json({
            wishlist: wishIds,
            products: populatedProducts,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post("/api/wishlist", verifyToken, async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) return res.status(400).json({ error: "Product ID required." });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found." });

        if (!user.wishlist.some(id => String(id) === String(productId))) {
            user.wishlist.push(productId);
            await user.save();
        }
        return res.json({ message: "Added to wishlist!", wishlist: user.wishlist });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.delete("/api/wishlist/:productId", verifyToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found." });

        user.wishlist = user.wishlist.filter(id => String(id) !== String(productId));
        await user.save();
        return res.json({ message: "Removed from wishlist!", wishlist: user.wishlist });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ==================================================
   PRODUCT ROUTES & SEEDING (Meesho & Flipkart Style)
================================================== */
const SELLER_PASSKEY = process.env.SELLER_PASSKEY || "SELLER2026";

const DEFAULT_PRODUCTS = [
    {
        name: "Smart Watch Elite Pro",
        description: "1.96 AMOLED Display, Bluetooth Calling, 100+ Sports Modes, IP68 Waterproof",
        price: 1499,
        originalPrice: 4999,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        rating: 4.4,
        reviewsCount: 3840,
        badge: "Assured",
        freeDelivery: true,
        sellerName: "Noise Retail Pvt Ltd",
    },
    {
        name: "Noise-Cancelling Wireless Headphones",
        description: "Deep Bass, 50H Playtime, Fast Charging Type-C, Foldable Ergonomic Design",
        price: 999,
        originalPrice: 2999,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        rating: 4.5,
        reviewsCount: 5210,
        badge: "Meesho Choice",
        freeDelivery: true,
        sellerName: "boAt Audio Store",
    },
    {
        name: "Air Cushion Lightweight Sneakers",
        description: "Breathable Mesh, Anti-Slip Sole, Daily Walking & Running Sports Shoes",
        price: 799,
        originalPrice: 1999,
        category: "fashion",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600",
        rating: 4.3,
        reviewsCount: 1890,
        badge: "Top Seller",
        freeDelivery: true,
        sellerName: "Asian Footwear",
    },
    {
        name: "Waterproof Travel Laptop Backpack",
        description: "Anti-Theft Hidden Pocket, USB Charging Port, 30L Multi-Compartment",
        price: 699,
        originalPrice: 1899,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600",
        rating: 4.2,
        reviewsCount: 940,
        badge: "Assured",
        freeDelivery: true,
        sellerName: "F Gear Bags",
    },
    {
        name: "5G Ultra Slim Smartphone (8GB/128GB)",
        description: "50MP AI Triple Camera, 5000mAh Battery, 44W FlashCharge, FHD+ 90Hz Display",
        price: 13999,
        originalPrice: 19999,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
        rating: 4.6,
        reviewsCount: 8420,
        badge: "Flipkart Choice",
        freeDelivery: true,
        sellerName: "TrueCom Retail",
    },
    {
        name: "Pure Cotton Regular Fit Casual T-Shirt",
        description: "Bio-Washed 100% Combed Cotton, Round Neck, Soft & Breathable",
        price: 349,
        originalPrice: 899,
        category: "fashion",
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600",
        rating: 4.3,
        reviewsCount: 2300,
        badge: "Hot Deal",
        freeDelivery: true,
        sellerName: "Kalyan Apparels",
    },
    {
        name: "Polarized Retro Sunglasses (UV400)",
        description: "Classic Wayfarer Style, Glare Protection, Lightweight Durable Metal Frame",
        price: 399,
        originalPrice: 1299,
        category: "accessories",
        image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600",
        rating: 4.1,
        reviewsCount: 650,
        badge: "Meesho Verified",
        freeDelivery: true,
        sellerName: "Vincent Eyewear",
    },
    {
        name: "Portable Extra-Bass Bluetooth Speaker",
        description: "16W Stereo Sound, RGB Ambient Lights, TWS Dual Pairing, 12H Battery",
        price: 899,
        originalPrice: 2499,
        category: "electronics",
        image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600",
        rating: 4.5,
        reviewsCount: 4100,
        badge: "Assured",
        freeDelivery: true,
        sellerName: "Zebronics Store",
    },
];

async function seedCatalog() {
    try {
        if (mongoose.connection.readyState === 1) {
            // Preserve user's existing products in shoppingCartDB.products, insert defaults only if not present
            for (const p of DEFAULT_PRODUCTS) {
                const existing = await Product.findOne({ name: p.name });
                if (!existing) {
                    await Product.create({ ...p, stock: 25 });
                }
            }
            console.log("🛍️ Product catalog verified & synchronized in MongoDB shoppingCartDB.products!");
        }
    } catch (e) {
        console.log("Seeding note:", e.message);
    }
}
mongoose.connection.on("connected", seedCatalog);

/* ── ROUTE: Get All Products (From MongoDB) ── */
app.get("/api/products", async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const dbProducts = await Product.find().sort({ createdAt: -1 });
            if (dbProducts.length > 0) {
                return res.json({ products: dbProducts });
            }
        }
        return res.json({ products: DEFAULT_PRODUCTS });
    } catch (err) {
        return res.status(500).json({ error: "Failed to fetch products." });
    }
});

/* ── ROUTE: Add Product (Protected via Seller Auth Token or Security Passkey) ── */
app.post("/api/products", async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            image,
            badge,
            sellerName,
            securityKey,
        } = req.body;

        // Extract seller from token if available
        let sellerId = null;
        let sellerEmail = "";
        let storeName = sellerName || "Verified ShopEase Partner";

        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (decoded.role === "seller" || decoded.role === "admin") {
                    sellerId = decoded.id;
                    sellerEmail = decoded.email;
                    storeName = decoded.storeName || decoded.name || storeName;
                }
            } catch (_) {}
        }

        // Security check: Must have valid seller JWT OR valid Seller Passkey
        if (!sellerId && (!securityKey || securityKey.trim() !== SELLER_PASSKEY)) {
            return res.status(403).json({
                error:
                    "🔒 Security Verification Failed: Invalid Seller Passkey or unauthorized seller session. Please log in as a seller or enter 'SELLER2026'.",
            });
        }

        if (!name || !price || !category || !image) {
            return res.status(400).json({ error: "Please fill all required product fields." });
        }

        const numPrice = Number(price);
        const numOriginal = originalPrice ? Number(originalPrice) : Math.round(numPrice * 1.6);

        if (isNaN(numPrice) || numPrice <= 0) {
            return res.status(400).json({ error: "Price must be a valid positive number." });
        }

        const productData = {
            name: name.trim(),
            description: (description || "Quality verified product on ShopEase.").trim(),
            price: numPrice,
            originalPrice: numOriginal,
            stock: req.body.stock !== undefined ? Number(req.body.stock) : 25,
            category: category.toLowerCase().trim(),
            image: image.trim(),
            rating: 4.5,
            reviewsCount: 0,
            badge: badge || "Assured",
            freeDelivery: true,
            sellerId: sellerId,
            sellerEmail: sellerEmail,
            sellerName: storeName,
            addedBy: "Authorized Seller",
            reviews: [],
        };

        if (mongoose.connection.readyState === 1) {
            const created = await Product.create(productData);
            console.log(`🛍️ New product published: "${created.name}" (₹${created.price}, Stock: ${created.stock}) by ${storeName}`);
            return res.status(201).json({
                message: "🎉 Product securely added and published to the store!",
                product: created,
            });
        }

        return res.status(201).json({
            message: "🎉 Product added successfully!",
            product: { ...productData, _id: "prod_" + Date.now() },
        });
    } catch (err) {
        console.error("Add product error:", err.message);
        return res.status(500).json({ error: "Could not add product: " + err.message });
    }
});

/* ── ROUTE: Seller Products List (Only Current Seller's Products) ── */
app.get("/api/seller/my-products", verifyToken, requireRole(["seller", "admin"]), async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            let filter = {};
            if (req.user.role !== "admin") {
                filter = {
                    $or: [
                        { sellerId: req.user.id },
                        { sellerEmail: req.user.email },
                    ],
                };
            }
            const products = await Product.find(filter).sort({ createdAt: -1 });
            return res.json({ products });
        }
        return res.json({ products: [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Edit Product (With Seller Ownership Enforcement) ── */
app.put("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const securityKey = req.headers["x-seller-key"] || req.body.securityKey;

        let authenticatedUser = null;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                authenticatedUser = jwt.verify(token, JWT_SECRET);
            } catch (_) {}
        }

        if (!authenticatedUser && (!securityKey || securityKey.trim() !== SELLER_PASSKEY)) {
            return res.status(403).json({ error: "🔒 Unauthorized: Please log in as a seller or provide Seller Passkey." });
        }

        if (mongoose.connection.readyState === 1) {
            const product = await Product.findById(id);
            if (!product) return res.status(404).json({ error: "Product not found." });

            // Enforce seller ownership: Sellers can only edit their own products!
            if (authenticatedUser && authenticatedUser.role !== "admin") {
                const isOwner = (product.sellerId && product.sellerId.toString() === authenticatedUser.id.toString()) ||
                                (product.sellerEmail && product.sellerEmail === authenticatedUser.email);
                if (!isOwner && product.sellerId) {
                    return res.status(403).json({ error: "⛔ Access Denied: You can only edit your own products." });
                }
            }

            if (req.body.name) product.name = req.body.name.trim();
            if (req.body.description) product.description = req.body.description.trim();
            if (req.body.price !== undefined) product.price = Number(req.body.price);
            if (req.body.originalPrice !== undefined) product.originalPrice = Number(req.body.originalPrice);
            if (req.body.stock !== undefined) product.stock = Number(req.body.stock);
            if (req.body.category) product.category = req.body.category.toLowerCase().trim();
            if (req.body.image) product.image = req.body.image.trim();
            if (req.body.badge) product.badge = req.body.badge;

            await product.save();
            return res.json({ message: "Product updated successfully!", product });
        }
        return res.json({ message: "Updated locally" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Delete Product (With Seller Ownership Enforcement) ── */
app.delete("/api/products/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const securityKey = req.headers["x-seller-key"] || req.query.securityKey;

        let authenticatedUser = null;
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                authenticatedUser = jwt.verify(token, JWT_SECRET);
            } catch (_) {}
        }

        if (!authenticatedUser && (!securityKey || securityKey.trim() !== SELLER_PASSKEY)) {
            return res.status(403).json({ error: "🔒 Unauthorized: Please log in as a seller or provide Seller Passkey." });
        }

        if (mongoose.connection.readyState === 1) {
            const product = await Product.findById(id);
            if (!product) return res.status(404).json({ error: "Product not found." });

            // Enforce seller ownership: Sellers can only delete their own products!
            if (authenticatedUser && authenticatedUser.role !== "admin") {
                const isOwner = (product.sellerId && product.sellerId.toString() === authenticatedUser.id.toString()) ||
                                (product.sellerEmail && product.sellerEmail === authenticatedUser.email);
                if (!isOwner && product.sellerId) {
                    return res.status(403).json({ error: "⛔ Access Denied: You can only delete your own products." });
                }
            }

            await Product.findByIdAndDelete(id);
            return res.json({ message: "Product deleted successfully." });
        }
        return res.json({ message: "Product removed." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Seller Orders (Orders Containing This Seller's Products) ── */
app.get("/api/seller/orders", verifyToken, requireRole(["seller", "admin"]), async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            if (req.user.role === "admin") {
                const allOrders = await Order.find().sort({ createdAt: -1 });
                return res.json({ orders: allOrders });
            }

            // Get IDs and names of products owned by this seller
            const sellerProducts = await Product.find({
                $or: [{ sellerId: req.user.id }, { sellerEmail: req.user.email }],
            });
            const sellerProdIds = sellerProducts.map(p => p._id.toString());
            const sellerProdNames = sellerProducts.map(p => p.name);

            // Find orders containing any of this seller's products
            const allOrders = await Order.find().sort({ createdAt: -1 });
            const matchedOrders = allOrders.filter(order => {
                return order.items.some(item => {
                    const pid = (item.productId || item.id || "").toString();
                    return sellerProdIds.includes(pid) || sellerProdNames.includes(item.name);
                });
            });

            return res.json({ orders: matchedOrders });
        }
        return res.json({ orders: [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Admin Overview & Metrics (Admin Only) ── */
app.get("/api/admin/overview", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const totalProducts = await Product.countDocuments();
            const totalUsers = await User.countDocuments();
            const totalOrders = await Order.countDocuments();
            const orders = await Order.find({ status: { $ne: "Cancelled" } });
            const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

            return res.json({
                totalProducts,
                totalUsers,
                totalOrders,
                totalRevenue,
            });
        }
        return res.json({ totalProducts: 8, totalUsers: 1, totalOrders: 0, totalRevenue: 0 });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Admin Users List (Admin Only) ── */
app.get("/api/admin/users", verifyToken, requireRole("admin"), async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const users = await User.find().select("-password").sort({ createdAt: -1 });
            return res.json({ users });
        }
        return res.json({ users: [] });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── ROUTE: Submit/Update Product Rating & Review (By Customers) ── */
app.post("/api/products/:id/review", async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment, userName } = req.body;

        const numRating = Number(rating);
        if (!numRating || numRating < 1 || numRating > 5) {
            return res.status(400).json({ error: "Please provide a valid rating between 1 and 5 stars." });
        }

        if (!comment || !comment.trim()) {
            return res.status(400).json({ error: "Please write a review comment." });
        }

        // Try extracting user from JWT if logged in
        let userId = null;
        let reviewerName = (userName && userName.trim()) || "Verified Buyer";
        let reviewerEmail = "";
        const authHeader = req.headers["authorization"];
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                userId = decoded.id;
                reviewerName = decoded.name || reviewerName;
                reviewerEmail = decoded.email || "";
            } catch (_) {}
        }

        if (mongoose.connection.readyState === 1) {
            const product = await Product.findOne({
                $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { name: id }],
            });

            if (!product) {
                return res.status(404).json({ error: "Product not found." });
            }

            // Check verified purchase eligibility (if user ordered this item)
            let isVerifiedPurchase = false;
            if (userId || reviewerEmail) {
                const userOrder = await Order.findOne({
                    $or: [{ userId: userId || null }, { customerEmail: reviewerEmail || "" }],
                    "items.name": product.name,
                });
                if (userOrder) {
                    isVerifiedPurchase = true;
                }
            }

            if (!product.reviews) product.reviews = [];

            // Check for existing review by this customer (PREVENT DUPLICATES - UPDATE IN PLACE)
            const existingIndex = product.reviews.findIndex(r => {
                if (userId && r.userId && r.userId.toString() === userId.toString()) return true;
                if (reviewerEmail && r.userEmail && r.userEmail.toLowerCase() === reviewerEmail.toLowerCase()) return true;
                return false;
            });

            const reviewDate = new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });
            let savedReview;

            if (existingIndex !== -1) {
                // Update existing review
                product.reviews[existingIndex].rating = numRating;
                product.reviews[existingIndex].comment = comment.trim();
                product.reviews[existingIndex].userName = reviewerName;
                product.reviews[existingIndex].date = reviewDate;
                product.reviews[existingIndex].isVerifiedPurchase = isVerifiedPurchase || product.reviews[existingIndex].isVerifiedPurchase;
                savedReview = product.reviews[existingIndex];
            } else {
                // Add new review
                savedReview = {
                    _id: new mongoose.Types.ObjectId(),
                    userId: userId ? new mongoose.Types.ObjectId(userId) : null,
                    userName: reviewerName,
                    userEmail: reviewerEmail,
                    rating: numRating,
                    comment: comment.trim(),
                    date: reviewDate,
                    isVerifiedPurchase: isVerifiedPurchase,
                };
                product.reviews.unshift(savedReview);
            }

            // Calculate actual average rating and review count from saved reviews
            const totalRatings = product.reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
            product.rating = Number((totalRatings / product.reviews.length).toFixed(1));
            product.reviewsCount = product.reviews.length;

            await product.save();

            return res.status(201).json({
                message: existingIndex !== -1
                    ? "⭐ Your review has been updated successfully!"
                    : "⭐ Thank you! Your review and rating have been posted.",
                review: savedReview,
                product,
            });
        }

        const fallbackReview = {
            _id: "rev_" + Date.now(),
            userName: reviewerName,
            userEmail: reviewerEmail,
            rating: numRating,
            comment: comment.trim(),
            date: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
            isVerifiedPurchase: true,
        };

        return res.status(201).json({
            message: "⭐ Review posted successfully!",
            review: fallbackReview,
        });
    } catch (err) {
        return res.status(500).json({ error: "Could not submit review: " + err.message });
    }
});

/* ── ROUTE: Delete Customer Review (Owner or Admin Only) ── */
app.delete("/api/products/:id/review/:reviewId", verifyToken, async (req, res) => {
    try {
        const { id, reviewId } = req.params;

        if (mongoose.connection.readyState === 1) {
            const product = await Product.findOne({
                $or: [{ _id: mongoose.isValidObjectId(id) ? id : null }, { name: id }],
            });

            if (!product) return res.status(404).json({ error: "Product not found." });
            if (!product.reviews) product.reviews = [];

            const reviewIndex = product.reviews.findIndex(r => {
                return (r._id && r._id.toString() === reviewId) ||
                       (r.userId && r.userId.toString() === req.user.id.toString());
            });

            if (reviewIndex === -1) {
                return res.status(404).json({ error: "Review not found." });
            }

            const review = product.reviews[reviewIndex];
            const isOwner = (review.userId && review.userId.toString() === req.user.id.toString()) ||
                            (review.userEmail && review.userEmail.toLowerCase() === req.user.email.toLowerCase()) ||
                            (req.user.role === "admin");

            if (!isOwner) {
                return res.status(403).json({ error: "⛔ Forbidden: You cannot delete another customer's review." });
            }

            product.reviews.splice(reviewIndex, 1);

            if (product.reviews.length > 0) {
                const total = product.reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
                product.rating = Number((total / product.reviews.length).toFixed(1));
                product.reviewsCount = product.reviews.length;
            } else {
                product.rating = 4.5;
                product.reviewsCount = 0;
            }

            await product.save();
            return res.json({ message: "Review deleted successfully.", product });
        }
        return res.json({ message: "Review removed locally." });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

/* ── Fallback ── */
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

/* ── Start ── */
app.listen(PORT, () => {
    console.log("================================================");
    console.log(`🚀 ShopEase server: http://localhost:${PORT}`);
    console.log(`🌐 Open: http://localhost:${PORT}/login.html`);
    console.log("================================================");
});
