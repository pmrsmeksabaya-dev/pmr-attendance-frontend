// CSS modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Global CSS side-effect import
declare module '*.css';

// Gambar
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.gif';
declare module '*.webp';

// Font
declare module '*.woff';
declare module '*.woff2';
declare module '*.ttf';
declare module '*.otf';