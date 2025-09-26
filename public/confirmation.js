window.onload = function() {
  // Retrieve order data from localStorage
  const orderItems = JSON.parse(localStorage.getItem("orderItems"));
  const totalPrice = localStorage.getItem("totalPrice");

  const orderDetails = document.getElementById("orderDetails");
  const finalPrice = document.getElementById("finalPrice");
  const emailInput = document.getElementById("emailInput");
  const tableNumberInput = document.getElementById("tableNumberInput");
  const paymentForm = document.getElementById("paymentForm");
  const qrCodeContainer = document.getElementById("qrCodeContainer");
  const qrCodeImage = document.getElementById("qrCodeImage");

  const errorMessageEmail = document.createElement("div");
  const errorMessageTable = document.createElement("div");

  errorMessageEmail.style.color = "red";
  errorMessageTable.style.color = "red";

  // Populate order details
  if (orderItems && orderItems.length > 0) {
    orderItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = `${item.name} - ₹${item.price.toFixed(2)}`;
      orderDetails.appendChild(li);
    });
    finalPrice.textContent = totalPrice;
  } else {
    orderDetails.innerHTML = "<li>No items found in your order.</li>";
  }

  // Listen for payment method selection
  document.querySelectorAll('input[name="paymentMethod"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.value === "UPI") {
        generateQRCode(totalPrice);
      } else {
        qrCodeContainer.style.display = "none";
      }
    });
  });

  // Generate UPI QR code
  function generateQRCode(amount) {
    fetch(`https://serve-sync.onrender.com/generate-qr?amount=${amount}`)  // Full backend URL!
      .then((response) => {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          qrCodeImage.src = data.qrCodeUrl;
          qrCodeContainer.style.display = "block";
        } else {
          alert("Error generating QR code. Try again!");
        }
      })
      .catch((error) => console.error("Error fetching QR code:", error));
  }

  // Handle form submission for payment
  paymentForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errorMessageEmail.textContent = "Please enter a valid email address";
      emailInput.parentNode.appendChild(errorMessageEmail);
      return;
    } else {
      errorMessageEmail.textContent = "";
    }

    const tableNumber = tableNumberInput.value;
    const tableNumberInt = parseInt(tableNumber, 10);

    if (isNaN(tableNumberInt) || tableNumberInt <= 0 || tableNumberInt >= 21) {
      errorMessageTable.textContent =
        "Please enter a valid table number (between 1 and 20)";
      tableNumberInput.parentNode.appendChild(errorMessageTable);
      return;
    } else {
      errorMessageTable.textContent = "";
    }

    const selectedPaymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    ).value;

    // If UPI is selected, ensure the QR code is generated before submitting
    if (selectedPaymentMethod === "UPI" && qrCodeContainer.style.display === "none") {
      alert("Please wait for the QR code to generate before submitting.");
      return;
    }

    const paymentData = {
      email: email,
      tableNumber: tableNumberInt,
      paymentMethod: selectedPaymentMethod,
      orderItems: orderItems,
      totalPrice: totalPrice,
    };

    localStorage.setItem("email", email);
    localStorage.setItem("tableNumber", tableNumberInt);

    fetch("https://serve-sync.onrender.com/send-order-details", {  // Full backend URL!
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    })
      .then((response) => {
        if (!response.ok) throw new Error('HTTP error ' + response.status);
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          window.location.href = `thankyou.html?email=${encodeURIComponent(
            email
          )}&tableNumber=${encodeURIComponent(tableNumberInt)}`;
        } else {
          alert("Error: " + data.message);
        }
      })
      .catch((error) => console.error("Error:", error));
  });
};

// Function to go back to the menu
function goBack() {
  window.location.href = "index.html";
}
