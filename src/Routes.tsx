import {UnconnectedGlobalMenu} from './components/menus/global';
import {Route, Router, Path} from 'wouter';
import PANES from './utils/pane-config';
import {Home} from './components/Home';
import {createGlobalStyle} from 'styled-components';
import {CanvasRouter as CanvasRouter3D} from './components/three-fiber/canvas-router';
import {CanvasRouter as CanvasRouter2D} from './components/two-string/canvas-router';
import {TestContext} from './components/panes/test';
import {useMemo, useState} from 'react';
import {OVERRIDE_HID_CHECK} from './utils/override';
import {useAppSelector} from './store/hooks';
import {getRenderMode} from './store/settingsSlice';
import {ErrorBoundary} from '@sentry/react';
import {useLocationProperty, navigate} from 'wouter/use-location';

const GlobalStyle = createGlobalStyle`
  *:focus {
    outline: none;
  }
`;

const hashLocation = () => window.location.hash.replace(/^#/, '') || '/';

const hashNavigate = (to: string) => navigate('#' + to);

const useHashLocation = (
  ...args: any[]
): [Path, (path: Path, ...args: any[]) => any] => {
  const location = useLocationProperty(hashLocation);
  return [location, hashNavigate];
};

export default () => {
  const hasHIDSupport = 'hid' in navigator || OVERRIDE_HID_CHECK;

  const renderMode = useAppSelector(getRenderMode);
  const RouteComponents = useMemo(
    () =>
      PANES.map((pane) => {
        return (
          <Route component={pane.component} key={pane.key} path={pane.path} />
        );
      }),
    [],
  );

  const CanvasRouter = renderMode === '2D' ? CanvasRouter2D : CanvasRouter3D;
  const testContextState = useState({clearTestKeys: () => {}});
  return (
    <>
      <ErrorBoundary showDialog={true}>
        <Router hook={useHashLocation}>
          <TestContext.Provider value={testContextState}>
            <GlobalStyle />
            {hasHIDSupport && <UnconnectedGlobalMenu />}
            <CanvasRouter />

            <Home hasHIDSupport={hasHIDSupport}>{RouteComponents}</Home>
          </TestContext.Provider>
        </Router>
      </ErrorBoundary>
    </>
  );
};
