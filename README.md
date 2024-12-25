# Forum-Style Threaded Chat Assistant Interface

![Screenshot from 2024-12-24 22-14-36](https://github.com/user-attachments/assets/11c4658d-09f7-4010-a102-504209f136b4)


![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
    - [Frontend Setup](#frontend-setup)
    - [Backend Setup](#backend-setup)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Project Overview

**Chatweaver** is a web application designed to streamline the organization and management of chat assistant responses. Tailored for personal use, it facilitates live work, ongoing exploration, and efficient handling of chat interactions. Users can create categorized threads, manage nested comments, and leverage AI-generated responses to enhance their workflow.

## Features

- **Thread Management:** Create, view, and manage threads within specific categories.
- **Nested Comments:** Engage in detailed discussions with support for nested replies.
- **Persistent Collapsed State:** Collapse or expand comments with the state persisting across sessions.
- **AI-Generated Responses:** Utilize AI models to generate intelligent responses to comments.
- **Real-Time Updates:** Experience immediate UI updates with optimistic rendering.
- **Error Handling:** Receive clear and informative error messages for enhanced usability.
- **Responsive Design:** Enjoy a seamless experience across various devices and screen sizes.

## Technologies Used

### Frontend

- **React:** Building dynamic and responsive user interfaces.
- **Axios:** Handling HTTP requests to interact with the backend API.
- **React Context API:** Managing global state for collapsed comments.
- **React Icons:** Incorporating intuitive icons for better UX.
- **CSS:** Styling components with custom or framework-based styles.

### Backend

- **Node.js & Express:** Creating a robust and scalable RESTful API.
- **Database (e.g., PostgreSQL):** Storing threads, comments, and user preferences.
- **Sequelize ORM:** Managing database interactions with ease.
- **Socket.IO (Optional):** Facilitating real-time communication for collaborative features.

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

Ensure you have the following installed on your system:

- **Node.js (v14 or higher):** [Download Node.js](https://nodejs.org/)
- **npm or yarn:** Package managers for installing dependencies.
- **Database (e.g., PostgreSQL):** [Download PostgreSQL](https://www.postgresql.org/download/)
- **Git:** For version control. [Download Git](https://git-scm.com/downloads)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/chat-assistant-organizer.git
cd chat-assistant-organizer
```

#### 2. Setup Backend
##### a. Navigate to Backend Directory
```
  cd backend
```
##### b. Install Dependencies
```
npm install
# or
yarn install
```

##### c. Configure Environment Variables
Create a .env file in the backend directory and add the following variables:
```
PORT=5000
DATABASE_URL=postgres://username:password@localhost:5432/chat_assistant_db
```

Replace username, password, and chat_assistant_db with your PostgreSQL credentials and desired database name.

##### d. Setup the Database
Create the Database:
``` bash
createdb chat_assistant_db
```

Run Migrations:
Assuming you're using Sequelize, run:
``` bash
npx sequelize-cli db:migrate
```

##### e. Start the Backend Server
``` bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

The backend server should now be running on http://localhost:5000.

#### 3. Setup Frontend
##### a. Navigate to Frontend Directory
Open a new terminal window/tab and navigate to the frontend directory:
``` bash
cd frontend
```

##### b. Install Dependencies
``` bash
npm install
# or
yarn install
```

##### c. Configure Environment Variables
Create a .env file in the frontend directory and add the following variables:
``` bash
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

##### d. Start the Frontend Server
``` bash
npm start
# or
yarn start
```

The frontend application should now be running on http://localhost:3000.


## Usage

### Creating a New Thread

1. **Navigate to the Application:**

   Open your browser and go to [http://localhost:3000](http://localhost:3000).

2. **Fill Out the Thread Form:**
   - Enter a **Thread Name**.
   - Optionally, provide a **Description**.

3. **Submit the Form:**

   Click the **Create Thread** button. The new thread will appear in the thread list without needing a page reload.

### Managing Comments

1. **Select a Thread:**

   Click on a thread from the list to view its comments.

2. **View Nested Comments:**
   - **Expand/Collapse Comments:** Click on the arrow icon next to a comment to collapse or expand its replies.
   - **Add a Comment:** Use the **Reply** button to add a new comment. Enter your comment and optionally select an AI model to generate a response.

3. **AI-Generated Responses:**
   - When adding a comment, select an AI model (e.g., "OpenAI GPT-4") to generate a response.
   - The AI response will appear as a nested comment under your original comment.
