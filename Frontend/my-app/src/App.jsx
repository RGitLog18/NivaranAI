import { RouterProvider } from "react-router-dom";
import { ComplaintProvider } from "./context/ComplaintContext";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AppProvider } from './context/AppContext.jsx';
import { router } from './routes.jsx';

const App = () => (
  <ThemeProvider>
    <AppProvider>
      <AuthProvider>
        <ComplaintProvider>
          <RouterProvider router={router} />
        </ComplaintProvider>
      </AuthProvider>
    </AppProvider>
  </ThemeProvider>
);

export default App;