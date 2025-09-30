import { Button } from "@/components/ui/button";
import { useState } from "react";
import Hero from "./components/custom/Hero";
import { usePageTitle } from "./hooks/usePageTitle";

function App() {
  const [count, setCount] = useState(0);

  // Set the page title for the landing page
  usePageTitle("Welcome");

  return (
    <>
      {/* Hero */}
      <Hero />
    </>
  );
}

export default App;
