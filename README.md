# Online Voting System (EVC)

A professional, secure, and modular Online Voting System built with **React**, **TypeScript**, **Vite**, and **Supabase**.

## Project Overview

The E-Vote Commission (EVC) platform provides a secure environment for national, provincial, and local elections. It supports multiple user roles, including Voters, Election Administrators, System Administrators, and Auditors.

## Getting Started

Follow these instructions to get the project up and running on your local machine.

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### Recommended: Clone the Repository

Open **Windows PowerShell** and run:

```powershell
cd "$env:USERPROFILE\OneDrive\Desktop"
git clone https://github.com/Lekgalake/Online-Voting-System-Group20.git
cd Online-Voting-System-Group20
npm install
npm run dev
```

The application will be available at:

```text
http://localhost:5173
```

If PowerShell blocks npm scripts, run:

```powershell
npm.cmd run dev
```

### Alternative: Download the ZIP Folder

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

7. Install dependencies and run the app:

   ```powershell
   npm install
   npm run dev
   ```

### Environment Setup

The app connects to Supabase using a `.env` file in the project root folder.

The `.env` file must be in the same folder as:

```text
package.json
vite.config.ts
src
```

For this group project, the local `.env` should use Vite variable names:

```env
VITE_SUPABASE_URL=https://akbbucujvktlvahiyfho.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
```

If you need to check that `.env` is in the correct place, run this in PowerShell from inside the project folder:

```powershell
dir .env
dir package.json
```

Both files should appear.

If `.env` is missing, create it:

```powershell
notepad .env
```

Paste the Supabase values, save the file, then restart the dev server.

### Restart After Editing `.env`

Vite only reads `.env` when the server starts. After changing `.env`, stop and restart the server:

```powershell
Ctrl + C
npm run dev
```

### Demo Login

After the app opens, test with:

- **Admin username**: `admin`
- **Admin password**: `admin123`
- **Voter ID**: `9001015009087`
- **Voter password**: `pass123`

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
