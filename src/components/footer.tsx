import Link from "next/link";

export function Footer() {
  return (
    <footer className="py-6 px-4 bg-card border-t mt-auto">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-muted-foreground">© {new Date().getFullYear()} Talent3X. Oulu Pilot.</p>
          </div>
          <div className="flex space-x-6">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Use
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Disclaimer
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}