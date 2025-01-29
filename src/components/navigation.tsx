import React from 'react';
// import './navigation.css';

const Navigation = () => {
    return (
        <nav className="navigation">
            <div className="logo">Logo</div>
            <ul className="nav-items">
                <li className="nav-item">About Tiler</li>
                <li className="nav-item">Contact</li>
                <li className="nav-item">Download</li>
            </ul>
            <div className="nav-buttons">
                <button className="nav-button">Try Tiler for free</button>
                <button className="nav-button">Sign Up</button>
            </div>
        </nav>
    );
};

export default Navigation;