import React, { useState, useEffect } from 'react'

const BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024
}

export function useResponsive() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    isMobile: viewport.width < BREAKPOINTS.mobile,
    isTablet: viewport.width >= BREAKPOINTS.mobile && viewport.width < BREAKPOINTS.desktop,
    isDesktop: viewport.width >= BREAKPOINTS.desktop,
    width: viewport.width,
    height: viewport.height
  }
}

export const ResponsiveContainer = ({ children, style }) => {
  const { isMobile } = useResponsive()

  return (
    <div style={{
      padding: isMobile ? 12 : 24,
      maxWidth: '100%',
      margin: '0 auto',
      ...style
    }}>
      {children}
    </div>
  )
}

export const ResponsiveGrid = ({ children, columns = 3 }) => {
  const { isMobile, isTablet } = useResponsive()
  
  const cols = isMobile ? 1 : isTablet ? 2 : columns

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: isMobile ? 12 : 16,
      width: '100%'
    }}>
      {children}
    </div>
  )
}

export const ResponsiveText = ({ children, variant = 'body' }) => {
  const { isMobile } = useResponsive()

  const sizes = {
    h1: isMobile ? 28 : 36,
    h2: isMobile ? 24 : 32,
    h3: isMobile ? 20 : 24,
    body: isMobile ? 14 : 16,
    small: isMobile ? 12 : 14
  }

  return (
    <span style={{ fontSize: sizes[variant] }}>
      {children}
    </span>
  )
}

export const MobileMenu = ({ isOpen, onClose, children }) => {
  const { isMobile } = useResponsive()

  if (!isMobile) return children

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: isOpen ? 0 : '-100%',
          width: '80%',
          height: '100vh',
          background: '#fff',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          transition: 'left 0.3s ease',
          zIndex: 1000,
          padding: 20
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
        {children}
      </div>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
        />
      )}
    </>
  )
}
