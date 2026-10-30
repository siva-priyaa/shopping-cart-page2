/* ==================================================
   API BASE & ENVIRONMENT ROUTING
================================================== */
var API_BASE = (typeof window !== "undefined" && (window.location.protocol === "file:" || (window.location.port && window.location.port !== "3000")))
    ? "http://localhost:3000"
    : "";

if (typeof window !== "undefined" && API_BASE && !window._fetchPatched) {
    window._fetchPatched = true;
    const originalFetch = window.fetch;
    window.fetch = function(resource, init) {
        if (typeof resource === "string" && resource.startsWith("/api/")) {
            resource = API_BASE + resource;
        }
        return originalFetch.call(this, resource, init);
    };
}

/* ==================================================
   PRODUCTS (Flipkart & Meesho Marketplace Catalog)
================================================== */

let products = [
    {
        id: 1,
        name: "Smart Watch Elite Pro",
        description: "1.96 AMOLED Display, Bluetooth Calling, 100+ Sports Modes, IP68",
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
        id: 2,
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
        id: 3,
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
        id: 4,
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
        id: 5,
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
        id: 6,
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
        id: 7,
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
        id: 8,
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

/* Fetch Live MongoDB Products (including newly added seller products) */
async function fetchProductsFromBackend() {
    try {
        const res = await fetch("/api/products");
        if (res.ok) {
            const data = await res.json();
            if (data.products && data.products.length > 0) {
                products = data.products.map(p => ({
                    id: p._id || p.id,
                    _id: p._id || p.id,
                    name: p.name,
                    description: p.description,
                    price: p.price,
                    originalPrice: p.originalPrice || Math.round(p.price * 1.6),
                    category: p.category,
                    image: p.image,
                    rating: p.rating || 4.3,
                    reviewsCount: p.reviewsCount || 230,
                    badge: p.badge || "Assured",
                    freeDelivery: p.freeDelivery !== false,
                    sellerName: p.sellerName || "Verified Partner",
                    stock: typeof p.stock === "number" ? p.stock : 10,
                    reviews: p.reviews || [],
                }));
                displayProducts();
            }
        }
    } catch (_) {}
}

/* ==================================================
   PAYMENT METHOD SELECTION (Flipkart & Meesho Style)
================================================== */

let selectedPaymentMethod = "UPI";

function selectPaymentMethod(method, element) {
    selectedPaymentMethod = method;
    document.querySelectorAll(".payment-card").forEach(c => c.classList.remove("active"));
    if (element) {
        element.classList.add("active");
        const radio = element.querySelector("input[type='radio']");
        if (radio) radio.checked = true;
    }

    const upiForm = document.getElementById("upi-details");
    const cardForm = document.getElementById("card-details");
    const codForm = document.getElementById("cod-details");
    const netbankingForm = document.getElementById("netbanking-details");

    if (upiForm) upiForm.style.display = method === "UPI" ? "block" : "none";
    if (cardForm) cardForm.style.display = method === "Credit / Debit Card" ? "block" : "none";
    if (codForm) {
        codForm.style.display = method === "Cash on Delivery" ? "block" : "none";
        const codTotalEl = document.getElementById("cod-total-amount");
        const totalEl = document.getElementById("total");
        if (codTotalEl && totalEl) codTotalEl.textContent = totalEl.textContent;
    }
    if (netbankingForm) netbankingForm.style.display = method === "Net Banking" ? "block" : "none";
}

function verifyUpiId() {
    const upiInput = document.getElementById("upi-id-input");
    const msg = document.getElementById("upi-verify-msg");
    if (!upiInput) return;
    const val = upiInput.value.trim();
    if (!val || !val.includes("@")) {
        msg.textContent = "❌ Please enter a valid UPI ID (e.g. mobile@upi or name@okaxis)";
        msg.style.color = "#dc2626";
    } else {
        msg.textContent = `✅ UPI ID "${val}" verified! Safe payment authorized.`;
        msg.style.color = "#16a34a";
    }
}


/* ==================================================
   LOAD LOCAL STORAGE
================================================== */

let cart =
    JSON.parse(
        localStorage.getItem("shoppingCart")
    ) || [];


let wishlist =
    JSON.parse(
        localStorage.getItem("shoppingWishlist")
    ) || [];


let orders =
    JSON.parse(
        localStorage.getItem("shoppingOrders")
    ) || [];


let appliedCoupon =
    localStorage.getItem("appliedCoupon") || null;


/* ==================================================
   SAVE CART
================================================== */

function saveCart() {

    localStorage.setItem(
        "shoppingCart",
        JSON.stringify(cart)
    );

}


/* ==================================================
   SAVE WISHLIST
================================================== */

function saveWishlist() {

    localStorage.setItem(
        "shoppingWishlist",
        JSON.stringify(wishlist)
    );

}


/* ==================================================
   SAVE ORDERS
================================================== */

function saveOrders() {

    localStorage.setItem(
        "shoppingOrders",
        JSON.stringify(orders)
    );

}
/* ==================================================
   DISPLAY PRODUCTS (Flipkart & Meesho Style Cards)
================================================== */

function displayProducts(productArray = products) {

    const productList =
        document.getElementById("product-list");


    if (!productList) {
        return;
    }


    productList.innerHTML = "";


    if (productArray.length === 0) {

        productList.innerHTML =
            "<p class='no-products-msg'>No products found matching your search. Explore other categories!</p>";

        return;
    }


    productArray.forEach(product => {

        const card = document.createElement("div");
        card.className = "product-card fk-style-card";

        const prodId = product.id || product._id;
        const isWishlisted = wishlist.includes(prodId) || wishlist.includes(Number(prodId)) || wishlist.includes(String(prodId));

        const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
        const discountPercent = originalPrice > product.price
            ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
            : 0;

        const rating = product.rating || 4.3;
        const reviewsCount = product.reviewsCount || 240;
        const badge = product.badge || "Assured";
        const sellerName = product.sellerName || "Verified Partner";
        const stock = typeof product.stock === "number" ? product.stock : 15;
        const isOutOfStock = stock <= 0;

        const imageUrl = (product.image && (product.image.startsWith("http") || product.image.startsWith("data:")))
            ? product.image
            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600";

        card.innerHTML = `
            ${badge ? `<div class="card-badge ${badge.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${badge}</div>` : ""}

            <button
                class="wishlist-btn"
                onclick="toggleWishlist('${prodId}')"
                title="Save to Wishlist"
            >
                ${isWishlisted ? "❤️" : "🤍"}
            </button>

            <img
                class="product-image"
                src="${imageUrl}"
                alt="${product.name}"
                loading="lazy"
                onclick="openProductDetails('${prodId}')"
                style="cursor: pointer;"
            >

            <div class="card-content">
                <span class="seller-tag">${sellerName}</span>
                <h3 class="prod-title" onclick="openProductDetails('${prodId}')" style="cursor: pointer;">${product.name}</h3>
                <p class="prod-desc">${product.description}</p>

                <div class="rating-row">
                    <span class="rating-pill">★ ${rating}</span>
                    <span class="reviews-count">(${reviewsCount.toLocaleString()} ratings)</span>
                </div>

                <div class="price-row">
                    <span class="current-price">₹${product.price.toLocaleString("en-IN")}</span>
                    ${originalPrice > product.price ? `<span class="original-price">₹${originalPrice.toLocaleString("en-IN")}</span>` : ""}
                    ${discountPercent > 0 ? `<span class="discount-percent">${discountPercent}% off</span>` : ""}
                </div>

                <div class="stock-indicator">
                    ${isOutOfStock ? `<span class="stock-pill out-of-stock">⚠️ Out of Stock</span>` : `<span class="stock-pill in-stock">🟢 In Stock (${stock} available)</span>`}
                </div>

                <div class="delivery-tag">
                    🚚 <span>Free Delivery</span> • Daily Best Price
                </div>

                <div class="card-btn-row">
                    <button
                        class="quick-view-btn"
                        onclick="openProductDetails('${prodId}')"
                        title="View Full Product Details"
                    >
                        👁️ Quick View
                    </button>
                    <button
                        class="add-btn ${isOutOfStock ? 'disabled-btn' : ''}"
                        onclick="${isOutOfStock ? '' : `addToCart('${prodId}')`}"
                        ${isOutOfStock ? 'disabled' : ''}
                    >
                        ${isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                </div>
            </div>
        `;

        productList.appendChild(card);

    });

}
/* ==================================================
   SEARCH + FILTER
================================================== */

function filterProducts() {

    const searchElement =
        document.getElementById("search-input");


    const categoryElement =
        document.getElementById("category-filter");


    if (!searchElement || !categoryElement) {
        return;
    }


    const searchText =
        searchElement.value.toLowerCase();


    const selectedCategory =
        categoryElement.value;


    const filteredProducts =
        products.filter(product => {

            const matchesSearch =
                product.name
                    .toLowerCase()
                    .includes(searchText);


            const matchesCategory =
                selectedCategory === "all" ||
                product.category === selectedCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });

    const sortElement = document.getElementById("sort-filter");
    const sortValue = sortElement ? sortElement.value : "default";

    if (sortValue === "price-low") {
        filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortValue === "price-high") {
        filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortValue === "rating") {
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    displayProducts(filteredProducts);

}

/* ==================================================
   PRODUCT DETAILS MODAL (Flipkart & Meesho Quick View + Reviews)
================================================== */

function changeModalQty(delta, maxStock) {
    const input = document.getElementById("modal-qty-input");
    if (!input) return;
    let val = Number(input.value) || 1;
    val += delta;
    if (val < 1) val = 1;
    if (val > maxStock) {
        val = maxStock;
        showNotification(`Maximum available stock is ${maxStock} units ⚠️`);
    }
    input.value = val;
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

let currentModalRating = 5;

function setModalStarRating(rating) {
    currentModalRating = rating;
    const stars = document.querySelectorAll("#modal-star-group .star-pick");
    const labels = ["", "1.0 (Poor)", "2.0 (Fair)", "3.0 (Good)", "4.0 (Very Good)", "5.0 (Excellent)"];
    stars.forEach(star => {
        const val = Number(star.getAttribute("data-rating"));
        if (val <= rating) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
    const labelEl = document.getElementById("modal-star-label");
    if (labelEl) labelEl.textContent = labels[rating] || rating + ".0";
}

async function submitModalReview(productId) {
    const textarea = document.getElementById("modal-review-text");
    const comment = textarea ? textarea.value.trim() : "";
    if (!comment) {
        showNotification("Please write your review before submitting ✍️");
        if (textarea) textarea.focus();
        return;
    }

    let userName = "Customer";
    try {
        const user = JSON.parse(localStorage.getItem("shopease_user"));
        if (user && user.name) userName = user.name;
    } catch (_) {}

    const token = localStorage.getItem("shopease_token");
    try {
        const res = await fetch(`/api/products/${productId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: "Bearer " + token } : {}),
            },
            body: JSON.stringify({
                rating: currentModalRating,
                comment: comment,
                userName: userName,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            showNotification("⭐ Thank you! Your review has been posted.");
            // Update in products list
            const prod = products.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
            if (prod) {
                if (!prod.reviews) prod.reviews = [];
                prod.reviews.unshift(data.review);
                if (data.product) {
                    prod.rating = data.product.rating;
                    prod.reviewsCount = data.product.reviewsCount;
                }
            }
            openProductDetails(productId);
            displayProducts();
        } else {
            showNotification(data.error || "Could not post review ❌");
        }
    } catch (err) {
        showNotification("Could not post review: " + err.message);
    }
}

async function deleteProductReview(productId, reviewId) {
    if (!confirm("Are you sure you want to delete your review?")) return;
    const token = localStorage.getItem("shopease_token");
    if (!token) {
        showNotification("Please log in to manage your reviews.");
        return;
    }

    try {
        const res = await fetch(`/api/products/${productId}/review/${reviewId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token },
        });

        const data = await res.json();
        if (res.ok) {
            showNotification("Review deleted successfully 🗑️");
            const prod = products.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
            if (prod && prod.reviews) {
                prod.reviews = prod.reviews.filter(r => String(r._id) !== String(reviewId));
                if (data.product) {
                    prod.rating = data.product.rating;
                    prod.reviewsCount = data.product.reviewsCount;
                }
            }
            openProductDetails(productId);
            displayProducts();
        } else {
            showNotification(data.error || "Could not delete review.");
        }
    } catch (err) {
        showNotification("Error deleting review: " + err.message);
    }
}

function openProductDetails(productId) {
    const product = products.find(p => String(p.id) === String(productId) || String(p._id) === String(productId));
    if (!product) return;

    const modal = document.getElementById("product-detail-modal");
    const content = document.getElementById("modal-product-content");
    if (!modal || !content) return;

    const prodId = product.id || product._id;
    const isWishlisted = wishlist.includes(prodId) || wishlist.includes(Number(prodId)) || wishlist.includes(String(prodId));
    const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
    const discountPercent = originalPrice > product.price
        ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
        : 0;
    const savings = originalPrice > product.price ? originalPrice - product.price : 0;
    const stock = typeof product.stock === "number" ? product.stock : 15;
    const isOutOfStock = stock <= 0;
    const rating = product.rating || 4.3;
    const reviewsCount = product.reviewsCount || 240;
    const badge = product.badge || "Assured";
    const sellerName = product.sellerName || "Verified ShopEase Partner";

    const imageUrl = (product.image && (product.image.startsWith("http") || product.image.startsWith("data:")))
        ? product.image
        : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600";

    let currentUserId = null;
    let currentUserEmail = "";
    try {
        const u = JSON.parse(localStorage.getItem("shopease_user"));
        if (u) {
            currentUserId = u.id || u._id;
            currentUserEmail = u.email || "";
        }
    } catch (_) {}

    const reviews = product.reviews || [];

    // Check if current logged in customer has reviewed
    const myReview = reviews.find(r => {
        if (currentUserId && r.userId && String(r.userId) === String(currentUserId)) return true;
        if (currentUserEmail && r.userEmail && r.userEmail.toLowerCase() === currentUserEmail.toLowerCase()) return true;
        return false;
    });

    const isExistingReview = !!myReview;
    currentModalRating = myReview ? (Number(myReview.rating) || 5) : 5;

    let reviewsHTML = "";
    if (reviews.length > 0) {
        reviewsHTML = reviews.map(r => {
            const isOwner = (currentUserId && r.userId && String(r.userId) === String(currentUserId)) ||
                            (currentUserEmail && r.userEmail && r.userEmail.toLowerCase() === currentUserEmail.toLowerCase());
            return `
                <div class="review-item-card">
                    <div class="review-item-top">
                        <div class="reviewer-meta">
                            <strong class="review-author">👤 ${escapeHtml(r.userName || "Verified Buyer")}</strong>
                            ${r.isVerifiedPurchase ? '<span class="verified-badge">✅ Verified Purchase</span>' : '<span class="verified-badge">✅ Verified Buyer</span>'}
                        </div>
                        <div class="review-item-right">
                            <span class="review-star-pill">★ ${Number(r.rating || 5).toFixed(1)}</span>
                            <span class="review-date">${r.date || "Recently"}</span>
                            ${isOwner ? `<button type="button" class="del-review-btn" onclick="deleteProductReview('${prodId}', '${r._id}')" title="Delete your review">🗑️ Delete</button>` : ''}
                        </div>
                    </div>
                    <p class="review-comment-text">"${escapeHtml(r.comment || "")}"</p>
                </div>
            `;
        }).join("");
    } else {
        reviewsHTML = `
            <div class="no-reviews-box">
                <p>⭐ No customer reviews written yet for this product.</p>
                <p class="hint">Be the first verified customer to share your thoughts below!</p>
            </div>
        `;
    }

    content.innerHTML = `
        <div class="modal-product-grid">
            <div class="modal-image-col">
                <img src="${imageUrl}" alt="${product.name}" class="modal-large-img" />
                <span class="modal-badge-pill ${badge.toLowerCase().replace(/[^a-z0-9]/g, '-')}">${badge}</span>
            </div>

            <div class="modal-info-col">
                <span class="modal-seller">${sellerName}</span>
                <h2 class="modal-title">${product.name}</h2>

                <div class="rating-row">
                    <span class="rating-pill">★ ${rating}</span>
                    <span class="reviews-count">${reviewsCount.toLocaleString()} ratings & reviews</span>
                </div>

                <div class="modal-price-box">
                    <div class="price-row">
                        <span class="current-price" style="font-size: 26px;">₹${product.price.toLocaleString("en-IN")}</span>
                        ${originalPrice > product.price ? `<span class="original-price" style="font-size: 16px;">₹${originalPrice.toLocaleString("en-IN")}</span>` : ""}
                        ${discountPercent > 0 ? `<span class="discount-percent" style="font-size: 16px;">${discountPercent}% off</span>` : ""}
                    </div>
                    ${savings > 0 ? `<p class="savings-text">🎉 You save ₹${savings.toLocaleString("en-IN")} on this product!</p>` : ""}
                </div>

                <div class="modal-stock-status">
                    ${isOutOfStock
                        ? `<span class="stock-pill out-of-stock" style="font-size: 14px;">⚠️ Currently Out of Stock</span>`
                        : `<span class="stock-pill in-stock" style="font-size: 14px;">🟢 In Stock (${stock} units available)</span>`
                    }
                    <span class="delivery-highlight">🚚 Free Delivery in 3-4 Business Days</span>
                </div>

                <div class="modal-desc-box">
                    <h4>Product Highlights & Specifications:</h4>
                    <p>${product.description}</p>
                    <ul class="spec-list">
                        <li><strong>Category:</strong> ${product.category.toUpperCase()}</li>
                        <li><strong>Authenticity:</strong> 100% Genuine Meesho & Flipkart Partner Quality</li>
                        <li><strong>Return Policy:</strong> 7 Days Easy Replacement & Refund Guarantee</li>
                        <li><strong>Availability:</strong> ${stock > 0 ? `${stock} Units In Stock (Ready to Dispatch)` : 'Out of Stock'}</li>
                    </ul>
                </div>

                <div class="modal-qty-row" style="display: flex; align-items: center; gap: 12px; margin: 15px 0;">
                    <strong style="font-size: 14px;">Select Quantity:</strong>
                    <div style="display: flex; align-items: center; border: 1px solid #7c3aed; border-radius: 8px; overflow: hidden; background: white;">
                        <button type="button" style="padding: 6px 14px; background: rgba(124,58,237,0.1); border: none; cursor: pointer; font-size: 16px; font-weight: 700; color: #7c3aed;" onclick="changeModalQty(-1, ${stock})">-</button>
                        <input id="modal-qty-input" type="number" value="1" min="1" max="${stock}" style="width: 48px; text-align: center; border: none; font-size: 15px; font-weight: 700; color: #333;" readonly>
                        <button type="button" style="padding: 6px 14px; background: rgba(124,58,237,0.1); border: none; cursor: pointer; font-size: 16px; font-weight: 700; color: #7c3aed;" onclick="changeModalQty(1, ${stock})">+</button>
                    </div>
                    <span style="font-size: 13px; color: #6b7280;">(Max ${stock} units)</span>
                </div>

                <div class="modal-actions-row">
                    <button
                        class="modal-add-cart-btn ${isOutOfStock ? 'disabled-btn' : ''}"
                        onclick="${isOutOfStock ? '' : `addToCart('${prodId}', document.getElementById('modal-qty-input') ? Number(document.getElementById('modal-qty-input').value) : 1); closeProductDetails();`}"
                        ${isOutOfStock ? 'disabled' : ''}
                    >
                        ${isOutOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
                    </button>
                    <button
                        class="modal-wishlist-btn"
                        onclick="toggleWishlist('${prodId}'); openProductDetails('${prodId}');"
                    >
                        ${isWishlisted ? '❤️ Saved to Wishlist' : '🤍 Add to Wishlist'}
                    </button>
                </div>

                <!-- Customer Ratings & Reviews Section -->
                <div class="modal-reviews-section">
                    <div class="reviews-section-header">
                        <div>
                            <h4 class="reviews-title">⭐ Customer Ratings & Reviews</h4>
                            <p class="rating-summary-text">Average Rating: <strong>${rating} ★</strong> based on ${reviewsCount.toLocaleString()} ratings</p>
                        </div>
                    </div>

                    <!-- Interactive Customer Review Form -->
                    <div class="write-review-card">
                        <h5>✍️ ${isExistingReview ? 'Update Your Customer Review' : 'Rate & Review this Product'}</h5>
                        <p class="write-hint">Your review helps other shoppers make the best choice like on Meesho & Flipkart.</p>
                        
                        <div class="star-rating-select-row">
                            <span class="star-pick-label">Select Stars:</span>
                            <div class="star-group-interactive" id="modal-star-group">
                                ${[1, 2, 3, 4, 5].map(s => `
                                    <span class="star-pick ${s <= currentModalRating ? 'active' : ''}" data-rating="${s}" onclick="setModalStarRating(${s})">★</span>
                                `).join('')}
                            </div>
                            <span id="modal-star-label" class="star-label-badge">${currentModalRating}.0 (${currentModalRating === 5 ? 'Excellent' : currentModalRating === 4 ? 'Very Good' : currentModalRating === 3 ? 'Good' : currentModalRating === 2 ? 'Fair' : 'Poor'})</span>
                        </div>

                        <div class="review-textarea-row">
                            <textarea id="modal-review-text" rows="2" placeholder="Write your review: quality, fit, color, material, or delivery experience...">${myReview ? escapeHtml(myReview.comment) : ''}</textarea>
                        </div>

                        <button type="button" class="post-review-btn" onclick="submitModalReview('${prodId}')">
                            🚀 ${isExistingReview ? 'Update My Customer Review' : 'Submit Customer Review'}
                        </button>
                    </div>

                    <!-- Customer Reviews Feed -->
                    <div class="reviews-feed">
                        <h5>Recent Customer Reviews (${reviews.length})</h5>
                        <div class="reviews-scroll-list">
                            ${reviewsHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    modal.classList.add("open");
}

function closeProductDetails() {
    const modal = document.getElementById("product-detail-modal");
    if (modal) modal.classList.remove("open");
}

function handleModalBackdropClick(e) {
    if (e.target.id === "product-detail-modal") {
        closeProductDetails();
    }
}


/* ==================================================
   ADD TO CART
================================================== */

function addToCart(productId, quantityToAdd = 1) {

    const product =
        products.find(
            item => String(item.id) === String(productId) || String(item._id) === String(productId)
        );

    if (!product) {
        return;
    }

    const availableStock = typeof product.stock === "number" ? product.stock : 10;
    if (availableStock <= 0) {
        showNotification("Sorry, " + product.name + " is Out of Stock ❌");
        return;
    }

    const qty = Math.max(1, Number(quantityToAdd) || 1);
    const existingItem =
        cart.find(
            item => String(item.id) === String(productId) || String(item._id) === String(productId)
        );

    if (existingItem) {
        if (existingItem.quantity + qty > availableStock) {
            existingItem.quantity = availableStock;
            showNotification(`Adjusted to maximum available stock (${availableStock} units) ⚠️`);
        } else {
            existingItem.quantity += qty;
        }
    } else {
        cart.push({
            ...product,
            quantity: Math.min(qty, availableStock)
        });
    }

    saveCart();
    updateCart();
    updateCounts();
    showNotification(`${product.name} (x${qty}) added to cart 🛒`);
}
/* ==================================================
   UPDATE CART
================================================== */

function updateCart() {

    const cartItems =
        document.getElementById("cart-items");


    if (!cartItems) {
        return;
    }


    const subtotalElement =
        document.getElementById("subtotal");


    const discountElement =
        document.getElementById("discount");


    const totalElement =
        document.getElementById("total");


    cartItems.innerHTML = "";


    if (cart.length === 0) {

        cartItems.innerHTML =
            "<p>Your cart is empty.</p>";

        if (subtotalElement) {
            subtotalElement.textContent =
                "0.00";
        }

        if (discountElement) {
            discountElement.textContent =
                "0.00";
        }

        if (totalElement) {
            totalElement.textContent =
                "0.00";
        }

        return;
    }


    let subtotal = 0;


    cart.forEach(item => {

        subtotal +=
            item.price *
            item.quantity;


        const cartItem =
            document.createElement("div");


        cartItem.className =
            "cart-item";


        cartItem.innerHTML = `

            <div class="cart-item-info">

                <h3>
                    ${item.name}
                </h3>

                <p>
                    ₹${item.price}
                    ×
                    ${item.quantity}
                </p>

            </div>


            <div class="quantity-controls">

                <button
                    onclick="decreaseQuantity('${item.id}')"
                >
                    −
                </button>

                <span>
                    ${item.quantity}
                </span>

                <button
                    onclick="increaseQuantity('${item.id}')"
                >
                    +
                </button>

            </div>


            <strong>
                ₹${(
                    item.price *
                    item.quantity
                ).toFixed(2)}
            </strong>


            <button
                class="remove-btn"
                onclick="removeFromCart('${item.id}')"
            >
                Remove
            </button>

        `;


        cartItems.appendChild(cartItem);

    });


    let discount = 0;


    if (appliedCoupon === "SAVE10") {

        discount =
            subtotal * 0.10;

    }


    if (appliedCoupon === "SAVE20") {

        discount =
            subtotal * 0.20;

    }


    const total =
        subtotal - discount;


    if (subtotalElement) {

        subtotalElement.textContent =
            subtotal.toFixed(2);

    }


    if (discountElement) {

        discountElement.textContent =
            discount.toFixed(2);

    }


    if (totalElement) {

        totalElement.textContent =
            total.toFixed(2);

    }

}
/* ==================================================
   INCREASE
================================================== */

function increaseQuantity(productId) {

    const item =
        cart.find(
            item => String(item.id) === String(productId) || String(item._id) === String(productId)
        );

    if (item) {
        const product = products.find(
            p => String(p.id) === String(productId) || String(p._id) === String(productId)
        );
        const availableStock = product && typeof product.stock === "number" ? product.stock : 50;

        if (item.quantity >= availableStock) {
            showNotification(`Maximum available stock reached (${availableStock} units) ⚠️`);
            return;
        }

        item.quantity++;

        saveCart();

        updateCart();

        updateCounts();

    }

}


/* ==================================================
   DECREASE
================================================== */

function decreaseQuantity(productId) {

    const item =
        cart.find(
            item => String(item.id) === String(productId) || String(item._id) === String(productId)
        );

    if (!item) {
        return;
    }

    item.quantity--;

    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCart();
        updateCounts();
    }

}

/* ==================================================
   REMOVE
================================================== */

function removeFromCart(productId) {

    const product =
        cart.find(
            item => String(item.id) === String(productId) || String(item._id) === String(productId)
        );

    cart =
        cart.filter(
            item => String(item.id) !== String(productId) && String(item._id) !== String(productId)
        );

    saveCart();
    updateCart();
    updateCounts();

    if (product) {
        showNotification(
            product.name +
            " removed from cart 🗑️"
        );
    }

}


/* ==================================================
   CLEAR CART
================================================== */

function clearCart() {

    if (cart.length === 0) {

        showNotification(
            "Cart is already empty"
        );

        return;
    }


    cart = [];

    appliedCoupon = null;


    saveCart();


    localStorage.removeItem(
        "appliedCoupon"
    );


    updateCart();

    updateCounts();


    const couponInput =
        document.getElementById(
            "coupon-input"
        );


    const couponMessage =
        document.getElementById(
            "coupon-message"
        );


    if (couponInput) {

        couponInput.value = "";

    }


    if (couponMessage) {

        couponMessage.textContent = "";

    }


    showNotification(
        "Cart cleared successfully"
    );

}


/* ==================================================
   COUPON
================================================== */

function applyCoupon() {

    const input =
        document.getElementById(
            "coupon-input"
        );


    const message =
        document.getElementById(
            "coupon-message"
        );


    if (!input || !message) {
        return;
    }


    const code =
        input.value
            .trim()
            .toUpperCase();


    if (cart.length === 0) {

        message.textContent =
            "❌ Add products to cart first.";

        return;
    }


    if (code === "SAVE10") {

        appliedCoupon = "SAVE10";


        localStorage.setItem(
            "appliedCoupon",
            appliedCoupon
        );


        message.textContent =
            "🎉 10% discount applied!";


        updateCart();

    }

    else if (code === "SAVE20") {

        appliedCoupon = "SAVE20";


        localStorage.setItem(
            "appliedCoupon",
            appliedCoupon
        );


        message.textContent =
            "🎉 20% discount applied!";


        updateCart();

    }

    else {

        message.textContent =
            "❌ Invalid coupon code.";

    }

}


/* ==================================================
   WISHLIST (With MongoDB User Sync & Move-to-Cart)
================================================== */

async function toggleWishlist(productId) {
    const index = wishlist.findIndex(id => String(id) === String(productId));
    const product = products.find(item => String(item.id) === String(productId) || String(item._id) === String(productId));
    const token = localStorage.getItem("shopease_token");

    if (index === -1) {
        wishlist.push(productId);
        showNotification((product ? product.name : "Product") + " added to wishlist ❤️");

        if (token) {
            try {
                await fetch("/api/wishlist", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token,
                    },
                    body: JSON.stringify({ productId }),
                });
            } catch (_) {}
        }
    } else {
        wishlist.splice(index, 1);
        showNotification((product ? product.name : "Product") + " removed from wishlist");

        if (token) {
            try {
                await fetch("/api/wishlist/" + productId, {
                    method: "DELETE",
                    headers: { Authorization: "Bearer " + token },
                });
            } catch (_) {}
        }
    }

    saveWishlist();
    displayProducts();
    displayWishlist();
    updateCounts();
}

function moveToCart(productId) {
    const product = products.find(item => String(item.id) === String(productId) || String(item._id) === String(productId));
    if (!product) return;

    addToCart(productId);

    // Remove from wishlist
    wishlist = wishlist.filter(id => String(id) !== String(productId));
    saveWishlist();

    const token = localStorage.getItem("shopease_token");
    if (token) {
        fetch("/api/wishlist/" + productId, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token },
        }).catch(() => {});
    }

    displayWishlist();
    displayProducts();
    updateCounts();
    showNotification(`${product.name} moved to cart 🛒`);
}

/* ==================================================
   WISHLIST BACKEND SYNC (MongoDB Persisted for Users)
================================================== */

async function syncWishlistFromBackend() {
    const token = localStorage.getItem("shopease_token");
    if (!token) return;

    try {
        const res = await fetch("/api/wishlist", {
            headers: { Authorization: "Bearer " + token },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.wishlist && Array.isArray(data.wishlist)) {
                wishlist = data.wishlist;
                saveWishlist();
            }
            if (data.products && Array.isArray(data.products) && data.products.length > 0) {
                data.products.forEach(p => {
                    const pid = String(p._id || p.id);
                    const idx = products.findIndex(existing => String(existing._id || existing.id) === pid);
                    if (idx === -1) {
                        products.push({
                            id: p._id || p.id,
                            _id: p._id || p.id,
                            name: p.name,
                            description: p.description,
                            price: p.price,
                            originalPrice: p.originalPrice || Math.round(p.price * 1.6),
                            category: p.category,
                            image: p.image,
                            rating: p.rating || 4.3,
                            reviewsCount: p.reviewsCount || 230,
                            badge: p.badge || "Assured",
                            freeDelivery: p.freeDelivery !== false,
                            sellerName: p.sellerName || "Verified Partner",
                            stock: typeof p.stock === "number" ? p.stock : 10,
                            reviews: p.reviews || [],
                        });
                    }
                });
            }
            displayWishlist();
            updateCounts();
        }
    } catch (_) {}
}

/* ==================================================
   DISPLAY WISHLIST (Fully Resolved from MongoDB Atlas)
================================================== */

function displayWishlist() {
    const wishlistItems = document.getElementById("wishlist-items");
    if (!wishlistItems) return;

    wishlistItems.innerHTML = "";

    const token = localStorage.getItem("shopease_token");
    if (!token) {
        wishlistItems.innerHTML = `
            <div class="empty-orders-card">
                <p style="font-size: 48px; margin-bottom: 10px;">🔒</p>
                <h3>Please Login to View Your Wishlist</h3>
                <p>Sign in to save products across devices and access them anytime.</p>
                <a href="login.html" class="shop-btn" style="margin-top: 15px;">🔑 Login to Account</a>
            </div>
        `;
        return;
    }

    if (!wishlist || wishlist.length === 0) {
        wishlistItems.innerHTML = `
            <div class="empty-orders-card">
                <p style="font-size: 48px; margin-bottom: 10px;">❤️</p>
                <h3>Your wishlist is empty</h3>
                <p>Explore trending products and tap the heart icon to save your favorites!</p>
                <a href="products.html" class="shop-btn" style="margin-top: 15px;">Explore Products</a>
            </div>
        `;
        return;
    }

    wishlist.forEach(productId => {
        const product = products.find(item => String(item.id) === String(productId) || String(item._id) === String(productId));
        if (!product) return;

        const prodId = product._id || product.id || productId;
        const originalPrice = product.originalPrice || Math.round(product.price * 1.6);
        const discountPercent = originalPrice > product.price
            ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
            : 0;
        const stock = typeof product.stock === "number" ? product.stock : 10;
        const isOutOfStock = stock <= 0;

        const imageUrl = product.image && (product.image.startsWith("http") || product.image.startsWith("data:"))
            ? product.image
            : "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600";

        const card = document.createElement("div");
        card.className = "wishlist-card fk-wishlist-card";

        card.innerHTML = `
            <img src="${imageUrl}" alt="${product.name}" class="wishlist-img" onclick="openProductDetails('${prodId}')" style="cursor: pointer;">
            <div class="wishlist-details">
                <span class="seller-tag">${product.sellerName || "Verified ShopEase Partner"}</span>
                <h3 onclick="openProductDetails('${prodId}')" style="cursor: pointer;">${product.name}</h3>
                <div class="price-row">
                    <span class="current-price">₹${product.price.toLocaleString("en-IN")}</span>
                    ${originalPrice > product.price ? `<span class="original-price">₹${originalPrice.toLocaleString("en-IN")}</span>` : ""}
                    ${discountPercent > 0 ? `<span class="discount-percent">${discountPercent}% off</span>` : ""}
                </div>
                <div class="rating-row" style="margin-top: 4px; margin-bottom: 6px;">
                    <span class="rating-pill">★ ${product.rating || 4.3}</span>
                    <span class="reviews-count">(${product.reviewsCount || 0} reviews)</span>
                </div>
                <div class="stock-indicator" style="margin-bottom: 8px;">
                    ${isOutOfStock ? `<span class="stock-pill out-of-stock">⚠️ Out of Stock</span>` : `<span class="stock-pill in-stock">🟢 In Stock (${stock} left)</span>`}
                </div>
            </div>
            <div class="wishlist-actions">
                <button
                    class="move-to-cart-btn ${isOutOfStock ? 'disabled-btn' : ''}"
                    onclick="${isOutOfStock ? '' : `moveToCart('${prodId}')`}"
                    ${isOutOfStock ? 'disabled' : ''}
                >
                    🛒 Move to Cart
                </button>
                <button
                    class="remove-wishlist-btn"
                    onclick="toggleWishlist('${prodId}')"
                    title="Remove from Wishlist"
                >
                    Remove ✕
                </button>
            </div>
        `;

        wishlistItems.appendChild(card);
    });
}

/* ==================================================
   DELIVERY ADDRESS MANAGEMENT (Meesho & Flipkart Style)
================================================== */

function initDeliveryAddress() {
    const nameInput = document.getElementById("shipping-name");
    if (!nameInput) return; // not on cart.html

    const saved = localStorage.getItem("shopease_shipping_address");
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem("shopease_user"));
    } catch (_) {}

    const phoneInput = document.getElementById("shipping-phone");
    const pincodeInput = document.getElementById("shipping-pincode");
    const houseInput = document.getElementById("shipping-house");
    const streetInput = document.getElementById("shipping-street");
    const landmarkInput = document.getElementById("shipping-landmark");
    const cityInput = document.getElementById("shipping-city");
    const stateInput = document.getElementById("shipping-state");

    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (nameInput) nameInput.value = data.name || (user ? user.name : "");
            if (phoneInput) phoneInput.value = data.phone || "";
            if (pincodeInput) pincodeInput.value = data.pincode || "";
            if (houseInput) houseInput.value = data.house || "";
            if (streetInput) streetInput.value = data.street || "";
            if (landmarkInput) landmarkInput.value = data.landmark || "";
            if (cityInput) cityInput.value = data.city || "";
            if (stateInput) stateInput.value = data.state || "";

            if (data.type) {
                const radio = document.querySelector(`input[name="addressType"][value="${data.type}"]`);
                if (radio) radio.checked = true;
            }

            renderSavedAddressPreview(data);
            showSavedAddressView();
            return;
        } catch (_) {}
    }

    if (user && user.name && nameInput && !nameInput.value) {
        nameInput.value = user.name;
    }
    showAddressFormView();
}

function renderSavedAddressPreview(data) {
    const previewName = document.getElementById("preview-addr-name");
    const previewType = document.getElementById("preview-addr-type");
    const previewPhone = document.getElementById("preview-addr-phone");
    const previewFull = document.getElementById("preview-addr-full");

    if (previewName) previewName.textContent = data.name || "Customer";
    if (previewType) previewType.textContent = (data.type || "HOME").toUpperCase();
    if (previewPhone) previewPhone.textContent = "📞 " + (data.phone || "No phone");

    let fullStr = `${data.house || ""}, ${data.street || ""}`;
    if (data.landmark) fullStr += `, Near ${data.landmark}`;
    fullStr += `, ${data.city || ""}, ${data.state || ""} - ${data.pincode || ""}`;

    if (previewFull) previewFull.textContent = fullStr;

    const hidden = document.getElementById("shipping-address");
    if (hidden) {
        hidden.value = `${data.name}, Phone: ${data.phone}, ${fullStr} (${data.type || "Home"})`;
    }
}

function showSavedAddressView() {
    const preview = document.getElementById("saved-address-preview");
    const form = document.getElementById("address-form-container");
    const btn = document.getElementById("toggle-address-btn");
    if (preview) preview.style.display = "block";
    if (form) form.style.display = "none";
    if (btn) btn.textContent = "✏️ Change Address";
}

function showAddressFormView() {
    const preview = document.getElementById("saved-address-preview");
    const form = document.getElementById("address-form-container");
    const btn = document.getElementById("toggle-address-btn");
    if (preview) preview.style.display = "none";
    if (form) form.style.display = "block";
    if (btn) btn.textContent = "👁️ View Saved Address";
}

function toggleAddressForm() {
    const form = document.getElementById("address-form-container");
    if (!form) return;
    if (form.style.display === "none") {
        showAddressFormView();
    } else {
        const saved = localStorage.getItem("shopease_shipping_address");
        if (saved) {
            showSavedAddressView();
        } else {
            showNotification("Please enter and save your address first 📝");
        }
    }
}

function saveCustomerAddress(showNotice = false) {
    const name = document.getElementById("shipping-name")?.value.trim() || "";
    const phone = document.getElementById("shipping-phone")?.value.trim() || "";
    const pincode = document.getElementById("shipping-pincode")?.value.trim() || "";
    const house = document.getElementById("shipping-house")?.value.trim() || "";
    const street = document.getElementById("shipping-street")?.value.trim() || "";
    const landmark = document.getElementById("shipping-landmark")?.value.trim() || "";
    const city = document.getElementById("shipping-city")?.value.trim() || "";
    const state = document.getElementById("shipping-state")?.value.trim() || "";
    const typeRadio = document.querySelector("input[name='addressType']:checked");
    const type = typeRadio ? typeRadio.value : "Home";

    if (!name) {
        showNotification("Please enter recipient full name 👤");
        document.getElementById("shipping-name")?.focus();
        return null;
    }
    if (!phone || phone.length < 10) {
        showNotification("Please enter a valid 10-digit mobile number 📞");
        document.getElementById("shipping-phone")?.focus();
        return null;
    }
    if (!pincode || pincode.length < 6) {
        showNotification("Please enter a valid 6-digit Pincode 📍");
        document.getElementById("shipping-pincode")?.focus();
        return null;
    }
    if (!house) {
        showNotification("Please enter Flat/House No. 🏠");
        document.getElementById("shipping-house")?.focus();
        return null;
    }
    if (!street) {
        showNotification("Please enter Area/Street 🛣️");
        document.getElementById("shipping-street")?.focus();
        return null;
    }
    if (!city) {
        showNotification("Please enter Town/City 🏙️");
        document.getElementById("shipping-city")?.focus();
        return null;
    }
    if (!state) {
        showNotification("Please enter State 🗺️");
        document.getElementById("shipping-state")?.focus();
        return null;
    }

    const addrData = { name, phone, pincode, house, street, landmark, city, state, type };
    localStorage.setItem("shopease_shipping_address", JSON.stringify(addrData));

    renderSavedAddressPreview(addrData);
    showSavedAddressView();

    if (showNotice) {
        showNotification("✅ Delivery address confirmed & saved!");
    }
    return addrData;
}

/* ==================================================
   CHECKOUT (With Order Tracking & MongoDB Sync)
================================================== */

async function checkout() {
    if (cart.length === 0) {
        showNotification("Your cart is empty 🛒");
        return;
    }

    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });

    let discount = 0;
    if (appliedCoupon === "SAVE10") {
        discount = subtotal * 0.10;
    } else if (appliedCoupon === "SAVE20") {
        discount = subtotal * 0.20;
    }

    const total = subtotal - discount;

    let currentUser = null;
    try {
        currentUser = JSON.parse(localStorage.getItem("shopease_user"));
    } catch (_) {}

    // Delivery Address Validation & Extraction
    let addrData = null;
    const formContainer = document.getElementById("address-form-container");
    if (formContainer && formContainer.style.display !== "none") {
        addrData = saveCustomerAddress(false);
        if (!addrData) return;
    } else {
        const saved = localStorage.getItem("shopease_shipping_address");
        if (saved) {
            try { addrData = JSON.parse(saved); } catch (_) {}
        }
        if (!addrData && formContainer) {
            showAddressFormView();
            addrData = saveCustomerAddress(false);
            if (!addrData) return;
        }
    }

    let shippingAddress = "";
    let deliveryAddress = {};
    if (addrData) {
        let streetLine = `${addrData.house}, ${addrData.street}`;
        if (addrData.landmark) streetLine += `, Near ${addrData.landmark}`;
        shippingAddress = `${addrData.name}, Ph: ${addrData.phone}, ${streetLine}, ${addrData.city}, ${addrData.state} - ${addrData.pincode} (${addrData.type || "Home"})`;
        deliveryAddress = {
            fullName: addrData.name,
            phone: addrData.phone,
            street: streetLine,
            city: addrData.city,
            state: addrData.state,
            pincode: addrData.pincode,
        };
    } else {
        const addressInput = document.getElementById("shipping-address");
        shippingAddress = (addressInput && addressInput.value.trim()) || "108 Central Residency, MG Road, Bengaluru";
    }

    const paymentMethod = selectedPaymentMethod || "Cash on Delivery";
    let paymentDetails = {};

    if (paymentMethod === "UPI") {
        const upiVal = document.getElementById("upi-id-input")?.value?.trim() || "customer@upi";
        paymentDetails = { upiId: upiVal };
    } else if (paymentMethod === "Credit / Debit Card") {
        const cardVal = document.getElementById("card-number-input")?.value?.trim() || "•••• 4242";
        paymentDetails = { cardLast4: cardVal.slice(-4) };
    } else if (paymentMethod === "Net Banking") {
        const bankVal = document.getElementById("bank-select")?.value || "HDFC Bank";
        paymentDetails = { bank: bankVal };
    }

    const paymentStatus = paymentMethod === "Cash on Delivery"
        ? "Pending (Pay on Delivery)"
        : "Paid (" + paymentMethod + ")";

    const orderId = "ORD" + Date.now();
    const trackingNumber = "TRK-" + Math.floor(100000 + Math.random() * 900000);
    const orderDate = new Date().toLocaleString();
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });

    const order = {
        id: orderId,
        orderId: orderId,
        date: orderDate,
        items: [...cart],
        subtotal: subtotal,
        discount: discount,
        total: total,
        customer: currentUser ? currentUser.name : "Shopper",
        customerEmail: currentUser ? currentUser.email : "",
        shippingAddress: shippingAddress,
        deliveryAddress: deliveryAddress,
        carrier: "ShopEase Express",
        trackingNumber: trackingNumber,
        estimatedDelivery: estimatedDelivery,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        paymentDetails: paymentDetails,
        status: "Confirmed",
        timeline: [
            {
                status: "Confirmed",
                time: orderDate,
                note: `Order placed via ${paymentMethod} (${paymentStatus}).`,
            },
        ],
    };

    orders.unshift(order);
    saveOrders();

    // Sync order to MongoDB Atlas
    const token = localStorage.getItem("shopease_token");
    try {
        await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: "Bearer " + token } : {}),
            },
            body: JSON.stringify(order),
        });
    } catch (_) {}

    cart = [];
    appliedCoupon = null;
    saveCart();
    localStorage.removeItem("appliedCoupon");
    updateCart();
    updateCounts();

    if (addressInput) {
        addressInput.value = "";
    }

    const couponInput = document.getElementById("coupon-input");
    const couponMessage = document.getElementById("coupon-message");
    if (couponInput) couponInput.value = "";
    if (couponMessage) couponMessage.textContent = "";

    showNotification("Order placed! Tracking: " + trackingNumber + " 🚚");

    if (
        confirm(
            "🎉 Order Placed Successfully!\n\n" +
            "Order ID: " + orderId + "\n" +
            "Tracking Number: " + trackingNumber + "\n" +
            "Payment Method: " + paymentMethod + " (" + paymentStatus + ")\n" +
            "Estimated Delivery: " + estimatedDelivery + "\n" +
            "Total Amount: ₹" + total.toFixed(2) + "\n\n" +
            "Would you like to track your order now?"
        )
    ) {
        window.location.href = "orders.html";
    }
}


/* ==================================================
   DISPLAY ORDERS & LIVE TRACKER
================================================== */

let currentOrderFilter = "all";

function filterOrdersByStatus(filter, btn) {
    currentOrderFilter = filter;
    document.querySelectorAll(".filter-tab").forEach(tab => tab.classList.remove("active"));
    if (btn) btn.classList.add("active");
    displayOrders();
}

function displayOrders(ordersToDisplay = null) {

    const ordersList = document.getElementById("orders-list");
    if (!ordersList) {
        return;
    }

    ordersList.innerHTML = "";

    const token = localStorage.getItem("shopease_token");
    if (!token) {
        ordersList.innerHTML = `
            <div class="empty-orders-card">
                <p style="font-size: 48px; margin-bottom: 10px;">🔒</p>
                <h3>Please Login to View Your Orders</h3>
                <p>Sign in to your account to track your orders, view delivery timeline, and submit reviews.</p>
                <a href="login.html" class="shop-btn" style="margin-top: 15px;">🔑 Login to Account</a>
            </div>
        `;
        return;
    }

    let list = ordersToDisplay || orders;

    if (currentOrderFilter === "active") {
        list = list.filter(o => o.status !== "Delivered" && o.status !== "Cancelled");
    } else if (currentOrderFilter === "Delivered") {
        list = list.filter(o => o.status === "Delivered");
    }

    if (list.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-orders-card">
                <p style="font-size: 42px; margin-bottom: 10px;">📦</p>
                <h3>No orders found</h3>
                <p>Start shopping to place your first order and track its delivery live!</p>
                <a href="products.html" class="shop-btn" style="margin-top: 15px;">Shop Now</a>
            </div>
        `;
        return;
    }

    const steps = [
        { key: "Confirmed", label: "Confirmed", icon: "📝" },
        { key: "Processing", label: "Packed", icon: "📦" },
        { key: "Shipped", label: "Out for Delivery", icon: "🚚" },
        { key: "Delivered", label: "Delivered", icon: "✅" },
    ];

    list.forEach(order => {

        const card = document.createElement("div");
        card.className = "order-card";
        card.id = "order-" + (order.orderId || order.id);

        const currentStatus = order.status || "Confirmed";
        const isCancelled = currentStatus === "Cancelled";

        let activeStepIndex = 0;
        if (currentStatus === "Processing") activeStepIndex = 1;
        else if (currentStatus === "Shipped") activeStepIndex = 2;
        else if (currentStatus === "Delivered") activeStepIndex = 3;

        const progressPercent = isCancelled
            ? 0
            : (activeStepIndex / (steps.length - 1)) * 100;

        // Stepper HTML
        let stepperHTML = "";
        if (!isCancelled) {
            stepperHTML = `
                <div class="order-tracker-box">
                    <div class="tracker-header">
                        <h4>🚚 Live Order Tracking</h4>
                        <span class="carrier-badge">Carrier: ${order.carrier || "ShopEase Express"}</span>
                    </div>

                    <div class="stepper-wrapper">
                        <div class="stepper-progress-bg">
                            <div class="stepper-progress-fill" style="width: ${progressPercent}%;"></div>
                        </div>

                        <div class="stepper-steps">
                            ${steps
                                .map((step, idx) => {
                                    const isCompleted = idx <= activeStepIndex;
                                    const isCurrent = idx === activeStepIndex;
                                    return `
                                        <div class="stepper-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}">
                                            <div class="step-circle">${step.icon}</div>
                                            <div class="step-label">${step.label}</div>
                                        </div>
                                    `;
                                })
                                .join("")}
                        </div>
                    </div>

                    <div class="tracking-meta-grid">
                        <div class="meta-item">
                            <span class="meta-label">Tracking Number</span>
                            <strong>${order.trackingNumber || "TRK-000000"}</strong>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Estimated Delivery</span>
                            <strong>${order.estimatedDelivery || "In 3-4 days"}</strong>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Delivery Address</span>
                            <span>${order.shippingAddress || "Registered Customer Address"}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Payment Mode</span>
                            <span class="payment-method-badge">${order.paymentMethod === "Cash on Delivery" ? "💵 Cash on Delivery" : order.paymentMethod === "UPI" ? "📱 UPI" : "💳 " + (order.paymentMethod || "Card")} (${order.paymentStatus || "Confirmed"})</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            stepperHTML = `
                <div class="order-cancelled-banner">
                    ⚠️ This order was cancelled.
                </div>
            `;
        }

        let productsHTML = "";
        order.items.forEach(item => {
            const pid = item.productId || item.id || "";
            productsHTML += `
                <div class="order-product-row">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" class="order-thumb" />` : ""}
                    <div class="order-prod-details">
                        <strong>${item.name}</strong>
                        <p>₹${item.price} × ${item.quantity}</p>
                    </div>
                    <div class="order-prod-actions" style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
                        <div class="order-prod-total">
                            ₹${(item.price * item.quantity).toFixed(2)}
                        </div>
                        <button type="button" class="order-rate-btn" onclick="openOrderReviewModal('${pid}', '${(item.name || '').replace(/'/g, "\\'")}')">
                            ⭐ Rate & Review
                        </button>
                    </div>
                </div>
            `;
        });

        // Status badge color class
        const statusClass = "status-" + currentStatus.toLowerCase();

        card.innerHTML = `
            <div class="order-header">
                <div>
                    <h3 class="order-title">Order #${order.orderId || order.id}</h3>
                    <small class="order-date">Placed on ${order.date}</small>
                </div>
                <div class="order-header-right">
                    <span class="order-status-badge ${statusClass}">
                        ${currentStatus}
                    </span>
                </div>
            </div>

            ${stepperHTML}

            <div class="order-items-wrapper">
                <h4>Items Ordered (${order.items.reduce((sum, i) => sum + i.quantity, 0)})</h4>
                ${productsHTML}
            </div>

            <div class="order-footer">
                <div class="order-actions">
                    ${
                        !isCancelled && currentStatus !== "Delivered"
                            ? `
                                <button class="track-action-btn advance-btn" onclick="advanceOrderStatus('${order.orderId || order.id}')">
                                    ⏩ Advance Tracker
                                </button>
                                <button class="track-action-btn cancel-btn" onclick="cancelOrder('${order.orderId || order.id}')">
                                    ❌ Cancel Order
                                </button>
                            `
                            : ""
                    }
                </div>
                <div class="order-total-summary">
                    ${order.discount > 0 ? `<small>Discount: -₹${order.discount.toFixed(2)}</small><br>` : ""}
                    <strong>Total Paid: ₹${order.total.toFixed(2)}</strong>
                </div>
            </div>
        `;

        ordersList.appendChild(card);
    });
}


/* ==================================================
   ADVANCE ORDER STATUS (Simulation / Real-time Tracker)
================================================== */

function advanceOrderStatus(orderId) {
    const order = orders.find(o => o.orderId === orderId || o.id === orderId);
    if (!order) return;

    const sequence = ["Confirmed", "Processing", "Shipped", "Delivered"];
    const currentIndex = sequence.indexOf(order.status || "Confirmed");

    if (currentIndex < sequence.length - 1) {
        order.status = sequence[currentIndex + 1];
        if (!order.timeline) order.timeline = [];
        order.timeline.push({
            status: order.status,
            time: new Date().toLocaleString(),
            note: `Package moved to ${order.status}.`,
        });

        saveOrders();

        // Sync with MongoDB backend if reachable
        fetch(`/api/orders/${order.orderId || order.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: order.status }),
        }).catch(() => {});

        displayOrders();
        showNotification(`Order #${orderId} is now ${order.status}! 🚚`);
    } else {
        showNotification("This order has already been Delivered! 🎉");
    }
}


/* ==================================================
   CANCEL ORDER
================================================== */

async function cancelOrder(orderId) {
    const order = orders.find(o => o.orderId === orderId || o.id === orderId);
    if (!order) return;

    if (["Shipped", "Out for Delivery", "Delivered", "Cancelled"].includes(order.status)) {
        alert(`Order #${orderId} is currently "${order.status}" and cannot be cancelled.`);
        return;
    }

    if (confirm("Are you sure you want to cancel Order #" + orderId + "?")) {
        const token = localStorage.getItem("shopease_token");
        try {
            const res = await fetch(`/api/orders/${order.orderId || order.id}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: "Bearer " + token } : {}),
                },
            });
            const data = await res.json();
            if (res.ok) {
                order.status = "Cancelled";
                saveOrders();
                displayOrders();
                showNotification(`Order #${orderId} cancelled & stock restored! ✅`);
                syncOrdersFromBackend();
            } else {
                alert(data.error || "Could not cancel order.");
            }
        } catch (err) {
            alert("Error cancelling order: " + err.message);
        }
    }
}


/* ==================================================
   TRACK ORDER SEARCH
================================================== */

function searchAndTrackOrder() {
    const input = document.getElementById("track-input");
    const msg = document.getElementById("track-message");
    if (!input) return;

    const query = input.value.trim().toUpperCase();
    if (!query) {
        if (msg) msg.textContent = "Please enter an Order ID or Tracking Number.";
        return;
    }

    const matches = orders.filter(o => {
        const oId = (o.orderId || o.id || "").toUpperCase();
        const trk = (o.trackingNumber || "").toUpperCase();
        return oId.includes(query) || trk.includes(query);
    });

    if (matches.length > 0) {
        if (msg) msg.textContent = `✅ Found ${matches.length} matching order(s)!`;
        displayOrders(matches);

        // Scroll to the first match
        const firstCard = document.getElementById("order-" + (matches[0].orderId || matches[0].id));
        if (firstCard) {
            firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
            firstCard.style.outline = "3px solid #7c3aed";
            setTimeout(() => {
                firstCard.style.outline = "";
            }, 2500);
        }
    } else {
        if (msg) msg.textContent = `❌ No orders found matching "${query}". Try your Order ID (e.g. ORD...).`;
    }
}

function clearTrackSearch() {
    const input = document.getElementById("track-input");
    const msg = document.getElementById("track-message");
    if (input) input.value = "";
    if (msg) msg.textContent = "";
    currentOrderFilter = "all";
    document.querySelectorAll(".filter-tab").forEach((t, i) => {
        if (i === 0) t.classList.add("active");
        else t.classList.remove("active");
    });
    displayOrders();
}

/* ==================================================
   ORDER PRODUCT RATING & REVIEW MODAL
================================================== */

let orderReviewTargetId = null;
let currentOrderRating = 5;

function openOrderReviewModal(productId, productName) {
    orderReviewTargetId = productId;
    currentOrderRating = 5;
    const modal = document.getElementById("order-review-modal");
    const titleEl = document.getElementById("review-product-title");
    const commentEl = document.getElementById("order-review-comment");
    if (titleEl) titleEl.textContent = productName ? "Review for: " + productName : "Rate this item";
    if (commentEl) commentEl.value = "";
    setOrderPickerRating(5);
    if (modal) modal.classList.add("open");
}

function closeOrderReviewModal() {
    const modal = document.getElementById("order-review-modal");
    if (modal) modal.classList.remove("open");
    orderReviewTargetId = null;
}

function handleOrderReviewBackdrop(e) {
    if (e.target.id === "order-review-modal") {
        closeOrderReviewModal();
    }
}

function setOrderPickerRating(rating) {
    currentOrderRating = rating;
    const stars = document.querySelectorAll("#order-stars .star");
    const labels = ["", "1.0 - Poor", "2.0 - Fair", "3.0 - Good", "4.0 - Very Good", "5.0 - Excellent"];
    stars.forEach(star => {
        const val = Number(star.getAttribute("data-val"));
        if (val <= rating) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });
    const labelEl = document.getElementById("order-rating-text");
    if (labelEl) labelEl.textContent = labels[rating] || rating + ".0";
}

async function submitOrderReview() {
    if (!orderReviewTargetId) {
        showNotification("Please select a product to review.");
        return;
    }
    const commentInput = document.getElementById("order-review-comment");
    const comment = commentInput ? commentInput.value.trim() : "";
    if (!comment) {
        showNotification("Please enter your review feedback ✍️");
        if (commentInput) commentInput.focus();
        return;
    }

    let userName = "Customer";
    try {
        const user = JSON.parse(localStorage.getItem("shopease_user"));
        if (user && user.name) userName = user.name;
    } catch (_) {}

    const token = localStorage.getItem("shopease_token");
    try {
        const res = await fetch(`/api/products/${orderReviewTargetId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: "Bearer " + token } : {}),
            },
            body: JSON.stringify({
                rating: currentOrderRating,
                comment: comment,
                userName: userName,
            }),
        });

        const data = await res.json();
        if (res.ok) {
            closeOrderReviewModal();
            showNotification("⭐ Thank you! Your product review has been submitted.");
            fetchProductsFromBackend();
        } else {
            showNotification(data.error || "Could not submit review ❌");
        }
    } catch (err) {
        showNotification("Could not submit review: " + err.message);
    }
}


/* ==================================================
   SYNC ORDERS FROM MONGODB BACKEND
================================================== */

async function syncOrdersFromBackend() {
    const token = localStorage.getItem("shopease_token");
    if (!token) return;

    try {
        const res = await fetch("/api/orders", {
            headers: { Authorization: "Bearer " + token },
        });

        if (res.ok) {
            const data = await res.json();
            if (data.orders) {
                orders = data.orders.map(backendOrder => ({
                    id: backendOrder.orderId,
                    orderId: backendOrder.orderId,
                    date: new Date(backendOrder.createdAt || Date.now()).toLocaleString(),
                    items: backendOrder.items || [],
                    subtotal: backendOrder.subtotal,
                    discount: backendOrder.discount,
                    total: backendOrder.total,
                    customer: backendOrder.customer,
                    customerEmail: backendOrder.customerEmail,
                    shippingAddress: backendOrder.shippingAddress,
                    deliveryAddress: backendOrder.deliveryAddress,
                    carrier: backendOrder.carrier,
                    trackingNumber: backendOrder.trackingNumber,
                    estimatedDelivery: backendOrder.estimatedDelivery,
                    status: backendOrder.status || "Placed",
                    timeline: backendOrder.timeline || [],
                }));
                saveOrders();
                displayOrders();
            }
        }
    } catch (_) {}
}


/* ==================================================
   UPDATE COUNTS
================================================== */

function updateCounts() {

    const cartCount =
        document.getElementById(
            "cart-count"
        );


    const wishlistCount =
        document.getElementById(
            "wishlist-count"
        );


    if (cartCount) {

        let count = 0;


        cart.forEach(item => {

            count += item.quantity;

        });


        cartCount.textContent =
            count;

    }


    if (wishlistCount) {

        wishlistCount.textContent =
            wishlist.length;

    }

}


/* ==================================================
   DARK MODE
================================================== */

function toggleTheme() {

    document.body.classList.toggle(
        "dark"
    );


    const button =
        document.getElementById(
            "theme-btn"
        );


    if (
        document.body.classList.contains(
            "dark"
        )
    ) {

        if (button) {
            button.textContent = "☀️";
        }


        localStorage.setItem(
            "theme",
            "dark"
        );

    } else {

        if (button) {
            button.textContent = "🌙";
        }


        localStorage.setItem(
            "theme",
            "light"
        );

    }

}


/* ==================================================
   LOAD THEME
================================================== */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "theme"
        );


    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark"
        );


        const button =
            document.getElementById(
                "theme-btn"
            );


        if (button) {

            button.textContent =
                "☀️";

        }

    }

}


/* ==================================================
   NOTIFICATION
================================================== */

function showNotification(message) {

    const notification =
        document.getElementById(
            "notification"
        );


    if (!notification) {
        return;
    }


    notification.textContent =
        message;


    notification.style.display =
        "block";


    setTimeout(() => {

        notification.style.display =
            "none";

    }, 2500);

}


/* ==================================================
   ACCOUNT - SIGN UP
================================================== */
/* ==================================================
   ACCOUNT - SIGN UP (MongoDB)
================================================== */
async function signup() {
    const name     = document.getElementById("signup-name").value.trim();
    const email    = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const message  = document.getElementById("signup-message");

    if (!name || !email || !password) {
        message.textContent = "❌ Please fill all fields.";
        return;
    }

    if (password.length < 6) {
        message.textContent = "❌ Password must contain at least 6 characters.";
        return;
    }

    try {
        const res  = await fetch("/api/auth/register", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ name, email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            message.textContent = "❌ " + data.error;
            return;
        }

        localStorage.setItem("shopease_token", data.token);
        localStorage.setItem("shopease_user",  JSON.stringify(data.user));

        message.textContent = "🎉 Account created successfully!";

        document.getElementById("signup-name").value     = "";
        document.getElementById("signup-email").value    = "";
        document.getElementById("signup-password").value = "";

        setTimeout(() => loadAccount(), 700);
    } catch (err) {
        message.textContent = "❌ Cannot connect to server. Is the backend running?";
    }
}


/* ==================================================
   ACCOUNT - LOGIN
================================================== */

/* ==================================================
   ACCOUNT - LOGIN (MongoDB)
================================================== */
async function login() {
    const email    = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const message  = document.getElementById("login-message");

    if (!email || !password) {
        message.textContent = "❌ Please fill all fields.";
        return;
    }

    try {
        const res  = await fetch("/api/auth/login", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (!res.ok) {
            message.textContent = "❌ " + data.error;
            return;
        }

        localStorage.setItem("shopease_token", data.token);
        localStorage.setItem("shopease_user",  JSON.stringify(data.user));

        message.textContent = "🎉 Login successful!";
        setTimeout(() => loadAccount(), 700);
    } catch (err) {
        message.textContent = "❌ Cannot connect to server. Is the backend running?";
    }
}
/* ==================================================
   SHOW LOGIN
================================================== */

function showLogin() {

    const loginForm =
        document.getElementById(
            "login-form"
        );


    const signupForm =
        document.getElementById(
            "signup-form"
        );


    const loginTab =
        document.getElementById(
            "login-tab"
        );


    const signupTab =
        document.getElementById(
            "signup-tab"
        );


    if (!loginForm) {
        return;
    }


    loginForm.classList.remove(
        "hidden"
    );


    signupForm.classList.add(
        "hidden"
    );


    loginTab.classList.add(
        "active-tab"
    );


    signupTab.classList.remove(
        "active-tab"
    );

}


/* ==================================================
   SHOW SIGNUP
================================================== */

function showSignup() {

    const loginForm =
        document.getElementById(
            "login-form"
        );


    const signupForm =
        document.getElementById(
            "signup-form"
        );


    const loginTab =
        document.getElementById(
            "login-tab"
        );


    const signupTab =
        document.getElementById(
            "signup-tab"
        );


    if (!signupForm) {
        return;
    }


    signupForm.classList.remove(
        "hidden"
    );


    loginForm.classList.add(
        "hidden"
    );


    signupTab.classList.add(
        "active-tab"
    );


    loginTab.classList.remove(
        "active-tab"
    );

}


/* ==================================================
   LOAD ACCOUNT
================================================== */

/* ==================================================
   LOAD ACCOUNT (MongoDB / localStorage)
================================================== */

function loadAccount() {
    const authSection    = document.getElementById("auth-section");
    const profileSection = document.getElementById("profile-section");

    if (!authSection || !profileSection) return;

    const token = localStorage.getItem("shopease_token");
    const raw   = localStorage.getItem("shopease_user");
    let user = null;
    try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }

    if (!token || !user) {
        authSection.classList.remove("hidden");
        profileSection.classList.add("hidden");
        return;
    }

    authSection.classList.add("hidden");
    profileSection.classList.remove("hidden");

    const nameEl  = document.getElementById("profile-name");
    const emailEl = document.getElementById("profile-email");

    if (nameEl)  nameEl.textContent  = user.name  || "User";
    if (emailEl) emailEl.textContent = user.email || "";

    const addrEl = document.getElementById("account-saved-address");
    if (addrEl) {
        const rawAddr = localStorage.getItem("shopease_shipping_address");
        let addr = null;
        try { addr = rawAddr ? JSON.parse(rawAddr) : null; } catch (_) {}
        if (addr) {
            addrEl.innerHTML = `
                <div style="font-size: 14px; line-height: 1.6;">
                    <strong>${addr.name}</strong> • <span style="background: rgba(124,58,237,0.15); color: #7c3aed; padding: 2px 8px; border-radius: 6px; font-size: 12px; font-weight: 700;">${addr.type || 'HOME'}</span><br>
                    📞 ${addr.phone}<br>
                    ${addr.house}, ${addr.street}${addr.landmark ? `, Near ${addr.landmark}` : ''}<br>
                    ${addr.city}, ${addr.state} - <strong>${addr.pincode}</strong>
                </div>
            `;
        }
    }
}


/* ==================================================
   LOGOUT (MongoDB / Clean Browser Session)
================================================== */

function logout() {
    try {
        localStorage.removeItem("shopease_token");
        localStorage.removeItem("shopease_user");
        localStorage.removeItem("shopease_seller_token");
        localStorage.removeItem("shopease_seller_user");
        sessionStorage.clear();
    } catch (_) {}

    try {
        fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    } catch (_) {}

    window.location.href = "login.html";
}

function updateNavbarAuth() {
    const nav = document.querySelector("header nav");
    if (!nav) return;

    const token = localStorage.getItem("shopease_token");
    const rawUser = localStorage.getItem("shopease_user");
    let user = null;
    try { user = rawUser ? JSON.parse(rawUser) : null; } catch (_) {}

    const accountLink = Array.from(nav.querySelectorAll("a")).find(a => (a.getAttribute("href") || "").includes("account.html"));

    if (token && user) {
        if (accountLink) {
            accountLink.innerHTML = `👤 ${user.name ? user.name.split(' ')[0] : 'Account'}`;
            accountLink.title = `Logged in as ${user.name || user.email}`;
        }
        if (!nav.querySelector(".nav-logout-btn")) {
            const logoutLink = document.createElement("a");
            logoutLink.href = "#";
            logoutLink.className = "nav-logout-btn";
            logoutLink.innerHTML = "🚪 Logout";
            logoutLink.style.cursor = "pointer";
            logoutLink.onclick = function(e) {
                e.preventDefault();
                logout();
            };
            const themeBtn = document.getElementById("theme-btn");
            if (themeBtn) {
                nav.insertBefore(logoutLink, themeBtn);
            } else {
                nav.appendChild(logoutLink);
            }
        }
    } else {
        if (accountLink) {
            accountLink.innerHTML = `🔑 Login`;
            accountLink.href = "login.html";
        }
    }
}

/* ==================================================
   START
================================================== */

updateNavbarAuth();
displayProducts();
fetchProductsFromBackend();
syncOrdersFromBackend();
syncWishlistFromBackend();
initDeliveryAddress();

displayWishlist();

displayOrders();

updateCart();

updateCounts();

loadTheme();

loadAccount();

/* Products are loaded from the static array above.
   They can be extended to load from MongoDB in a future update. */
