"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface NavbarContextValue {
  isNavbarOpen: boolean;
  setIsNavbarOpen: Dispatch<SetStateAction<boolean>>;
}

const NavbarContext = createContext<NavbarContextValue | null>(null);

/**
 * Owns the navbar open/collapsed state. Lives in the dashboard layout (not the
 * per-project page tree) so the state survives navigating between projects.
 */
export const NavbarProvider = ({ children }: { children: ReactNode }) => {
  const [isNavbarOpen, setIsNavbarOpen] = useState(true);

  return (
    <NavbarContext.Provider value={{ isNavbarOpen, setIsNavbarOpen }}>
      {children}
    </NavbarContext.Provider>
  );
};

export function useNavbar() {
  const context = useContext(NavbarContext);
  if (!context) {
    throw new Error("useNavbar must be used within a NavbarProvider");
  }
  return context;
}
