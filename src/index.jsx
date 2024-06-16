import { createRoot } from 'react-dom/client';

import * as Sentry from '@sentry/react';

import App from './App';
import ErrorBoundary from './ErrorBoundary';

import variables from 'config/variables';
import defaults from 'config/default';

import './scss/index.scss';
// the toast css is based on default so we need to import it
import 'react-toastify/dist/ReactToastify.min.css';

import { createTranslator } from 'lib/translations';

const locale_id = localStorage.getItem('language').replace('_', '-') || defaults.language;
variables.language = createTranslator(locale_id);
variables.locale_id = locale_id;
document.documentElement.lang = locale_id;

variables.getMessage = (text, optional) =>
  variables.language.getMessage(variables.locale_id, text, optional || {});

Sentry.init({
  dsn: variables.constants.SENTRY_DSN,
  defaultIntegrations: false,
  autoSessionTracking: false,
});

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
