import { Link } from "react-router-dom";
import logo from "@/assets/mypo-logo.png";

const Footer = () => {
  return (
    <footer className="bg-primary py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center" aria-label="MyPO home">
            <img src={logo} alt="MyPO logo" loading="lazy" className="h-44 w-auto brightness-0 invert" width={256} height={256} />
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-6 text-primary-foreground/70">
            <Link to="/about" className="hover:text-primary-foreground transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-primary-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-primary-foreground transition-colors">
              Contact Us
            </Link>
          </div>

          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} MyPO. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
