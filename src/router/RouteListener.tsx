import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import i18n from '../lib/i18n';
import { reapplyLegacyTextTranslation } from '../lib/legacyTextTranslator';

export default function RouteListener() {
  const location = useLocation();

  useEffect(() => {
    const pageId = `P-${location.pathname.replace('/', '').toUpperCase()}`;
    console.log(
      '当前pageId:',
      pageId,
      ', pathname:',
      location.pathname,
      ', search:',
      location.search,
    );
    if (typeof window === 'object' && window.parent && window.parent.postMessage) {
      window.parent.postMessage(
        {
          type: 'chux-path-change',
          pageId,
          pathname: location.pathname,
          search: location.search,
        },
        '*',
      );
    }

    // Re-apply legacy translation for pages that still contain hardcoded strings.
    window.requestAnimationFrame(() => {
      reapplyLegacyTextTranslation(i18n);
    });
  }, [location]);

  return <Outlet />;
}
