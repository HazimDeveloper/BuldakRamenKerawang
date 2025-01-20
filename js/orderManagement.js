class OrderManagement {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('buldakOrders')) || [];
        this.cart = JSON.parse(localStorage.getItem('buldakCart')) || [];
        this.adminPhone = "601169591087";
        this.GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_SCRIPT_URL';
        this.initializeEventListeners();
        this.updateCartCount();
    }

    async addToCart(product) {
        const orderButton = document.querySelector(`button[onclick="orderManager.addToCart('${product}')"]`);
        
        try {
            // Show loading state
            if (orderButton) {
                orderButton.innerText = 'Adding to Cart...';
                orderButton.disabled = true;
            }
    
            const quantity = parseInt(document.getElementById(`${product}-quantity`).textContent);
            const type = document.querySelector(`input[name="${product}-type"]:checked`).value;
            const payment = document.querySelector(`input[name="${product}-payment"]:checked`).value;
            const delivery = document.querySelector(`input[name="${product}-delivery"]:checked`).value;
            const roomNumber = document.getElementById(`${product}-room`).value;
    
            if (delivery.includes('delivery') && !roomNumber) {
                alert('Sila masukkan nombor bilik!');
                return;
            }
    
            const priceDetails = this.updateTotal(product);
    
            const cartItem = {
                id: Date.now(),
                product: product.charAt(0).toUpperCase() + product.slice(1),
                type,
                quantity,
                basePrice: priceDetails.basePrice,
                deliveryFeePerItem: priceDetails.deliveryFeePerItem,
                total: priceDetails.total,
                payment,
                delivery,
                roomNumber: roomNumber || 'K240'
            };
    
            this.cart.push(cartItem);
            localStorage.setItem('buldakCart', JSON.stringify(this.cart));
            this.updateCartCount();
            this.showCartNotification();
    
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Error adding item to cart. Please try again.');
        } finally {
            // Reset button state
            if (orderButton) {
                orderButton.innerText = 'Add to Cart';
                orderButton.disabled = false;
            }
        }
    }

    updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        cartCount.textContent = this.cart.length;
    }

    showCart() {
        const modal = document.getElementById('cartModal');
        const cartItems = document.querySelector('.cart-items');
        const cartTotal = document.querySelector('.cart-total h3');
        
        cartItems.innerHTML = '';
        let total = 0;

        this.cart.forEach(item => {
            const itemTotal = parseFloat(item.total.replace('RM', ''));
            total += itemTotal;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.product} - ${item.type}</h4>
                        <p>Quantity: ${item.quantity}</p>
                        <p>Delivery: ${item.delivery}</p>
                        <p>Total: ${item.total}</p>
                    </div>
                    <div class="cart-item-remove" onclick="orderManager.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </div>
                </div>
            `;
        });

        cartTotal.textContent = `Total: RM${total.toFixed(2)}`;
        modal.style.display = 'block';

        // Close modal when clicking outside
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };

        // Close button functionality
        document.querySelector('.close').onclick = () => {
            modal.style.display = 'none';
        };
    }

    removeFromCart(itemId) {
        this.cart = this.cart.filter(item => item.id !== itemId);
        localStorage.setItem('buldakCart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.showCart(); // Refresh cart display
    }

    clearCart() {
        this.cart = [];
        localStorage.setItem('buldakCart', JSON.stringify(this.cart));
        this.updateCartCount();
        this.showCart();
    }

    async checkoutCart() {
        if (this.cart.length === 0) {
            alert('Cart is empty!');
            return;
        }
    
        try {
            // Save all orders at once
            const savedOrders = [];
            for (const item of this.cart) {
                const savedOrder = await this.saveOrder(item);
                savedOrders.push(savedOrder);
            }
    
            // Show single receipt with all items
            await this.showReceipt(savedOrders);
            
            // Clear cart after successful checkout
            this.clearCart();
            document.getElementById('cartModal').style.display = 'none';
    
        } catch (error) {
            console.error('Error during checkout:', error);
            alert('Error processing checkout. Please try again.');
        }
    }

    showCartNotification() {
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 80px;
                background: white;
                padding: 10px 20px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            ">
                Item added to cart!
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }

    initializeEventListeners() {
        // Add listeners for delivery type changes
        document.querySelectorAll('input[name$="-delivery"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const product = e.target.name.split('-')[0];
                this.toggleLocationInput(product, e.target.value);
            });
        });

        // Add listeners for type changes
        document.querySelectorAll('input[name$="-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const product = e.target.name.split('-')[0];
                this.updateTotal(product);
            });
        });

        // Initialize location inputs
        document.querySelectorAll('input[name$="-delivery"]:checked').forEach(radio => {
            const product = radio.name.split('-')[0];
            this.toggleLocationInput(product, radio.value);
        });
    }

    toggleLocationInput(product, type) {
        const locationInput = document.getElementById(`${product}-location`);
        if (type === 'pickup') {
            locationInput.style.display = 'none';
            document.getElementById(`${product}-room`).value = '';
        } else {
            locationInput.style.display = 'block';
        }
    }

    updateQuantity(product, change) {
        const quantityElement = document.getElementById(`${product}-quantity`);
        let quantity = parseInt(quantityElement.textContent);
        quantity = Math.max(1, quantity + change);
        quantityElement.textContent = quantity;
        this.updateTotal(product);
    }

    updateTotal(product) {
        const quantity = parseInt(document.getElementById(`${product}-quantity`).textContent);
        const selectedType = document.querySelector(`input[name="${product}-type"]:checked`);
        const selectedDelivery = document.querySelector(`input[name="${product}-delivery"]:checked`);
        
        let basePrice = parseFloat(selectedType.dataset.price);
        let deliveryFee = selectedDelivery.value === 'delivery-sutera' ? 1 : 0;
        let totalPrice = (basePrice + deliveryFee) * quantity;
        
        const total = totalPrice.toFixed(2);
        document.getElementById(`${product}-total`).textContent = `Total: RM${total}`;
        return {
            basePrice,
            deliveryFee,
            totalPrice,
            total: `RM${total}`
        };
    }

    generateOrderId() {
        return 'ORD' + Date.now().toString().slice(-6);
    }

    async saveOrder(orderData) {
        const order = {
            orderId: this.generateOrderId(),
            timestamp: new Date().toISOString(),
            ...orderData
        };
    
        try {
            console.log('Preparing to save order:', order);
    
            // Create URLSearchParams object
            const formData = new URLSearchParams();
            formData.append('data', JSON.stringify(order));
    
            // First try to save to Google Sheets
            await fetch(this.GOOGLE_SCRIPT_URL + "?data=" + encodeURIComponent(JSON.stringify(order)), {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
    
            console.log('Order sent to Google Sheets');
    
            // Save locally as backup
            this.orders.push(order);
            localStorage.setItem('buldakOrders', JSON.stringify(this.orders));
    
            return order;
        } catch (error) {
            console.error('Error saving order:', error);
            // Still save locally if Google Sheets fails
            this.orders.push(order);
            localStorage.setItem('buldakOrders', JSON.stringify(this.orders));
            return order;
        }
    }

    generateReceiptHTML(order) {
        return `
            <div class="receipt" style="
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 20px auto;
                font-family: 'Courier New', monospace;
            ">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #ff4d4d;">Buldak Ramen UITM KT</h2>
                    <p>Order ID: ${order.orderId}</p>
                    <p>${new Date().toLocaleString()}</p>
                </div>
                <hr style="border: 1px dashed #ccc; margin: 10px 0;">
                <div style="margin: 15px 0;">
                    <p><strong>Product:</strong> ${order.product}</p>
                    <p><strong>Type:</strong> ${order.type}</p>
                    <p><strong>Quantity:</strong> ${order.quantity}</p>
                    <p><strong>Payment Method:</strong> ${order.payment}</p>
                    <p><strong>Delivery Method:</strong> ${order.delivery}</p>
                    <p><strong>Room Number:</strong> ${order.roomNumber}</p>
                </div>
                <hr style="border: 1px dashed #ccc; margin: 10px 0;">
                <div style="text-align: right; margin-top: 10px;">
                    <h3>${order.total}</h3>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 0.8em;">
                    <p>Thank you for your order!</p>
                    <p>Please screenshot this receipt.</p>
                </div>
            </div>`;
    }

    showReceipt(order) {
        // Convert order data to URL-safe string
        const orderData = encodeURIComponent(JSON.stringify(order));
        
        // Redirect to receipt page
        window.location.href = `receipt.html?data=${orderData}`;
    }

    notifyAdmin(order) {
        const message = encodeURIComponent(`
🆕 New Order Received!

Order ID: ${order.orderId}
Product: ${order.product}
Type: ${order.type}
Quantity: ${order.quantity}
${order.total}
Payment: ${order.payment}
Delivery: ${order.delivery}
Room: ${order.roomNumber}
Time: ${new Date().toLocaleString()}`);

        window.open(`https://wa.me/${this.adminPhone}?text=${message}`, '_blank');
    }

    async processOrder(product) {
        const orderButton = document.querySelector(`button[onclick="orderManager.processOrder('${product}')"]`);
        
        try {
            orderButton.innerText = 'Processing...';
            orderButton.disabled = true;
    
            const quantity = document.getElementById(`${product}-quantity`).textContent;
            const type = document.querySelector(`input[name="${product}-type"]:checked`).value;
            const payment = document.querySelector(`input[name="${product}-payment"]:checked`).value;
            const delivery = document.querySelector(`input[name="${product}-delivery"]:checked`).value;
            const roomNumber = document.getElementById(`${product}-room`).value;
    
            // Calculate prices including delivery fee
            const priceDetails = this.updateTotal(product);
    
            if (delivery.includes('delivery') && !roomNumber) {
                alert('Sila masukkan nombor bilik!');
                orderButton.innerText = 'Order Sekarang';
                orderButton.disabled = false;
                return;
            }
    
            const deliveryText = {
                'delivery-kasa': 'Penghantaran Kolej Kasa',
                'delivery-sutera': 'Penghantaran Kolej Sutera (+RM1)',
                'pickup': 'Ambil Sendiri'
            };
    
            const orderData = {
                product: product.charAt(0).toUpperCase() + product.slice(1),
                type,
                quantity,
                basePrice: priceDetails.basePrice,
                deliveryFee: priceDetails.deliveryFee,
                total: priceDetails.total,
                payment: payment === 'cash' ? 'Tunai' : 'Transfer Bank',
                delivery: deliveryText[delivery],
                roomNumber: roomNumber || 'K240'
            };
    
            const savedOrder = await this.saveOrder(orderData);
            await this.showReceipt(savedOrder);
            this.notifyAdmin(savedOrder);
    
            // Reset form
            document.getElementById(`${product}-quantity`).textContent = '1';
            document.getElementById(`${product}-room`).value = '';
            this.updateTotal(product);
    
        } catch (error) {
            console.error('Error processing order:', error);
            alert('Warning: Order saved locally but might not have synced with our system. Please save your receipt.');
        } finally {
            orderButton.innerText = 'Order Sekarang';
            orderButton.disabled = false;
        }
    }

    completeOrder(orderId) {
        const order = this.orders.find(o => o.orderId === orderId);
        if (order) {
            this.notifyAdmin(order);
        }
    }
}

// Initialize global orderManager instance
const orderManager = new OrderManagement();

// Global function for order completion
window.completeOrder = (orderId) => orderManager.completeOrder(orderId);