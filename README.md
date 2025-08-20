# Hostel Management System

## 📌 Overview
The **Hostel Management System** is a responsive, browser-based application designed for managing hostel operations. 
It provides dedicated dashboards for both **wardens** and **students**, allowing smooth management of profiles, room allocations, leave requests, and mess payments.  
This system is implemented using **HTML**, **CSS**(front-end simulation only — no backend integration).  

---

## 🚀 Features

### **For Warden**
- **Manage Students**: Add, edit, and delete student records.
- **Leave Requests**: Approve or reject pending leave applications.
- **Mess Payments**: Record and track payments for each student.
- **Export Data**: Simulated CSV export functionality.

### **For Students**
- **Profile Management**: View and update personal and hostel details.
- **Leave Applications**: Apply for leave and check approval status.
- **Mess Payment Tracking**: View mess payment history.

### **General**
- User-friendly, mobile-responsive interface.
- Multiple modals for data entry without leaving the dashboard.
- Simulated login/registration system for demo purposes.

---

## 🛠️ Tech Stack
- **HTML** – Page structure and UI components.
- **CSS** – Styling with responsive design.
- **Font Awesome** – Icons for better U

---

## 📂 Project Structure
```
/project
│── index.html     # Main HTML file with structure and JS logic
│── style.css      # Styling for all pages, modals, and components
```

---

## 🔑 Default Demo Login Credentials
- **Warden**
  - Username: `warden`
  - Password: `1234`
- **Student**
  - Username: `student1`
  - Password: `1111`

> *Note*: You can also register new users for simulation. Data will not persist after refresh since there’s no backend.

---

## 📦 How to Run
1. **Download** the project files (`index.html` and `style.css`).
2. Open `index.html` in any modern web browser.
3. Log in using the demo credentials or register a new account.

---

## ⚠️ Limitations
- No backend or database — all actions are simulated and reset on page reload.
- CSV export and data persistence require backend integration.

---


## 💡 Future Improvements
- Connect to a backend (Node.js, PHP, Django, etc.) for real data storage.
- Implement authentication and role-based access control.
- Add search, filtering, and sorting features for students and payments.
- Generate downloadable reports.
