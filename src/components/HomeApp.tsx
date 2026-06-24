import { ConvexClientProvider } from "./ConvexClientProvider";
import { StatusHero } from "./StatusHero";
import { NewsSection } from "./NewsSection";

export function HomeApp() {
  return (
    <ConvexClientProvider>
      <StatusHero />
      <NewsSection />
    </ConvexClientProvider>
  );
}
