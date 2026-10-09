export const KEY = "laddex-theme";

/**
 * Inline script that sets `data-theme` on <html> before first paint, from the saved choice or the
 * system preference, so there is no flash of the wrong theme. Kept apart from theme.ts, which is a client module.
 */
export const themeScript = `try{var t=localStorage.getItem('${KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','light')}`;
