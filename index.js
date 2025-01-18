// Order storage and management
class OrderManagement {
    constructor() {
        this.orders = JSON.parse(localStorage.getItem('buldakOrders')) || [];
    }

    generateOrderId() {
        return 'ORD' + Date.now().toString().slice(-6);
    }

    saveOrder(orderData) {
        const order = {
            id: this.generateOrderId(),
            timestamp: new Date().toISOString(),
            ...orderData
        };
        this.orders.push(order);
        localStorage.setItem('buldakOrders', JSON.stringify(this.orders));
        return order;
    }

    generateReceipt(order) {
        const receiptHTML = `
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
                    <p>Order ID: ${order.id}</p>
                    <p>${new Date(order.timestamp).toLocaleString()}</p>
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
                    <p>For inquiries: wa.me/601169591087</p>
                </div>
            </div>`;

        // Create a popup window for the receipt
        const receiptWindow = window.open('', 'Receipt', 'width=400,height=600');
        receiptWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt</title>
                </head>
                <body style="background: #f5f5f5; margin: 0; padding: 20px;">
                    ${receiptHTML}
                    <div style="text-align: center; margin-top: 20px;">
                        <button onclick="window.print()" style="
                            background: #ff4d4d;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 5px;
                            cursor: pointer;
                        ">Print Receipt</button>
                    </div>
                </body>
            </html>
        `);
    }
}

// Initialize order management
const orderManagement = new OrderManagement();

// Modified process order function
function processOrder(product) {
    const quantity = document.getElementById(`${product}-quantity`).textContent;
    const type = document.querySelector(`input[name="${product}-type"]:checked`).value;
    const payment = document.querySelector(`input[name="${product}-payment"]:checked`).value;
    const delivery = document.querySelector(`input[name="${product}-delivery"]:checked`).value;
    const total = document.getElementById(`${product}-total`).textContent;
    const roomNumber = document.getElementById(`${product}-room`).value;

    if (delivery === 'delivery' && !roomNumber) {
        alert('Sila masukkan nombor bilik!');
        return;
    }

    // Create order object
    const orderData = {
        product: product.charAt(0).toUpperCase() + product.slice(1),
        type,
        quantity,
        total,
        payment: payment === 'cash' ? 'Tunai' : 'Transfer Bank',
        delivery: delivery === 'delivery' ? 'Penghantaran' : 'Ambil Sendiri',
        roomNumber: roomNumber || 'K240'
    };

    // Save order and generate receipt
    const savedOrder = orderManagement.saveOrder(orderData);
    orderManagement.generateReceipt(savedOrder);

    // Send WhatsApp message
    const numPhone = "601169591087";
    const message = encodeURIComponent(`Saya nak order:
${orderData.product}
Order ID: ${savedOrder.id}
Jenis: ${orderData.type}
Kuantiti: ${orderData.quantity}
${orderData.total}
Kaedah Pembayaran: ${orderData.payment}
Kaedah Penghantaran: ${orderData.delivery}
No. Bilik: ${orderData.roomNumber}`);
    
    window.open(`https://wa.me/${numPhone}?text=${message}`, '_blank');
}

// Export order data to CSV
function exportOrders() {
    const orders = JSON.parse(localStorage.getItem('buldakOrders')) || [];
    if (orders.length === 0) {
        alert('No orders to export');
        return;
    }

    const csvContent = [
        ['Order ID', 'Timestamp', 'Product', 'Type', 'Quantity', 'Total', 'Payment', 'Delivery', 'Room Number'],
        ...orders.map(order => [
            order.id,
            order.timestamp,
            order.product,
            order.type,
            order.quantity,
            order.total,
            order.payment,
            order.delivery,
            order.roomNumber
        ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'buldak_orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}