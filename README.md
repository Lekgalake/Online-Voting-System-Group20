# Online Voting System (EVC)

A professional, secure, and modular Online Voting System built with **React**, **TypeScript**, **Vite**, and **Supabase**.

## Project Overview

The E-Vote Commission (EVC) platform provides a secure environment for national, provincial, and local elections. It supports multiple user roles, including Voters, Election Administrators, System Administrators, and Auditors.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### Option 1: Download the ZIP Folder

1. Go to the GitHub repository:

   ```text
   https://github.com/Lekgalake/Online-Voting-System-Group20
   ```

2. Click **Code** > **Download ZIP**.

3. Extract the ZIP folder.

4. Place the extracted folder on your Desktop.

5. Open **PowerShell**.

6. Navigate into the extracted project folder. For example:

   ```powershell
   cd "C:\Users\mulon\OneDrive\Desktop\Online-Voting-System-Group20-main"
   ```

### Option 2: Clone the Repository

If you prefer using Git, open PowerShell and run:

```bash
git clone https://github.com/Lekgalake/Online-Voting-System-Group20.git
cd Online-Voting-System-Group20
```

### Environment Setup

Create a `.env` file in the project root folder and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in **Supabase Dashboard** > **Project Settings** > **API**.

### Install Dependencies

Run this inside the project folder:

```bash
npm install
```

### Running Locally

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

If PowerShell blocks npm scripts, run:

```bash
npm.cmd run dev
```

### Building for Production

To create a production-ready bundle in the `dist` folder:

```bash
npm run build
```

## Demo Credentials

Use these accounts to test different features of the system:

| Role | Username / ID | Password |
| :--- | :--- | :--- |
| **Voter** | `9001015009087` | `pass123` |
| **System Admin** | `admin` | `admin123` |
| **Auditor** | `auditor1` | `audit123` |

## Supabase Database

The GitHub repository contains the SQL files needed for the database structure and fixes:

- `database.sql`
- `supabase-fix-election-status-trigger.sql`

The actual Supabase database and data do not get downloaded with the ZIP file. To connect the app locally, use the correct Supabase URL and anon key in your local `.env` file.

## Architecture

- **`src/context/DataContext.tsx`**: Centralized state management and Supabase data operations.
- **`src/types/index.ts`**: TypeScript interfaces for the main data entities.
- **`src/pages/`**: Page components for Dashboard, Elections, Voters, Candidates, Audit Log, and Admin.
- **`src/components/`**: Reusable UI components.
- **`src/index.css`**: Main styling and EVC design system.

---

Copyright 2026 E-Vote Commission - Secure & Verified Electoral Systems
