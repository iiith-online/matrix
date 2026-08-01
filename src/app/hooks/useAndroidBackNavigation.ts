import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBackPath } from '../components/BackRouteHandler';

export const useAndroidBackNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locationRef = useRef(location);
  const urlRef = useRef(window.location.href);
  const stateRef = useRef(window.history.state);

  useEffect(() => {
    locationRef.current = location;
    urlRef.current = window.location.href;
    stateRef.current = window.history.state;
  }, [location]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const portal = document.getElementById('portalContainer');
      if (portal?.children.length) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.history.pushState(stateRef.current, '', urlRef.current);
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
      }

      const backPath = getBackPath(locationRef.current.pathname);
      if (!backPath) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(backPath, { replace: true });
    };

    window.addEventListener('popstate', handlePopState, true);
    return () => window.removeEventListener('popstate', handlePopState, true);
  }, [navigate]);
};
