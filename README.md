# CodeHarbor

**CodeHarbor** is a collaborative C developer editor designed to enhance real-time coding efficiency for teams and individuals. This full-stack application enables multiple users to write, compile, and execute C code simultaneously. Built with Electron.js and a multi-threaded Python server, CodeHarbor offers seamless text synchronization, integrated compilation, and execution, making it an ideal platform for collaborative coding and learning.

## Features

- **Real-time Collaboration:** Multiple users can edit the same file with an almost instant synchronization.
- **Code Compilation:** Integrated with GCC, allowing users to compile and execute C code within the app.
- **Multi-threaded Server:** Efficient handling of multiple client connections using a Python server.
- **Electron.js Interface:** Desktop application with a UI built in Electron.js for cross-platform compatibility.
- **Git Integration:** Includes version control support to manage collaborative development effectively.

## Technologies Used

- **Electron.js** – Cross-platform desktop application framework
- **Python** – Backend server, handling real-time synchronization and multi-user functionality
- **MongoDB** – Database for storing user and session data
- **GCC** – Compiler for C code execution
- **Git** – Version control for project management

## How to Run

#### <em> Make sure to have GCC installed for C code compilation. </em>
<br/> 

1. **Clone the repository:**
   <br/>
   ```bash
   git clone https://github.com/shakedSisso/CodeHarbor.git
2. **Install dependencies:**
   <br/>
   ```bash
   cd CodeHarbor
   npm install
3. **Start the application:**
   <br/>
   ```bash
   npm start
