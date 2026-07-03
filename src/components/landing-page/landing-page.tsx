import Navbar from "./navbar";
import Hero from "./hero";
import Features from "./features";
import Cta from "./cta";
import Footer from "./footer";
import BetaNoticeDialog from "./beta-notice-dialog";

const LandingPage = () => {
  return (
    <>
      <BetaNoticeDialog />
      <Navbar />
      <main className="flex flex-col gap-32 md:gap-48">
        <Hero />
        <Features />
        <Cta />
      </main>
      <Footer />
    </>
  );
};

export default LandingPage;
