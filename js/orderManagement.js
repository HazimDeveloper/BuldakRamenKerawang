class OrderManagement {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('buldakOrders')) || [];
        this.adminPhone = "601169591087";
        this.GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4u_T5jzYk2L2r6Gyjgx8BQDDARgSkcdo-TLYrQ8bNSYTwqsWDKSzCEBJdEGwVLn1bKA/exec';
        this.initializeEventListeners();
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
        const price = parseFloat(selectedType.dataset.price);
        const total = (price * quantity).toFixed(2);
        document.getElementById(`${product}-total`).textContent = `Total: RM${total}`;
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
        return new Promise((resolve) => {
            // Convert order data to URL-safe string
            const orderData = encodeURIComponent(JSON.stringify(order));
            
            // Open receipt in new window/tab
            const receiptWindow = window.open(`receipt.html?data=${orderData}`, 'Receipt', 
                'width=400,height=600,scrollbars=yes,resizable=yes');
            
            resolve(receiptWindow);
        });
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
            // Show loading state
            orderButton.innerText = 'Processing...';
            orderButton.disabled = true;

            const quantity = document.getElementById(`${product}-quantity`).textContent;
            const type = document.querySelector(`input[name="${product}-type"]:checked`).value;
            const payment = document.querySelector(`input[name="${product}-payment"]:checked`).value;
            const delivery = document.querySelector(`input[name="${product}-delivery"]:checked`).value;
            const total = document.getElementById(`${product}-total`).textContent;
            const roomNumber = document.getElementById(`${product}-room`).value;

            if (delivery === 'delivery' && !roomNumber) {
                alert('Sila masukkan nombor bilik!');
                orderButton.innerText = 'Order Sekarang';
                orderButton.disabled = false;
                return;
            }

            const orderData = {
                product: product.charAt(0).toUpperCase() + product.slice(1),
                type,
                quantity,
                total,
                payment: payment === 'cash' ? 'Tunai' : 'Transfer Bank',
                delivery: delivery === 'delivery' ? 'Penghantaran' : 'Ambil Sendiri',
                roomNumber: roomNumber || 'K240'
            };

            const savedOrder = await this.saveOrder(orderData);
            await this.showReceipt(savedOrder);

            // Reset form
            document.getElementById(`${product}-quantity`).textContent = '1';
            document.getElementById(`${product}-room`).value = '';
            this.updateTotal(product);

        } catch (error) {
            console.error('Error processing order:', error);
            alert('Warning: Order saved locally but might not have synced with our system. Please save your receipt.');
        } finally {
            // Reset button state
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