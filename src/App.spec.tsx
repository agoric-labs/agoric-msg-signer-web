import "./installSesLockdown.js";
import { render, screen } from "@testing-library/react";
import App from "./App.tsx";
import { ContextProviders } from "./contexts/providers.tsx";

describe("App.tsx", () => {
  it("renders app title", async () => {
    render(
      <ContextProviders>
        <App />
      </ContextProviders>
    );

    const titleElement = await screen.findByText("Agoric Proto Signer");
    expect(titleElement).toBeTruthy();
  });
});
