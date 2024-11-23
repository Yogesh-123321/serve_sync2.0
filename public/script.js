let total = 0;
let orderItems = [];

function addToOrder(itemName, itemPrice) {
  // Add item to the order
  orderItems.push({ name: itemName, price: itemPrice });
  total += itemPrice;
  
  // Update the order list and total price
  updateOrder();
}

function updateOrder() {
  const orderList = document.getElementById('orderList');
  const totalPrice = document.getElementById('totalPrice');
  
  // Clear current order list
  orderList.innerHTML = '';

  // Add all items to the order list
  orderItems.forEach(item => {
    const li = document.createElement('li');
    // Correct string interpolation with backticks
    li.textContent = `${item.name} - ₹${item.price.toFixed(2)}`;
    orderList.appendChild(li);
  });

  // Update total price
  totalPrice.textContent = `Total - ₹ ${total.toFixed(2)}`;
}

function clearOrder() {
  // Reset order and total
  orderItems = [];
  total = 0;
  
  // Clear the order list and total price
  updateOrder();
}

function placeOrder() {
  if (orderItems.length === 0) {
    alert("Please add items to your order before placing it.");
    return;
  }

  // Store the order in localStorage so we can retrieve it on the confirmation page
  localStorage.setItem('orderItems', JSON.stringify(orderItems));
  localStorage.setItem('totalPrice', total.toFixed(2));

  // Redirect to the confirmation page
  window.location.href = 'confirmation.html';
}
