export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__inner">
        <p>© {new Date().getFullYear()} Ujjwal Rai</p>
        <p className="footer__note">Compiled with React, caffeine &amp; one too many console.logs.</p>
        <p className="footer__hint">
          Press <kbd>T</kbd> to switch theme
        </p>
      </div>
    </footer>
  );
}
