import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const GlowCard = ({ children, className = '', onClick, style = {}, ...props }) => {
  const cardRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        setIsClicked(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleMouseEnter = (e) => {
    setIsActive(true);
    handleMove(e.clientX, e.clientY);
  };

  const handleClick = (e) => {
    setIsClicked(true);
    if (e.clientX || e.clientY) {
      handleMove(e.clientX, e.clientY);
    }
    if (onClick) onClick(e);
  };

  const handleMove = (clientX, clientY) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    cardRef.current.style.setProperty('--mouse-x', `${x}px`);
    cardRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchStart = (e) => {
    setIsActive(true);
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsActive(false);
  };

  // Extract dimensions and style-related props from outer div to prevent duplication/misplacement
  const wrapperStyle = {
    position: 'relative',
    ...style
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsActive(false)}
      onClick={handleClick}
      className={`glow-card-container ${isActive ? 'active-glow' : ''} ${isClicked ? 'clicked-glow' : ''} ${className}`}
      style={wrapperStyle}
      {...props}
    >
      <div className="glow-card-glow" />
      <div className="glow-card-content">
        {children}
      </div>
    </motion.div>
  );
};

export default GlowCard;
