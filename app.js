/* =========================================================
   UNIT ONE — Application Engine (Full Version)
   ========================================================= */

const ADMIN_CLEAR_ID = "admin_super";
const ADMIN_PASSWORD = "SuperuserPak2026!";

const STORAGE_KEYS = {
    users: "u1_users",
    reviews: "u1_reviews",
    product: "u1_product",
    session: "u1_session",
};

const DEFAULT_PRODUCT = {
    title: "New Featured Product",
    image: "https://via.placeholder.com/400",
    price: "0"
};

/* ---------------------------------------------------------
   DATA PERSISTENCE
   --------------------------------------------------------- */
function loadJSON(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
}

function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

const getUsers = () => loadJSON(STORAGE_KEYS.users, []);
const setUsers = (users) => saveJSON(STORAGE_KEYS.users, users);
const getReviews = () => loadJSON(STORAGE_KEYS.reviews, []);
const setReviews = (reviews) => saveJSON(STORAGE_KEYS.reviews, reviews);
const getProduct = () => loadJSON(STORAGE_KEYS.product, DEFAULT_PRODUCT);
const setProduct = (product) => saveJSON(STORAGE_KEYS.product, product);
const getSession = () => loadJSON(STORAGE_KEYS.session, null);
const setSession = (session) => saveJSON(STORAGE_KEYS.session, session);

/* ---------------------------------------------------------
   MODAL UI CONTROL (MISSING PIECES RESTORED)
   --------------------------------------------------------- */
function openAuthModal(tab) {
    const overlay = $("#authModalOverlay");
    if(overlay) overlay.classList.remove("hidden");
    switchAuthTab(tab || "signin");
}

function closeAuthModal() {
    const overlay = $("#authModalOverlay");
    if(overlay) overlay.classList.add("hidden");
}

function switchAuthTab(tab) {
    const isSignIn = tab === "signin";
    $("#tabSignIn")?.classList.toggle("active", isSignIn);
    $("#tabSignUp")?.classList.toggle("active", !isSignIn);
    $("#signInForm")?.classList.toggle("hidden", !isSignIn);
    $("#signUpForm")?.classList.toggle("hidden", isSignIn);
}

/* ---------------------------------------------------------
   RENDER FUNCTIONS
   --------------------------------------------------------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function renderAuthArea() {
    const session = getSession();
    const authArea = $("#authArea");
    if (!authArea) return;
    
    if (!session) {
        authArea.innerHTML = `<button class="btn btn-ghost" id="navSignInBtn">Sign In</button>`;
        $("#navSignInBtn")?.addEventListener("click", () => openAuthModal("signin"));
    } else {
        authArea.innerHTML = `<div class="session-chip"><span>${session.clearId}</span></div>
                              <button class="btn btn-ghost btn-small" id="logOutBtn">Log Out</button>`;
        $("#logOutBtn")?.addEventListener("click", () => { localStorage.removeItem(STORAGE_KEYS.session); renderAll(); });
    }
}

function renderProductPanel() {
    const p = getProduct();
    const panel = $("#productPanel");
    if (panel) {
        panel.innerHTML = `
            <img src="${p.image}" alt="${p.title}" style="width:100%; border-radius:10px;">
            <h3>${p.title}</h3>
            <p style="font-size: 1.2rem; font-weight: bold;">Rs. ${p.price}</p>
        `;
    }
}

function renderReviewFeed() {
    const reviews = getReviews();
    const session = getSession();
    const isAdmin = session?.isAdmin;
    const feed = $("#reviewFeed");
    if (!feed) return;

    if (reviews.length === 0) {
        feed.innerHTML = "<p>No reviews yet. Be the first!</p>";
        return;
    }

    feed.innerHTML = reviews.map(r => `
        <article class="review-card">
            <strong>${r.clearId}</strong> — ${'★'.repeat(r.rating)}
            <p><strong>✅ Good:</strong> ${r.pros}</p>
            <p><strong>❌ Bad:</strong> ${r.cons}</p>
            ${isAdmin ? `<button class="btn btn-danger btn-small" onclick="deleteReview('${r.id}')">Delete</button>` : ""}
        </article>
    `).join("");
}

function renderAdminUI() {
    const session = getSession();
    const adminSection = $("#productManagerSection");
    if (!adminSection) return;
    
    if (session?.isAdmin) {
        adminSection.classList.remove("hidden");
        const p = getProduct();
        $("#pmTitle").value = p.title;
        $("#pmImage").value = p.image;
        $("#pmPrice").value = p.price;
    } else {
        adminSection.classList.add("hidden");
    }
}

function renderAll() {
    renderAuthArea();
    renderProductPanel();
    renderReviewFeed();
    renderAdminUI();
}

/* ---------------------------------------------------------
   HANDLERS & LOGIC
   --------------------------------------------------------- */
function handleAdminUpdate(e) {
    e.preventDefault();
    const updated = {
        title: $("#pmTitle").value,
        image: $("#pmImage").value,
        price: $("#pmPrice").value
    };
    setProduct(updated);
    renderAll();
    $("#pmConfirm").innerText = "Updated!";
    setTimeout(() => $("#pmConfirm").innerText = "", 2000);
}

function deleteReview(id) {
    let reviews = getReviews().filter(r => r.id !== id);
    setReviews(reviews);
    renderAll();
}

function handleReviewSubmit(e) {
    e.preventDefault();
    const session = getSession();
    if (!session) return alert("Sign in first!");
    
    const newReview = {
        id: Date.now().toString(),
        clearId: session.clearId,
        rating: Number($("#ratingValue").value),
        pros: $("#prosInput").value,
        cons: $("#consInput").value
    };
    
    let reviews = getReviews();
    reviews.push(newReview);
    setReviews(reviews);
    $("#reviewForm").reset();
    renderAll();
}

/* ---------------------------------------------------------
   INIT
   --------------------------------------------------------- */
function init() {
    // Modal Close
    $("#modalCloseBtn")?.addEventListener("click", closeAuthModal);
    
    // Tab switching
    $("#tabSignIn")?.addEventListener("click", () => switchAuthTab("signin"));
    $("#tabSignUp")?.addEventListener("click", () => switchAuthTab("signup"));

    // Forms
    $("#productManagerForm")?.addEventListener("submit", handleAdminUpdate);
    $("#reviewForm")?.addEventListener("submit", handleReviewSubmit);

    // Sign In Logic
    $("#signInForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = $("#siClearId").value;
        const pass = $("#siPassword").value;
        if (id === ADMIN_CLEAR_ID && pass === ADMIN_PASSWORD) {
            setSession({ clearId: id, isAdmin: true });
        } else {
            let users = getUsers();
            let user = users.find(u => u.clearId === id && u.password === pass);
            if(user) {
                setSession({ clearId: id, isAdmin: false });
            } else {
                return alert("Invalid Login");
            }
        }
        closeAuthModal();
        renderAll();
    });

    // Sign Up Logic
    $("#signUpForm")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const users = getUsers();
        const newUser = {
            clearId: $("#suClearId").value,
            password: $("#suPassword").value
        };
        users.push(newUser);
        setUsers(users);
        alert("Account Created! You can now Sign In.");
        switchAuthTab("signin");
    });

    renderAll();
}

document.addEventListener("DOMContentLoaded", init);