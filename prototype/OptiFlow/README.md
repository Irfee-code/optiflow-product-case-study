# OptiFlow — Interactive Prototype

This folder contains the **React prototype for OptiFlow**, a smart patient-flow system designed to reduce waiting time and improve coordination across high-volume eye hospitals.

The prototype demonstrates the proposed patient journey and interactions between different hospital roles.

---

## Product Overview

OptiFlow focuses on reducing non-clinical waiting and coordination delays across:

- Patient registration
- Doctor consultation
- Nurse-led scanning and dilation
- Pharmacy coordination
- Digital payments
- Patient education
- Billing and pharmacy pre-packing

This is a **concept validation prototype**, not a production-ready hospital system.

---

## Prototype Workflows

### Patient

The patient can:

- Log into the system
- Complete registration
- View their assigned doctor and department
- Track their patient journey
- Complete digital payment
- Use the AI education assistant while waiting

### Nurse

The nurse can:

- View patients in the workflow
- Select required scans
- Identify patients requiring dilation
- Trigger the relevant workflow
- View alerts for faster coordination

### Doctor

The doctor can:

- View patient information
- Select prescribed medications
- Send medication information to the pharmacy
- Support the pharmacy pre-packing workflow

### Pharmacist

The pharmacist can:

- View the patient's bill/payment status
- Identify digitally paid orders
- Start preparing medication orders
- Coordinate the final pharmacy workflow

---

## Running the Prototype Locally

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm

### 1. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/Irfee-code/optiflow-product-case-study.git
```

### 2. Navigate to the Prototype

Move into the React prototype directory:

```bash
cd optiflow-product-case-study/prototype/OptiFlow
```

### 3. Install Dependencies

Install the required packages:

```bash
npm install
```

### 4. Start the Development Server

Run the prototype:

```bash
npm run dev
```

Vite will display a local URL in the terminal.

Typically:

```text
http://localhost:5173/
```

Open the URL in your browser to interact with the OptiFlow prototype.

### 5. Stop the Development Server

When you are finished, press:

```text
Ctrl + C
```

---

## Prototype Usage

The prototype uses a simplified login and role-selection flow for demonstration purposes.

Select a role to explore its corresponding workflow:

- **Patient** — registration, journey tracking, payment and AI assistance
- **Nurse** — patient monitoring, scan selection and dilation alerts
- **Doctor** — patient information and prescription workflow
- **Pharmacist** — payment verification and medication preparation

The same login interface is used for demonstration purposes, with the selected role determining the workflow shown.

---

## Prototype Notes

This is a **frontend-only prototype** created to demonstrate the proposed product experience and workflows.

The prototype currently does not include:

- Production backend
- Real hospital database
- Real payment integration
- Production authentication
- Real AI/RAG backend
- Real patient data

The login and role-selection flow is intentionally simplified for demonstration purposes.

All patient information, workflows, payments and interactions shown in the prototype are simulated.

---

## Technology

- React
- Vite
- JavaScript
- CSS
- ESLint

---

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure

```text
OptiFlow/
│
├── public/
│   └── icons.svg
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── OptiFlow.jsx
│   ├── index.css
│   └── main.jsx
│
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

---

## Product Case Study

The complete OptiFlow product case study is available in the repository.

[View the OptiFlow Product Case Study](../../case-study/OptiFlow_CaseStudy.pdf)

The case study covers:

- Problem definition
- Patient journey
- Operational bottlenecks
- Product insights
- Proposed solution
- Product decisions
- Projected impact and KPIs

The interactive prototype serves as a demonstration of the product experience proposed in the case study.

---

## Project Context

OptiFlow was developed as part of the **Sankara Innovation Challenge 2026**.

The prototype represents the proposed product experience and is intended for product demonstration and concept validation.

Projected impact figures and product outcomes presented in the case study would require validation through a real hospital pilot.

---

## Author

**Irfan Ahmed J.**

Product Strategy & Product Design