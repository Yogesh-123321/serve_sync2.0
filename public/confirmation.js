window.onload = function() {
  // Retrieve order data from localStorage
  const orderItems = JSON.parse(localStorage.getItem('orderItems'));
  const totalPrice = localStorage.getItem('totalPrice');

  const orderDetails = document.getElementById('orderDetails');
  const finalPrice = document.getElementById('finalPrice');
  const emailInput = document.getElementById('emailInput'); // New email input reference
  const tableNumberInput = document.getElementById('tableNumberInput');
  const errorMessageEmail = document.createElement('div'); // Error message for invalid email
  const errorMessageTable = document.createElement('div'); // Error message for invalid table number

  errorMessageEmail.style.color = 'red'; // Red text for email error message
  errorMessageTable.style.color = 'red';  // Red text for table number error message

  // Populate order details
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

  // Handle form submission for payment
  paymentForm.addEventListener('submit', function(event) {
    event.preventDefault();

    // Validate email address
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic regex for email validation

    if (!emailRegex.test(email)) {
      errorMessageEmail.textContent = "Please enter a valid email address";
      emailInput.parentNode.appendChild(errorMessageEmail); // Append error message under the email input field
      return; // Prevent form submission
    } else {
      if (errorMessageEmail.textContent !== "") {
        errorMessageEmail.textContent = ""; // Clear error message if the email is valid
      }
    }

    // Validate table number
    const tableNumber = tableNumberInput.value;
    const tableNumberInt = parseInt(tableNumber, 10);

    if (isNaN(tableNumberInt) || tableNumberInt <= 0 || tableNumberInt >= 21) {
      errorMessageTable.textContent = "Please enter a valid table number (between 1 and 20)";
      tableNumberInput.parentNode.appendChild(errorMessageTable); // Append error message under the table number input field
      return; // Prevent form submission
    } else {
      if (errorMessageTable.textContent !== "") {
        errorMessageTable.textContent = ""; // Clear error message if the table number is valid
      }
    }

    // Collect payment method
    const selectedPaymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Prepare data to send to server
    const paymentData = {
      email: email,
      tableNumber: tableNumberInt,
      paymentMethod: selectedPaymentMethod,
      orderItems: orderItems,
      totalPrice: totalPrice,
    };

    // Store email and table number in localStorage for use on thank you page
    localStorage.setItem('email', email);
    localStorage.setItem('tableNumber', tableNumberInt);

    // Send data to server using fetch API
    fetch('/send-order-details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Redirect to thank you page with query parameters
        window.location.href = `thankyou.html?email=${encodeURIComponent(email)}&tableNumber=${encodeURIComponent(tableNumberInt)}`;
      } else {
        alert("Error: " + data.message); // Show error message from server
      }
    })
    .catch(error => console.error('Error:', error));
  });
};

// Function to go back to the menu
function goBack() {
  window.location.href = 'index.html'; // Redirect back to the menu page
}