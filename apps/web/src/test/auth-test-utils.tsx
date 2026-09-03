import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { AuthProvider } from "../auth/auth-context";
import App from "../App";

export function renderApp({
  initialEntries = ["/login"],
}: {
  initialEntries?: string[];
} = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}
