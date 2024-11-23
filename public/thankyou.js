window.onload = function() {
    // Retrieve order and customer data from localStorage
    const orderItems = JSON.parse(localStorage.getItem('orderItems'));
    const totalPrice = localStorage.getItem('totalPrice');

    const tableNumber = localStorage.getItem('tableNumber'); // Retrieve table number
    const email = localStorage.getItem('email'); // Retrieve email from localStorage

    const orderDetails = document.getElementById('thankYouOrderDetails');
    const finalPrice = document.getElementById('thankYouTotalPrice');
    const tableDisplay = document.getElementById('thankYouTableNumber');
    const emailDisplay = document.getElementById('thankYouEmail'); // Element for displaying email

    // Populate order details (items and total price)
    if (orderItems && orderItems.length > 0) {
        orderItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.name} - ₹${item.price.toFixed(2)}`;
            orderDetails.appendChild(li);
        });
        finalPrice.textContent = totalPrice;
    } else {
        orderDetails.innerHTML = "<li>No items found in your order.</li>";
    }

    // Display customer info
    tableDisplay.textContent = tableNumber || 'N/A'; // Display table number
    emailDisplay.textContent = email || 'N/A'; // Display email
};

function goBackToMenu() {
    window.location.href = 'index.html'; // Redirect back to the menu page
}