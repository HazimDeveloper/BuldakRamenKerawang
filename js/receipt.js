class ReceiptGenerator {
    static generateHTML(order) {
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
                    <p>Powered by HazimDev</p>
                </div>
            </div>`;
    }

    static showReceipt(order) {
        return new Promise((resolve) => {
            const receiptWindow = window.open('', 'Receipt', 'width=400,height=600');
            receiptWindow.document.write(`
                <html>
                    <head>
                        <title>Order Receipt - ${order.id}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="background: #f5f5f5; margin: 0; padding: 20px;">
                        ${this.generateHTML(order)}
                        <div style="text-align: center; margin-top: 20px;">
                            <button onclick="window.print()" style="
                                background: #ff4d4d;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                                margin-right: 10px;
                            ">Print Receipt</button>
                            <button onclick="window.close(); window.opener.completeOrder('${order.id}')" style="
                                background: #4CAF50;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 5px;
                                cursor: pointer;
                            ">Complete Order</button>
                        </div>
                    </body>
                </html>
            `);
            receiptWindow.document.close();
        });
    }
}

// Add to OrderManagement class prototype
OrderManagement.prototype.showReceipt = function(order) {
    return ReceiptGenerator.showReceipt(order);
};