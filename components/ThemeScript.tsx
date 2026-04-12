// Server component — inyecta script inline antes de hidratación para evitar FOUC
export default function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
