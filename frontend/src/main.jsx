import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { Provider } from "react-redux";
import store from "./redux/store.js";
import { Toaster } from "react-hot-toast";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { downloadFaceModels } from './utils/downloadFaceModels';
import { LanguageProvider } from './context/LanguageContext';

// Initialize face-api.js models download
downloadFaceModels()
  .then(success => {
    if (success) {
      console.log('Face recognition models loaded successfully');
    } else {
      console.warn('Failed to load face recognition models');
    }
  })
  .catch(error => {
    console.error('Error initializing face recognition:', error);
  });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <LanguageProvider>
          <App />
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: 'green',
                color: 'white',
              },
            },
            error: {
              duration: 4000,
              style: {
                background: 'red',
                color: 'white',
              },
            },
          }} />
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </LanguageProvider>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
