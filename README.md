# Online Voting System (EVC) - React Migration

A professional, secure, and modular Online Voting System built with **React**, **TypeScript**, and **Vite**. This project was migrated from a monolithic prototype to a scalable architecture ready for enterprise-grade backend integration (Supabase).

## 🇿🇦 Project Overview

The E-Vote Commission (EVC) platform provides a secure environment for national, provincial, and local elections. It features a sophisticated 'Springbok' green and gold design system and supports multiple user roles, including Voters, Election Administrators, and Auditors.

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/Online-Voting-System-Group20.git
   cd Online-Voting-System-Group20
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Running Locally

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Building for Production

To create a production-ready bundle in the `dist` folder:

```bash
npm run build
```

## 🔐 Demo Credentials

Use these accounts to test different features of the system:

| Role | Username / ID | Password |
| :--- | :--- | :--- |
| **Voter** | `9001015009087` | `pass123` |
| **System Admin** | `admin` | `admin123` |
| **Auditor** | `auditor1` | `audit123` |

## 🏗️ Architecture

- **`src/context/DataContext.tsx`**: Centralized state management using React Context. Currently handles mock database logic.
- **`src/types/index.ts`**: Unified TypeScript interfaces for all data entities.
- **`src/pages/`**: Modular page components (Dashboard, Elections, Voters, etc.).
- **`src/components/`**: Reusable UI elements (Navbar, Modals, etc.).
- **`src/index.css`**: Core design system using CSS variables for the EVC branding.

## 🔜 Roadmap

- [ ] **Supabase Integration**: Replace the `DataProvider` mock state with real-time Supabase fetches and mutations.
- [ ] **Biometric Verification**: Integration with official identity verification services.
- [ ] **Blockchain Audit**: Immutable ledger for vote receipts.

---
© 2026 E-Vote Commission - Secure & Verified Electoral Systems
