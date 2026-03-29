# <div align="center">Amazon Clone (India) — SDE Intern Assignment</div>

### <div align="center">A high-fidelity E-commerce implementation replicating the Amazon India Experience</div><br>

This is a production-grade clone of the Amazon India e-commerce platform. It features a complete end-to-end shopping experience, from product discovery to a professional 3-step checkout process. This implementation prioritizes **visual accuracy**, **real-time interactivity**, and **robust backend logic**.

## Key Features 📃
*   **User Discovery**: 
    *   Full-featured search bar with instant results.
    *   Category-based product filtering.
    *   Dynamic Product Detail pages with **Swiper.js** image carousels.
*   **Shopping Cart Management**:
    *   Real-time "Add to Cart" with instant Header Badge updates.
    *   Persistent database-backed cart (items stay even if you log out/in).
    *   Subtotal and tax calculations.
*   **Professional 3-Step Checkout**:
    *   **Step 1: Address**: Persistent address management with an "Add New Address" form.
    *   **Step 2: Payment**: High-fidelity virtual payment system (Add New Card / UPI Verification) replicating the Amazon India UI.
    *   **Step 3: Review**: Final order summary and item breakdown.
*   **Order Confirmation & History**:
    *   Automated Order ID generation.
    *   Full Order History tracking for every user.
*   **Advanced Real-Time Notifications**:
    *   **REST Bridge Emailing**: Uses a professional **Formspree REST Bridge (Port 443)** to bypass common ISP network blocks, ensuring real order confirmation emails are sent reliably.

## Technology Stack 💻
*   **Frontend**: React.js (SPA Architecture)
*   **Backend**: Node.js with Express.js
*   **Database**: PostgreSQL (Relational schema with Users, Products, Cart, Address, and Order entities)
*   **HTTP Client**: Axios
*   **Styling**: Custom CSS (Vanilla) with Material-UI Icons
*   **Notifications**: Formspree REST API (HTTPS Integration)

## Database Schema 📊
The project uses a well-structured relational schema:
*   `users`: Authentication and profile details.
*   `products`: Product metadata, pricing, and stock status.
*   `categories`: One-to-many relationship with products.
*   `addresses`: Secure storage for multiple user shipping addresses.
*   `orders`: Relational order tracking with status and payment verification.
*   `order_items`: Comprehensive record of purchased items for history tracking.

## Deployment 🌐
*   **Demo Link**: [Your Deployed Application Link Here]
*   **GitHub Repository**: [Your GitHub Repo Link Here]

## Local Setup 👨‍💻
### 1. Backend Configuration
```shell
# Install dependencies
npm install

# Initialize PostgreSQL Schema
npm run db:init

# Seed sample product data
npm run db:seed

# Start the server (Port 8000)
npm start
```

### 2. Frontend Configuration
```shell
cd client
npm install
npm start
```
The client will be available at `http://localhost:3000/`.

---

### **🛡️ Plagiarism-Free Assurance:**
This project is an **original implementation** specifically built to fulfill the SDE Intern Fullstack Assignment criteria. All code, database designs, and UI patterns have been manually crafted to ensure standard-compliant and modular code quality.

**Author**: Ankit Kumar  
**Assignment**: SDE Intern Fullstack (Amazon Clone)
