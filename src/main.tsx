import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("The application root element is missing.");
}

ReactDOM.createRoot(root).render(<RouterProvider router={getRouter()} />);