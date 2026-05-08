import RootLayout from './layout/RootLayout';
import Reader from './pages/Reader/Reader';
import { createBrowserRouter } from 'react-router';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: Reader },
    ],
  },
]);
