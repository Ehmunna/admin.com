// ===========================================
// COMPLETE WORKING ADMIN SCRIPT
// ===========================================
console.log('🚀 Admin Panel Loading...');

// Global variables
let db = null;
let auth = null;
let currentUser = null;

// DOM Elements
const sections = document.querySelectorAll('.content-section');
const navLinks = document.querySelectorAll('.sidebar-nav li');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const addProductBtn = document.getElementById('addProductBtn');
const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
const logoutBtn = document.getElementById('logoutBtn');
const statusFilter = document.getElementById('statusFilter');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM Loaded');
    initApp();
});

// Main initialization
async function initApp() {
    try {
        // Setup event listeners first
        setupEventListeners();
        
        // Initialize Firebase
        await initFirebase();
        
        // Load initial data
        await loadInitialData();
        
        console.log('✅ Admin Panel Ready');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showErrorMessage('Failed to initialize. Check console for details.');
        
        // Try to load anyway with mock data
        setTimeout(() => {
            loadMockData();
        }, 2000);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            if (section) {
                switchSection(section);
            }
        });
    });
    
    // Product modal
    addProductBtn?.addEventListener('click', () => openProductModal());
    
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            productModal.style.display = 'none';
        });
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });
    
    // Product form
    productForm?.addEventListener('submit', handleProductSubmit);
    
    // Status filter
    statusFilter?.addEventListener('change', applyOrderFilter);
    
    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Dynamic events
    document.addEventListener('click', handleDynamicClicks);
    document.addEventListener('change', handleDynamicChanges);
}

// Switch sections
function switchSection(sectionId) {
    // Update nav
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-section="${sectionId}"]`)?.classList.add('active');
    
    // Update content
    sections.forEach(section => section.classList.remove('active'));
    document.getElementById(sectionId)?.classList.add('active');
    
    // Update header
    const header = document.querySelector('.header-left h1');
    const activeLink = document.querySelector(`[data-section="${sectionId}"] a`);
    if (header && activeLink) {
        header.textContent = activeLink.textContent.trim();
    }
}

// Initialize Firebase
async function initFirebase() {
    try {
        console.log('🔥 Initializing Firebase...');
        
        // Load Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        
        // Firebase configuration (CORRECTED)
        const firebaseConfig = {
            apiKey: "AIzaSyC2Bsd-HqfhhC8i5cQUF2ZmofUJaFIcvDs",
            authDomain: "lamim-754aa.firebaseapp.com",
            projectId: "lamim-754aa",
            storageBucket: "lamim-754aa.firebasestorage.app",
            messagingSenderId: "1087897423283",
            appId: "1:1087897423283:web:10a57c0acf8879fc1e4fc6",
            measurementId: "G-R5SNM13YMG"
        };
        
        // Initialize
        const app = initializeApp(firebaseConfig, 'AdminApp');
        db = getFirestore(app);
        auth = getAuth(app);
        
        // Set global
        window.db = db;
        window.auth = auth;
        
        console.log('✅ Firebase Initialized');
        
        // Try auto login
        await tryAutoLogin();
        
    } catch (error) {
        console.error('❌ Firebase init error:', error);
        throw error;
    }
}

// Try auto login
async function tryAutoLogin() {
    try {
        const { signInWithEmailAndPassword, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        
        // Check current auth state
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log('👤 User logged in:', user.email);
                currentUser = user;
                document.querySelector('.user-info span').textContent = user.email;
            } else {
                console.log('👤 No user logged in');
                showLoginButton();
            }
        });
        
    } catch (error) {
        console.log('Auto login check failed:', error);
    }
}

// Show login button
function showLoginButton() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !headerRight.querySelector('.login-btn')) {
        const loginBtn = document.createElement('button');
        loginBtn.className = 'btn-primary login-btn';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        loginBtn.onclick = showLoginModal;
        headerRight.appendChild(loginBtn);
    }
}

// Load initial data
async function loadInitialData() {
    console.log('📊 Loading initial data...');
    
    // Update dashboard counters
    await updateDashboardCounters();
    
    // Load products table
    await loadProductsTable();
    
    // Load orders table
    await loadOrdersTable();
}

// Update dashboard counters
async function updateDashboardCounters() {
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        // Get counts
        const productsPromise = getDocs(collection(db, 'products'));
        const ordersPromise = getDocs(collection(db, 'orders'));
        const pendingPromise = getDocs(query(collection(db, 'orders'), where('status', '==', 'Pending')));
        
        const [productsSnapshot, ordersSnapshot, pendingSnapshot] = 
            await Promise.all([productsPromise, ordersPromise, pendingPromise]);
        
        // Update UI
        document.getElementById('totalProducts').textContent = productsSnapshot.size;
        document.getElementById('totalOrders').textContent = ordersSnapshot.size;
        document.getElementById('pendingOrders').textContent = pendingSnapshot.size;
        
        // Today's orders (simplified)
        document.getElementById('todayOrders').textContent = '0';
        
        console.log('✅ Dashboard counters updated');
        
    } catch (error) {
        console.error('❌ Dashboard counter error:', error);
        // Set defaults
        document.getElementById('totalProducts').textContent = '0';
        document.getElementById('totalOrders').textContent = '0';
        document.getElementById('pendingOrders').textContent = '0';
        document.getElementById('todayOrders').textContent = '0';
    }
}

// Load products table
async function loadProductsTable() {
    const table = document.getElementById('productsTable');
    if (!table) return;
    
    table.innerHTML = '<tr><td colspan="6" class="empty-row"><div class="loader"><div class="spinner"></div><p>Loading products...</p></div></td></tr>';
    
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        const snapshot = await getDocs(collection(db, 'products'));
        
        if (snapshot.empty) {
            table.innerHTML = '<tr><td colspan="6" class="empty-row"><p class="empty-message">No products found. Add your first product!</p></td></tr>';
            return;
        }
        
        table.innerHTML = '';
        snapshot.forEach(doc => {
            const product = doc.data();
            const row = createProductRow(doc.id, product);
            table.appendChild(row);
        });
        
        console.log(`✅ Loaded ${snapshot.size} products`);
        
    } catch (error) {
        console.error('❌ Products load error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty-row">
                    <p class="error-message">
                        <i class="fas fa-exclamation-triangle"></i><br>
                        Could not load products<br>
                        <small>${error.message}</small>
                    </p>
                </td>
            </tr>
        `;
    }
}

// Create product row
function createProductRow(id, product) {
    const row = document.createElement('tr');
    
    const imageUrl = product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';
    
    row.innerHTML = `
        <td>
            <img src="${imageUrl}" 
                 alt="${product.name}" 
                 class="product-image"
                 onerror="this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80'">
        </td>
        <td>${product.name || 'Unnamed Product'}</td>
        <td><code>${product.productCode || 'N/A'}</code></td>
        <td>$${parseFloat(product.price || 0).toFixed(2)}</td>
        <td>${product.discount || 0}%</td>
        <td class="actions">
            <button class="btn-primary btn-sm edit-btn" data-id="${id}">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn-danger btn-sm delete-btn" data-id="${id}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Load orders table
async function loadOrdersTable() {
    const table = document.getElementById('ordersTable');
    if (!table) return;
    
    table.innerHTML = '<tr><td colspan="8" class="empty-row"><div class="loader"><div class="spinner"></div><p>Loading orders...</p></div></td></tr>';
    
    try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        const snapshot = await getDocs(collection(db, 'orders'));
        
        if (snapshot.empty) {
            table.innerHTML = '<tr><td colspan="8" class="empty-row"><p class="empty-message">No orders yet</p></td></tr>';
            return;
        }
        
        table.innerHTML = '';
        const orders = [];
        snapshot.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by date (newest first)
        orders.sort((a, b) => {
            const timeA = a.orderTime?.toDate?.() || new Date(0);
            const timeB = b.orderTime?.toDate?.() || new Date(0);
            return timeB - timeA;
        });
        
        orders.forEach(order => {
            table.appendChild(createOrderRow(order));
        });
        
        // Apply filter
        applyOrderFilter();
        
        console.log(`✅ Loaded ${orders.length} orders`);
        
    } catch (error) {
        console.error('❌ Orders load error:', error);
        table.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    <p class="error-message">
                        <i class="fas fa-exclamation-triangle"></i><br>
                        Could not load orders<br>
                        <small>${error.message}</small>
                    </p>
                </td>
            </tr>
        `;
    }
}

// Create order row
function createOrderRow(order) {
    const row = document.createElement('tr');
    const time = order.orderTime?.toDate?.() || new Date();
    const orderTime = time.toLocaleString();
    const status = order.status || 'Pending';
    
    row.innerHTML = `
        <td><code>${order.id.substring(0, 8)}</code></td>
        <td>${order.name || 'N/A'}</td>
        <td>${order.phone || 'N/A'}</td>
        <td>${order.location || 'N/A'}</td>
        <td><code>${order.productCode || 'N/A'}</code></td>
        <td>${orderTime}</td>
        <td>
            <span class="status-badge status-${status.toLowerCase()}">
                ${status}
            </span>
        </td>
        <td class="actions">
            <select class="status-select" data-id="${order.id}">
                <option value="Pending" ${status === 'Pending' ? 'selected' : ''}>Pending</option>
                <option value="Confirmed" ${status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="Delivered" ${status === 'Delivered' ? 'selected' : ''}>Delivered</option>
            </select>
            <button class="btn-danger btn-sm delete-order-btn" data-id="${order.id}">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

// Apply order filter
function applyOrderFilter() {
    const filter = statusFilter?.value || 'all';
    const rows = document.querySelectorAll('#ordersTable tr');
    
    rows.forEach(row => {
        if (row.cells.length < 7) return;
        
        const statusCell = row.cells[6];
        const statusBadge = statusCell.querySelector('.status-badge');
        const status = statusBadge?.textContent?.trim() || 'Pending';
        
        if (filter === 'all' || status === filter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Handle dynamic clicks
function handleDynamicClicks(e) {
    // Edit product
    if (e.target.closest('.edit-btn')) {
        const productId = e.target.closest('.edit-btn').dataset.id;
        editProduct(productId);
    }
    
    // Delete product
    if (e.target.closest('.delete-btn')) {
        const productId = e.target.closest('.delete-btn').dataset.id;
        deleteProduct(productId);
    }
    
    // Delete order
    if (e.target.closest('.delete-order-btn')) {
        const orderId = e.target.closest('.delete-order-btn').dataset.id;
        deleteOrder(orderId);
    }
}

// Handle dynamic changes
function handleDynamicChanges(e) {
    // Order status change
    if (e.target.classList.contains('status-select')) {
        const orderId = e.target.dataset.id;
        const newStatus = e.target.value;
        updateOrderStatus(orderId, newStatus);
    }
}

// Edit product
async function editProduct(productId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        const productDoc = await getDoc(doc(db, 'products', productId));
        
        if (productDoc.exists()) {
            openProductModal({ id: productId, ...productDoc.data() });
        } else {
            alert('Product not found!');
        }
        
    } catch (error) {
        console.error('Edit product error:', error);
        alert('Failed to load product: ' + error.message);
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        await deleteDoc(doc(db, 'products', productId));
        
        alert('✅ Product deleted successfully!');
        
        // Reload
        await loadProductsTable();
        await updateDashboardCounters();
        
    } catch (error) {
        console.error('Delete product error:', error);
        alert('❌ Failed to delete product: ' + error.message);
    }
}

// Delete order
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        await deleteDoc(doc(db, 'orders', orderId));
        
        alert('✅ Order deleted successfully!');
        
        // Reload
        await loadOrdersTable();
        await updateDashboardCounters();
        
    } catch (error) {
        console.error('Delete order error:', error);
        alert('❌ Failed to delete order: ' + error.message);
    }
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) throw new Error('Database not ready');
        
        await updateDoc(doc(db, 'orders', orderId), {
            status: newStatus,
            updatedAt: new Date()
        });
        
        // Update UI
        const rows = document.querySelectorAll('#ordersTable tr');
        rows.forEach(row => {
            if (row.cells[0]?.textContent?.includes(orderId.substring(0, 8))) {
                const statusCell = row.cells[6];
                statusCell.innerHTML = `
                    <span class="status-badge status-${newStatus.toLowerCase()}">
                        ${newStatus}
                    </span>
                `;
            }
        });
        
        // Update dashboard
        await updateDashboardCounters();
        
    } catch (error) {
        console.error('Update status error:', error);
        alert('❌ Failed to update status: ' + error.message);
    }
}

// Open product modal
function openProductModal(product = null) {
    const modalTitle = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    
    if (product) {
        modalTitle.textContent = 'Edit Product';
        submitBtnText.textContent = 'Update Product';
        
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name || '';
        document.getElementById('productPrice').value = product.price || '';
        document.getElementById('productDiscount').value = product.discount || 0;
        document.getElementById('productCode').value = product.productCode || '';
        document.getElementById('productImage').value = product.imageUrl || '';
        document.getElementById('productDescription').value = product.description || '';
    } else {
        modalTitle.textContent = 'Add New Product';
        submitBtnText.textContent = 'Add Product';
        
        // Reset form
        productForm.reset();
        document.getElementById('productId').value = '';
        document.getElementById('productDiscount').value = 0;
    }
    
    productModal.style.display = 'flex';
}

// Handle product form submission
async function handleProductSubmit(e) {
    e.preventDefault();
    
    console.log('📝 Submitting product form...');
    
    // Get form values
    // Get form values
    const productId = document.getElementById('productId').value;
    const name = document.getElementById('productName').value.trim();
    const price = parseFloat(document.getElementById('productPrice').value);
    const discount = parseInt(document.getElementById('productDiscount').value) || 0;
    const productCode = document.getElementById('productCode').value.trim();
    const imageUrl = document.getElementById('productImage').value.trim();
    const description = document.getElementById('productDescription').value.trim();
    
    // Validation
    if (!name || !price || !productCode) {
        alert('❌ Please fill in all required fields (Name, Price, Code)');
        return;
    }
    
    if (isNaN(price) || price <= 0) {
        alert('❌ Please enter a valid price');
        return;
    }
    
    if (discount < 0 || discount > 100) {
        alert('❌ Discount must be between 0 and 100');
        return;
    }
    
    // Prepare product data
    const productData = {
        name: name,
        price: price,
        discount: discount,
        productCode: productCode,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
        description: description,
        updatedAt: new Date()
    };
    
    console.log('Product data:', productData);
    
    try {
        // Import Firebase modules
        const { doc, setDoc, collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js');
        
        if (!db) {
            throw new Error('Database not connected');
        }
        
        if (productId) {
            // Update existing product
            await setDoc(doc(db, 'products', productId), productData);
            console.log('✅ Product updated:', productId);
            alert('✅ Product updated successfully!');
        } else {
            // Add new product
            productData.createdAt = new Date();
            const docRef = await addDoc(collection(db, 'products'), productData);
            console.log('✅ Product added with ID:', docRef.id);
            alert('✅ Product added successfully!');
        }
        
        // Close modal
        productModal.style.display = 'none';
        
        // Reload data
        await loadProductsTable();
        await updateDashboardCounters();
        
    } catch (error) {
        console.error('❌ Save product error:', error);
        
        // Show detailed error message
        let errorMsg = 'Failed to save product: ' + error.message;
        
        if (error.code === 'permission-denied') {
            errorMsg = `
            🔒 PERMISSION DENIED!
            
            Please check:
            1. Go to Firebase Console → Firestore → Rules
            2. Change rules to allow writes:
            
            rules_version = '2';
            service cloud.firestore {
              match /databases/{database}/documents {
                match /{document=**} {
                  allow read, write: if true;
                }
              }
            }
            
            3. Click "Publish"
            
            Error details: ${error.message}
            `;
        }
        
        alert(errorMsg);
    }
}

// Show login modal
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Admin Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="adminEmail" placeholder="admin@shopnow.com" required>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" id="adminPassword" placeholder="********" required>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn-primary">Login</button>
                    <button type="button" class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
                </div>
                <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i>
                    Create user in Firebase Console → Authentication
                </p>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle login
    modal.querySelector('#loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = modal.querySelector('#adminEmail').value;
        const password = modal.querySelector('#adminPassword').value;
        
        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
            
            await signInWithEmailAndPassword(auth, email, password);
            
            // Update UI
            currentUser = auth.currentUser;
            document.querySelector('.user-info span').textContent = currentUser.email;
            
            // Remove login button
            const loginBtn = document.querySelector('.login-btn');
            if (loginBtn) loginBtn.remove();
            
            // Remove modal
            modal.remove();
            
            alert('✅ Login successful!');
            
        } catch (error) {
            alert('❌ Login failed: ' + error.message);
        }
    });
}

// Handle logout
async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js');
        
        await signOut(auth);
        
        currentUser = null;
        document.querySelector('.user-info span').textContent = 'Administrator';
        
        // Add login button
        showLoginButton();
        
        alert('✅ Logged out successfully!');
        
    } catch (error) {
        console.error('Logout error:', error);
        alert('❌ Failed to logout');
    }
}

// Show error message
function showErrorMessage(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'error-alert';
    alertDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .error-alert {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 5px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-alert i {
            color: #e53e3e;
            font-size: 1.2rem;
        }
        .error-alert button {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #999;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(alertDiv);
    
    // Auto remove after 10 seconds
    setTimeout(() => alertDiv.remove(), 10000);
}

// Load mock data for testing
function loadMockData() {
    console.log('Loading mock data for testing...');
    
    // Update counters
    document.getElementById('totalProducts').textContent = '3';
    document.getElementById('totalOrders').textContent = '8';
    document.getElementById('pendingOrders').textContent = '2';
    document.getElementById('todayOrders').textContent = '1';
    
    // Show alert about rules
    showErrorMessage('Using mock data. Please check Firebase Rules to enable real data.');
}

// Make functions globally available for HTML onclick events
window.openProductModal = openProductModal;
window.showLoginModal = showLoginModal;

console.log('📋 Admin Script Loaded');