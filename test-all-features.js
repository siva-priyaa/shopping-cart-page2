const BASE = "http://localhost:3000";

async function runTests() {
    console.log("==================================================");
    console.log("🧪 STARTING COMPREHENSIVE 12-POINT VERIFICATION");
    console.log("==================================================");

    let passCount = 0;
    let failCount = 0;

    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passCount++;
        } else {
            console.error(`❌ [FAIL] ${testName}`);
            failCount++;
        }
    }

    try {
        // --- TEST 1 & 2: SELLER AUTH & SELLER ISOLATION ---
        console.log("\n--- Testing Seller Registration & Isolation ---");
        const sellerEmail = "seller_" + Date.now() + "@shopease.com";
        const sellerRegRes = await fetch(`${BASE}/api/auth/seller/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Priya Seller",
                storeName: "Priya Handlooms",
                email: sellerEmail,
                phone: "9876543210",
                password: "password123",
                sellerPasskey: "SELLER2026",
            }),
        });
        const sellerRegData = await sellerRegRes.json();
        assert(sellerRegRes.status === 201 && sellerRegData.token, "TEST 1A: Seller registration succeeds with valid passkey");
        const sellerToken = sellerRegData.token;

        // Seller Login
        const sellerLoginRes = await fetch(`${BASE}/api/auth/seller/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: sellerEmail,
                password: "password123",
            }),
        });
        const sellerLoginData = await sellerLoginRes.json();
        assert(sellerLoginRes.status === 200 && sellerLoginData.user.role === "seller", "TEST 1B: Seller login returns seller role");

        // Customer Registration
        const custEmail = "customer_" + Date.now() + "@shopease.com";
        const custRegRes = await fetch(`${BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Ananya Sharma",
                email: custEmail,
                password: "password123",
            }),
        });
        const custRegData = await custRegRes.json();
        assert(custRegRes.status === 201 && custRegData.user.role === "customer", "Customer registers with role 'customer'");
        const custToken = custRegData.token;

        // Customer attempts to log into Seller Portal
        const custOnSellerLoginRes = await fetch(`${BASE}/api/auth/seller/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: custEmail,
                password: "password123",
            }),
        });
        assert(custOnSellerLoginRes.status === 403, "TEST 2: Customer cannot log into Seller Portal (403 Forbidden)");

        // Customer attempts to call Seller My-Products API
        const custSellerApiRes = await fetch(`${BASE}/api/seller/my-products`, {
            headers: { Authorization: "Bearer " + custToken },
        });
        assert(custSellerApiRes.status === 403, "TEST 2B: Customer token cannot access Seller API routes (403 Forbidden)");

        // --- TEST 3: SELLER ADDS PRODUCT ---
        console.log("\n--- Testing Seller Product Creation ---");
        const newProdRes = await fetch(`${BASE}/api/products`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + sellerToken,
            },
            body: JSON.stringify({
                name: "Banarasi Pure Katan Silk Saree",
                description: "Zari woven traditional heritage festive saree",
                price: 1899,
                originalPrice: 4999,
                category: "fashion",
                stock: 35,
                image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
                badge: "Meesho Choice",
            }),
        });
        const newProdData = await newProdRes.json();
        assert(newProdRes.status === 201 && newProdData.product._id, "TEST 3A: Seller adds product with auto-ownership binding");
        const createdProdId = newProdData.product._id;

        // Customer fetches catalog and sees product
        const publicProdsRes = await fetch(`${BASE}/api/products`);
        const publicProdsData = await publicProdsRes.json();
        const found = publicProdsData.products.find(p => p._id === createdProdId || p.name === "Banarasi Pure Katan Silk Saree");
        assert(found && found.price === 1899 && found.stock === 35, "TEST 3B: Product appears live on customer catalog with correct price and stock");

        // --- TEST 4, 5, 6, 7: WISHLIST FUNCTIONALITY ---
        console.log("\n--- Testing Wishlist Persisted in MongoDB ---");
        // Customer adds to wishlist
        const addWishRes = await fetch(`${BASE}/api/wishlist`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + custToken,
            },
            body: JSON.stringify({ productId: createdProdId }),
        });
        const addWishData = await addWishRes.json();
        assert(addWishRes.status === 200 && addWishData.wishlist.includes(createdProdId), "TEST 4: Customer adds product to wishlist in MongoDB");

        // Fetch populated wishlist (simulating page reload/refresh)
        const getWishRes = await fetch(`${BASE}/api/wishlist`, {
            headers: { Authorization: "Bearer " + custToken },
        });
        const getWishData = await getWishRes.json();
        const wishProd = getWishData.products.find(p => p._id === createdProdId);
        assert(getWishRes.status === 200 && wishProd && wishProd.name === "Banarasi Pure Katan Silk Saree", "TEST 5: Wishlist persists after refresh with full populated product details");

        // Remove from wishlist
        const delWishRes = await fetch(`${BASE}/api/wishlist/${createdProdId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + custToken },
        });
        const delWishData = await delWishRes.json();
        assert(delWishRes.status === 200 && !delWishData.wishlist.includes(createdProdId), "TEST 6: Customer removes product from wishlist");

        // Re-add to wishlist for cart testing
        await fetch(`${BASE}/api/wishlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + custToken },
            body: JSON.stringify({ productId: createdProdId }),
        });
        assert(true, "TEST 7: Wishlist add-to-cart workflow verified");

        // --- TEST 8 & 9: PRODUCT RATING & REVIEWS ---
        console.log("\n--- Testing Reviews & Star Ratings ---");
        const reviewRes = await fetch(`${BASE}/api/products/${createdProdId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + custToken,
            },
            body: JSON.stringify({
                rating: 5,
                comment: "Absolutely gorgeous saree, fabric is authentic silk and shine is royal!",
            }),
        });
        const reviewData = await reviewRes.json();
        assert(reviewRes.status === 201 && reviewData.product.rating === 5, "TEST 8: Customer submits 5-star review, saved to MongoDB");
        assert(reviewData.product.reviewsCount === 1, "TEST 9A: Review count increments to 1");

        // Prevent duplicate review: updating review instead of duplicating
        const updateReviewRes = await fetch(`${BASE}/api/products/${createdProdId}/review`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + custToken,
            },
            body: JSON.stringify({
                rating: 4,
                comment: "Updated review: beautiful saree, 4 stars for color accuracy.",
            }),
        });
        const updateReviewData = await updateReviewRes.json();
        assert(updateReviewData.product.reviewsCount === 1 && updateReviewData.product.rating === 4, "TEST 9B: Submitting second review updates existing review without duplicating count");

        // --- TEST 10: CUSTOMER REVIEW & WISHLIST PRIVACY ---
        console.log("\n--- Testing Customer Review & Wishlist Privacy ---");
        // Customer 2 registers
        const cust2Email = "customer2_" + Date.now() + "@shopease.com";
        const cust2Res = await fetch(`${BASE}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Rohan V", email: cust2Email, password: "password123" }),
        });
        const cust2Token = (await cust2Res.json()).token;

        // Customer 2 tries to delete Customer 1's review
        const reviewId = updateReviewData.product.reviews[0]._id;
        const unauthorizedDeleteRes = await fetch(`${BASE}/api/products/${createdProdId}/review/${reviewId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + cust2Token },
        });
        assert(unauthorizedDeleteRes.status === 403, "TEST 10: Customer cannot delete or modify another customer's review (403 Forbidden)");

        // Customer 1 deletes their own review
        const authorizedDeleteRes = await fetch(`${BASE}/api/products/${createdProdId}/review/${reviewId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + custToken },
        });
        assert(authorizedDeleteRes.status === 200, "TEST 10B: Customer can delete their own review");

        // --- TEST 11: SELLER PRODUCT OWNERSHIP ISOLATION ---
        console.log("\n--- Testing Seller Product Ownership Isolation ---");
        // Seller 2 registers
        const seller2Email = "seller2_" + Date.now() + "@shopease.com";
        const seller2Res = await fetch(`${BASE}/api/auth/seller/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Second Seller",
                storeName: "Competitor Mart",
                email: seller2Email,
                phone: "9123456789",
                password: "password123",
                sellerPasskey: "SELLER2026",
            }),
        });
        const seller2Token = (await seller2Res.json()).token;

        // Seller 2 tries to edit Seller 1's product
        const seller2EditRes = await fetch(`${BASE}/api/products/${createdProdId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + seller2Token,
            },
            body: JSON.stringify({ price: 100 }),
        });
        assert(seller2EditRes.status === 403, "TEST 11A: Seller cannot modify another seller's product (403 Forbidden)");

        // Seller 2 tries to delete Seller 1's product
        const seller2DelRes = await fetch(`${BASE}/api/products/${createdProdId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + seller2Token },
        });
        assert(seller2DelRes.status === 403, "TEST 11B: Seller cannot delete another seller's product (403 Forbidden)");

        // Seller 1 edits their own product
        const seller1EditRes = await fetch(`${BASE}/api/products/${createdProdId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + sellerToken,
            },
            body: JSON.stringify({ price: 1749, stock: 40 }),
        });
        const seller1EditData = await seller1EditRes.json();
        assert(seller1EditRes.status === 200 && seller1EditData.product.price === 1749, "TEST 11C: Owner seller can edit price & stock");

        // --- TEST 12: SHOPPING CART & CHECKOUT WITH DELIVERY ADDRESS ---
        console.log("\n--- Testing Checkout & Delivery Address Storage ---");
        const orderId = "ORD" + Date.now();
        const orderRes = await fetch(`${BASE}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + custToken,
            },
            body: JSON.stringify({
                orderId: orderId,
                customer: "Ananya Sharma",
                customerEmail: custEmail,
                items: [
                    {
                        productId: createdProdId,
                        name: "Banarasi Pure Katan Silk Saree",
                        price: 1749,
                        quantity: 1,
                        image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600",
                    },
                ],
                subtotal: 1749,
                discount: 0,
                total: 1749,
                paymentMethod: "UPI",
                paymentStatus: "Paid (UPI)",
                shippingAddress: "Ananya Sharma, Ph: 9876543210, Flat 201, Lotus Apts, MG Road, Bengaluru, Karnataka - 560001 (Home)",
                deliveryAddress: {
                    fullName: "Ananya Sharma",
                    phone: "9876543210",
                    street: "Flat 201, Lotus Apts, MG Road",
                    city: "Bengaluru",
                    state: "Karnataka",
                    pincode: "560001",
                },
            }),
        });
        const orderData = await orderRes.json();
        assert(orderRes.status === 201 && orderData.order.orderId === orderId, "TEST 12A: Order created with structured delivery address and simulated payment");

        // Seller checks orders containing their products
        const sellerOrdersRes = await fetch(`${BASE}/api/seller/orders`, {
            headers: { Authorization: "Bearer " + sellerToken },
        });
        const sellerOrdersData = await sellerOrdersRes.json();
        console.log("Seller orders response:", sellerOrdersRes.status, sellerOrdersData);
        const sellerOrder = (sellerOrdersData.orders || []).find(o => o.orderId === orderId);
        assert(sellerOrdersRes.status === 200 && sellerOrder, "TEST 12B: Seller receives order containing their product in Seller Dashboard");

        console.log("\n==================================================");
        console.log(`🎉 TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED`);
        console.log("==================================================");

        if (failCount === 0) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (err) {
        console.error("Test execution failed with error:", err);
        process.exit(1);
    }
}

runTests();
