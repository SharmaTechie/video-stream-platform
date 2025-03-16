import React from 'react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Video Stream</h1>
      </header>
      <main className="main-content">
        <div className="video-container">
          <video id="videoPlayer" controls>
            <source src="http://localhost:3000/video" type="video/mp4" />
          </video>
        </div>
      </main>
      <footer className="app-footer">
        <p>&copy; 2024 Video Stream. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App; 